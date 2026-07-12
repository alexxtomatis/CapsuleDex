import { useEffect, useMemo, useState } from 'react'
import { abilityIndex } from '../data/abilityIndex'
import { getAbilityDetail } from '../services/pokeapi'
import type { AbilityDetailData, AbilityIndexItem } from '../types'
import { ArrowLeftIcon, IconButton, SearchIcon } from './Icon'

const PAGE_SIZE = 36
const POKEMON_PAGE_SIZE = 24
const ROMAN_GENERATIONS = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX']

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[\s_]+/g, '-')
}

function padAbilityId(id: number) {
  return `A${String(id).padStart(id >= 10000 ? 5 : 4, '0')}`
}

function generationLabel(generation: number) {
  return `Generazione ${ROMAN_GENERATIONS[generation] ?? generation}`
}

function sortAbilities(items: AbilityIndexItem[], sort: string) {
  const copy = [...items]
  if (sort === 'name') return copy.sort((a, b) => a.name.localeCompare(b.name, 'it'))
  if (sort === 'generation') return copy.sort((a, b) => a.generation - b.generation || a.id - b.id)
  return copy.sort((a, b) => a.id - b.id)
}

function AbilityCard({ ability, onOpen }: { ability: AbilityIndexItem; onOpen: () => void }) {
  return (
    <button type="button" className={`ability-db-card${ability.isMainSeries ? '' : ' ability-db-card--side'}`} onClick={onOpen}>
      <span className="ability-db-card__glow" aria-hidden="true" />
      <header>
        <span>{padAbilityId(ability.id)}</span>
        <i>{generationLabel(ability.generation)}</i>
      </header>
      <div className="ability-db-card__sigil" aria-hidden="true"><span>✦</span><i /></div>
      <strong>{ability.name}</strong>
      {ability.name !== ability.englishName && <small>{ability.englishName}</small>}
      <div className="ability-db-card__tags">
        <span>{ability.isMainSeries ? 'Serie principale' : 'Titolo secondario'}</span>
      </div>
      <span className="ability-db-card__open">Apri scheda <b>→</b></span>
    </button>
  )
}

type AbilityDetailScreenProps = {
  abilityId: number
  onBack: () => void
  onOpenPokemon: (id: number) => void
  onOpenAbility: (id: number) => void
  onToast: (message: string) => void
}

