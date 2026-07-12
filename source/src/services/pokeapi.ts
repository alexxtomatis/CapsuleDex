import type { PokemonCardData, PokemonCatalogItem } from '../types'

const API_BASE = 'https://pokeapi.co/api/v2'
const detailCache = new Map<number, PokemonCardData>()
const typeCache = new Map<string, Set<number>>()
let catalogCache: PokemonCatalogItem[] | null = null

function extractId(url: string): number {
  const parts = url.split('/').filter(Boolean)
  return Number(parts.at(-1))
}

function titleCasePokemonName(name: string): string {
  return name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, {
    signal,
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error(`PokéAPI ha risposto con codice ${response.status}`)
  }

  return response.json() as Promise<T>
}

type CatalogResponse = {
  results: Array<{ name: string; url: string }>
}

type PokemonResponse = {
  id: number
  name: string
  sprites: {
    front_default: string | null
    other?: {
      ['official-artwork']?: { front_default: string | null }
      home?: { front_default: string | null }
    }
  }
  types: Array<{ slot: number; type: { name: string } }>
}

type TypeResponse = {
  pokemon: Array<{ pokemon: { name: string; url: string } }>
}

export async function getPokemonCatalog(signal?: AbortSignal): Promise<PokemonCatalogItem[]> {
  if (catalogCache) return catalogCache

  const payload = await fetchJson<CatalogResponse>(`${API_BASE}/pokemon-species?limit=2000`, signal)
  catalogCache = payload.results
    .map((item) => ({ id: extractId(item.url), name: item.name }))
    .filter((item) => Number.isFinite(item.id))
    .sort((a, b) => a.id - b.id)

  return catalogCache
}

export async function getPokemonCard(id: number, signal?: AbortSignal): Promise<PokemonCardData> {
  const cached = detailCache.get(id)
  if (cached) return cached

  const pokemon = await fetchJson<PokemonResponse>(`${API_BASE}/pokemon/${id}`, signal)
  const image =
    pokemon.sprites.other?.['official-artwork']?.front_default ??
    pokemon.sprites.other?.home?.front_default ??
    pokemon.sprites.front_default

  const card: PokemonCardData = {
    id: pokemon.id,
    name: titleCasePokemonName(pokemon.name),
    image,
    types: pokemon.types.sort((a, b) => a.slot - b.slot).map((entry) => entry.type.name),
  }

  detailCache.set(id, card)
  return card
}

export async function getPokemonCards(ids: number[], signal?: AbortSignal): Promise<PokemonCardData[]> {
  const results: PokemonCardData[] = []
  const queue = [...ids]
  const workers = Array.from({ length: Math.min(8, queue.length) }, async () => {
    while (queue.length > 0) {
      const id = queue.shift()
      if (id === undefined) return
      try {
        const card = await getPokemonCard(id, signal)
        results.push(card)
      } catch (error) {
        if (signal?.aborted) throw error
      }
    }
  })

  await Promise.all(workers)
  if (results.length === 0 && ids.length > 0) {
    throw new Error('Nessun dato Pokémon disponibile')
  }
  return results.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id))
}

export async function getPokemonIdsByType(type: string, signal?: AbortSignal): Promise<Set<number>> {
  const cached = typeCache.get(type)
  if (cached) return cached

  const payload = await fetchJson<TypeResponse>(`${API_BASE}/type/${type}`, signal)
  const ids = new Set(
    payload.pokemon
      .map((entry) => extractId(entry.pokemon.url))
      .filter((id) => Number.isFinite(id)),
  )

  typeCache.set(type, ids)
  return ids
}
