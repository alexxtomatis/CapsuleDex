import { FormEvent, useEffect, useMemo, useState } from 'react'
import { getPokemonCards } from '../services/pokeapi'
import type { FavoriteEntry, PokemonCardData } from '../types'
import { ArrowLeftIcon, HeartIcon, IconButton, SearchIcon, TrashIcon } from './Icon'
import { PokemonCard, PokemonCardSkeleton } from './PokemonCard'

type SortMode = 'recent' | 'number' | 'name'

type FavoritesViewProps = {
  favorites: FavoriteEntry[]
  onBack: () => void
  onOpenPokedex: () => void
  onOpenPokemon: (id: number) => void
  onToggleFavorite: (id: number, name?: string) => void
  onClearFavorites: () => void
  onToast: (message: string) => void
}

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, '-')
}

export function FavoritesView({
  favorites,
  onBack,
  onOpenPokedex,
  onOpenPokemon,
  onToggleFavorite,
  onClearFavorites,
  onToast,
}: FavoritesViewProps) {
  const [cards, setCards] = useState<PokemonCardData[]>([])
  const [query, setQuery] = useState('')
  const [sortMode, setSortMode] = useState<SortMode>('recent')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [reloadToken, setReloadToken] = useState(0)

  const favoriteIds = useMemo(() => favorites.map((favorite) => favorite.pokemonId), [favorites])

  useEffect(() => {
    if (favoriteIds.length === 0) {
      setCards([])
      setLoading(false)
      setError('')
      return
    }

    const controller = new AbortController()
    setLoading(true)
    setError('')

    getPokemonCards(favoriteIds, controller.signal)
      .then(setCards)
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return
        const message = reason instanceof Error ? reason.message : 'Errore sconosciuto'
        setError(`Non riesco a caricare i preferiti: ${message}.`)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [favoriteIds, reloadToken])

  const visibleCards = useMemo(() => {
    const normalized = normalize(query)
    const numericQuery = Number(normalized)
    const addedAtById = new Map(favorites.map((favorite) => [favorite.pokemonId, favorite.addedAt]))
    const currentFavoriteIds = new Set(favorites.map((favorite) => favorite.pokemonId))

    const filtered = cards.filter((pokemon) => currentFavoriteIds.has(pokemon.id) && (
      normalized.length === 0 ||
      pokemon.name.toLowerCase().includes(normalized) ||
      (Number.isInteger(numericQuery) && pokemon.id === numericQuery)
    ))

    return filtered.sort((a, b) => {
      if (sortMode === 'number') return a.id - b.id
      if (sortMode === 'name') return a.name.localeCompare(b.name, 'it')
      return (addedAtById.get(b.id) ?? 0) - (addedAtById.get(a.id) ?? 0)
    })
  }, [cards, favorites, query, sortMode])

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (query.trim() && visibleCards.length === 0) onToast(`Nessun preferito trovato per “${query.trim()}”.`)
  }

  return (
    <div className="favorites-view">
      <header className="pokedex-header favorites-header">
        <IconButton label="Torna alla home" onClick={onBack}>
          <ArrowLeftIcon />
        </IconButton>
        <div>
          <p className="eyebrow">La tua raccolta</p>
          <h1>Preferiti</h1>
        </div>
        <IconButton
          label="Rimuovi tutti i preferiti"
          onClick={() => favorites.length > 0 ? onClearFavorites() : onToast('Non ci sono preferiti da rimuovere.')}
        >
          <TrashIcon />
        </IconButton>
      </header>

      <section className="favorites-summary" aria-label="Riepilogo preferiti">
        <div className="favorites-summary__icon"><HeartIcon /></div>
        <div>
          <strong>{favorites.length}</strong>
          <span>{favorites.length === 1 ? 'Pokémon salvato' : 'Pokémon salvati'}</span>
        </div>
        <p>I tuoi preferiti restano su questo dispositivo e sono disponibili al prossimo accesso.</p>
      </section>

      {favorites.length > 0 && (
        <>
          <form className="search-bar search-bar--pokedex" onSubmit={handleSearch}>
            <SearchIcon />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cerca tra i preferiti..."
              inputMode="search"
              autoComplete="off"
              aria-label="Cerca tra i Pokémon preferiti"
            />
            {query && <button type="button" onClick={() => setQuery('')} aria-label="Cancella ricerca">×</button>}
          </form>

          <div className="favorites-toolbar">
            <span>Ordina per</span>
            <div role="group" aria-label="Ordina i preferiti">
              <button type="button" className={sortMode === 'recent' ? 'is-selected' : ''} onClick={() => setSortMode('recent')}>Recenti</button>
              <button type="button" className={sortMode === 'number' ? 'is-selected' : ''} onClick={() => setSortMode('number')}>Numero</button>
              <button type="button" className={sortMode === 'name' ? 'is-selected' : ''} onClick={() => setSortMode('name')}>Nome</button>
            </div>
          </div>
        </>
      )}

      <section className="favorites-results" aria-labelledby="favorites-results-title">
        <div className="section-heading section-heading--results">
          <div>
            <p className="eyebrow">CapsuleDex personale</p>
            <h2 id="favorites-results-title">
              {loading ? 'Caricamento...' : query.trim() ? `${visibleCards.length} risultati` : 'Pokémon preferiti'}
            </h2>
          </div>
          {!loading && favorites.length > 0 && <span className="results-counter">{visibleCards.length} / {favorites.length}</span>}
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

        {!error && loading && (
          <div className="pokemon-grid">
            {Array.from({ length: Math.min(6, Math.max(2, favoriteIds.length)) }, (_, index) => <PokemonCardSkeleton key={index} />)}
          </div>
        )}

        {!error && !loading && favorites.length === 0 && (
          <div className="favorites-empty">
            <div className="favorites-empty__orb"><HeartIcon /></div>
            <p className="eyebrow">La lista è vuota</p>
            <h2>Scegli i Pokémon che ami</h2>
            <p>Premi il cuore nelle carte del Pokédex o nelle schede dettagliate per ritrovarli qui.</p>
            <button type="button" onClick={onOpenPokedex}>Apri il Pokédex <span>→</span></button>
          </div>
        )}

        {!error && !loading && favorites.length > 0 && visibleCards.length === 0 && (
          <div className="empty-state">
            <span>⌕</span>
            <strong>Nessun preferito trovato</strong>
            <p>Prova con un altro nome o numero Pokédex.</p>
          </div>
        )}

        {!error && !loading && visibleCards.length > 0 && (
          <div className="pokemon-grid">
            {visibleCards.map((pokemon) => (
              <PokemonCard
                key={pokemon.id}
                pokemon={pokemon}
                onOpen={() => onOpenPokemon(pokemon.id)}
                isFavorite
                onToggleFavorite={() => onToggleFavorite(pokemon.id, pokemon.name)}
              />
            ))}
          </div>
        )}
      </section>

      <footer className="app-footer app-footer--pokedex">
        <img src="./assets/capsuledex-mark.svg" alt="" />
        <p>Dati forniti da PokéAPI · progetto fan-made non ufficiale.</p>
      </footer>
    </div>
  )
}
