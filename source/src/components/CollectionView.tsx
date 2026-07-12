import { FormEvent, useEffect, useMemo, useState } from 'react'
import { getPokemonCards, getPokemonCatalog } from '../services/pokeapi'
import type { CollectionEntry, CollectionTrait, PokemonCardData, PokemonCatalogItem } from '../types'
import { ArrowLeftIcon, CollectionIcon, IconButton, SearchIcon, TrashIcon } from './Icon'
import { PokemonCardSkeleton } from './PokemonCard'

const PAGE_SIZE = 24
const traitOptions: Array<{ id: CollectionTrait; label: string; symbol: string }> = [
  { id: 'shiny', label: 'Shiny', symbol: '✦' },
  { id: 'alpha', label: 'Alpha', symbol: 'Α' },
  { id: 'gigantamax', label: 'Gigamax', symbol: 'G' },
  { id: 'paradox', label: 'Paradox', symbol: '∞' },
  { id: 'legendary', label: 'Leggendari', symbol: '★' },
]

type CollectionFilter = 'all' | CollectionTrait
type SortMode = 'recent' | 'number' | 'name'

type CollectionViewProps = {
  entries: CollectionEntry[]
  onBack: () => void
  onOpenPokemon: (id: number) => void
  onAddPokemon: (id: number, name?: string) => void
  onRemovePokemon: (id: number, name?: string) => void
  onToggleTrait: (id: number, trait: CollectionTrait, name?: string) => void
  onClear: () => void
  onToast: (message: string) => void
}

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, '-')
}

function padId(id: number) {
  return `N°${String(id).padStart(4, '0')}`
}

