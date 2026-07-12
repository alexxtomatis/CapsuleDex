import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { regions, typeFilters } from '../data/features'
import { getPokemonCards, getPokemonCatalog, getPokemonIdsByType } from '../services/pokeapi'
import type { PokemonCardData, PokemonCatalogItem } from '../types'
import { ArrowLeftIcon, FilterIcon, IconButton, SearchIcon } from './Icon'
import { PokemonCard, PokemonCardSkeleton } from './PokemonCard'

const PAGE_SIZE = 24

type PokedexViewProps = {
  initialQuery: string
  initialRegion: string
  onBack: () => void
  onOpenPokemon: (id: number) => void
  onToast: (message: string) => void
  favoriteIds: Set<number>
  onToggleFavorite: (id: number, name?: string) => void
  collectionIds: Set<number>
  onAddToCollection: (id: number, name?: string) => void
}

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, '-')
}

export function PokedexView({ initialQuery, initialRegion, onBack, onOpenPokemon, onToast, favoriteIds, onToggleFavorite, collectionIds, onAddToCollection }: PokedexViewProps) {
  const [catalog, setCatalog] = useState<PokemonCatalogItem[]>([])
  const [query, setQuery] = useState(initialQuery)
  const [regionId, setRegionId] = useState(initialRegion)
  const [typeId, setTypeId] = useState('all')
  const [typeIds, setTypeIds] = useState<Set<number> | null>(null)
  const [cards, setCards] = useState<PokemonCardData[]>([])
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [cardsLoading, setCardsLoading] = useState(false)
  const [typeLoading, setTypeLoading] = useState(false)
  const [error, setError] = useState('')
  const [reloadToken, setReloadToken] = useState(0)
  const typeScrollerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const controller = new AbortController()
    setCatalogLoading(true)
    setError('')

    getPokemonCatalog(controller.signal)
      .then(setCatalog)
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return
        const message = reason instanceof Error ? reason.message : 'Errore sconosciuto'
        setError(`Non riesco a collegarmi al Pokédex: ${message}.`)
      })
      .finally(() => {
        if (!controller.signal.aborted) setCatalogLoading(false)
      })

    return () => controller.abort()
  }, [reloadToken])

  useEffect(() => {
    if (typeId === 'all') {
      setTypeIds(null)
      setTypeLoading(false)
      return
    }

    const controller = new AbortController()
    setTypeLoading(true)
    getPokemonIdsByType(typeId, controller.signal)
      .then(setTypeIds)
      .catch(() => {
        if (!controller.signal.aborted) {
          setTypeIds(new Set())
          onToast('Il filtro per tipo non è disponibile. Riprova tra poco.')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setTypeLoading(false)
      })

    return () => controller.abort()
  }, [typeId, onToast])

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [query, regionId, typeId])

  const selectedRegion = useMemo(
    () => regions.find((region) => region.id === regionId) ?? regions[0],
    [regionId],
  )

  const filteredCatalog = useMemo(() => {
    const normalized = normalize(query)
    const numericQuery = Number(normalized)

    return catalog.filter((pokemon) => {
      const inRegion = pokemon.id >= selectedRegion.min && pokemon.id <= selectedRegion.max
      const inType = typeId === 'all' || Boolean(typeIds?.has(pokemon.id))
      const matchesQuery =
        normalized.length === 0 ||
        pokemon.name.includes(normalized) ||
        (Number.isInteger(numericQuery) && pokemon.id === numericQuery)

      return inRegion && inType && matchesQuery
    })
  }, [catalog, query, selectedRegion, typeId, typeIds])

  const visibleIds = useMemo(
    () => filteredCatalog.slice(0, visibleCount).map((pokemon) => pokemon.id),
    [filteredCatalog, visibleCount],
  )

  useEffect(() => {
    if (visibleIds.length === 0) {
      setCards([])
      setCardsLoading(false)
      return
    }

    const controller = new AbortController()
    setCardsLoading(true)

    getPokemonCards(visibleIds, controller.signal)
      .then(setCards)
      .catch(() => {
        if (!controller.signal.aborted) {
          setCards([])
          onToast('Errore nel caricamento delle immagini. Controlla la connessione.')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setCardsLoading(false)
      })

    return () => controller.abort()
  }, [visibleIds, onToast])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!query.trim()) return
    if (filteredCatalog.length === 0) onToast(`Nessun Pokémon trovato per “${query.trim()}”.`)
  }

  function openPokemon(pokemon: PokemonCardData) {
    onOpenPokemon(pokemon.id)
  }

  const isLoading = catalogLoading || typeLoading
  const hasMore = visibleCount < filteredCatalog.length

  return (
    <div className="pokedex-view">
      <header className="pokedex-header">
        <IconButton label="Torna alla home" onClick={onBack}>
          <ArrowLeftIcon />
        </IconButton>
        <div>
          <p className="eyebrow">CapsuleDex</p>
          <h1>Pokédex</h1>
        </div>
        <IconButton
          label="Vai ai filtri"
          onClick={() => typeScrollerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
        >
          <FilterIcon />
        </IconButton>
      </header>

      <form className="search-bar search-bar--pokedex" onSubmit={handleSubmit}>
        <SearchIcon />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Nome o numero del Pokémon..."
          inputMode="search"
          autoComplete="off"
          aria-label="Cerca un Pokémon"
        />
        {query && (
          <button type="button" onClick={() => setQuery('')} aria-label="Cancella ricerca">×</button>
        )}
      </form>

      <div className="region-scroller" aria-label="Filtra per regione">
        {regions.map((region) => (
          <button
            type="button"
            key={region.id}
            className={regionId === region.id ? 'is-selected' : ''}
            onClick={() => setRegionId(region.id)}
          >
            {region.label}
          </button>
        ))}
      </div>

      <div className="type-scroller" ref={typeScrollerRef} aria-label="Filtra per tipo">
        {typeFilters.map((type) => (
          <button
            type="button"
            key={type.id}
            className={`type-filter type-filter--${type.id}${typeId === type.id ? ' is-selected' : ''}`}
            onClick={() => setTypeId(type.id)}
            title={type.label}
            aria-label={`Tipo ${type.label}`}
          >
            <span aria-hidden="true">{type.symbol}</span>
            <small>{type.label}</small>
          </button>
        ))}
      </div>

      <section className="pokedex-results" aria-labelledby="results-title">
        <div className="section-heading section-heading--results">
          <div>
            <p className="eyebrow">
              {selectedRegion.id === 'all' ? 'Pokédex nazionale' : `Regione di ${selectedRegion.label}`}
            </p>
            <h2 id="results-title">
              {isLoading ? 'Caricamento...' : `${filteredCatalog.length} Pokémon`}
            </h2>
          </div>
          {!isLoading && filteredCatalog.length > 0 && (
            <span className="results-counter">{Math.min(visibleCount, filteredCatalog.length)} / {filteredCatalog.length}</span>
          )}
        </div>

        {error && (
          <div className="api-error" role="alert">
            <span aria-hidden="true">!</span>
            <div>
              <strong>Connessione non riuscita</strong>
              <p>{error}</p>
              <button type="button" onClick={() => setReloadToken((value) => value + 1)}>Riprova</button>
            </div>
          </div>
        )}

        {!error && isLoading && (
          <div className="pokemon-grid">
            {Array.from({ length: 8 }, (_, index) => <PokemonCardSkeleton key={index} />)}
          </div>
        )}

        {!error && !isLoading && filteredCatalog.length === 0 && (
          <div className="empty-state">
            <span>⌕</span>
            <strong>Nessun Pokémon trovato</strong>
            <p>Cambia nome, numero, regione o tipo e riprova.</p>
          </div>
        )}

        {!error && !isLoading && filteredCatalog.length > 0 && (
          <>
            <div className="pokemon-grid" aria-busy={cardsLoading}>
              {cards.length > 0
                ? cards.map((pokemon) => (
                    <PokemonCard
                      key={pokemon.id}
                      pokemon={pokemon}
                      onOpen={openPokemon}
                      isFavorite={favoriteIds.has(pokemon.id)}
                      onToggleFavorite={() => onToggleFavorite(pokemon.id, pokemon.name)}
                      isCollected={collectionIds.has(pokemon.id)}
                      onToggleCollection={() => collectionIds.has(pokemon.id)
                        ? onToast(`${pokemon.name} è già nella collezione.`)
                        : onAddToCollection(pokemon.id, pokemon.name)}
                    />
                  ))
                : Array.from({ length: Math.min(8, visibleIds.length) }, (_, index) => <PokemonCardSkeleton key={index} />)}
            </div>

            {hasMore && (
              <button
                type="button"
                className="load-more"
                disabled={cardsLoading}
                onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
              >
                {cardsLoading ? 'Caricamento...' : `Carica altri ${Math.min(PAGE_SIZE, filteredCatalog.length - visibleCount)}`}
              </button>
            )}
          </>
        )}
      </section>

      <footer className="app-footer app-footer--pokedex">
        <img src="./assets/capsuledex-mark.svg" alt="" />
        <p>Dati forniti da PokéAPI · progetto fan-made non ufficiale.</p>
      </footer>
    </div>
  )
}
