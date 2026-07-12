import { useEffect, useMemo, useState } from 'react'
import { gymGames } from '../data/gymLeaders'
import { italianTypeNames } from '../data/features'
import { getPokemonCatalog } from '../services/pokeapi'
import type { GymLeader, PokemonCatalogItem } from '../types'
import { ArrowLeftIcon, IconButton, SearchIcon } from './Icon'

const artworkBase = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork'

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[\s_]+/g, '-')
}

function formatSlug(value?: string) {
  if (!value) return ''
  return value
    .split('-')
    .map((part) => part ? part[0].toUpperCase() + part.slice(1) : part)
    .join(' ')
}

function teamMatches(leader: GymLeader, query: string) {
  if (!query) return true
  const needle = normalize(query)
  return [leader.name, leader.type ?? '', leader.circuit ?? '', leader.variant ?? '', ...leader.team.flatMap((pokemon) => [pokemon.displayName, pokemon.slug])]
    .some((value) => normalize(value).includes(needle))
}


type SavedGymSelection = { gameId?: string; version?: string; variant?: string }

function loadGymSelection(): SavedGymSelection {
  try {
    return JSON.parse(localStorage.getItem('capsuledex:gym-selection') ?? '{}') as SavedGymSelection
  } catch {
    return {}
  }
}

type GymLeaderViewProps = {
  onBack: () => void
  onOpenPokemon: (id: number) => void
  onToast: (message: string) => void
}

