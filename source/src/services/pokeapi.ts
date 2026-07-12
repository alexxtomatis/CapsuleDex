import { italianTypeNames, statLabels } from '../data/features'
import { abilityById } from '../data/abilityIndex'
import { itemById, itemBySlug } from '../data/itemIndex'
import { moveById, moveBySlug } from '../data/moveIndex'
import type {
  AbilityDetailData,
  AbilityEffectChange,
  AbilityPokemonPreview,
  EvolutionChainData,
  EvolutionMethodGroup,
  EvolutionNodeData,
  EvolutionPath,
  EvolutionRequirement,
  ItemDetailData,
  ItemHeldPokemonPreview,
  ItemMachinePreview,
  MoveDetailData,
  MovePokemonPreview,
  EvolutionStep,
  PokemonAbility,
  PokemonCardData,
  PokemonCatalogItem,
  PokemonDetailData,
  PokemonMovePreview,
  PokemonVariant,
} from '../types'

const API_BASE = 'https://pokeapi.co/api/v2'
const OFFICIAL_ARTWORK_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork'
const detailCache = new Map<number, PokemonCardData>()
const fullDetailCache = new Map<number, PokemonDetailData>()
const abilityCache = new Map<string, PokemonAbility>()
const abilityDetailCache = new Map<number, AbilityDetailData>()
const evolutionChainCache = new Map<number, EvolutionChainData>()
const speciesCache = new Map<number, SpeciesResponse>()
const typeCache = new Map<string, Set<number>>()
let catalogCache: PokemonCatalogItem[] | null = null

function extractId(url: string): number {
  const parts = url.split('/').filter(Boolean)
  return Number(parts.at(-1))
}

function cleanText(value: string): string {
  return value.replace(/[\n\f\r]+/g, ' ').replace(/\s+/g, ' ').trim()
}

