import { FormEvent, useEffect, useMemo, useState } from 'react'
import { italianTypeNames } from '../data/features'
import { getPokemonCards, getPokemonCatalog } from '../services/pokeapi'
import type { PokemonCardData, PokemonCatalogItem, PokemonTeam } from '../types'
import { ArrowLeftIcon, EditIcon, IconButton, PlusIcon, SearchIcon, TrashIcon, UsersIcon } from './Icon'

const MAX_TEAM_SIZE = 6

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, '-')
}

function padId(id: number) {
  return `N°${String(id).padStart(4, '0')}`
}

type TeamViewProps = {
  teams: PokemonTeam[]
  activeTeamId: string
  onBack: () => void
  onSelectTeam: (teamId: string) => void
  onCreateTeam: (name: string) => void
  onRenameTeam: (teamId: string, name: string) => void
  onDeleteTeam: (teamId: string) => void
  onAddPokemon: (pokemonId: number) => void
  onRemovePokemon: (pokemonId: number) => void
  onOpenPokemon: (pokemonId: number) => void
  onToast: (message: string) => void
}

type ModalState =
  | { kind: 'closed' }
  | { kind: 'create'; value: string }
  | { kind: 'rename'; value: string }
  | { kind: 'delete' }

export function TeamView({
  teams,
  activeTeamId,
  onBack,
  onSelectTeam,
  onCreateTeam,
  onRenameTeam,
  onDeleteTeam,
  onAddPokemon,
  onRemovePokemon,
  onOpenPokemon,
  onToast,
}: TeamViewProps) {
  const activeTeam = teams.find((team) => team.id === activeTeamId) ?? teams[0]
  const [catalog, setCatalog] = useState<PokemonCatalogItem[]>([])
  const [teamCards, setTeamCards] = useState<PokemonCardData[]>([])
  const [searchCards, setSearchCards] = useState<PokemonCardData[]>([])
  const [query, setQuery] = useState('')
  const [loadingTeam, setLoadingTeam] = useState(true)
  const [loadingSearch, setLoadingSearch] = useState(false)
  const [catalogError, setCatalogError] = useState('')
  const [modal, setModal] = useState<ModalState>({ kind: 'closed' })

  useEffect(() => {
    const controller = new AbortController()
    getPokemonCatalog(controller.signal)
      .then(setCatalog)
      .catch(() => setCatalogError('La ricerca non è disponibile. Controlla la connessione.'))
    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (!activeTeam || activeTeam.pokemonIds.length === 0) {
      setTeamCards([])
      setLoadingTeam(false)
      return
    }

    const controller = new AbortController()
    setLoadingTeam(true)
    getPokemonCards(activeTeam.pokemonIds, controller.signal)
      .then(setTeamCards)
      .catch(() => onToast('Non riesco a caricare i Pokémon della squadra.'))
      .finally(() => {
        if (!controller.signal.aborted) setLoadingTeam(false)
      })
    return () => controller.abort()
  }, [activeTeam, onToast])

  const filteredSearch = useMemo(() => {
    const normalized = normalize(query)
    if (!normalized) return []
    const numeric = Number(normalized)
    return catalog
      .filter((pokemon) => pokemon.name.includes(normalized) || (Number.isInteger(numeric) && pokemon.id === numeric))
      .slice(0, 12)
  }, [catalog, query])

  useEffect(() => {
    if (filteredSearch.length === 0) {
      setSearchCards([])
      setLoadingSearch(false)
      return
    }
    const controller = new AbortController()
    setLoadingSearch(true)
    getPokemonCards(filteredSearch.map((pokemon) => pokemon.id), controller.signal)
      .then(setSearchCards)
      .catch(() => onToast('Impossibile caricare i risultati della ricerca.'))
      .finally(() => {
        if (!controller.signal.aborted) setLoadingSearch(false)
      })
    return () => controller.abort()
  }, [filteredSearch, onToast])

  const cardById = useMemo(() => new Map(teamCards.map((card) => [card.id, card])), [teamCards])
  const typeCount = useMemo(() => new Set(teamCards.flatMap((card) => card.types)).size, [teamCards])

  function submitModal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (modal.kind === 'create') {
      const name = modal.value.trim()
      if (!name) return
      onCreateTeam(name)
      setModal({ kind: 'closed' })
    }
    if (modal.kind === 'rename' && activeTeam) {
      const name = modal.value.trim()
      if (!name) return
      onRenameTeam(activeTeam.id, name)
      setModal({ kind: 'closed' })
    }
  }

  if (!activeTeam) {
    return (
      <div className="team-view">
        <header className="pokedex-header">
          <IconButton label="Torna alla home" onClick={onBack}><ArrowLeftIcon /></IconButton>
          <div><p className="eyebrow">CapsuleDex</p><h1>La mia squadra</h1></div>
          <span className="detail-header-placeholder" />
        </header>
        <div className="empty-state"><span>◉</span><strong>Nessuna squadra</strong><p>Crea una squadra per iniziare.</p></div>
      </div>
    )
  }

  return (
    <div className="team-view">
      <header className="pokedex-header team-header">
        <IconButton label="Torna alla home" onClick={onBack}><ArrowLeftIcon /></IconButton>
        <div><p className="eyebrow">Team Builder</p><h1>La mia squadra</h1></div>
        <IconButton label="Crea una nuova squadra" onClick={() => setModal({ kind: 'create', value: `Squadra ${teams.length + 1}` })}><PlusIcon /></IconButton>
      </header>

      <section className="team-selector-section" aria-labelledby="teams-title">
        <div className="detail-section__heading">
          <div><p className="eyebrow">Squadre salvate</p><h2 id="teams-title">I miei team</h2></div>
          <span>{teams.length}</span>
        </div>
        <div className="team-selector">
          {teams.map((team) => (
            <button
              type="button"
              key={team.id}
              className={team.id === activeTeam.id ? 'is-active' : ''}
              onClick={() => onSelectTeam(team.id)}
            >
              <UsersIcon />
              <span>{team.name}</span>
              <small>{team.pokemonIds.length}/6</small>
            </button>
          ))}
          <button type="button" className="team-selector__new" onClick={() => setModal({ kind: 'create', value: `Squadra ${teams.length + 1}` })}>
            <PlusIcon /><span>Nuova</span><small>Crea</small>
          </button>
        </div>
      </section>

      <section className="active-team-card" aria-labelledby="active-team-title">
        <div className="active-team-card__top">
          <div>
            <p className="eyebrow">Squadra attiva</p>
            <h2 id="active-team-title">{activeTeam.name}</h2>
          </div>
          <div className="team-actions">
            <IconButton label="Rinomina squadra" onClick={() => setModal({ kind: 'rename', value: activeTeam.name })}><EditIcon /></IconButton>
            <IconButton label="Elimina squadra" onClick={() => setModal({ kind: 'delete' })}><TrashIcon /></IconButton>
          </div>
        </div>

        <div className="team-summary">
          <div><strong>{activeTeam.pokemonIds.length}/6</strong><span>Pokémon</span></div>
          <div><strong>{typeCount}</strong><span>Tipi diversi</span></div>
          <div><strong>{6 - activeTeam.pokemonIds.length}</strong><span>Slot liberi</span></div>
        </div>

        <div className="team-roster" aria-busy={loadingTeam}>
          {Array.from({ length: MAX_TEAM_SIZE }, (_, index) => {
            const pokemonId = activeTeam.pokemonIds[index]
            const card = pokemonId ? cardById.get(pokemonId) : undefined
            if (!pokemonId) {
              return (
                <button type="button" className="team-slot team-slot--empty" key={`empty-${index}`} onClick={() => document.getElementById('team-search')?.focus()}>
                  <PlusIcon /><strong>Slot libero</strong><span>Aggiungi Pokémon</span>
                </button>
              )
            }
            if (!card) {
              return <div className="team-slot team-slot--loading skeleton" key={pokemonId} />
            }
            const mainType = card.types[0] ?? 'normal'
            return (
              <article className={`team-slot team-slot--${mainType}`} key={card.id}>
                <button type="button" className="team-slot__open" onClick={() => onOpenPokemon(card.id)} aria-label={`Apri ${card.name}`}>
                  <span>{padId(card.id)}</span>
                  <img src={card.image ?? './assets/capsuledex-mark.svg'} alt="" loading="lazy" />
                  <strong>{card.name}</strong>
                  <small>{card.types.map((type) => italianTypeNames[type] ?? type).join(' · ')}</small>
                </button>
                <button type="button" className="team-slot__remove" onClick={() => onRemovePokemon(card.id)} aria-label={`Rimuovi ${card.name} dalla squadra`}>×</button>
              </article>
            )
          })}
        </div>
      </section>

      <section className="team-builder-section" aria-labelledby="builder-title">
        <div className="detail-section__heading">
          <div><p className="eyebrow">Componi il team</p><h2 id="builder-title">Aggiungi Pokémon</h2></div>
          <span>Max 6</span>
        </div>

        <form className="search-bar" onSubmit={(event) => event.preventDefault()}>
          <SearchIcon />
          <input
            id="team-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cerca per nome o numero..."
            inputMode="search"
            autoComplete="off"
            aria-label="Cerca un Pokémon da aggiungere"
          />
          {query && <button type="button" onClick={() => setQuery('')} aria-label="Cancella ricerca">×</button>}
        </form>

        {catalogError && <div className="team-inline-message">{catalogError}</div>}
        {!query && !catalogError && (
          <div className="team-search-hint"><span>⌕</span><p>Cerca un Pokémon e premi <strong>Aggiungi</strong>. La squadra viene salvata automaticamente su questo dispositivo.</p></div>
        )}
        {query && !loadingSearch && filteredSearch.length === 0 && (
          <div className="empty-state"><span>⌕</span><strong>Nessun risultato</strong><p>Prova con il nome inglese o il numero del Pokédex.</p></div>
        )}
        {loadingSearch && <div className="team-result-list">{Array.from({ length: 4 }, (_, index) => <div className="team-result team-result--loading skeleton" key={index} />)}</div>}
        {!loadingSearch && searchCards.length > 0 && (
          <div className="team-result-list">
            {searchCards.map((pokemon) => {
              const inTeam = activeTeam.pokemonIds.includes(pokemon.id)
              const isFull = activeTeam.pokemonIds.length >= MAX_TEAM_SIZE
              return (
                <article className="team-result" key={pokemon.id}>
                  <button type="button" className="team-result__pokemon" onClick={() => onOpenPokemon(pokemon.id)}>
                    <img src={pokemon.image ?? './assets/capsuledex-mark.svg'} alt="" loading="lazy" />
                    <div><span>{padId(pokemon.id)}</span><strong>{pokemon.name}</strong><small>{pokemon.types.map((type) => italianTypeNames[type] ?? type).join(' · ')}</small></div>
                  </button>
                  <button
                    type="button"
                    className={inTeam ? 'is-added' : ''}
                    disabled={inTeam || isFull}
                    onClick={() => onAddPokemon(pokemon.id)}
                  >
                    {inTeam ? 'In squadra' : isFull ? 'Completa' : 'Aggiungi'}
                  </button>
                </article>
              )
            })}
          </div>
        )}
      </section>

      <footer className="app-footer app-footer--pokedex">
        <img src="./assets/capsuledex-mark.svg" alt="" />
        <p>Le squadre sono salvate localmente nel browser.</p>
      </footer>

      {modal.kind !== 'closed' && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setModal({ kind: 'closed' })}>
          <div className="team-modal" role="dialog" aria-modal="true" aria-labelledby="team-modal-title" onMouseDown={(event) => event.stopPropagation()}>
            {modal.kind === 'delete' ? (
              <>
                <div className="team-modal__icon team-modal__icon--danger"><TrashIcon /></div>
                <h2 id="team-modal-title">Eliminare “{activeTeam.name}”?</h2>
                <p>La squadra e la sua composizione verranno rimosse da questo dispositivo.</p>
                <div className="team-modal__actions">
                  <button type="button" onClick={() => setModal({ kind: 'closed' })}>Annulla</button>
                  <button type="button" className="is-danger" onClick={() => { onDeleteTeam(activeTeam.id); setModal({ kind: 'closed' }) }}>Elimina</button>
                </div>
              </>
            ) : (
              <form onSubmit={submitModal}>
                <div className="team-modal__icon"><UsersIcon /></div>
                <h2 id="team-modal-title">{modal.kind === 'create' ? 'Nuova squadra' : 'Rinomina squadra'}</h2>
                <p>Scegli un nome riconoscibile. Potrai cambiarlo in qualsiasi momento.</p>
                <input
                  autoFocus
                  maxLength={30}
                  value={modal.value}
                  onChange={(event) => setModal({ ...modal, value: event.target.value })}
                  aria-label="Nome della squadra"
                />
                <div className="team-modal__actions">
                  <button type="button" onClick={() => setModal({ kind: 'closed' })}>Annulla</button>
                  <button type="submit" disabled={!modal.value.trim()}>{modal.kind === 'create' ? 'Crea' : 'Salva'}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
