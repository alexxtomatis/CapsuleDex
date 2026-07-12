/* CapsuleDex service worker — Fase 13 */
const VERSION = '13'
const APP_CACHE = `capsuledex-app-v${VERSION}`
const API_CACHE = `capsuledex-api-v${VERSION}`
const IMAGE_CACHE = `capsuledex-images-v${VERSION}`
const DATA_CACHE = `capsuledex-data-v${VERSION}`
const ALL_CACHES = [APP_CACHE, API_CACHE, IMAGE_CACHE, DATA_CACHE]
const MAX_API_ENTRIES = 1600
const MAX_IMAGE_ENTRIES = 1400

function scoped(path = '') {
  return new URL(path, self.registration.scope).toString()
}

async function addQuietly(cache, url) {
  try {
    const response = await fetch(url, { cache: 'reload' })
    if (response.ok || response.type === 'opaque') await cache.put(url, response)
  } catch {
    // La risorsa verrà memorizzata alla prima visita disponibile.
  }
}

async function precacheAppShell() {
  const cache = await caches.open(APP_CACHE)
  const indexUrl = scoped('index.html')
  let indexResponse

  try {
    indexResponse = await fetch(indexUrl, { cache: 'reload' })
  } catch {
    return
  }

  if (!indexResponse.ok) return

  const html = await indexResponse.clone().text()
  await cache.put(indexUrl, indexResponse.clone())
  await cache.put(scoped(''), indexResponse.clone())

  const discovered = [...html.matchAll(/(?:src|href)=["']([^"']+)["']/g)]
    .map((match) => match[1])
    .filter((value) => value.startsWith('./') || value.startsWith('/'))
    .map((value) => new URL(value, indexUrl).toString())

  const core = [
    scoped('manifest.webmanifest'),
    scoped('assets/favicon.png'),
    scoped('assets/icon-192.png'),
    scoped('assets/icon-512.png'),
    scoped('assets/capsuledex-mark.svg'),
    scoped('assets/capsuledex-mark.png'),
    ...discovered,
  ]

  await Promise.allSettled([...new Set(core)].map((url) => addQuietly(cache, url)))
}

async function trimCache(cacheName, maximum) {
  const cache = await caches.open(cacheName)
  const keys = await cache.keys()
  if (keys.length <= maximum) return
  await Promise.all(keys.slice(0, keys.length - maximum).map((request) => cache.delete(request)))
}

async function putSafe(cacheName, request, response, maximum) {
  if (!response || (!response.ok && response.type !== 'opaque')) return
  const cache = await caches.open(cacheName)
  try {
    await cache.put(request, response.clone())
    if (maximum) void trimCache(cacheName, maximum)
  } catch {
    // Alcuni browser possono rifiutare risposte particolari o cache piene.
  }
}

async function cacheFirst(request, cacheName, maximum) {
  const cached = await caches.match(request)
  if (cached) return cached

  const response = await fetch(request)
  void putSafe(cacheName, request, response, maximum)
  return response
}

async function networkFirst(request, cacheName, timeoutMs = 5000, maximum) {
  const cache = await caches.open(cacheName)
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(request, { signal: controller.signal })
    clearTimeout(timer)
    void putSafe(cacheName, request, response, maximum)
    return response
  } catch (error) {
    clearTimeout(timer)
    const cached = await cache.match(request)
    if (cached) return cached
    throw error
  }
}

async function staleWhileRevalidate(request, cacheName, maximum) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  const network = fetch(request)
    .then((response) => {
      void putSafe(cacheName, request, response, maximum)
      return response
    })
    .catch(() => null)

  if (cached) return cached
  const response = await network
  return response || Response.error()
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    await precacheAppShell()
    await self.skipWaiting()
  })())
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys()
    await Promise.all(
      names
        .filter((name) => name.startsWith('capsuledex-') && !ALL_CACHES.includes(name))
        .map((name) => caches.delete(name)),
    )
    await self.clients.claim()
  })())
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  const isNavigation = request.mode === 'navigate'
  const isPokeApi = url.hostname === 'pokeapi.co'
  const isPokemonImage =
    url.hostname === 'raw.githubusercontent.com' ||
    url.hostname === 'raw.githubusercontentusercontent.com' ||
    url.hostname.endsWith('githubusercontent.com')
  const isSameOrigin = url.origin === self.location.origin

  if (isNavigation) {
    event.respondWith((async () => {
      try {
        const response = await fetch(request)
        void putSafe(APP_CACHE, scoped('index.html'), response)
        return response
      } catch {
        const cache = await caches.open(APP_CACHE)
        return (
          await cache.match(request) ||
          await cache.match(scoped('')) ||
          await cache.match(scoped('index.html')) ||
          new Response('CapsuleDex non è ancora disponibile offline. Aprila almeno una volta con internet.', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          })
        )
      }
    })())
    return
  }

  if (isPokeApi) {
    event.respondWith(networkFirst(request, API_CACHE, 4500, MAX_API_ENTRIES))
    return
  }

  if (isPokemonImage || request.destination === 'image') {
    event.respondWith(cacheFirst(request, IMAGE_CACHE, MAX_IMAGE_ENTRIES))
    return
  }

  if (isSameOrigin) {
    if (request.destination === 'script' || request.destination === 'style' || request.destination === 'font') {
      event.respondWith(cacheFirst(request, APP_CACHE))
      return
    }
    event.respondWith(staleWhileRevalidate(request, DATA_CACHE, 300))
  }
})

self.addEventListener('message', (event) => {
  const message = event.data || {}

  if (message.type === 'SKIP_WAITING') {
    void self.skipWaiting()
    return
  }

  if (message.type === 'CLEAR_OFFLINE_DATA') {
    event.waitUntil((async () => {
      await Promise.all([API_CACHE, IMAGE_CACHE, DATA_CACHE].map((name) => caches.delete(name)))
      event.ports?.[0]?.postMessage({ ok: true })
    })())
  }
})
