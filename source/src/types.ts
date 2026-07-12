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
