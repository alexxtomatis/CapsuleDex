const CACHE_PREFIX = 'capsuledex-'
const API_BASE = 'https://pokeapi.co/api/v2'
const ARTWORK_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork'
const API_CACHE = 'capsuledex-api-v15'
const IMAGE_CACHE = 'capsuledex-images-v15'

export type OfflineStats = {
  cacheEntries: number
  appEntries: number
  apiEntries: number
  imageEntries: number
  usedBytes: number | null
  quotaBytes: number | null
}

export type OfflineProgress = {
  completed: number
  total: number
  label: string
}

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

let deferredInstallPrompt: BeforeInstallPromptEvent | null = null

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault()
  deferredInstallPrompt = event as BeforeInstallPromptEvent
  window.dispatchEvent(new CustomEvent('capsuledex:install-available'))
})

window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null
  window.dispatchEvent(new CustomEvent('capsuledex:installed'))
})

export function canInstallApp() {
  return deferredInstallPrompt !== null
}

export async function requestAppInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  const prompt = deferredInstallPrompt
  if (!prompt) return 'unavailable'
  await prompt.prompt()
  const choice = await prompt.userChoice
  if (choice.outcome === 'accepted') deferredInstallPrompt = null
  return choice.outcome
}

export function isStandaloneMode() {
  return window.matchMedia('(display-mode: standalone)').matches ||
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
}

export async function registerCapsuleDexServiceWorker() {
  if (!('serviceWorker' in navigator)) return null

  try {
    const registration = await navigator.serviceWorker.register('./sw.js', { scope: './' })

    if (registration.waiting) {
      window.dispatchEvent(new CustomEvent('capsuledex:update-ready'))
    }

    registration.addEventListener('updatefound', () => {
      const worker = registration.installing
      worker?.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) {
          window.dispatchEvent(new CustomEvent('capsuledex:update-ready'))
        }
      })
    })

    return registration
  } catch {
    return null
  }
}

export async function activateWaitingServiceWorker() {
  if (!('serviceWorker' in navigator)) return false
  const registration = await navigator.serviceWorker.getRegistration('./')
  if (!registration?.waiting) return false
  registration.waiting.postMessage({ type: 'SKIP_WAITING' })
  return true
}

function formatCacheName(name: string) {
  if (name.includes('-app-')) return 'app'
  if (name.includes('-api-')) return 'api'
  if (name.includes('-images-')) return 'images'
  return 'other'
}

export async function getOfflineStats(): Promise<OfflineStats> {
  let appEntries = 0
  let apiEntries = 0
  let imageEntries = 0
  let cacheEntries = 0

  if ('caches' in window) {
    const names = (await caches.keys()).filter((name) => name.startsWith(CACHE_PREFIX))
    for (const name of names) {
      const cache = await caches.open(name)
      const count = (await cache.keys()).length
      cacheEntries += count
      const kind = formatCacheName(name)
      if (kind === 'app') appEntries += count
      if (kind === 'api') apiEntries += count
      if (kind === 'images') imageEntries += count
    }
  }

  let usedBytes: number | null = null
  let quotaBytes: number | null = null
  if (navigator.storage?.estimate) {
    const estimate = await navigator.storage.estimate()
    usedBytes = typeof estimate.usage === 'number' ? estimate.usage : null
    quotaBytes = typeof estimate.quota === 'number' ? estimate.quota : null
  }

  return { cacheEntries, appEntries, apiEntries, imageEntries, usedBytes, quotaBytes }
}

async function fetchForCache(url: string) {
  if ('caches' in window) {
    const existing = await caches.match(url)
    if (existing) return existing
  }

  const response = await fetch(url, { headers: { Accept: '*/*' } })
  if (!response.ok && response.type !== 'opaque') throw new Error(`Risorsa non disponibile (${response.status})`)

  if ('caches' in window) {
    const targetCache = url.startsWith(API_BASE) || url.startsWith('https://pokeapi.co/') ? API_CACHE : IMAGE_CACHE
    try {
      const cache = await caches.open(targetCache)
      await cache.put(url, response.clone())
    } catch {
      // Il service worker continuerà comunque a gestire la cache automatica.
    }
  }

  return response
}

async function runPool<T>(items: T[], concurrency: number, worker: (item: T) => Promise<void>) {
  const queue = [...items]
  const workers = Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
    while (queue.length > 0) {
      const item = queue.shift()
      if (item === undefined) return
      await worker(item)
    }
  })
  await Promise.all(workers)
}

export async function prepareSearchOffline(onProgress?: (progress: OfflineProgress) => void) {
  const typeNames = [
    'normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison', 'ground',
    'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy',
  ]
  const urls = [`${API_BASE}/pokemon-species?limit=2000`, ...typeNames.map((type) => `${API_BASE}/type/${type}`)]
  let completed = 0

  await runPool(urls, 4, async (url) => {
    await fetchForCache(url)
    completed += 1
    onProgress?.({ completed, total: urls.length, label: 'Dati di ricerca e filtri' })
  })
}

type PokemonPayloadForOffline = {
  species?: { url: string }
  abilities?: Array<{ ability: { url: string } }>
  sprites?: {
    front_default?: string | null
    front_shiny?: string | null
    other?: {
      ['official-artwork']?: { front_default?: string | null; front_shiny?: string | null }
      home?: { front_default?: string | null; front_shiny?: string | null }
    }
  }
}

