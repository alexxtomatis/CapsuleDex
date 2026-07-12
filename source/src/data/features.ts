import type { Feature, RegionFilter, TypeFilter } from '../types'

export const CURRENT_PHASE = 14

export const regions: RegionFilter[] = [
  { id: 'all', label: 'Tutti', min: 1, max: Number.MAX_SAFE_INTEGER },
  { id: 'kanto', label: 'Kanto', min: 1, max: 151 },
  { id: 'johto', label: 'Johto', min: 152, max: 251 },
  { id: 'hoenn', label: 'Hoenn', min: 252, max: 386 },
  { id: 'sinnoh', label: 'Sinnoh', min: 387, max: 493 },
  { id: 'unova', label: 'Unima', min: 494, max: 649 },
  { id: 'kalos', label: 'Kalos', min: 650, max: 721 },
  { id: 'alola', label: 'Alola', min: 722, max: 809 },
  { id: 'galar', label: 'Galar', min: 810, max: 905 },
  { id: 'paldea', label: 'Paldea', min: 906, max: 1025 },
]

export const typeFilters: TypeFilter[] = [
  { id: 'all', label: 'Tutti', symbol: '◉' },
  { id: 'fire', label: 'Fuoco', symbol: '🔥' },
  { id: 'water', label: 'Acqua', symbol: '💧' },
  { id: 'grass', label: 'Erba', symbol: '🍃' },
  { id: 'electric', label: 'Elettro', symbol: '⚡' },
  { id: 'psychic', label: 'Psico', symbol: '◉' },
  { id: 'ice', label: 'Ghiaccio', symbol: '❄' },
  { id: 'dragon', label: 'Drago', symbol: '◇' },
  { id: 'dark', label: 'Buio', symbol: '☾' },
  { id: 'fairy', label: 'Folletto', symbol: '✦' },
  { id: 'fighting', label: 'Lotta', symbol: '✊' },
  { id: 'flying', label: 'Volante', symbol: '⌁' },
  { id: 'poison', label: 'Veleno', symbol: '☠' },
  { id: 'ground', label: 'Terra', symbol: '⬟' },
  { id: 'rock', label: 'Roccia', symbol: '⬢' },
  { id: 'bug', label: 'Coleottero', symbol: '✣' },
  { id: 'ghost', label: 'Spettro', symbol: '◌' },
  { id: 'steel', label: 'Acciaio', symbol: '⬡' },
  { id: 'normal', label: 'Normale', symbol: '●' },
]

export const features: Feature[] = [
  { id: 'pokemon', title: 'Pokémon', subtitle: 'Pokédex e schede complete', icon: '◉', accent: 'pink', phase: 2 },
  { id: 'items', title: 'Strumenti', subtitle: 'Oggetti e bacche', icon: '🎒', accent: 'orange', phase: 10 },
  { id: 'moves', title: 'Mosse', subtitle: 'Potenza, tipo e PP', icon: '⚡', accent: 'green', phase: 9 },
  { id: 'abilities', title: 'Abilità', subtitle: 'Effetti e strategie', icon: '✦', accent: 'purple', phase: 11 },
  { id: 'evolutions', title: 'Evoluzioni', subtitle: 'Metodi e alberi completi', icon: '↗', accent: 'cyan', phase: 12 },
  { id: 'team', title: 'La mia squadra', subtitle: 'Crea e salva i tuoi team', icon: '◉', accent: 'blue', phase: 4 },
  { id: 'favorites', title: 'Preferiti', subtitle: 'La tua raccolta personale', icon: '♥', accent: 'pink', phase: 5 },
  { id: 'collection', title: 'Collezione', subtitle: 'Catture e forme speciali', icon: '⬡', accent: 'cyan', phase: 6 },
  { id: 'types', title: 'Calcolatore tipi', subtitle: 'Debolezze e resistenze', icon: '◇', accent: 'purple', phase: 7 },
  { id: 'battle', title: 'Battle Dex', subtitle: 'Confronta due Pokémon', icon: 'VS', accent: 'orange', phase: 8 },
  { id: 'offline', title: 'Modalità offline', subtitle: 'Cache, installazione e backup', icon: '⌁', accent: 'blue', phase: 13 },
]

export const italianTypeNames: Record<string, string> = {
  normal: 'Normale',
  fire: 'Fuoco',
  water: 'Acqua',
  electric: 'Elettro',
  grass: 'Erba',
  ice: 'Ghiaccio',
  fighting: 'Lotta',
  poison: 'Veleno',
  ground: 'Terra',
  flying: 'Volante',
  psychic: 'Psico',
  bug: 'Coleottero',
  rock: 'Roccia',
  ghost: 'Spettro',
  dragon: 'Drago',
  dark: 'Buio',
  steel: 'Acciaio',
  fairy: 'Folletto',
}

export const statLabels: Record<string, string> = {
  hp: 'PS',
  attack: 'Attacco',
  defense: 'Difesa',
  'special-attack': 'Att. Sp.',
  'special-defense': 'Dif. Sp.',
  speed: 'Velocità',
}