function titleCasePokemonName(name: string): string {
  return name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function localizedName(
  names: Array<{ name: string; language: { name: string } }> | undefined,
  fallback: string,
): string {
  return names?.find((entry) => entry.language.name === 'it')?.name ?? titleCasePokemonName(fallback)
}

function officialArtwork(id: number): string {
  return `${OFFICIAL_ARTWORK_BASE}/${id}.png`
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
  height: number
  weight: number
  base_experience: number | null
  species: { name: string; url: string }
  sprites: {
    front_default: string | null
    front_shiny: string | null
    other?: {
      ['official-artwork']?: { front_default: string | null; front_shiny: string | null }
      home?: { front_default: string | null; front_shiny: string | null }
    }
  }
  types: Array<{ slot: number; type: { name: string } }>
  stats: Array<{ base_stat: number; stat: { name: string } }>
  abilities: Array<{ is_hidden: boolean; slot: number; ability: { name: string; url: string } }>
  moves: Array<{
    move: { name: string; url: string }
    version_group_details: Array<{
      level_learned_at: number
      move_learn_method: { name: string }
      version_group: { name: string }
    }>
  }>
}

type SpeciesResponse = {
  id: number
  is_baby: boolean
  name: string
  names: Array<{ name: string; language: { name: string } }>
  genera: Array<{ genus: string; language: { name: string } }>
  flavor_text_entries: Array<{ flavor_text: string; language: { name: string }; version: { name: string } }>
  generation: { name: string }
  habitat: { name: string } | null
  evolution_chain: { url: string } | null
  varieties: Array<{ is_default: boolean; pokemon: { name: string; url: string } }>
}

type TypeResponse = {
  pokemon: Array<{ pokemon: { name: string; url: string } }>
}

type AbilityResponse = {
  id: number
  name: string
  is_main_series: boolean
  generation: { name: string; url: string }
  names: Array<{ name: string; language: { name: string } }>
  flavor_text_entries: Array<{ flavor_text: string; language: { name: string }; version_group: { name: string } }>
  effect_entries: Array<{
    short_effect: string
    effect: string
    language: { name: string }
  }>
  effect_changes: Array<{
    effect_entries: Array<{ effect: string; language: { name: string } }>
    version_group: { name: string; url: string }
  }>
  pokemon: Array<{
    is_hidden: boolean
    slot: number
    pokemon: { name: string; url: string }
  }>
}

type EvolutionNamedResource = { name: string; url: string }

type EvolutionDetail = {
  trigger: EvolutionNamedResource
  min_level: number | null
  item: EvolutionNamedResource | null
  held_item: EvolutionNamedResource | null
  known_move: EvolutionNamedResource | null
  known_move_type: EvolutionNamedResource | null
  location: EvolutionNamedResource | null
  min_happiness: number | null
  min_affection: number | null
  time_of_day: string
  gender: number | null
  needs_overworld_rain: boolean
  turn_upside_down: boolean
  relative_physical_stats: number | null
  party_species: EvolutionNamedResource | null
  party_type: EvolutionNamedResource | null
  trade_species: EvolutionNamedResource | null
}

type EvolutionChainLink = {
  species: { name: string; url: string }
  evolution_details: EvolutionDetail[] | null
  evolves_to: EvolutionChainLink[]
}

type EvolutionChainResponse = {
  id: number
  baby_trigger_item: EvolutionNamedResource | null
  chain: EvolutionChainLink
}

const triggerNames: Record<string, string> = {
  'level-up': 'Aumento di livello',
  trade: 'Scambio',
  'use-item': 'Uso di uno strumento',
  shed: 'Condizione speciale',
  spin: 'Rotazione',
  'tower-of-darkness': 'Torre Buio',
  'tower-of-waters': 'Torre Acqua',
  'three-critical-hits': '3 brutti colpi',
  'take-damage': 'Danni subiti',
  other: 'Metodo speciale',
}

const generationNames: Record<string, string> = {
  'generation-i': 'Generazione I',
  'generation-ii': 'Generazione II',
  'generation-iii': 'Generazione III',
  'generation-iv': 'Generazione IV',
  'generation-v': 'Generazione V',
  'generation-vi': 'Generazione VI',
  'generation-vii': 'Generazione VII',
  'generation-viii': 'Generazione VIII',
  'generation-ix': 'Generazione IX',
}

const habitatNames: Record<string, string> = {
  cave: 'Grotte',
  forest: 'Foreste',
  grassland: 'Praterie',
  mountain: 'Montagne',
  rare: 'Luoghi rari',
  'rough-terrain': 'Terreni accidentati',
  sea: 'Mare',
  urban: 'Zone urbane',
  'waters-edge': "Riva dell'acqua",
}

function resourceDisplayName(kind: 'item' | 'move', slug: string): string {
  if (kind === 'item') return itemBySlug.get(slug)?.name ?? titleCasePokemonName(slug)
  return moveBySlug.get(slug)?.name ?? titleCasePokemonName(slug)
}

function buildEvolutionRequirement(detail: EvolutionDetail): EvolutionRequirement {
  const groups = new Set<EvolutionMethodGroup>()
  const details: string[] = []
  const resources: EvolutionRequirement['resources'] = []
  const trigger = triggerNames[detail.trigger.name] ?? titleCasePokemonName(detail.trigger.name)

  if (detail.trigger.name === 'level-up') groups.add('level')
  else if (detail.trigger.name === 'trade') groups.add('trade')
  else if (detail.trigger.name === 'use-item') groups.add('item')
  else groups.add('special')

  if (detail.min_level !== null) details.push(`Livello ${detail.min_level}`)

  if (detail.item) {
    const name = resourceDisplayName('item', detail.item.name)
    details.push(`Usa ${name}`)
    resources.push({ kind: 'item', slug: detail.item.name, name })
    groups.add('item')
  }
  if (detail.held_item) {
    const name = resourceDisplayName('item', detail.held_item.name)
    details.push(`Tiene ${name}`)
    resources.push({ kind: 'item', slug: detail.held_item.name, name })
    groups.add('item')
  }
  if (detail.known_move) {
    const name = resourceDisplayName('move', detail.known_move.name)
    details.push(`Conosce ${name}`)
    resources.push({ kind: 'move', slug: detail.known_move.name, name })
    groups.add('move')
  }
  if (detail.known_move_type) {
    details.push(`Conosce una mossa di tipo ${italianTypeNames[detail.known_move_type.name] ?? titleCasePokemonName(detail.known_move_type.name)}`)
    groups.add('move')
  }
  if (detail.location) {
    details.push(`Nella zona ${titleCasePokemonName(detail.location.name)}`)
    groups.add('location')
  }
  if (detail.min_happiness !== null) {
    details.push(`Felicità ${detail.min_happiness}+`)
    groups.add('friendship')
  }
  if (detail.min_affection !== null) {
    details.push(`Affetto ${detail.min_affection}+`)
    groups.add('friendship')
  }
  if (detail.time_of_day) {
    details.push(detail.time_of_day === 'day' ? 'Di giorno' : detail.time_of_day === 'night' ? 'Di notte' : titleCasePokemonName(detail.time_of_day))
    groups.add('time')
  }
  if (detail.needs_overworld_rain) {
    details.push('Con pioggia nel mondo di gioco')
    groups.add('weather')
  }
  if (detail.turn_upside_down) {
    details.push('Capovolgi il dispositivo durante il livello')
    groups.add('special')
  }
  if (detail.gender === 1) {
    details.push('Solo femmina')
    groups.add('special')
  }
  if (detail.gender === 2) {
    details.push('Solo maschio')
    groups.add('special')
  }
  if (detail.relative_physical_stats === 1) {
    details.push('Attacco maggiore della Difesa')
    groups.add('stats')
  }
  if (detail.relative_physical_stats === 0) {
    details.push('Attacco uguale alla Difesa')
    groups.add('stats')
  }
  if (detail.relative_physical_stats === -1) {
    details.push('Attacco minore della Difesa')
    groups.add('stats')
  }
  if (detail.party_species) {
    details.push(`${titleCasePokemonName(detail.party_species.name)} in squadra`)
    groups.add('party')
  }
  if (detail.party_type) {
    details.push(`Un Pokémon di tipo ${italianTypeNames[detail.party_type.name] ?? titleCasePokemonName(detail.party_type.name)} in squadra`)
    groups.add('party')
  }
  if (detail.trade_species) {
    details.push(`Scambio con ${titleCasePokemonName(detail.trade_species.name)}`)
    groups.add('trade')
  }

  const uniqueResources = resources.filter((resource, index) => (
    resources.findIndex((candidate) => candidate.kind === resource.kind && candidate.slug === resource.slug) === index
  ))
  const uniqueDetails = [...new Set(details)]

  return {
    trigger,
    summary: [trigger, ...uniqueDetails].join(' · '),
    groups: [...groups],
    details: uniqueDetails,
    resources: uniqueResources,
  }
}

function formatEvolutionDetail(detail: EvolutionDetail): string {
  return buildEvolutionRequirement(detail).summary
}

function evolutionTrigger(details: EvolutionDetail[] | null): string | null {
  if (!details || details.length === 0) return null
  const labels = [...new Set(details.map(formatEvolutionDetail))]
  return labels.join(' / ')
}

function buildEvolutionPaths(root: EvolutionChainLink): EvolutionPath[] {
  const paths: EvolutionPath[] = []

  function visit(node: EvolutionChainLink, path: EvolutionStep[]) {
    const id = extractId(node.species.url)
    const step: EvolutionStep = {
      id,
      name: titleCasePokemonName(node.species.name),
      image: officialArtwork(id),
      trigger: evolutionTrigger(node.evolution_details),
    }
    const nextPath = [...path, step]

    if (node.evolves_to.length === 0) {
      paths.push(nextPath)
      return
    }

    node.evolves_to.forEach((child) => visit(child, nextPath))
  }

  visit(root, [])
  return paths
}

async function getSpeciesPayload(id: number, signal?: AbortSignal): Promise<SpeciesResponse> {
  const cached = speciesCache.get(id)
  if (cached) return cached
  const payload = await fetchJson<SpeciesResponse>(`${API_BASE}/pokemon-species/${id}`, signal)
  speciesCache.set(payload.id, payload)
  return payload
}

async function resolveSpeciesPayload(key: number | string, signal?: AbortSignal): Promise<SpeciesResponse> {
  try {
    const payload = await fetchJson<SpeciesResponse>(`${API_BASE}/pokemon-species/${key}`, signal)
    speciesCache.set(payload.id, payload)
    return payload
  } catch (error) {
    if (signal?.aborted) throw error
    const pokemon = await fetchJson<PokemonResponse>(`${API_BASE}/pokemon/${key}`, signal)
    return getSpeciesPayload(extractId(pokemon.species.url), signal)
  }
}

function collectEvolutionLinks(root: EvolutionChainLink): EvolutionChainLink[] {
  return [root, ...root.evolves_to.flatMap(collectEvolutionLinks)]
}

function countEvolutionLeaves(node: EvolutionNodeData): number {
  if (node.evolvesTo.length === 0) return 1
  return node.evolvesTo.reduce((sum, child) => sum + countEvolutionLeaves(child), 0)
}

function evolutionDepth(node: EvolutionNodeData): number {
  if (node.evolvesTo.length === 0) return 1
  return 1 + Math.max(...node.evolvesTo.map(evolutionDepth))
}

function collectEvolutionGroups(node: EvolutionNodeData, output = new Set<EvolutionMethodGroup>()): Set<EvolutionMethodGroup> {
  node.requirements.forEach((requirement) => requirement.groups.forEach((group) => output.add(group)))
  node.evolvesTo.forEach((child) => collectEvolutionGroups(child, output))
  return output
}

function buildEvolutionNode(
  link: EvolutionChainLink,
  speciesById: Map<number, SpeciesResponse>,
): EvolutionNodeData {
  const id = extractId(link.species.url)
  const species = speciesById.get(id)
  const italianName = localizedName(species?.names, link.species.name)
  return {
    id,
    slug: link.species.name,
    name: italianName,
    englishName: titleCasePokemonName(link.species.name),
    image: officialArtwork(id),
    isBaby: species?.is_baby ?? false,
    requirements: (link.evolution_details ?? []).map(buildEvolutionRequirement),
    evolvesTo: link.evolves_to.map((child) => buildEvolutionNode(child, speciesById)),
  }
}

export async function getEvolutionChainForPokemon(
  pokemonKey: number | string,
  signal?: AbortSignal,
): Promise<EvolutionChainData> {
  const species = await resolveSpeciesPayload(pokemonKey, signal)
  if (!species.evolution_chain) throw new Error('Questo Pokémon non dispone di una catena evolutiva.')

  const chainId = extractId(species.evolution_chain.url)
  const cached = evolutionChainCache.get(chainId)
  if (cached) return cached

  const payload = await fetchJson<EvolutionChainResponse>(species.evolution_chain.url, signal)
  const links = collectEvolutionLinks(payload.chain)
  const uniqueIds = [...new Set(links.map((link) => extractId(link.species.url)).filter(Number.isFinite))]
  const speciesPayloads = await Promise.all(uniqueIds.map(async (id) => {
    try {
      return await getSpeciesPayload(id, signal)
    } catch (error) {
      if (signal?.aborted) throw error
      return null
    }
  }))
  const speciesById = new Map(speciesPayloads.filter((entry): entry is SpeciesResponse => Boolean(entry)).map((entry) => [entry.id, entry]))
  const root = buildEvolutionNode(payload.chain, speciesById)
  const babyTriggerItem = payload.baby_trigger_item
    ? {
        kind: 'item' as const,
        slug: payload.baby_trigger_item.name,
        name: resourceDisplayName('item', payload.baby_trigger_item.name),
      }
    : null
  const result: EvolutionChainData = {
    id: payload.id,
    root,
    babyTriggerItem,
    speciesCount: uniqueIds.length,
    branchCount: countEvolutionLeaves(root),
    maxDepth: evolutionDepth(root),
    methodGroups: [...collectEvolutionGroups(root)],
  }

  evolutionChainCache.set(payload.id, result)
  return result
}

async function getAbility(
  ability: PokemonResponse['abilities'][number],
  signal?: AbortSignal,
): Promise<PokemonAbility> {
  const cached = abilityCache.get(ability.ability.name)
  if (cached) return { ...cached, hidden: ability.is_hidden }

  try {
    const payload = await fetchJson<AbilityResponse>(`${API_BASE}/ability/${ability.ability.name}`, signal)
    const italianFlavor = payload.flavor_text_entries.find((entry) => entry.language.name === 'it')?.flavor_text
    const englishEffect = payload.effect_entries.find((entry) => entry.language.name === 'en')?.short_effect
    const englishFlavor = payload.flavor_text_entries.find((entry) => entry.language.name === 'en')?.flavor_text
    const result: PokemonAbility = {
      id: ability.ability.name,
      name: localizedName(payload.names, payload.name),
      description: cleanText(italianFlavor ?? englishEffect ?? englishFlavor ?? 'Descrizione non disponibile.'),
      hidden: ability.is_hidden,
    }
    abilityCache.set(ability.ability.name, { ...result, hidden: false })
    return result
  } catch (error) {
    if (signal?.aborted) throw error
    return {
      id: ability.ability.name,
      name: titleCasePokemonName(ability.ability.name),
      description: 'Descrizione non disponibile al momento.',
      hidden: ability.is_hidden,
    }
  }
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

export async function getPokemonDetail(id: number, signal?: AbortSignal): Promise<PokemonDetailData> {
  const cached = fullDetailCache.get(id)
  if (cached) return cached

  const pokemon = await fetchJson<PokemonResponse>(`${API_BASE}/pokemon/${id}`, signal)
  const speciesId = extractId(pokemon.species.url)
  const species = await fetchJson<SpeciesResponse>(`${API_BASE}/pokemon-species/${speciesId}`, signal)

  const evolutionPromise = species.evolution_chain
    ? fetchJson<EvolutionChainResponse>(species.evolution_chain.url, signal)
        .then((chain) => buildEvolutionPaths(chain.chain))
        .catch((error: unknown) => {
          if (signal?.aborted) throw error
          return [] as EvolutionPath[]
        })
    : Promise.resolve([] as EvolutionPath[])

  const [abilities, evolutionPaths] = await Promise.all([
    Promise.all(pokemon.abilities.sort((a, b) => a.slot - b.slot).map((ability) => getAbility(ability, signal))),
    evolutionPromise,
  ])

  const artwork =
    pokemon.sprites.other?.['official-artwork']?.front_default ??
    pokemon.sprites.other?.home?.front_default ??
    pokemon.sprites.front_default
  const shiny =
    pokemon.sprites.other?.['official-artwork']?.front_shiny ??
    pokemon.sprites.other?.home?.front_shiny ??
    pokemon.sprites.front_shiny

  const description =
    species.flavor_text_entries.find((entry) => entry.language.name === 'it')?.flavor_text ??
    species.flavor_text_entries.find((entry) => entry.language.name === 'en')?.flavor_text ??
    'Descrizione non disponibile.'
  const category =
    species.genera.find((entry) => entry.language.name === 'it')?.genus ??
    species.genera.find((entry) => entry.language.name === 'en')?.genus ??
    'Pokémon'

  const variants: PokemonVariant[] = species.varieties.map((variety) => {
    const variantId = extractId(variety.pokemon.url)
    return {
      id: variantId,
      name: titleCasePokemonName(variety.pokemon.name),
      image: officialArtwork(variantId),
      isDefault: variety.is_default,
    }
  })

  const stats = pokemon.stats.map((entry) => ({
    id: entry.stat.name,
    label: statLabels[entry.stat.name] ?? titleCasePokemonName(entry.stat.name),
    value: entry.base_stat,
  }))

  const moves: PokemonMovePreview[] = pokemon.moves.map((entry) => {
    const latestDetail = entry.version_group_details.at(-1)
    return {
      id: entry.move.name,
      name: titleCasePokemonName(entry.move.name),
      method: latestDetail?.move_learn_method.name ?? 'unknown',
      level: latestDetail?.level_learned_at ?? 0,
    }
  })

  const detail: PokemonDetailData = {
    id: pokemon.id,
    name: titleCasePokemonName(pokemon.name),
    italianName: localizedName(species.names, pokemon.name),
    image: artwork,
    sprite: pokemon.sprites.front_default,
    shinyImage: shiny,
    types: pokemon.types.sort((a, b) => a.slot - b.slot).map((entry) => entry.type.name),
    heightMetres: pokemon.height / 10,
    weightKg: pokemon.weight / 10,
    category: category.replace(/^Pokémon\s*/i, '').trim() || category,
    description: cleanText(description),
    generation: generationNames[species.generation.name] ?? titleCasePokemonName(species.generation.name),
    habitat: species.habitat ? habitatNames[species.habitat.name] ?? titleCasePokemonName(species.habitat.name) : null,
    baseExperience: pokemon.base_experience,
    stats,
    totalStats: stats.reduce((sum, stat) => sum + stat.value, 0),
    abilities,
    evolutionPaths,
    variants,
    moves,
  }

  fullDetailCache.set(id, detail)
  detailCache.set(id, { id: detail.id, name: detail.italianName, image: detail.image, types: detail.types })
  return detail
}

type MoveApiResponse = {
  id: number
  name: string
  accuracy: number | null
  effect_chance: number | null
  pp: number | null
  priority: number
  power: number | null
  damage_class: { name: 'physical' | 'special' | 'status' }
  effect_entries: Array<{
    effect: string
    short_effect: string
    language: { name: string }
  }>
  flavor_text_entries: Array<{
    flavor_text: string
    language: { name: string }
    version_group: { name: string }
  }>
  generation: { name: string; url: string }
  meta: {
    ailment: { name: string }
    category: { name: string }
    min_hits: number | null
    max_hits: number | null
    min_turns: number | null
    max_turns: number | null
    drain: number
    healing: number
    crit_rate: number
    ailment_chance: number
    flinch_chance: number
    stat_chance: number
  } | null
  names: Array<{ name: string; language: { name: string } }>
  stat_changes: Array<{ change: number; stat: { name: string } }>
  target: { name: string }
  type: { name: string }
  learned_by_pokemon: Array<{ name: string; url: string }>
}

const moveDetailCache = new Map<number, MoveDetailData>()

const moveTargetNames: Record<string, string> = {
  'specific-move': 'Una mossa specifica',
  'selected-pokemon-me-first': 'Pokémon selezionato',
  'ally': 'Un alleato',
  'users-field': 'Campo dell’utilizzatore',
  user: 'Utilizzatore',
  'opponents-field': 'Campo avversario',
  'selected-pokemon': 'Pokémon selezionato',
  'all-opponents': 'Tutti gli avversari',
  'entire-field': 'Intero campo',
  'user-and-allies': 'Utilizzatore e alleati',
  'all-other-pokemon': 'Tutti gli altri Pokémon',
  'all-allies': 'Tutti gli alleati',
  'fainting-pokemon': 'Pokémon esausto',
}

const moveAilmentNames: Record<string, string> = {
  none: 'Nessuno',
  paralysis: 'Paralisi',
  sleep: 'Sonno',
  freeze: 'Congelamento',
  burn: 'Scottatura',
  poison: 'Avvelenamento',
  confusion: 'Confusione',
  infatuation: 'Infatuazione',
  trap: 'Intrappolamento',
  nightmare: 'Incubo',
  torment: 'Attaccabrighe',
  disable: 'Inibizione',
  yawn: 'Sbadiglio',
  'heal-block': 'Anticura',
  'no-type-immunity': 'Rimozione immunità',
  'leech-seed': 'Parassiseme',
  embargo: 'Divieto',
  'perish-song': 'Ultimocanto',
  ingrain: 'Radicamento',
  silence: 'Silenzio',
}

const moveCategoryNames: Record<string, string> = {
  damage: 'Danno diretto',
  ailment: 'Problema di stato',
  'net-good-stats': 'Modifica statistiche',
  heal: 'Recupero',
  'damage+ailment': 'Danno e stato',
  swagger: 'Confusione e statistiche',
  'damage+lower': 'Danno e riduzione statistiche',
  'damage+raise': 'Danno e aumento statistiche',
  'damage+heal': 'Danno e recupero',
  ohko: 'KO in un colpo',
  'whole-field-effect': 'Effetto sul campo',
  'field-effect': 'Effetto di campo',
  'force-switch': 'Cambio forzato',
  unique: 'Effetto unico',
}

const statNamesIt: Record<string, string> = {
  attack: 'Attacco',
  defense: 'Difesa',
  'special-attack': 'Attacco Speciale',
  'special-defense': 'Difesa Speciale',
  speed: 'Velocità',
  accuracy: 'Precisione',
  evasion: 'Elusione',
}

function replaceEffectChance(value: string, chance: number | null): string {
  const replacement = chance === null ? 'una certa probabilità' : `${chance}%`
  return cleanText(value.replace(/\$effect_chance/g, replacement).replace(/\[[^\]]+\]\{[^}]+\}/g, (match) => {
    const label = match.match(/^\[([^\]]+)\]/)?.[1]
    return label ?? match
  }))
}