type SpeciesPayloadForOffline = {
  evolution_chain?: { url: string } | null
}

type EvolutionLinkForOffline = {
  species?: { url: string }
  evolves_to?: EvolutionLinkForOffline[]
}

type EvolutionPayloadForOffline = {
  chain?: EvolutionLinkForOffline
}

function resourceId(url: string) {
  const parts = url.split('/').filter(Boolean)
  const id = Number(parts.at(-1))
  return Number.isFinite(id) ? id : null
}

function collectEvolutionSpeciesUrls(link: EvolutionLinkForOffline | undefined): string[] {
  if (!link) return []
  return [
    ...(link.species?.url ? [link.species.url] : []),
    ...(link.evolves_to ?? []).flatMap(collectEvolutionSpeciesUrls),
  ]
}

export async function preparePokemonOffline(
  pokemonIds: number[],
  onProgress?: (progress: OfflineProgress) => void,
) {
  const ids = [...new Set(pokemonIds)]
    .filter((id) => Number.isInteger(id) && id > 0)
    .sort((a, b) => a - b)

  if (ids.length === 0) return
  let completed = 0
  const preparedEvolutionChains = new Set<string>()

  await runPool(ids, 3, async (id) => {
    const pokemonUrl = `${API_BASE}/pokemon/${id}`
    const pokemonResponse = await fetchForCache(pokemonUrl)
    const pokemon = await pokemonResponse.clone().json() as PokemonPayloadForOffline
    const speciesUrl = pokemon.species?.url ?? `${API_BASE}/pokemon-species/${id}`
    const speciesResponse = await fetchForCache(speciesUrl)
    const species = await speciesResponse.clone().json() as SpeciesPayloadForOffline

    const artwork = pokemon.sprites?.other?.['official-artwork']
    const home = pokemon.sprites?.other?.home
    const resources = [
      artwork?.front_default,
      artwork?.front_shiny,
      home?.front_default,
      home?.front_shiny,
      pokemon.sprites?.front_default,
      pokemon.sprites?.front_shiny,
      `${ARTWORK_BASE}/${id}.png`,
      `${ARTWORK_BASE}/shiny/${id}.png`,
      `${API_BASE}/pokemon/${id}/encounters`,
      ...(pokemon.abilities ?? []).map((entry) => entry.ability.url),
    ].filter((value): value is string => Boolean(value))

    await Promise.allSettled(resources.map(fetchForCache))

    const chainUrl = species.evolution_chain?.url
    if (chainUrl && !preparedEvolutionChains.has(chainUrl)) {
      preparedEvolutionChains.add(chainUrl)
      try {
        const chainResponse = await fetchForCache(chainUrl)
        const chain = await chainResponse.clone().json() as EvolutionPayloadForOffline
        const chainSpeciesUrls = [...new Set(collectEvolutionSpeciesUrls(chain.chain))]
        await Promise.allSettled(chainSpeciesUrls.map(async (url) => {
          await fetchForCache(url)
          const evolutionId = resourceId(url)
          if (evolutionId) {
            await Promise.allSettled([
              fetchForCache(`${ARTWORK_BASE}/${evolutionId}.png`),
              fetchForCache(`${ARTWORK_BASE}/shiny/${evolutionId}.png`),
            ])
          }
        }))
      } catch {
        // La scheda principale resta disponibile anche se una catena non è scaricabile.
      }
    }

    completed += 1
    onProgress?.({ completed, total: ids.length, label: `Pokémon #${String(id).padStart(4, '0')}` })
  })
}

export async function clearOfflineRuntimeData() {
  if (!('caches' in window)) return
  const names = await caches.keys()
  await Promise.all(
    names
      .filter((name) => name.startsWith(CACHE_PREFIX) && !name.includes('-app-'))
      .map((name) => caches.delete(name)),
  )
}

export function exportLocalBackup() {
  const data: Record<string, string> = {}
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index)
    if (key?.startsWith('capsuledex.')) {
      const value = localStorage.getItem(key)
      if (value !== null) data[key] = value
    }
  }

  const payload = {
    app: 'CapsuleDex',
    version: 15,
    exportedAt: new Date().toISOString(),
    data,
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `capsuledex-backup-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export async function importLocalBackup(file: File) {
  const raw = await file.text()
  const parsed = JSON.parse(raw) as unknown
  if (!parsed || typeof parsed !== 'object') throw new Error('Backup non valido.')
  const record = parsed as { app?: unknown; data?: unknown }
  if (record.app !== 'CapsuleDex' || !record.data || typeof record.data !== 'object') {
    throw new Error('Il file non è un backup CapsuleDex valido.')
  }

  const entries = Object.entries(record.data as Record<string, unknown>)
    .filter(([key, value]) => key.startsWith('capsuledex.') && typeof value === 'string')
  if (entries.length === 0) throw new Error('Il backup non contiene salvataggi utilizzabili.')

  entries.forEach(([key, value]) => localStorage.setItem(key, value as string))
  return entries.length
}

export function formatBytes(value: number | null) {
  if (value === null || !Number.isFinite(value)) return 'Non disponibile'
  if (value < 1024) return `${value} B`
  const units = ['KB', 'MB', 'GB']
  let current = value / 1024
  let unit = units[0]
  for (let index = 1; index < units.length && current >= 1024; index += 1) {
    current /= 1024
    unit = units[index]
  }
  return `${current.toFixed(current >= 100 ? 0 : current >= 10 ? 1 : 2)} ${unit}`
}
