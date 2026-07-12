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