export async function getMoveDetail(id: number, signal?: AbortSignal): Promise<MoveDetailData> {
  const cached = moveDetailCache.get(id)
  if (cached) return cached

  const payload = await fetchJson<MoveApiResponse>(`${API_BASE}/move/${id}`, signal)
  const indexEntry = moveById.get(payload.id)
  const generationId = extractId(payload.generation.url)
  const italianFlavor = [...payload.flavor_text_entries]
    .reverse()
    .find((entry) => entry.language.name === 'it')?.flavor_text
  const englishFlavor = [...payload.flavor_text_entries]
    .reverse()
    .find((entry) => entry.language.name === 'en')?.flavor_text
  const englishEffect = payload.effect_entries.find((entry) => entry.language.name === 'en')

  const pokemon: MovePokemonPreview[] = payload.learned_by_pokemon
    .map((entry) => {
      const pokemonId = extractId(entry.url)
      return {
        id: pokemonId,
        name: titleCasePokemonName(entry.name),
        image: officialArtwork(pokemonId),
      }
    })
    .filter((entry) => Number.isFinite(entry.id) && entry.id > 0)
    .sort((a, b) => a.id - b.id)

  const meta = payload.meta
  const detail: MoveDetailData = {
    id: payload.id,
    slug: payload.name,
    name: localizedName(payload.names, payload.name),
    englishName: indexEntry?.englishName ?? titleCasePokemonName(payload.name),
    generation: indexEntry?.generation ?? generationId,
    type: payload.type.name,
    damageClass: payload.damage_class.name,
    power: payload.power,
    pp: payload.pp,
    accuracy: payload.accuracy,
    priority: payload.priority,
    description: cleanText(italianFlavor ?? englishFlavor ?? 'Descrizione non disponibile.'),
    effect: replaceEffectChance(
      englishEffect?.short_effect ?? englishEffect?.effect ?? italianFlavor ?? englishFlavor ?? 'Effetto non disponibile.',
      payload.effect_chance,
    ),
    effectChance: payload.effect_chance,
    target: moveTargetNames[payload.target.name] ?? titleCasePokemonName(payload.target.name),
    ailment: meta && meta.ailment.name !== 'none'
      ? moveAilmentNames[meta.ailment.name] ?? titleCasePokemonName(meta.ailment.name)
      : null,
    category: meta ? moveCategoryNames[meta.category.name] ?? titleCasePokemonName(meta.category.name) : 'Non specificata',
    minHits: meta?.min_hits ?? null,
    maxHits: meta?.max_hits ?? null,
    minTurns: meta?.min_turns ?? null,
    maxTurns: meta?.max_turns ?? null,
    drain: meta?.drain ?? 0,
    healing: meta?.healing ?? 0,
    critRate: meta?.crit_rate ?? 0,
    ailmentChance: meta?.ailment_chance ?? 0,
    flinchChance: meta?.flinch_chance ?? 0,
    statChance: meta?.stat_chance ?? 0,
    statChanges: payload.stat_changes.map((change) => ({
      stat: statNamesIt[change.stat.name] ?? titleCasePokemonName(change.stat.name),
      change: change.change,
    })),
    learnedByPokemon: pokemon,
  }

  moveDetailCache.set(id, detail)
  return detail
}

