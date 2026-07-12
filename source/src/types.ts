export type Accent = 'orange' | 'green' | 'purple' | 'blue' | 'cyan' | 'pink'

export type Feature = {
  id: string
  title: string
  subtitle: string
  icon: string
  accent: Accent
  phase: number
}

export type PokemonCatalogItem = {
  id: number
  name: string
}

export type PokemonCardData = PokemonCatalogItem & {
  image: string | null
  types: string[]
}

export type PokemonStat = {
  id: string
  label: string
  value: number
}

export type PokemonAbility = {
  id: string
  name: string
  description: string
  hidden: boolean
}

export type EvolutionStep = {
  id: number
  name: string
  image: string
  trigger: string | null
}

export type EvolutionPath = EvolutionStep[]

export type PokemonMovePreview = {
  id: string
  name: string
  method: string
  level: number
}

export type PokemonVariant = {
  id: number
  name: string
  image: string
  isDefault: boolean
}

export type PokemonDetailData = PokemonCardData & {
  italianName: string
  sprite: string | null
  shinyImage: string | null
  heightMetres: number
  weightKg: number
  category: string
  description: string
  generation: string
  habitat: string | null
  baseExperience: number | null
  stats: PokemonStat[]
  totalStats: number
  abilities: PokemonAbility[]
  evolutionPaths: EvolutionPath[]
  variants: PokemonVariant[]
  moves: PokemonMovePreview[]
}

export type RegionFilter = {
  id: string
  label: string
  min: number
  max: number
}

export type TypeFilter = {
  id: string
  label: string
  symbol: string
}

export type PokemonTeam = {
  id: string
  name: string
  pokemonIds: number[]
  createdAt: number
}

export type FavoriteEntry = {
  pokemonId: number
  addedAt: number
}


export type CollectionTrait = 'shiny' | 'alpha' | 'gigantamax' | 'paradox' | 'legendary'

export type CollectionEntry = {
  pokemonId: number
  traits: CollectionTrait[]
  addedAt: number
  updatedAt: number
}

export type MoveDamageClass = 'physical' | 'special' | 'status'

export type MoveIndexItem = {
  id: number
  slug: string
  name: string
  englishName: string
  generation: number
  type: string
  damageClass: MoveDamageClass
  power: number | null
  pp: number | null
  accuracy: number | null
  priority: number
}

export type MovePokemonPreview = {
  id: number
  name: string
  image: string
}

export type MoveStatChange = {
  stat: string
  change: number
}

export type MoveDetailData = MoveIndexItem & {
  description: string
  effect: string
  effectChance: number | null
  target: string
  ailment: string | null
  category: string
  minHits: number | null
  maxHits: number | null
  minTurns: number | null
  maxTurns: number | null
  drain: number
  healing: number
  critRate: number
  ailmentChance: number
  flinchChance: number
  statChance: number
  statChanges: MoveStatChange[]
  learnedByPokemon: MovePokemonPreview[]
}

export type ItemIndexItem = {
  id: number
  slug: string
  name: string
  englishName: string
  category: string
  pocket: string
  cost: number
  flingPower: number | null
}

export type ItemHeldPokemonPreview = {
  id: number
  name: string
  image: string
  rarity: number | null
  versions: string[]
}

export type ItemMachinePreview = {
  id: number
  moveSlug: string
  moveName: string
  versionGroup: string
}

export type ItemDetailData = ItemIndexItem & {
  image: string | null
  description: string
  effect: string
  attributes: string[]
  flingEffect: string | null
  generation: number | null
  heldByPokemon: ItemHeldPokemonPreview[]
  machines: ItemMachinePreview[]
  babyTrigger: boolean
}
