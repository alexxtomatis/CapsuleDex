import type { CollectionEntry, CollectionTrait } from '../types'

const STORAGE_KEY = 'capsuledex.collection.v1'
const VALID_TRAITS = new Set<CollectionTrait>(['shiny', 'alpha', 'gigantamax', 'paradox', 'legendary'])

function isCollectionEntry(value: unknown): value is CollectionEntry {
  if (!value || typeof value !== 'object') return false
  const entry = value as Partial<CollectionEntry>
  return (
    Number.isInteger(entry.pokemonId) &&
    Number(entry.pokemonId) > 0 &&
    Array.isArray(entry.traits) &&
    entry.traits.every((trait) => VALID_TRAITS.has(trait as CollectionTrait)) &&
    typeof entry.addedAt === 'number' &&
    typeof entry.updatedAt === 'number'
  )
}

export function loadCollection(): CollectionEntry[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []

    const unique = new Map<number, CollectionEntry>()
    parsed.filter(isCollectionEntry).forEach((entry) => {
      if (!unique.has(entry.pokemonId)) {
        unique.set(entry.pokemonId, {
          ...entry,
          traits: [...new Set(entry.traits)],
        })
      }
    })

    return [...unique.values()].sort((a, b) => b.updatedAt - a.updatedAt)
  } catch {
    return []
  }
}

export function saveCollection(entries: CollectionEntry[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch {
    // L'app resta utilizzabile anche se il browser blocca lo storage locale.
  }
}
