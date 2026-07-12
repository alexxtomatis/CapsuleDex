import { FormEvent, useEffect, useMemo, useState } from 'react'
import { getPokemonCard, getPokemonCatalog, getPokemonEncounters } from '../services/pokeapi'
import type { PokemonCardData, PokemonCatalogItem, PokemonEncounterData } from '../types'
import { ArrowLeftIcon, IconButton, SearchIcon } from './Icon'

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[\s_]+/g, '-')
}

function padId(id: number) {
  return `N°${String(id).padStart(4, '0')}`
}

function chanceLabel(value: number) {
  if (value <= 0) return 'Probabilità variabile'
  return `Fino al ${value}%`
}

function levelLabel(min: number, max: number) {
  if (min === max) return `Lv. ${min}`
  return `Lv. ${min}–${max}`
}

type EncounterViewProps = {
  initialPokemonId: number | null
  onBack: () => void
  onOpenPokemon: (id: number) => void
  onSelectionChange: (id: number | null) => void
  onToast: (message: string) => void
}

export function EncounterView({ initialPokemonId, onBack, onOpenPokemon, onSelectionChange, onToast }: EncounterViewProps) {
  const [catalog, setCatalog] = useState<PokemonCatalogItem[]>([])
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(initialPokemonId ?? 25)
  const [pokemon, setPokemon] = useState<PokemonCardData | null>(null)
  const [encounters, setEncounters] = useState<PokemonEncounterData | null>(null)
  const [selectedVersion, setSelectedVersion] = useState('all')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    getPokemonCatalog(controller.signal).then(setCatalog).catch(() => undefined)
    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (!selectedId) return
    const controller = new AbortController()
    setLoading(true)
    setError('')
    setSelectedVersion('all')
    Promise.all([
      getPokemonCard(selectedId, controller.signal),
      getPokemonEncounters(selectedId, controller.signal),
    ])
      .then(([card, encounterData]) => {
        setPokemon(card)
        setEncounters(encounterData)
        onSelectionChange(selectedId)
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return
        setPokemon(null)
        setEncounters(null)
        setError(reason instanceof Error ? reason.message : 'Dati degli incontri non disponibili.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [selectedId, reloadToken, onSelectionChange])

  const visibleVersions = useMemo(() => {
    if (!encounters) return []
    return selectedVersion === 'all'
      ? encounters.versions
      : encounters.versions.filter((version) => version.slug === selectedVersion)
  }, [encounters, selectedVersion])

  function resolvePokemon(value: string) {
    const normalized = normalize(value)
    if (!normalized) return null
    const numeric = Number(normalized.replace(/^#/, ''))
    if (Number.isInteger(numeric) && numeric > 0) return numeric
    const exact = catalog.find((entry) => normalize(entry.name) === normalized)
    if (exact) return exact.id
    return catalog.find((entry) => normalize(entry.name).startsWith(normalized))?.id ?? null
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const id = resolvePokemon(query)
    if (!id) {
      onToast('Pokémon non trovato. Prova con il nome inglese o il numero del Pokédex.')
      return
    }
    setSelectedId(id)
    setQuery('')
  }

  return (
    <div className="encounter-view">
      <header className="database-topbar">
        <IconButton label="Torna alla Home" onClick={onBack}><ArrowLeftIcon /></IconButton>
        <div>
          <span className="eyebrow">Guida agli incontri</span>
          <h1>Luoghi Pokémon</h1>
        </div>
        <span className="database-topbar__badge">⌖</span>
      </header>

      <section className="encounter-intro">
        <div>
          <p className="eyebrow">Dove catturarlo</p>
          <h2>Cerca un Pokémon e scegli il gioco</h2>
          <p>Consulta aree, metodi d’incontro, livelli e probabilità disponibili nei dati PokéAPI.</p>
        </div>
        <span aria-hidden="true">⌖</span>
      </section>

      <form className="database-search encounter-search" onSubmit={submitSearch}>
        <SearchIcon />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Nome inglese o numero Pokédex…"
          aria-label="Cerca il Pokémon di cui vedere i luoghi"
          inputMode="search"
          list="encounter-pokemon-suggestions"
        />
        <datalist id="encounter-pokemon-suggestions">
          {catalog.slice(0, 1025).map((entry) => <option key={entry.id} value={entry.name} />)}
        </datalist>
        <button type="submit">Cerca</button>
      </form>

      {loading && (
        <div className="database-loading" role="status">
          <span className="spinner" />
          <strong>Sto cercando tutti i luoghi…</strong>
          <p>Le informazioni vengono raggruppate per versione del gioco.</p>
        </div>
      )}

      {!loading && error && (
        <div className="api-error" role="alert">
          <span>!</span>
          <div>
            <strong>Luoghi non disponibili</strong>
            <p>{error}</p>
            <button type="button" onClick={() => setReloadToken((value) => value + 1)}>Riprova</button>
          </div>
        </div>
      )}

      {!loading && pokemon && encounters && (
        <>
          <section className="encounter-pokemon-hero">
            <button type="button" className="encounter-pokemon-hero__art" onClick={() => onOpenPokemon(pokemon.id)}>
              {pokemon.image ? <img src={pokemon.image} alt="" /> : <span>◉</span>}
            </button>
            <div>
              <span>{padId(pokemon.id)}</span>
              <h2>{pokemon.name}</h2>
              <div className="encounter-summary-pills">
                <small>{encounters.versions.length} versioni</small>
                <small>{encounters.totalLocations} aree uniche</small>
                <small>{encounters.methods.length} metodi</small>
              </div>
              <button type="button" onClick={() => onOpenPokemon(pokemon.id)}>Apri scheda Pokémon →</button>
            </div>
          </section>

          {encounters.versions.length > 0 ? (
            <>
              <div className="encounter-version-scroller" aria-label="Filtra per versione del gioco">
                <button type="button" className={selectedVersion === 'all' ? 'is-selected' : ''} onClick={() => setSelectedVersion('all')}>Tutte</button>
                {encounters.versions.map((version) => (
                  <button
                    type="button"
                    key={version.slug}
                    className={selectedVersion === version.slug ? 'is-selected' : ''}
                    onClick={() => setSelectedVersion(version.slug)}
                  >
                    {version.name}
                  </button>
                ))}
              </div>

              <div className="encounter-version-list">
                {visibleVersions.map((version) => (
                  <section className="encounter-version-card" key={version.slug}>
                    <header>
                      <div><p className="eyebrow">Versione</p><h3>{version.name}</h3></div>
                      <span>{version.locations.length} {version.locations.length === 1 ? 'luogo' : 'luoghi'}</span>
                    </header>
                    <div className="encounter-location-grid">
                      {version.locations.map((location) => (
                        <article className="encounter-location-card" key={`${version.slug}-${location.slug}`}>
                          <div className="encounter-location-card__heading">
                            <span>⌖</span>
                            <div><strong>{location.name}</strong><small>{chanceLabel(location.maxChance)}</small></div>
                          </div>
                          <div className="encounter-method-list">
                            {location.details.map((detail, index) => (
                              <div key={`${detail.method}-${detail.minLevel}-${detail.maxLevel}-${index}`}>
                                <span>{detail.method}</span>
                                <strong>{levelLabel(detail.minLevel, detail.maxLevel)}</strong>
                                <small>{detail.chance > 0 ? `${detail.chance}%` : 'Variabile'}</small>
                                {detail.conditions.length > 0 && <p>{detail.conditions.join(' · ')}</p>}
                              </div>
                            ))}
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </>
          ) : (
            <div className="empty-state encounter-empty">
              <span>⌖</span>
              <strong>Nessun incontro selvatico registrato</strong>
              <p>Questo Pokémon potrebbe essere ottenibile tramite evoluzione, dono, scambio, evento o in giochi non ancora coperti dai dati degli incontri.</p>
            </div>
          )}
        </>
      )}

      <aside className="data-note encounter-note">
        <span>i</span>
        <p>I risultati mostrano gli incontri selvatici disponibili nell’API. Doni, scambi interni, raid, eventi e alcune aree dei giochi più recenti possono non essere presenti.</p>
      </aside>

      <footer className="app-footer app-footer--database">
        <img src="./assets/capsuledex-mark.svg" alt="" />
        <p>CapsuleDex 1.1 · Luoghi basati sui dati degli incontri di PokéAPI.</p>
      </footer>
    </div>
  )
}