type ItemApiResponse = {
  id: number
  name: string
  cost: number
  fling_power: number | null
  fling_effect: { name: string; url: string } | null
  attributes: Array<{ name: string; url: string }>
  category: { name: string; url: string }
  effect_entries: Array<{
    effect: string
    short_effect: string
    language: { name: string }
  }>
  flavor_text_entries: Array<{
    text: string
    language: { name: string }
    version_group: { name: string }
  }>
  game_indices: Array<{
    game_index: number
    generation: { name: string; url: string }
  }>
  names: Array<{ name: string; language: { name: string } }>
  sprites: { default: string | null }
  held_by_pokemon: Array<{
    pokemon: { name: string; url: string }
    version_details: Array<{
      rarity: number
      version: { name: string; url: string }
    }>
  }>
  baby_trigger_for: { url: string } | null
  machines: Array<{
    machine: { url: string }
    version_group: { name: string; url: string }
  }>
}

type ItemFlingEffectResponse = {
  effect_entries: Array<{
    effect: string
    language: { name: string }
  }>
}

type MachineApiResponse = {
  id: number
  item: { name: string; url: string }
  move: { name: string; url: string }
  version_group: { name: string; url: string }
}

const itemDetailCache = new Map<number, ItemDetailData>()

const itemAttributeNames: Record<string, string> = {
  countable: 'Contabile nella Borsa',
  consumable: 'Consumabile',
  'usable-overworld': 'Utilizzabile fuori dalla lotta',
  'usable-in-battle': 'Utilizzabile in lotta',
  holdable: 'Assegnabile a un Pokémon',
  'holdable-passive': 'Effetto passivo se assegnato',
  'holdable-active': 'Effetto attivo se assegnato',
  underground: 'Legato ai Sotterranei',
}