export function GymLeaderView({ onBack, onOpenPokemon, onToast }: GymLeaderViewProps) {
  const savedSelection = useMemo(loadGymSelection, [])
  const initialGame = gymGames.find((game) => game.id === savedSelection.gameId) ?? gymGames[0]
  const [selectedGameId, setSelectedGameId] = useState(initialGame.id)
  const [selectedVersion, setSelectedVersion] = useState(initialGame.versions.includes(savedSelection.version ?? '') ? savedSelection.version! : initialGame.versions[0])
  const [selectedVariant, setSelectedVariant] = useState(savedSelection.variant ?? 'all')
  const [selectedGeneration, setSelectedGeneration] = useState('all')
  const [query, setQuery] = useState('')
  const [catalog, setCatalog] = useState<PokemonCatalogItem[]>([])

  useEffect(() => {
    const controller = new AbortController()
    getPokemonCatalog(controller.signal).then(setCatalog).catch(() => undefined)
    return () => controller.abort()
  }, [])

  useEffect(() => {
    localStorage.setItem('capsuledex:gym-selection', JSON.stringify({ gameId: selectedGameId, version: selectedVersion, variant: selectedVariant }))
  }, [selectedGameId, selectedVariant, selectedVersion])

  const pokemonIdBySlug = useMemo(() => new Map(catalog.map((entry) => [entry.name, entry.id])), [catalog])
  const generations = useMemo(() => [...new Set(gymGames.map((game) => game.generation))], [])
  const availableGames = useMemo(() => selectedGeneration === 'all'
    ? gymGames
    : gymGames.filter((game) => game.generation === selectedGeneration), [selectedGeneration])

  const selectedGame = useMemo(
    () => gymGames.find((game) => game.id === selectedGameId) ?? gymGames[0],
    [selectedGameId],
  )

  const variants = useMemo(() => [...new Set(selectedGame.leaders.map((leader) => leader.variant).filter((value): value is string => Boolean(value)))], [selectedGame])

  const visibleLeaders = useMemo(() => selectedGame.leaders
    .filter((leader) => !leader.versions || leader.versions.includes(selectedVersion))
    .filter((leader) => selectedVariant === 'all' || leader.variant === selectedVariant)
    .filter((leader) => teamMatches(leader, query))
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, 'it')),
  [query, selectedGame, selectedVariant, selectedVersion])

  function selectGeneration(generation: string) {
    setSelectedGeneration(generation)
    if (generation === 'all' || selectedGame.generation === generation) return
    const firstGame = gymGames.find((game) => game.generation === generation)
    if (firstGame) selectGame(firstGame.id)
  }

  function selectGame(gameId: string) {
    const game = gymGames.find((entry) => entry.id === gameId)
    if (!game) return
    setSelectedGameId(gameId)
    setSelectedVersion(game.versions[0])
    setSelectedVariant('all')
    setQuery('')
  }

  function openTeamPokemon(slug: string, displayName: string) {
    const id = pokemonIdBySlug.get(slug)
    if (!id) {
      onToast(`La scheda di ${displayName} non è disponibile nel catalogo attuale.`)
      return
    }
    onOpenPokemon(id)
  }

  return (
    <div className="gym-view">
      <header className="database-topbar gym-topbar">
        <IconButton label="Torna alla Home" onClick={onBack}><ArrowLeftIcon /></IconButton>
        <div>
          <span className="eyebrow">Guida alle sfide</span>
          <h1>Capipalestra</h1>
        </div>
        <span className="database-topbar__badge gym-topbar__badge">◆</span>
      </header>

      <section className="gym-intro">
        <div className="gym-intro__badge" aria-hidden="true"><span>◆</span></div>
        <div>
          <p className="eyebrow">Palestre, prove e Kahuna</p>
          <h2>Ogni gioco, ogni squadra</h2>
          <p>Scegli il titolo e la versione per vedere l’ordine delle sfide e i Pokémon usati nel primo incontro della storia.</p>
        </div>
      </section>

      <section className="gym-game-browser" aria-labelledby="gym-games-title">
        <div className="gym-section-heading">
          <div><p className="eyebrow">Archivio giochi</p><h2 id="gym-games-title">Scegli la versione</h2></div>
          <span>{gymGames.length} gruppi</span>
        </div>

        <div className="gym-generation-scroller" aria-label="Filtra per generazione">
          <button type="button" className={selectedGeneration === 'all' ? 'is-selected' : ''} onClick={() => selectGeneration('all')}>Tutte</button>
          {generations.map((generation) => (
            <button type="button" key={generation} className={selectedGeneration === generation ? 'is-selected' : ''} onClick={() => selectGeneration(generation)}>
              Gen. {generation}
            </button>
          ))}
        </div>

        <div className="gym-game-grid">
          {availableGames.map((game) => (
            <button
              type="button"
              key={game.id}
              className={selectedGame.id === game.id ? 'is-selected' : ''}
              onClick={() => selectGame(game.id)}
            >
              <span>Gen. {game.generation}</span>
              <strong>{game.short}</strong>
              <small>{game.region}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="gym-selected-game">
        <header>
          <div>
            <p className="eyebrow">{selectedGame.region} · Generazione {selectedGame.generation}</p>
            <h2>{selectedGame.title}</h2>
            <span>{selectedGame.category}</span>
          </div>
          <strong>{selectedGame.leaders.length || '—'}</strong>
        </header>
        <p>{selectedGame.note}</p>

        {selectedGame.versions.length > 1 && (
          <div className="gym-version-scroller" aria-label="Scegli la versione specifica">
            {selectedGame.versions.map((version) => (
              <button type="button" key={version} className={selectedVersion === version ? 'is-selected' : ''} onClick={() => setSelectedVersion(version)}>{version}</button>
            ))}
          </div>
        )}

        {variants.length > 0 && (
          <div className="gym-variant-scroller" aria-label="Scegli la variante della sfida">
            <button type="button" className={selectedVariant === 'all' ? 'is-selected' : ''} onClick={() => setSelectedVariant('all')}>Tutte le modalità</button>
            {variants.map((variant) => (
              <button type="button" key={variant} className={selectedVariant === variant ? 'is-selected' : ''} onClick={() => setSelectedVariant(variant)}>{variant}</button>
            ))}
          </div>
        )}
      </section>

      {selectedGame.leaders.length > 0 && (
        <label className="database-search gym-search">
          <SearchIcon />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cerca Capopalestra o Pokémon…" aria-label="Cerca tra Capipalestra e squadre" />
          {query && <button type="button" onClick={() => setQuery('')} aria-label="Cancella ricerca">×</button>}
        </label>
      )}

      {selectedGame.leaders.length === 0 ? (
        <section className="gym-no-leaders">
          <span>◇</span>
          <div>
            <strong>Nessun circuito di Palestre tradizionale</strong>
            <p>{selectedGame.note}</p>
          </div>
        </section>
      ) : visibleLeaders.length === 0 ? (
        <div className="empty-state gym-empty">
          <span>◆</span>
          <strong>Nessun risultato</strong>
          <p>Cambia versione, modalità oppure cancella la ricerca.</p>
        </div>
      ) : (
        <div className="gym-leader-list">
          {visibleLeaders.map((leader) => (
            <article className="gym-leader-card" key={`${selectedGame.id}-${selectedVersion}-${leader.id}-${leader.variant ?? 'base'}-${leader.name}`}>
              <header>
                <div className="gym-order-badge"><span>{leader.circuit ?? selectedGame.category}</span><strong>{leader.order}</strong></div>
                <div className="gym-leader-heading">
                  <p>{leader.circuit ? `${leader.circuit} · ` : ''}{leader.variant ?? 'Sfida della storia'}</p>
                  <h3>{leader.name}</h3>
                  <div>
                    {leader.type && <span className={`type-pill type-pill--${leader.type}`}>{italianTypeNames[leader.type] ?? formatSlug(leader.type)}</span>}
                    {leader.versions?.map((version) => <small key={version}>{version}</small>)}
                  </div>
                </div>
                <span className="gym-team-count">{leader.team.length}<small>Pokémon</small></span>
              </header>

              <div className="gym-team-grid">
                {leader.team.map((pokemon, index) => {
                  const pokemonId = pokemonIdBySlug.get(pokemon.slug)
                  return (
                    <button
                      type="button"
                      className="gym-pokemon-card"
                      key={`${leader.id}-${pokemon.slug}-${pokemon.level ?? 'x'}-${index}`}
                      onClick={() => openTeamPokemon(pokemon.slug, pokemon.displayName)}
                    >
                      <span className="gym-pokemon-card__art">
                        {pokemonId
                          ? <img src={`${artworkBase}/${pokemonId}.png`} alt="" loading="lazy" onError={(event) => { event.currentTarget.hidden = true }} />
                          : <i>◉</i>}
                      </span>
                      <span className="gym-pokemon-card__copy">
                        <strong>{pokemon.displayName}</strong>
                        <small>{pokemon.level ? `Lv. ${pokemon.level}` : 'Livello variabile'}</small>
                        {pokemon.condition && <em>{pokemon.condition}</em>}
                        {pokemon.ability && <em>Abilità: {formatSlug(pokemon.ability)}</em>}
                        {pokemon.heldItem && <em>Strumento: {formatSlug(pokemon.heldItem)}</em>}
                        {pokemon.teraType && <em>Teratipo: {italianTypeNames[pokemon.teraType] ?? formatSlug(pokemon.teraType)}</em>}
                      </span>
                      <b>→</b>
                    </button>
                  )
                })}
              </div>
            </article>
          ))}
        </div>
      )}

      <aside className="data-note gym-note">
        <span>i</span>
        <p>Le squadre mostrate sono quelle della prima sfida nella storia principale. Rivincite, Tornei, DLC e squadre post-game non sono incluse; Nero 2/Bianco 2 mostra anche le varianti disponibili della Modalità Sfida.</p>
      </aside>

      <footer className="app-footer app-footer--database">
        <img src="./assets/capsuledex-mark.svg" alt="" />
        <p>CapsuleDex 1.1 · Guida fan-made a Palestre, prove e squadre.</p>
      </footer>
    </div>
  )
}