export function CollectionView({
  entries,
  onBack,
  onOpenPokemon,
  onAddPokemon,
  onRemovePokemon,
  onToggleTrait,
  onClear,
  onToast,
}: CollectionViewProps) {
  const [catalog, setCatalog] = useState<PokemonCatalogItem[]>([])
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [catalogError, setCatalogError] = useState('')
  const [addQuery, setAddQuery] = useState('')
  const [listQuery, setListQuery] = useState('')
  const [filter, setFilter] = useState<CollectionFilter>('all')
  const [sortMode, setSortMode] = useState<SortMode>('recent')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [cards, setCards] = useState<PokemonCardData[]>([])
  const [cardsLoading, setCardsLoading] = useState(false)
  const [reloadToken, setReloadToken] = useState(0)

  const entryMap = useMemo(() => new Map(entries.map((entry) => [entry.pokemonId, entry])), [entries])
  const catalogMap = useMemo(() => new Map(catalog.map((pokemon) => [pokemon.id, pokemon])), [catalog])

  useEffect(() => {
    const controller = new AbortController()
    setCatalogLoading(true)
    setCatalogError('')

    getPokemonCatalog(controller.signal)
      .then(setCatalog)
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return
        const message = reason instanceof Error ? reason.message : 'Errore sconosciuto'
        setCatalogError(`Catalogo non disponibile: ${message}.`)
      })
      .finally(() => {
        if (!controller.signal.aborted) setCatalogLoading(false)
      })

    return () => controller.abort()
  }, [reloadToken])

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [filter, listQuery, sortMode])

  const addResults = useMemo(() => {
    const normalized = normalize(addQuery)
    if (!normalized) return []
    const numeric = Number(normalized)

    return catalog
      .filter((pokemon) => (
        pokemon.name.includes(normalized) ||
        (Number.isInteger(numeric) && pokemon.id === numeric)
      ))
      .slice(0, 8)
  }, [addQuery, catalog])

  const filteredEntries = useMemo(() => {
    const normalized = normalize(listQuery)
    const numeric = Number(normalized)

    const result = entries.filter((entry) => {
      const catalogPokemon = catalogMap.get(entry.pokemonId)
      const name = catalogPokemon?.name ?? ''
      const matchesFilter = filter === 'all' || entry.traits.includes(filter)
      const matchesQuery = !normalized || name.includes(normalized) || (Number.isInteger(numeric) && entry.pokemonId === numeric)
      return matchesFilter && matchesQuery
    })

    return [...result].sort((a, b) => {
      if (sortMode === 'number') return a.pokemonId - b.pokemonId
      if (sortMode === 'name') {
        const aName = catalogMap.get(a.pokemonId)?.name ?? String(a.pokemonId)
        const bName = catalogMap.get(b.pokemonId)?.name ?? String(b.pokemonId)
        return aName.localeCompare(bName, 'it')
      }
      return b.updatedAt - a.updatedAt
    })
  }, [catalogMap, entries, filter, listQuery, sortMode])

  const visibleIds = useMemo(
    () => filteredEntries.slice(0, visibleCount).map((entry) => entry.pokemonId),
    [filteredEntries, visibleCount],
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
          onToast('Non riesco a caricare le immagini della collezione.')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setCardsLoading(false)
      })

    return () => controller.abort()
  }, [visibleIds, onToast])

  const nationalTotal = catalog.length || Math.max(1025, entries.length)

  const counts = useMemo(() => ({
    caught: entries.length,
    shiny: entries.filter((entry) => entry.traits.includes('shiny')).length,
    alpha: entries.filter((entry) => entry.traits.includes('alpha')).length,
    special: entries.filter((entry) => entry.traits.some((trait) => ['gigantamax', 'paradox', 'legendary'].includes(trait))).length,
  }), [entries])

  function handleAddSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const first = addResults[0]
    if (!first) {
      onToast('Scrivi un nome o un numero valido.')
      return
    }
    if (entryMap.has(first.id)) {
      onToast(`${first.name} è già nella collezione.`)
      return
    }
    onAddPokemon(first.id, first.name)
    setAddQuery('')
  }

  function addPokemon(pokemon: PokemonCatalogItem) {
    if (entryMap.has(pokemon.id)) {
      onToast(`${pokemon.name} è già nella collezione.`)
      return
    }
    onAddPokemon(pokemon.id, pokemon.name)
    setAddQuery('')
  }

  return (
    <div className="collection-view">
      <header className="pokedex-header collection-header">
        <IconButton label="Torna alla home" onClick={onBack}><ArrowLeftIcon /></IconButton>
        <div>
          <p className="eyebrow">CapsuleDex</p>
          <h1>Collezione</h1>
        </div>
        <IconButton label="Svuota la collezione" onClick={onClear}><TrashIcon /></IconButton>
      </header>

      <section className="collection-dashboard" aria-label="Riepilogo collezione">
        <article className="collection-dashboard__main">
          <span><CollectionIcon /></span>
          <div>
            <strong>{counts.caught}</strong>
            <small>Pokémon catturati</small>
          </div>
          <div className="collection-progress" aria-label={`${counts.caught} Pokémon su ${nationalTotal}`}>
            <i><b style={{ width: `${Math.min((counts.caught / nationalTotal) * 100, 100)}%` }} /></i>
            <span>{Math.round((counts.caught / nationalTotal) * 100)}%</span>
          </div>
        </article>
        <div className="collection-dashboard__mini">
          <article><span>✦</span><strong>{counts.shiny}</strong><small>Shiny</small></article>
          <article><span>Α</span><strong>{counts.alpha}</strong><small>Alpha</small></article>
          <article><span>★</span><strong>{counts.special}</strong><small>Speciali</small></article>
        </div>
      </section>

      <section className="collection-add" aria-labelledby="collection-add-title">
        <div className="section-heading section-heading--compact">
          <div>
            <p className="eyebrow">Nuova cattura</p>
            <h2 id="collection-add-title">Aggiungi un Pokémon</h2>
          </div>
          <span className="results-counter">Salvataggio locale</span>
        </div>

        <form className="search-bar" onSubmit={handleAddSubmit}>
          <SearchIcon />
          <input
            value={addQuery}
            onChange={(event) => setAddQuery(event.target.value)}
            placeholder="Nome o numero del Pokémon..."
            inputMode="search"
            autoComplete="off"
            aria-label="Aggiungi un Pokémon alla collezione"
          />
          {addQuery && <button type="button" onClick={() => setAddQuery('')} aria-label="Cancella ricerca">×</button>}
        </form>

        {catalogError && (
          <div className="api-error collection-api-error" role="alert">
            <span aria-hidden="true">!</span>
            <div>
              <strong>Catalogo non disponibile</strong>
              <p>{catalogError}</p>
              <button type="button" onClick={() => setReloadToken((value) => value + 1)}>Riprova</button>
            </div>
          </div>
        )}

        {!catalogError && addQuery && (
          <div className="collection-suggestions">
            {catalogLoading ? (
              <div className="collection-suggestion collection-suggestion--loading"><span className="skeleton" /></div>
            ) : addResults.length > 0 ? addResults.map((pokemon) => (
              <button type="button" key={pokemon.id} onClick={() => addPokemon(pokemon)} disabled={entryMap.has(pokemon.id)}>
                <span>{padId(pokemon.id)}</span>
                <strong>{pokemon.name.replace(/-/g, ' ')}</strong>
                <b>{entryMap.has(pokemon.id) ? '✓' : '+'}</b>
              </button>
            )) : (
              <div className="collection-suggestion-empty">Nessun Pokémon trovato.</div>
            )}
          </div>
        )}
      </section>

      <section className="collection-library" aria-labelledby="collection-library-title">
        <div className="section-heading section-heading--results">
          <div>
            <p className="eyebrow">Il tuo archivio</p>
            <h2 id="collection-library-title">Pokémon salvati</h2>
          </div>
          <span className="results-counter">{filteredEntries.length} / {entries.length}</span>
        </div>

        <div className="collection-filter-scroller" aria-label="Filtra la collezione">
          <button type="button" className={filter === 'all' ? 'is-selected' : ''} onClick={() => setFilter('all')}>
            <span>◉</span><small>Tutti</small>
          </button>
          {traitOptions.map((trait) => (
            <button type="button" key={trait.id} className={filter === trait.id ? 'is-selected' : ''} onClick={() => setFilter(trait.id)}>
              <span>{trait.symbol}</span><small>{trait.label}</small>
            </button>
          ))}
        </div>

        <div className="collection-toolbar">
          <form className="search-bar search-bar--collection" onSubmit={(event) => event.preventDefault()}>
            <SearchIcon />
            <input value={listQuery} onChange={(event) => setListQuery(event.target.value)} placeholder="Cerca nella collezione..." inputMode="search" />
            {listQuery && <button type="button" onClick={() => setListQuery('')} aria-label="Cancella ricerca">×</button>}
          </form>
          <select value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)} aria-label="Ordina la collezione">
            <option value="recent">Più recenti</option>
            <option value="number">Numero</option>
            <option value="name">Nome</option>
          </select>
        </div>

        {entries.length === 0 ? (
          <div className="collection-empty">
            <span><CollectionIcon /></span>
            <p className="eyebrow">Collezione vuota</p>
            <h2>Inizia la tua avventura</h2>
            <p>Cerca un Pokémon qui sopra oppure segnalo come catturato dalla sua scheda.</p>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="empty-state">
            <span>⌕</span>
            <strong>Nessun risultato</strong>
            <p>Cambia filtro o termine di ricerca.</p>
          </div>
        ) : (
          <>
            <div className="collection-grid" aria-busy={cardsLoading}>
              {cards.length > 0 ? cards.map((pokemon) => {
                const entry = entryMap.get(pokemon.id)
                if (!entry) return null
                return (
                  <article className="collection-card" key={pokemon.id}>
                    <button type="button" className="collection-card__main" onClick={() => onOpenPokemon(pokemon.id)}>
                      <div className="collection-card__image">
                        {pokemon.image ? <img src={pokemon.image} alt="" loading="lazy" /> : <span>◉</span>}
                      </div>
                      <div className="collection-card__copy">
                        <span>{padId(pokemon.id)}</span>
                        <strong>{pokemon.name}</strong>
                        <small>{pokemon.types.join(' · ')}</small>
                      </div>
                      <b>→</b>
                    </button>
                    <div className="collection-card__traits" aria-label={`Categorie di ${pokemon.name}`}>
                      {traitOptions.map((trait) => (
                        <button
                          type="button"
                          key={trait.id}
                          className={entry.traits.includes(trait.id) ? 'is-active' : ''}
                          onClick={() => onToggleTrait(pokemon.id, trait.id, pokemon.name)}
                          aria-pressed={entry.traits.includes(trait.id)}
                          title={trait.label}
                        >
                          <span>{trait.symbol}</span><small>{trait.label}</small>
                        </button>
                      ))}
                    </div>
                    <button type="button" className="collection-card__remove" onClick={() => onRemovePokemon(pokemon.id, pokemon.name)}>
                      <TrashIcon /><span>Rimuovi dalla collezione</span>
                    </button>
                  </article>
                )
              }) : Array.from({ length: Math.min(8, visibleIds.length) }, (_, index) => <PokemonCardSkeleton key={index} />)}
            </div>

            {visibleCount < filteredEntries.length && (
              <button type="button" className="load-more" disabled={cardsLoading} onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}>
                {cardsLoading ? 'Caricamento...' : `Carica altri ${Math.min(PAGE_SIZE, filteredEntries.length - visibleCount)}`}
              </button>
            )}
          </>
        )}
      </section>

      <footer className="app-footer app-footer--collection">
        <img src="./assets/capsuledex-mark.svg" alt="" />
        <p>La collezione resta salvata su questo dispositivo.</p>
      </footer>
    </div>
  )
}
