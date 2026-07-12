import type { FavoriteEntry } from '../types'

const STORAGE_KEY = 'capsuledex.favorites.v1'

function isFavoriteEntry(value: unknown): value is FavoriteEntry {
  if (!value || typeof value !== 'object') return false
  const entry = value as Partial<FavoriteEntry>
  return Number.isInteger(entry.pokemonId) && Number(entry.pokemonId) > 0 && typeof entry.addedAt === 'number'
}

export function loadFavorites(): FavoriteEntry[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []

    const unique = new Map<number, FavoriteEntry>()
    parsed.filter(isFavoriteEntry).forEach((entry) => {
      if (!unique.has(entry.pokemonId)) unique.set(entry.pokemonId, entry)
    })

    return [...unique.values()].sort((a, b) => b.addedAt - a.addedAt)
  } catch {
    return []
  }
}

export function saveFavorites(favorites: FavoriteEntry[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites))
  } catch {
    // L'app resta utilizzabile anche quando il browser blocca lo storage locale.
  }
}