function AbilityDetailScreen({ abilityId, onBack, onOpenPokemon, onOpenAbility, onToast }: AbilityDetailScreenProps) {
  const [ability, setAbility] = useState<AbilityDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pokemonLimit, setPokemonLimit] = useState(POKEMON_PAGE_SIZE)
  const [pokemonQuery, setPokemonQuery] = useState('')
  const [pokemonFilter, setPokemonFilter] = useState<'all' | 'normal' | 'hidden'>('all')

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError('')
    setAbility(null)
    setPokemonLimit(POKEMON_PAGE_SIZE)
    setPokemonQuery('')
    setPokemonFilter('all')
    getAbilityDetail(abilityId, controller.signal)
      .then(setAbility)
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return
        setError(reason instanceof Error ? reason.message : 'Impossibile caricare l’abilità.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [abilityId])

  const currentIndex = useMemo(() => abilityIndex.findIndex((entry) => entry.id === abilityId), [abilityId])
  const previousAbility = currentIndex > 0 ? abilityIndex[currentIndex - 1] : null
  const nextAbility = currentIndex >= 0 && currentIndex < abilityIndex.length - 1 ? abilityIndex[currentIndex + 1] : null

  const filteredPokemon = useMemo(() => {
    if (!ability) return []
    const normalizedQuery = normalize(pokemonQuery)
    const numericQuery = Number(pokemonQuery.trim())
    return ability.pokemon.filter((pokemon) => {
      const matchesQuery = !normalizedQuery
        || normalize(pokemon.name).includes(normalizedQuery)
        || (Number.isInteger(numericQuery) && pokemon.id === numericQuery)
      const matchesFilter = pokemonFilter === 'all'
        || (pokemonFilter === 'hidden' ? pokemon.hidden : !pokemon.hidden)
      return matchesQuery && matchesFilter
    })
  }, [ability, pokemonFilter, pokemonQuery])

  if (loading) {
    return (
      <div className="ability-view ability-detail-view">
        <header className="subpage-header">
          <IconButton label="Torna alle abilità" onClick={onBack}><ArrowLeftIcon /></IconButton>
          <div><p className="eyebrow">Database abilità</p><h1>Caricamento...</h1></div>
          <span className="subpage-header__spacer" />
        </header>
        <div className="ability-detail-skeleton" aria-busy="true">
          <span className="skeleton" /><span className="skeleton" /><span className="skeleton" />
        </div>
      </div>
    )
  }

  if (!ability || error) {
    return (
      <div className="ability-view ability-detail-view">
        <header className="subpage-header">
          <IconButton label="Torna alle abilità" onClick={onBack}><ArrowLeftIcon /></IconButton>
          <div><p className="eyebrow">Database abilità</p><h1>Errore</h1></div>
          <span className="subpage-header__spacer" />
        </header>
        <div className="error-panel" role="alert">
          <span>!</span><strong>Dati non disponibili</strong><p>{error || 'Riprova tra poco.'}</p>
          <button type="button" onClick={onBack}>Torna all’elenco</button>
        </div>
      </div>
    )
  }

  const normalCount = ability.pokemon.filter((pokemon) => !pokemon.hidden).length
  const hiddenCount = ability.pokemon.length - normalCount

  async function copySummary() {
    if (!ability) return
    const summary = `${ability.name} (${ability.englishName}) — ${generationLabel(ability.generation)}\n${ability.description}\nEffetto: ${ability.effect}`
    try {
      await navigator.clipboard.writeText(summary)
      onToast('Riepilogo dell’abilità copiato.')
    } catch {
      onToast('Il browser non consente di copiare automaticamente.')
    }
  }

  return (
    <div className="ability-view ability-detail-view">
      <header className="subpage-header">
        <IconButton label="Torna alle abilità" onClick={onBack}><ArrowLeftIcon /></IconButton>
        <div><p className="eyebrow">Scheda abilità</p><h1>{ability.name}</h1></div>
        <span className="ability-id-badge">{padAbilityId(ability.id)}</span>
      </header>

      <section className={`ability-detail-hero${ability.isMainSeries ? '' : ' ability-detail-hero--side'}`}>
        <span className="ability-detail-hero__orbits" aria-hidden="true" />
        <div className="ability-detail-hero__sigil" aria-hidden="true"><span>✦</span><i /><b /></div>
        <article>
          <div className="ability-detail-hero__chips">
            <span>{generationLabel(ability.generation)}</span>
            <span>{ability.isMainSeries ? 'Serie principale' : 'Titolo secondario'}</span>
          </div>
          <h2>{ability.name}</h2>
          {ability.name !== ability.englishName && <p className="ability-detail-hero__english">{ability.englishName}</p>}
          <p>{ability.description}</p>
          <small>Identificatore API: {ability.slug}</small>
        </article>
      </section>

      <section className="ability-core-stats" aria-label="Riepilogo abilità">
        <article><span>Pokémon</span><strong>{ability.pokemon.length}</strong><small>associati</small></article>
        <article><span>Normale</span><strong>{normalCount}</strong><small>slot standard</small></article>
        <article><span>Nascosta</span><strong>{hiddenCount}</strong><small>abilità nascosta</small></article>
      </section>

      <section className="ability-info-section">
        <div className="detail-section__heading">
          <div><p className="eyebrow">Meccanica</p><h2>Effetto dell’abilità</h2></div>
          <span>{ability.effectLanguage === 'it' ? 'IT' : 'EN'}</span>
        </div>
        <article className="ability-effect-card">
          <span>✦</span>
          <div>
            <strong>{ability.effect}</strong>
            {ability.effectLanguage === 'en' && <p>PokéAPI non fornisce per questa voce un effetto tecnico in italiano; viene mostrato il testo inglese disponibile.</p>}
          </div>
        </article>
      </section>

      {ability.effectChanges.length > 0 && (
        <section className="ability-info-section">
          <div className="detail-section__heading">
            <div><p className="eyebrow">Cronologia</p><h2>Effetti nelle versioni precedenti</h2></div>
            <span>{ability.effectChanges.length}</span>
          </div>
          <div className="ability-change-list">
            {ability.effectChanges.map((change, index) => (
              <article key={`${change.versionGroup}-${index}`}>
                <span>{change.versionGroup}</span>
                <p>{change.effect}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="ability-info-section">
        <div className="detail-section__heading">
          <div><p className="eyebrow">Compatibilità</p><h2>Pokémon con questa abilità</h2></div>
          <span>{filteredPokemon.length}</span>
        </div>

        <label className="search-bar ability-pokemon-search">
          <SearchIcon />
          <input value={pokemonQuery} onChange={(event) => setPokemonQuery(event.target.value)} placeholder="Cerca un Pokémon..." inputMode="search" />
          {pokemonQuery && <button type="button" onClick={() => setPokemonQuery('')} aria-label="Cancella ricerca">×</button>}
        </label>

        <div className="ability-pokemon-filters" aria-label="Filtra i Pokémon per tipo di abilità">
          {([
            ['all', 'Tutti'],
            ['normal', 'Normale'],
            ['hidden', 'Nascosta'],
          ] as const).map(([id, label]) => (
            <button type="button" key={id} className={pokemonFilter === id ? 'is-selected' : ''} onClick={() => setPokemonFilter(id)}>{label}</button>
          ))}
        </div>

        {filteredPokemon.length > 0 ? (
          <>
            <div className="ability-pokemon-grid">
              {filteredPokemon.slice(0, pokemonLimit).map((pokemon) => (
                <button type="button" key={`${pokemon.id}-${pokemon.slot}-${pokemon.hidden}`} onClick={() => onOpenPokemon(pokemon.id)}>
                  <span className="ability-pokemon-grid__number">N°{String(pokemon.id).padStart(4, '0')}</span>
                  <img src={pokemon.image} alt="" loading="lazy" onError={(event) => { event.currentTarget.src = './assets/capsuledex-mark.svg' }} />
                  <strong>{pokemon.name}</strong>
                  <small>{pokemon.hidden ? 'Nascosta' : `Slot ${pokemon.slot}`}</small>
                </button>
              ))}
            </div>
            {pokemonLimit < filteredPokemon.length && (
              <button type="button" className="load-more-button" onClick={() => setPokemonLimit((value) => value + POKEMON_PAGE_SIZE)}>
                Carica altri {Math.min(POKEMON_PAGE_SIZE, filteredPokemon.length - pokemonLimit)} Pokémon
              </button>
            )}
          </>
        ) : (
          <div className="empty-state ability-empty-state">
            <span>✦</span><strong>Nessun Pokémon trovato</strong><p>Modifica la ricerca o il filtro selezionato.</p>
          </div>
        )}
      </section>

      <nav className="ability-detail-navigation" aria-label="Navigazione tra abilità">
        <button type="button" disabled={!previousAbility} onClick={() => previousAbility && onOpenAbility(previousAbility.id)}>
          <span>← Precedente</span><strong>{previousAbility?.name ?? '—'}</strong>
        </button>
        <button type="button" disabled={!nextAbility} onClick={() => nextAbility && onOpenAbility(nextAbility.id)}>
          <span>Successiva →</span><strong>{nextAbility?.name ?? '—'}</strong>
        </button>
      </nav>

      <button type="button" className="ability-copy-button" onClick={copySummary}>Copia riepilogo</button>
      <p className="ability-note"><span>i</span> Gli effetti possono variare tra giochi e generazioni. Consulta le modifiche storiche quando disponibili.</p>
    </div>
  )
}

type AbilityViewProps = {
  initialAbilityId?: number | null
  onBack: () => void
  onOpenPokemon: (id: number) => void
  onSelectionChange?: (id: number | null) => void
  onToast: (message: string) => void
}

export function AbilityView({ initialAbilityId, onBack, onOpenPokemon, onSelectionChange, onToast }: AbilityViewProps) {
  const [query, setQuery] = useState('')
  const [generationFilter, setGenerationFilter] = useState('all')
  const [seriesFilter, setSeriesFilter] = useState<'all' | 'main' | 'side'>('all')
  const [sort, setSort] = useState('id')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [selectedAbilityId, setSelectedAbilityId] = useState<number | null>(initialAbilityId ?? null)
  const [filtersOpen, setFiltersOpen] = useState(false)

  useEffect(() => {
    if (initialAbilityId) setSelectedAbilityId(initialAbilityId)
  }, [initialAbilityId])

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [query, generationFilter, seriesFilter, sort])

  const filtered = useMemo(() => {
    const normalizedQuery = normalize(query)
    const numericQuery = Number(query.trim())
    const results = abilityIndex.filter((ability) => {
      const matchesQuery = !normalizedQuery
        || normalize(ability.name).includes(normalizedQuery)
        || normalize(ability.englishName).includes(normalizedQuery)
        || ability.slug.includes(normalizedQuery)
        || (Number.isInteger(numericQuery) && ability.id === numericQuery)
      const matchesGeneration = generationFilter === 'all' || ability.generation === Number(generationFilter)
      const matchesSeries = seriesFilter === 'all'
        || (seriesFilter === 'main' ? ability.isMainSeries : !ability.isMainSeries)
      return matchesQuery && matchesGeneration && matchesSeries
    })
    return sortAbilities(results, sort)
  }, [generationFilter, query, seriesFilter, sort])

  function openAbility(id: number) {
    setSelectedAbilityId(id)
    onSelectionChange?.(id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function closeAbility() {
    setSelectedAbilityId(null)
    onSelectionChange?.(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function clearFilters() {
    setQuery('')
    setGenerationFilter('all')
    setSeriesFilter('all')
    setSort('id')
  }

  if (selectedAbilityId !== null) {
    return (
      <AbilityDetailScreen
        abilityId={selectedAbilityId}
        onBack={closeAbility}
        onOpenPokemon={onOpenPokemon}
        onOpenAbility={openAbility}
        onToast={onToast}
      />
    )
  }

  const activeFilterCount = [generationFilter !== 'all', seriesFilter !== 'all'].filter(Boolean).length
  const mainSeriesCount = abilityIndex.filter((ability) => ability.isMainSeries).length

  return (
    <div className="ability-view">
      <header className="subpage-header">
        <IconButton label="Torna alla Home" onClick={onBack}><ArrowLeftIcon /></IconButton>
        <div><p className="eyebrow">Fase 11</p><h1>Database abilità</h1></div>
        <span className="ability-count-badge">{abilityIndex.length}</span>
      </header>

      <section className="ability-intro-card">
        <div className="ability-intro-card__sigil"><span>✦</span><i /></div>
        <article><p className="eyebrow">Talenti passivi</p><h2>Scopri ciò che rende unico ogni Pokémon</h2><p>Consulta effetti, generazioni, modifiche storiche e tutti i Pokémon compatibili.</p></article>
      </section>

      <section className="ability-summary-strip" aria-label="Riepilogo archivio">
        <article><strong>{mainSeriesCount}</strong><span>serie principale</span></article>
        <article><strong>{abilityIndex.length - mainSeriesCount}</strong><span>titoli secondari</span></article>
        <article><strong>9</strong><span>generazioni</span></article>
      </section>

      <div className="ability-search-row">
        <label className="search-bar ability-search">
          <SearchIcon />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cerca Levitazione, Statico o 26..." inputMode="search" />
          {query && <button type="button" onClick={() => setQuery('')} aria-label="Cancella ricerca">×</button>}
        </label>
        <button type="button" className={filtersOpen || activeFilterCount > 0 ? 'ability-filter-toggle is-active' : 'ability-filter-toggle'} onClick={() => setFiltersOpen((value) => !value)}>
          <span>☷</span>{activeFilterCount > 0 && <b>{activeFilterCount}</b>}
        </button>
      </div>

      <div className="ability-series-scroller" aria-label="Filtra per serie">
        {([
          ['all', 'Tutte'],
          ['main', 'Serie principale'],
          ['side', 'Titoli secondari'],
        ] as const).map(([id, label]) => (
          <button type="button" key={id} className={seriesFilter === id ? 'is-selected' : ''} onClick={() => setSeriesFilter(id)}>{label}</button>
        ))}
      </div>

      <div className="ability-generation-scroller" aria-label="Filtra per generazione">
        <button type="button" className={generationFilter === 'all' ? 'is-selected' : ''} onClick={() => setGenerationFilter('all')}>Tutte</button>
        {Array.from({ length: 9 }, (_, index) => index + 1).map((generation) => (
          <button type="button" key={generation} className={generationFilter === String(generation) ? 'is-selected' : ''} onClick={() => setGenerationFilter(String(generation))}>
            Gen. {ROMAN_GENERATIONS[generation]}
          </button>
        ))}
      </div>

      {filtersOpen && (
        <section className="ability-filter-panel" aria-label="Filtri avanzati">
          <div>
            <label htmlFor="ability-generation-filter">Generazione</label>
            <select id="ability-generation-filter" value={generationFilter} onChange={(event) => setGenerationFilter(event.target.value)}>
              <option value="all">Tutte le generazioni</option>
              {Array.from({ length: 9 }, (_, index) => index + 1).map((generation) => <option key={generation} value={generation}>Generazione {ROMAN_GENERATIONS[generation]}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="ability-sort">Ordina</label>
            <select id="ability-sort" value={sort} onChange={(event) => setSort(event.target.value)}>
              <option value="id">Numero</option>
              <option value="name">Nome</option>
              <option value="generation">Generazione</option>
            </select>
          </div>
          <button type="button" onClick={clearFilters}>Azzera filtri</button>
        </section>
      )}

      <div className="ability-results-heading">
        <div><strong>{filtered.length}</strong><span>{filtered.length === 1 ? 'abilità trovata' : 'abilità trovate'}</span></div>
        <small>{sort === 'name' ? 'Ordine alfabetico' : sort === 'generation' ? 'Ordine per generazione' : 'Ordine archivio'}</small>
      </div>

      {filtered.length > 0 ? (
        <>
          <div className="ability-db-grid">
            {filtered.slice(0, visibleCount).map((ability) => <AbilityCard key={ability.id} ability={ability} onOpen={() => openAbility(ability.id)} />)}
          </div>
          {visibleCount < filtered.length && (
            <button type="button" className="load-more-button" onClick={() => setVisibleCount((value) => value + PAGE_SIZE)}>
              Carica altre {Math.min(PAGE_SIZE, filtered.length - visibleCount)} abilità
            </button>
          )}
        </>
      ) : (
        <div className="empty-state ability-empty-state">
          <span>✦</span><strong>Nessuna abilità trovata</strong><p>Prova un altro nome oppure azzera i filtri.</p><button type="button" onClick={clearFilters}>Azzera filtri</button>
        </div>
      )}

      <footer className="app-footer app-footer--abilities">
        <img src="./assets/capsuledex-mark.svg" alt="" />
        <p>{abilityIndex.length} abilità indicizzate · dettagli tramite PokéAPI.</p>
      </footer>
    </div>
  )
}
