import { useState } from 'react'
import { italianTypeNames } from '../data/features'
import type { PokemonCardData } from '../types'
import { CollectionIcon, HeartIcon } from './Icon'

const padId = (id: number) => `N°${String(id).padStart(4, '0')}`

type PokemonCardProps = {
  pokemon: PokemonCardData
  onOpen: (pokemon: PokemonCardData) => void
  isFavorite?: boolean
  onToggleFavorite?: (pokemon: PokemonCardData) => void
  isCollected?: boolean
  onToggleCollection?: (pokemon: PokemonCardData) => void
}

export function PokemonCard({ pokemon, onOpen, isFavorite = false, onToggleFavorite, isCollected = false, onToggleCollection }: PokemonCardProps) {
  const [imageFailed, setImageFailed] = useState(false)
  const mainType = pokemon.types[0] ?? 'normal'

  return (
    <article className={`pokemon-card pokemon-card--${mainType}`}>
      <button
        type="button"
        className="pokemon-card__open"
        onClick={() => onOpen(pokemon)}
        aria-label={`Apri ${pokemon.name}, ${padId(pokemon.id)}`}
      >
        <span className="pokemon-card__glow" aria-hidden="true" />
        <span className="pokemon-card__number">{padId(pokemon.id)}</span>
        <strong className="pokemon-card__name">{pokemon.name}</strong>

        <span className="pokemon-card__types">
          {pokemon.types.map((type) => (
            <span key={type} className={`type-pill type-pill--${type}`}>
              {italianTypeNames[type] ?? type}
            </span>
          ))}
        </span>

        <span className="pokemon-card__image-wrap" aria-hidden="true">
          {!imageFailed && pokemon.image ? (
            <img src={pokemon.image} alt="" loading="lazy" onError={() => setImageFailed(true)} />
          ) : (
            <span className="pokemon-card__fallback">◉</span>
          )}
        </span>
      </button>

      {onToggleFavorite && (
        <button
          type="button"
          className={`pokemon-card__favorite${isFavorite ? ' is-favorite' : ''}`}
          onClick={() => onToggleFavorite(pokemon)}
          aria-label={isFavorite ? `Rimuovi ${pokemon.name} dai preferiti` : `Aggiungi ${pokemon.name} ai preferiti`}
          aria-pressed={isFavorite}
        >
          <HeartIcon />
        </button>
      )}

      {onToggleCollection && (
        <button
          type="button"
          className={`pokemon-card__collection${isCollected ? ' is-collected' : ''}`}
          onClick={() => onToggleCollection(pokemon)}
          aria-label={isCollected ? `${pokemon.name} è nella collezione` : `Segna ${pokemon.name} come catturato`}
          aria-pressed={isCollected}
        >
          <CollectionIcon />
        </button>
      )}
    </article>
  )
}

export function PokemonCardSkeleton() {
  return (
    <div className="pokemon-card pokemon-card--skeleton" aria-hidden="true">
      <span className="skeleton skeleton--number" />
      <span className="skeleton skeleton--name" />
      <span className="skeleton skeleton--pill" />
      <span className="skeleton skeleton--image" />
    </div>
  )
}
