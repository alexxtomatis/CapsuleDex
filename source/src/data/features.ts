import type { Feature } from '../types'

export const regions = [
  'Tutti',
  'Kanto',
  'Johto',
  'Hoenn',
  'Sinnoh',
  'Unima',
  'Kalos',
  'Alola',
  'Galar',
  'Paldea',
]

export const features: Feature[] = [
  { id: 'items', title: 'Strumenti', subtitle: 'Oggetti e bacche', icon: '🎒', accent: 'orange', phase: 10 },
  { id: 'moves', title: 'Mosse', subtitle: 'Potenza, tipo e PP', icon: '⚡', accent: 'green', phase: 9 },
  { id: 'abilities', title: 'Abilità', subtitle: 'Effetti e strategie', icon: '✦', accent: 'purple', phase: 11 },
  { id: 'team', title: 'La mia squadra', subtitle: 'Fino a 6 Pokémon', icon: '◉', accent: 'blue', phase: 4 },
  { id: 'areas', title: 'Zone', subtitle: 'Regioni e percorsi', icon: '🗺️', accent: 'cyan', phase: 6 },
  { id: 'species', title: 'Specie', subtitle: 'Forme e varianti', icon: '✣', accent: 'pink', phase: 3 },
]