function cleanApiEffect(value: string): string {
  return cleanText(value
    .replace(/\$effect_chance/g, 'una certa probabilità')
    .replace(/\[([^\]]+)\]\{[^}]+\}/g, '$1'))
}

function formatVersionName(value: string): string {
  return titleCasePokemonName(value)
    .replace(/Omega Ruby/g, 'Rubino Omega')
    .replace(/Alpha Sapphire/g, 'Zaffiro Alpha')
    .replace(/Ultra Sun/g, 'Ultrasole')
    .replace(/Ultra Moon/g, 'Ultraluna')
    .replace(/Brilliant Diamond/g, 'Diamante Lucente')
    .replace(/Shining Pearl/g, 'Perla Splendente')
    .replace(/Lets Go Pikachu/g, "Let's Go, Pikachu!")
    .replace(/Lets Go Eevee/g, "Let's Go, Eevee!")
}

async function getMachinePreview(
  entry: ItemApiResponse['machines'][number],
  signal?: AbortSignal,
): Promise<ItemMachinePreview | null> {
  try {
    const machine = await fetchJson<MachineApiResponse>(entry.machine.url, signal)
    const indexedMove = moveBySlug.get(machine.move.name)
    return {
      id: machine.id,
      moveSlug: machine.move.name,
      moveName: indexedMove?.name ?? titleCasePokemonName(machine.move.name),
      versionGroup: formatVersionName(entry.version_group.name || machine.version_group.name),
    }
  } catch (error) {
    if (signal?.aborted) throw error
    return null
  }
}

