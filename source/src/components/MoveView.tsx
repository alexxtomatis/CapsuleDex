import { useEffect, useMemo, useState } from 'react'
import { italianTypeNames } from '../data/features'
import { moveIndex } from '../data/moveIndex'
import { getMoveDetail } from '../services/pokeapi'
import type { MoveDamageClass, MoveDetailData, MoveIndexItem } from '../types'
import { ArrowLeftIcon, IconButton, SearchIcon } from './Icon'

const PAGE_SIZE = 30
const POKEMON_PAGE_SIZE = 18

const moveTypeFilters = [
  'all', 'normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison', 'ground',
  'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy', 'shadow',
]

const damageClassLabels: Record<MoveDamageClass, string> = {
  physical: 'Fisica',
  special: 'Speciale',
  status: 'Stato',
}

const generationLabels: Record<number, string> = {
  1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI', 7: 'VII', 8: 'VIII', 9: 'IX',
}

const typeFallbackNames: Record<string, string> = {
  shadow: 'Ombra',
  unknown: 'Sconosciuto',
}

function typeLabel(type: string) {
  return italianTypeNames[type] ?? typeFallbackNames[type] ?? type.replace(/-/g, ' ')
}

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[\s_]+/g, '-')
}

function formatValue(value: number | null, suffix = '') {
  return value === null ? '—' : `${value}${suffix}`
}

function padMoveId(id: number) {
  return `M${String(id).padStart(4, '0')}`
}

function sortMoves(items: MoveIndexItem[], sort: string) {
  const copy = [...items]
  if (sort === 'name') return copy.sort((a, b) => a.name.localeCompare(b.name, 'it'))
  if (sort === 'power') return copy.sort((a, b) => (b.power ?? -1) - (a.power ?? -1) || a.id - b.id)
  if (sort === 'accuracy') return copy.sort((a, b) => (b.accuracy ?? -1) - (a.accuracy ?? -1) || a.id - b.id)
  if (sort === 'pp') return copy.sort((a, b) => (b.pp ?? -1) - (a.pp ?? -1) || a.id - b.id)
  return copy.sort((a, b) => a.id - b.id)
}

function MoveCard({ move, onOpen }: { move: MoveIndexItem; onOpen: () => void }) {
  return (
    <button type="button" className={`move-card move-card--${move.type}`} onClick={onOpen}>
      <span className="move-card__glow" aria-hidden="true" />
      <header>
        <span>{padMoveId(move.id)}</span>
        <i className={`move-class move-class--${move.damageClass}`}>{damageClassLabels[move.damageClass]}</i>
      </header>
      <strong>{move.name}</strong>
      {move.name !== move.englishName && <small>{move.englishName}</small>}
      <div className="move-card__type-row">
        <span className={`type-pill type-pill--${move.type}`}>{typeLabel(move.type)}</span>
        <b>Gen. {generationLabels[move.generation] ?? move.generation}</b>
      </div>
      <dl>
        <div><dt>Potenza</dt><dd>{formatValue(move.power)}</dd></div>
        <div><dt>Precisione</dt><dd>{formatValue(move.accuracy, '%')}</dd></div>
        <div><dt>PP</dt><dd>{formatValue(move.pp)}</dd></div>
      </dl>
      <span className="move-card__open">Dettagli <b>→</b></span>
    </button>
  )
}

type MoveDetailScreenProps = {
  moveId: number
  onBack: () => void
  onOpenPokemon: (id: number) => void
  onToast: (message: string) => void
}

