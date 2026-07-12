import { statLabels } from '../data/features'
import { moveById } from '../data/moveIndex'
import type {
  EvolutionPath,
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
  names: Array<{ name: string; language: { name: string } }>
  flavor_text_entries: Array<{ flavor_text: string; language: { name: string }; version_group: { name: string } }>
  effect_entries: Array<{
    short_effect: string
    effect: string
    language: { name: string }
  }>
}

type EvolutionDetail = {
  trigger: { name: string }
  min_level: number | null
  item: { name: string } | null
  held_item: { name: string } | null
  known_move: { name: string } | null
  known_move_type: { name: string } | null
  location: { name: string } | null
  min_happiness: number | null
  min_affection: number | null
  time_of_day: string
  gender: number | null
  needs_overworld_rain: boolean
  turn_upside_down: boolean
  relative_physical_stats: number | null
  party_species: { name: string } | null
  party_type: { name: string } | null
  trade_species: { name: string } | null
}

type EvolutionChainLink = {
  species: { name: string; url: string }
  evolution_details: EvolutionDetail[]
  evolves_to: EvolutionChainLink[]
}

type EvolutionChainResponse = {
  id: number
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

function formatEvolutionDetail(detail: EvolutionDetail): string {
  const parts: string[] = [triggerNames[detail.trigger.name] ?? titleCasePokemonName(detail.trigger.name)]

  if (detail.min_level !== null) parts.push(`liv. ${detail.min_level}`)
  if (detail.item) parts.push(titleCasePokemonName(detail.item.name))
  if (detail.held_item) parts.push(`con ${titleCasePokemonName(detail.held_item.name)}`)
  if (detail.known_move) parts.push(`con ${titleCasePokemonName(detail.known_move.name)}`)
  if (detail.known_move_type) parts.push(`mossa ${titleCasePokemonName(detail.known_move_type.name)}`)
  if (detail.location) parts.push(`a ${titleCasePokemonName(detail.location.name)}`)
  if (detail.min_happiness !== null) parts.push(`felicità ${detail.min_happiness}+`)
  if (detail.min_affection !== null) parts.push(`affetto ${detail.min_affection}+`)
  if (detail.time_of_day) parts.push(detail.time_of_day === 'day' ? 'di giorno' : 'di notte')
  if (detail.needs_overworld_rain) parts.push('con pioggia')
  if (detail.turn_upside_down) parts.push('capovolgendo il dispositivo')
  if (detail.gender === 1) parts.push('femmina')
  if (detail.gender === 2) parts.push('maschio')
  if (detail.relative_physical_stats === 1) parts.push('Attacco > Difesa')
  if (detail.relative_physical_stats === 0) parts.push('Attacco = Difesa')
  if (detail.relative_physical_stats === -1) parts.push('Attacco < Difesa')
  if (detail.party_species) parts.push(`${titleCasePokemonName(detail.party_species.name)} in squadra`)
  if (detail.party_type) parts.push(`tipo ${titleCasePokemonName(detail.party_type.name)} in squadra`)
  if (detail.trade_species) parts.push(`per ${titleCasePokemonName(detail.trade_species.name)}`)

  return parts.join(' · ')
}

function evolutionTrigger(details: EvolutionDetail[]): string | null {
  if (details.length === 0) return null
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