export async function getItemDetail(id: number, signal?: AbortSignal): Promise<ItemDetailData> {
  const cached = itemDetailCache.get(id)
  if (cached) return cached

  const payload = await fetchJson<ItemApiResponse>(`${API_BASE}/item/${id}`, signal)
  const indexEntry = itemById.get(payload.id)
  const italianFlavor = [...payload.flavor_text_entries]
    .reverse()
    .find((entry) => entry.language.name === 'it')?.text
  const englishFlavor = [...payload.flavor_text_entries]
    .reverse()
    .find((entry) => entry.language.name === 'en')?.text
  const englishEffect = payload.effect_entries.find((entry) => entry.language.name === 'en')

  let flingEffect: string | null = null
  if (payload.fling_effect) {
    try {
      const flingPayload = await fetchJson<ItemFlingEffectResponse>(payload.fling_effect.url, signal)
      const englishFling = flingPayload.effect_entries.find((entry) => entry.language.name === 'en')?.effect
      flingEffect = englishFling ? cleanApiEffect(englishFling) : titleCasePokemonName(payload.fling_effect.name)
    } catch (error) {
      if (signal?.aborted) throw error
      flingEffect = titleCasePokemonName(payload.fling_effect.name)
    }
  }

  const machines = (await Promise.all(payload.machines.map((entry) => getMachinePreview(entry, signal))))
    .filter((entry): entry is ItemMachinePreview => Boolean(entry))
    .sort((a, b) => a.versionGroup.localeCompare(b.versionGroup, 'it'))

  const heldByPokemon: ItemHeldPokemonPreview[] = payload.held_by_pokemon
    .map((entry) => {
      const pokemonId = extractId(entry.pokemon.url)
      const rarities = entry.version_details.map((detail) => detail.rarity)
      return {
        id: pokemonId,
        name: titleCasePokemonName(entry.pokemon.name),
        image: officialArtwork(pokemonId),
        rarity: rarities.length > 0 ? Math.max(...rarities) : null,
        versions: [...new Set(entry.version_details.map((detail) => formatVersionName(detail.version.name)))],
      }
    })
    .filter((entry) => Number.isFinite(entry.id) && entry.id > 0)
    .sort((a, b) => a.id - b.id)

  const generationIds = payload.game_indices
    .map((entry) => extractId(entry.generation.url))
    .filter((generation) => Number.isFinite(generation) && generation > 0)

  const detail: ItemDetailData = {
    id: payload.id,
    slug: payload.name,
    name: localizedName(payload.names, payload.name),
    englishName: indexEntry?.englishName ?? titleCasePokemonName(payload.name),
    category: indexEntry?.category ?? payload.category.name,
    pocket: indexEntry?.pocket ?? 'misc',
    cost: payload.cost,
    flingPower: payload.fling_power,
    image: payload.sprites.default,
    description: cleanText(italianFlavor ?? englishFlavor ?? 'Descrizione non disponibile.'),
    effect: cleanApiEffect(
      englishEffect?.short_effect ?? englishEffect?.effect ?? italianFlavor ?? englishFlavor ?? 'Effetto non disponibile.',
    ),
    attributes: payload.attributes.map((attribute) => (
      itemAttributeNames[attribute.name] ?? titleCasePokemonName(attribute.name)
    )),
    flingEffect,
    generation: generationIds.length > 0 ? Math.min(...generationIds) : null,
    heldByPokemon,
    machines,
    babyTrigger: Boolean(payload.baby_trigger_for),
  }

  itemDetailCache.set(id, detail)
  return detail
}