function MoveDetailScreen({ moveId, onBack, onOpenPokemon, onToast }: MoveDetailScreenProps) {
  const [move, setMove] = useState<MoveDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pokemonLimit, setPokemonLimit] = useState(POKEMON_PAGE_SIZE)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError('')
    setMove(null)
    setPokemonLimit(POKEMON_PAGE_SIZE)
    getMoveDetail(moveId, controller.signal)
      .then(setMove)
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return
        setError(reason instanceof Error ? reason.message : 'Impossibile caricare la mossa.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [moveId])

  if (loading) {
    return (
      <div className="move-view move-detail-view">
        <header className="subpage-header">
          <IconButton label="Torna alle mosse" onClick={onBack}><ArrowLeftIcon /></IconButton>
          <div><p className="eyebrow">Database mosse</p><h1>Caricamento...</h1></div>
          <span className="subpage-header__spacer" />
        </header>
        <div className="move-detail-skeleton" aria-busy="true">
          <span className="skeleton" /><span className="skeleton" /><span className="skeleton" />
        </div>
      </div>
    )
  }

  if (!move || error) {
    return (
      <div className="move-view move-detail-view">
        <header className="subpage-header">
          <IconButton label="Torna alle mosse" onClick={onBack}><ArrowLeftIcon /></IconButton>
          <div><p className="eyebrow">Database mosse</p><h1>Errore</h1></div>
          <span className="subpage-header__spacer" />
        </header>
        <div className="error-panel" role="alert">
          <span>!</span><strong>Dati non disponibili</strong><p>{error || 'Riprova tra poco.'}</p>
          <button type="button" onClick={onBack}>Torna all’elenco</button>
        </div>
      </div>
    )
  }

  const multiHit = move.minHits !== null || move.maxHits !== null
  const multiTurn = move.minTurns !== null || move.maxTurns !== null
  const advancedStats = [
    move.priority !== 0 ? { label: 'Priorità', value: move.priority > 0 ? `+${move.priority}` : String(move.priority) } : null,
    move.effectChance !== null ? { label: 'Effetto', value: `${move.effectChance}%` } : null,
    move.ailmentChance > 0 ? { label: 'Stato', value: `${move.ailmentChance}%` } : null,
    move.flinchChance > 0 ? { label: 'Tentennamento', value: `${move.flinchChance}%` } : null,
    move.statChance > 0 ? { label: 'Statistiche', value: `${move.statChance}%` } : null,
    move.critRate > 0 ? { label: 'Critico', value: `+${move.critRate}` } : null,
    move.drain !== 0 ? { label: move.drain > 0 ? 'Assorbimento' : 'Contraccolpo', value: `${Math.abs(move.drain)}%` } : null,
    move.healing > 0 ? { label: 'Cura', value: `${move.healing}%` } : null,
    multiHit ? { label: 'Colpi', value: move.minHits === move.maxHits ? `${move.minHits}` : `${move.minHits ?? 1}–${move.maxHits ?? '∞'}` } : null,
    multiTurn ? { label: 'Turni', value: move.minTurns === move.maxTurns ? `${move.minTurns}` : `${move.minTurns ?? 1}–${move.maxTurns ?? '∞'}` } : null,
  ].filter((item): item is { label: string; value: string } => Boolean(item))

  return (
    <div className="move-view move-detail-view">
      <header className="subpage-header">
        <IconButton label="Torna alle mosse" onClick={onBack}><ArrowLeftIcon /></IconButton>
        <div><p className="eyebrow">Scheda mossa</p><h1>{move.name}</h1></div>
        <span className="move-id-badge">{padMoveId(move.id)}</span>
      </header>

      <section className={`move-detail-hero move-detail-hero--${move.type}`}>
        <span className="move-detail-hero__orb" aria-hidden="true">✦</span>
        <div className="move-detail-hero__copy">
          <div>
            <span className={`type-pill type-pill--${move.type}`}>{typeLabel(move.type)}</span>
            <span className={`move-class move-class--${move.damageClass}`}>{damageClassLabels[move.damageClass]}</span>
          </div>
          <h2>{move.name}</h2>
          {move.name !== move.englishName && <p className="move-detail-hero__english">{move.englishName}</p>}
          <p>{move.description}</p>
          <span>Introdotta in Generazione {generationLabels[move.generation] ?? move.generation}</span>
        </div>
      </section>

      <section className="move-core-stats" aria-label="Statistiche principali della mossa">
        <article><span>Potenza</span><strong>{formatValue(move.power)}</strong><small>{move.damageClass === 'status' ? 'Mossa di stato' : 'Danno base'}</small></article>
        <article><span>Precisione</span><strong>{formatValue(move.accuracy, '%')}</strong><small>{move.accuracy === null ? 'Non fallisce normalmente' : 'Probabilità base'}</small></article>
        <article><span>PP</span><strong>{formatValue(move.pp)}</strong><small>Punti Potenza</small></article>
      </section>

      <section className="move-info-section" aria-labelledby="move-effect-title">
        <div className="section-heading">
          <div><p className="eyebrow">Funzionamento</p><h2 id="move-effect-title">Effetto in lotta</h2></div>
          <span className="results-counter">{move.category}</span>
        </div>
        <article className="move-effect-card">
          <span className="move-effect-card__icon">⚡</span>
          <div><strong>{move.effect}</strong><p>Bersaglio: {move.target}</p></div>
        </article>
      </section>

      {(move.ailment || move.statChanges.length > 0 || advancedStats.length > 0) && (
        <section className="move-info-section" aria-labelledby="move-advanced-title">
          <div className="section-heading">
            <div><p className="eyebrow">Dati tecnici</p><h2 id="move-advanced-title">Effetti secondari</h2></div>
          </div>

          {move.ailment && (
            <article className="move-status-callout">
              <span>✦</span><div><small>Problema di stato</small><strong>{move.ailment}</strong></div>
              {move.ailmentChance > 0 && <b>{move.ailmentChance}%</b>}
            </article>
          )}

          {move.statChanges.length > 0 && (
            <div className="move-stat-changes">
              {move.statChanges.map((change) => (
                <article key={`${change.stat}-${change.change}`} className={change.change > 0 ? 'is-positive' : 'is-negative'}>
                  <span>{change.stat}</span><strong>{change.change > 0 ? '+' : ''}{change.change}</strong>
                </article>
              ))}
            </div>
          )}

          {advancedStats.length > 0 && (
            <dl className="move-advanced-grid">
              {advancedStats.map((item) => <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}
            </dl>
          )}
        </section>
      )}

      <section className="move-info-section" aria-labelledby="move-learners-title">
        <div className="section-heading">
          <div><p className="eyebrow">Compatibilità</p><h2 id="move-learners-title">Pokémon che la apprendono</h2></div>
          <span className="results-counter">{move.learnedByPokemon.length}</span>
        </div>

        {move.learnedByPokemon.length > 0 ? (
          <>
            <div className="move-pokemon-grid">
              {move.learnedByPokemon.slice(0, pokemonLimit).map((pokemon) => (
                <button type="button" key={pokemon.id} onClick={() => onOpenPokemon(pokemon.id)}>
                  <img src={pokemon.image} alt="" loading="lazy" onError={(event) => { event.currentTarget.src = './assets/capsuledex-mark.svg' }} />
                  <span>N°{String(pokemon.id).padStart(4, '0')}</span>
                  <strong>{pokemon.name}</strong>
                </button>
              ))}
            </div>
            {pokemonLimit < move.learnedByPokemon.length && (
              <button type="button" className="load-more-button" onClick={() => setPokemonLimit((value) => value + POKEMON_PAGE_SIZE)}>
                Mostra altri Pokémon
              </button>
            )}
          </>
        ) : (
          <div className="empty-state"><span>◇</span><strong>Nessun Pokémon elencato</strong><p>La mossa potrebbe essere speciale, inutilizzata o legata a una meccanica particolare.</p></div>
        )}
      </section>

      <aside className="move-note">
        <span>i</span>
        <p>I valori possono cambiare tra generazioni e giochi. CapsuleDex mostra i dati correnti restituiti da PokéAPI.</p>
      </aside>

      <button type="button" className="move-copy-button" onClick={() => {
        const text = `${move.name} · ${typeLabel(move.type)} · ${damageClassLabels[move.damageClass]} · Potenza ${formatValue(move.power)} · Precisione ${formatValue(move.accuracy, '%')} · PP ${formatValue(move.pp)}`
        navigator.clipboard?.writeText(text)
          .then(() => onToast('Riepilogo della mossa copiato.'))
          .catch(() => onToast('Copia non disponibile su questo browser.'))
      }}>Copia riepilogo</button>

      <footer className="app-footer app-footer--moves">
        <img src="./assets/capsuledex-mark.svg" alt="" />
        <p>Database mosse · dati tramite PokéAPI.</p>
      </footer>
    </div>
  )
}

type MoveViewProps = {
  initialMoveId?: number | null
  onBack: () => void
  onOpenPokemon: (id: number) => void
  onSelectionChange?: (id: number | null) => void
  onToast: (message: string) => void
}

export function MoveView({ initialMoveId, onBack, onOpenPokemon, onSelectionChange, onToast }: MoveViewProps) {
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [classFilter, setClassFilter] = useState<'all' | MoveDamageClass>('all')
  const [generationFilter, setGenerationFilter] = useState('all')
  const [sort, setSort] = useState('id')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [selectedMoveId, setSelectedMoveId] = useState<number | null>(initialMoveId ?? null)
  const [filtersOpen, setFiltersOpen] = useState(false)

  useEffect(() => {
    if (initialMoveId) setSelectedMoveId(initialMoveId)
  }, [initialMoveId])

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [query, typeFilter, classFilter, generationFilter, sort])

  const filtered = useMemo(() => {
    const normalizedQuery = normalize(query)
    const numericQuery = Number(query.trim())
    const results = moveIndex.filter((move) => {
      const matchesQuery = !normalizedQuery
        || normalize(move.name).includes(normalizedQuery)
        || normalize(move.englishName).includes(normalizedQuery)
        || move.slug.includes(normalizedQuery)
        || (Number.isInteger(numericQuery) && move.id === numericQuery)
      const matchesType = typeFilter === 'all' || move.type === typeFilter
      const matchesClass = classFilter === 'all' || move.damageClass === classFilter
      const matchesGeneration = generationFilter === 'all' || move.generation === Number(generationFilter)
      return matchesQuery && matchesType && matchesClass && matchesGeneration
    })
    return sortMoves(results, sort)
  }, [query, typeFilter, classFilter, generationFilter, sort])

  function openMove(id: number) {
    setSelectedMoveId(id)
    onSelectionChange?.(id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function closeMove() {
    setSelectedMoveId(null)
    onSelectionChange?.(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function clearFilters() {
    setQuery('')
    setTypeFilter('all')
    setClassFilter('all')
    setGenerationFilter('all')
    setSort('id')
  }

  if (selectedMoveId !== null) {
    return <MoveDetailScreen moveId={selectedMoveId} onBack={closeMove} onOpenPokemon={onOpenPokemon} onToast={onToast} />
  }

  const activeFilterCount = [typeFilter !== 'all', classFilter !== 'all', generationFilter !== 'all'].filter(Boolean).length

  return (
    <div className="move-view">
      <header className="subpage-header">
        <IconButton label="Torna alla Home" onClick={onBack}><ArrowLeftIcon /></IconButton>
        <div><p className="eyebrow">Fase 9</p><h1>Database mosse</h1></div>
        <span className="move-count-badge">{moveIndex.length}</span>
      </header>

      <section className="move-intro-card">
        <div><span>⚡</span></div>
        <article><p className="eyebrow">Archivio completo</p><h2>Ogni mossa, a portata di tap</h2><p>Cerca per nome o numero e confronta potenza, precisione, PP, tipo, categoria ed effetto.</p></article>
      </section>

      <div className="move-search-row">
        <label className="search-bar move-search">
          <SearchIcon />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cerca Botta, Thunderbolt o 85..." inputMode="search" />
          {query && <button type="button" onClick={() => setQuery('')} aria-label="Cancella ricerca">×</button>}
        </label>
        <button type="button" className={filtersOpen || activeFilterCount > 0 ? 'move-filter-toggle is-active' : 'move-filter-toggle'} onClick={() => setFiltersOpen((value) => !value)}>
          <span>☷</span>{activeFilterCount > 0 && <b>{activeFilterCount}</b>}
        </button>
      </div>

      <div className="move-type-scroller" aria-label="Filtra per tipo">
        {moveTypeFilters.map((type) => (
          <button type="button" key={type} className={`${typeFilter === type ? 'is-selected' : ''} ${type !== 'all' ? `type-filter--${type}` : ''}`} onClick={() => setTypeFilter(type)}>
            {type === 'all' ? 'Tutti i tipi' : typeLabel(type)}
          </button>
        ))}
      </div>

      {filtersOpen && (
        <section className="move-filter-panel" aria-label="Filtri avanzati">
          <div>
            <label htmlFor="move-class-filter">Categoria</label>
            <select id="move-class-filter" value={classFilter} onChange={(event) => setClassFilter(event.target.value as 'all' | MoveDamageClass)}>
              <option value="all">Tutte</option>
              <option value="physical">Fisiche</option>
              <option value="special">Speciali</option>
              <option value="status">Di stato</option>
            </select>
          </div>
          <div>
            <label htmlFor="move-generation-filter">Generazione</label>
            <select id="move-generation-filter" value={generationFilter} onChange={(event) => setGenerationFilter(event.target.value)}>
              <option value="all">Tutte</option>
              {Object.entries(generationLabels).map(([id, label]) => <option key={id} value={id}>Generazione {label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="move-sort">Ordina</label>
            <select id="move-sort" value={sort} onChange={(event) => setSort(event.target.value)}>
              <option value="id">Numero</option>
              <option value="name">Nome</option>
              <option value="power">Potenza</option>
              <option value="accuracy">Precisione</option>
              <option value="pp">PP</option>
            </select>
          </div>
          <button type="button" onClick={clearFilters}>Azzera filtri</button>
        </section>
      )}

      <div className="move-results-heading">
        <div><strong>{filtered.length}</strong><span>{filtered.length === 1 ? 'mossa trovata' : 'mosse trovate'}</span></div>
        <small>{sort === 'id' ? 'Ordine Pokédex mosse' : `Ordinate per ${sort === 'name' ? 'nome' : sort === 'power' ? 'potenza' : sort === 'accuracy' ? 'precisione' : 'PP'}`}</small>
      </div>

      {filtered.length > 0 ? (
        <>
          <div className="move-grid">
            {filtered.slice(0, visibleCount).map((move) => <MoveCard key={move.id} move={move} onOpen={() => openMove(move.id)} />)}
          </div>
          {visibleCount < filtered.length && (
            <button type="button" className="load-more-button" onClick={() => setVisibleCount((value) => value + PAGE_SIZE)}>
              Carica altre {Math.min(PAGE_SIZE, filtered.length - visibleCount)} mosse
            </button>
          )}
        </>
      ) : (
        <div className="empty-state move-empty-state">
          <span>⚡</span><strong>Nessuna mossa trovata</strong><p>Prova un nome diverso oppure azzera i filtri.</p><button type="button" onClick={clearFilters}>Azzera filtri</button>
        </div>
      )}

      <footer className="app-footer app-footer--moves">
        <img src="./assets/capsuledex-mark.svg" alt="" />
        <p>{moveIndex.length} mosse indicizzate · dettagli tramite PokéAPI.</p>
      </footer>
    </div>
  )
}
