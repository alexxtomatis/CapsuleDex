export const pokemonTypes = [
  'normal',
  'fire',
  'water',
  'electric',
  'grass',
  'ice',
  'fighting',
  'poison',
  'ground',
  'flying',
  'psychic',
  'bug',
  'rock',
  'ghost',
  'dragon',
  'dark',
  'steel',
  'fairy',
] as const

export type PokemonType = (typeof pokemonTypes)[number]
export type DefensiveMultiplier = 0 | 0.25 | 0.5 | 1 | 2 | 4

export type TypeProfileEntry = {
  type: PokemonType
  multiplier: DefensiveMultiplier
}

/**
 * Moltiplicatori ricevuti da un singolo tipo difensivo.
 * Le chiavi interne rappresentano il tipo della mossa in arrivo.
 */
const defensiveChart: Record<PokemonType, Partial<Record<PokemonType, 0 | 0.5 | 2>>> = {
  normal: { fighting: 2, ghost: 0 },
  fire: { water: 2, ground: 2, rock: 2, fire: 0.5, grass: 0.5, ice: 0.5, bug: 0.5, steel: 0.5, fairy: 0.5 },
  water: { electric: 2, grass: 2, fire: 0.5, water: 0.5, ice: 0.5, steel: 0.5 },
  electric: { ground: 2, electric: 0.5, flying: 0.5, steel: 0.5 },
  grass: { fire: 2, ice: 2, poison: 2, flying: 2, bug: 2, water: 0.5, electric: 0.5, grass: 0.5, ground: 0.5 },
  ice: { fire: 2, fighting: 2, rock: 2, steel: 2, ice: 0.5 },
  fighting: { flying: 2, psychic: 2, fairy: 2, bug: 0.5, rock: 0.5, dark: 0.5 },
  poison: { ground: 2, psychic: 2, fighting: 0.5, poison: 0.5, bug: 0.5, grass: 0.5, fairy: 0.5 },
  ground: { water: 2, grass: 2, ice: 2, poison: 0.5, rock: 0.5, electric: 0 },
  flying: { electric: 2, ice: 2, rock: 2, grass: 0.5, fighting: 0.5, bug: 0.5, ground: 0 },
  psychic: { bug: 2, ghost: 2, dark: 2, fighting: 0.5, psychic: 0.5 },
  bug: { fire: 2, flying: 2, rock: 2, grass: 0.5, fighting: 0.5, ground: 0.5 },
  rock: { water: 2, grass: 2, fighting: 2, ground: 2, steel: 2, normal: 0.5, fire: 0.5, poison: 0.5, flying: 0.5 },
  ghost: { ghost: 2, dark: 2, poison: 0.5, bug: 0.5, normal: 0, fighting: 0 },
  dragon: { ice: 2, dragon: 2, fairy: 2, fire: 0.5, water: 0.5, electric: 0.5, grass: 0.5 },
  dark: { fighting: 2, bug: 2, fairy: 2, ghost: 0.5, dark: 0.5, psychic: 0 },
  steel: { fire: 2, fighting: 2, ground: 2, normal: 0.5, grass: 0.5, ice: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 0.5, dragon: 0.5, steel: 0.5, fairy: 0.5, poison: 0 },
  fairy: { poison: 2, steel: 2, fighting: 0.5, bug: 0.5, dark: 0.5, dragon: 0 },
}

export const typeSymbols: Record<PokemonType, string> = {
  normal: '●',
  fire: '🔥',
  water: '💧',
  electric: '⚡',
  grass: '🍃',
  ice: '❄',
  fighting: '✊',
  poison: '☠',
  ground: '⬟',
  flying: '⌁',
  psychic: '◉',
  bug: '✣',
  rock: '⬢',
  ghost: '◌',
  dragon: '◇',
  dark: '☾',
  steel: '⬡',
  fairy: '✦',
}

export function isPokemonType(value: string): value is PokemonType {
  return (pokemonTypes as readonly string[]).includes(value)
}

export function calculateDefensiveProfile(defendingTypes: readonly PokemonType[]): TypeProfileEntry[] {
  const uniqueTypes = Array.from(new Set(defendingTypes)).slice(0, 2)

  return pokemonTypes.map((attackType) => {
    const rawMultiplier = uniqueTypes.reduce((total, defendingType) => {
      return total * (defensiveChart[defendingType][attackType] ?? 1)
    }, 1)

    return {
      type: attackType,
      multiplier: rawMultiplier as DefensiveMultiplier,
    }
  })
}

export function groupDefensiveProfile(profile: readonly TypeProfileEntry[]) {
  return {
    quadrupleWeaknesses: profile.filter((entry) => entry.multiplier === 4),
    weaknesses: profile.filter((entry) => entry.multiplier === 2),
    neutral: profile.filter((entry) => entry.multiplier === 1),
    resistances: profile.filter((entry) => entry.multiplier === 0.5),
    quarterResistances: profile.filter((entry) => entry.multiplier === 0.25),
    immunities: profile.filter((entry) => entry.multiplier === 0),
  }
}