export async function getAbilityDetail(id: number, signal?: AbortSignal): Promise<AbilityDetailData> {
  const cached = abilityDetailCache.get(id)
  if (cached) return cached

  const payload = await fetchJson<AbilityResponse>(`${API_BASE}/ability/${id}`, signal)
  const indexEntry = abilityById.get(payload.id)
  const italianFlavor = [...payload.flavor_text_entries]
    .reverse()
    .find((entry) => entry.language.name === 'it')?.flavor_text
  const englishFlavor = [...payload.flavor_text_entries]
    .reverse()
    .find((entry) => entry.language.name === 'en')?.flavor_text
  const italianEffect = payload.effect_entries.find((entry) => entry.language.name === 'it')
  const englishEffect = payload.effect_entries.find((entry) => entry.language.name === 'en')
  const effectSource = italianEffect ?? englishEffect
  const effectLanguage: 'it' | 'en' = italianEffect ? 'it' : 'en'

  const pokemon: AbilityPokemonPreview[] = payload.pokemon
    .map((entry) => {
      const pokemonId = extractId(entry.pokemon.url)
      return {
        id: pokemonId,
        name: titleCasePokemonName(entry.pokemon.name),
        image: officialArtwork(pokemonId),
        hidden: entry.is_hidden,
        slot: entry.slot,
      }
    })
    .filter((entry) => Number.isFinite(entry.id) && entry.id > 0)
    .sort((a, b) => a.id - b.id || Number(a.hidden) - Number(b.hidden))

  const effectChanges: AbilityEffectChange[] = payload.effect_changes
    .map((change) => {
      const italianChange = change.effect_entries.find((entry) => entry.language.name === 'it')?.effect
      const englishChange = change.effect_entries.find((entry) => entry.language.name === 'en')?.effect
      const effect = italianChange ?? englishChange
      if (!effect) return null
      return {
        versionGroup: formatVersionName(change.version_group.name),
        effect: cleanApiEffect(effect),
      }
    })
    .filter((entry): entry is AbilityEffectChange => Boolean(entry))

  const generationId = extractId(payload.generation.url)
  const detail: AbilityDetailData = {
    id: payload.id,
    slug: payload.name,
    name: localizedName(payload.names, payload.name),
    englishName: indexEntry?.englishName ?? titleCasePokemonName(payload.name),
    generation: Number.isFinite(generationId) && generationId > 0 ? generationId : indexEntry?.generation ?? 0,
    isMainSeries: payload.is_main_series,
    description: cleanText(italianFlavor ?? englishFlavor ?? 'Descrizione non disponibile.'),
    effect: cleanApiEffect(
      effectSource?.short_effect ?? effectSource?.effect ?? italianFlavor ?? englishFlavor ?? 'Effetto non disponibile.',
    ),
    effectLanguage,
    pokemon,
    effectChanges,
  }

  abilityDetailCache.set(id, detail)
  return detail
}
