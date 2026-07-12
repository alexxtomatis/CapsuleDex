import { useEffect, useMemo, useState } from 'react'
import { italianTypeNames } from '../data/features'
import { getPokemonDetail } from '../services/pokeapi'
import type { CollectionEntry, CollectionTrait, PokemonDetailData, PokemonStat } from '../types'
import { ArrowLeftIcon, ChartIcon, CollectionIcon, EvolutionIcon, HeartIcon, IconButton, InfoIcon, StarIcon, UsersIcon } from './Icon'

const padId = (id: number) => `N°${String(id).padStart(4, '0')}`

function formatNumber(value: number, digits = 1) {
  return new Intl.NumberFormat('it-IT', {
    minimumFractionDigits: value % 1 === 0 ? 0 : digits,
    maximumFractionDigits: digits,
  }).format(value)
}

function StatRadar({ stats }: { stats: PokemonStat[] }) {
  const size = 190
  const center = size / 2
  const radius = 68
  const count = Math.max(stats.length, 6)

  function point(index: number, factor: number) {
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / count
    return `${center + Math.cos(angle) * radius * factor},${center + Math.sin(angle) * radius * factor}`
  }

  const rings = [0.25, 0.5, 0.75, 1]
  const dataPoints = stats.map((stat, index) => point(index, Math.min(stat.value / 180, 1)))

  return (
    <svg className="stat-radar" viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Grafico delle statistiche base">
      {rings.map((ring) => (
        <polygon key={ring} points={Array.from({ length: count }, (_, index) => point(index, ring)).join(' ')} />
      ))}
      {Array.from({ length: count }, (_, index) => (
        <line key={index} x1={center} y1={center} x2={point(index, 1).split(',')[0]} y2={point(index, 1).split(',')[1]} />
      ))}
      <polygon className="stat-radar__data" points={dataPoints.join(' ')} />
      {dataPoints.map((value, index) => {
        const [cx, cy] = value.split(',')
        return <circle key={stats[index]?.id ?? index} cx={cx} cy={cy} r="2.6" />
      })}
    </svg>
  )
}

type DetailProps = {
  pokemonId: number
  onBack: () => void
  onOpenPokemon: (id: number) => void
  onToast: (message: string) => void
  isInTeam: boolean
  isTeamFull: boolean
  onAddToTeam: () => void
  onOpenTeam: () => void
  isFavorite: boolean
  onToggleFavorite: (name?: string) => void
  collectionEntry?: CollectionEntry
  onAddToCollection: (name?: string) => void
  onOpenCollection: () => void
  onOpenTypeCalculator: () => void
  onToggleCollectionTrait: (trait: CollectionTrait, name?: string) => void
}

export function PokemonDetailView({ pokemonId, onBack, onOpenPokemon, onToast, isInTeam, isTeamFull, onAddToTeam, onOpenTeam, isFavorite, onToggleFavorite, collectionEntry, onAddToCollection, onOpenCollection, onOpenTypeCalculator, onToggleCollectionTrait }: DetailProps) {
  const [pokemon, setPokemon] = useState<PokemonDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadToken, setReloadToken] = useState(0)
  const [showShiny, setShowShiny] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [imageFailed, setImageFailed] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError('')
    setPokemon(null)
    setShowShiny(false)
    setImageFailed(false)
    setActiveTab('overview')
    window.scrollTo({ top: 0, behavior: 'auto' })

    getPokemonDetail(pokemonId, controller.signal)
      .then(setPokemon)
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return
        const message = reason instanceof Error ? reason.message : 'Errore sconosciuto'
        setError(`Non riesco a caricare la scheda: ${message}.`)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [pokemonId, reloadToken])

  const heroImage = useMemo(() => {
    if (!pokemon) return null
    return showShiny && pokemon.shinyImage ? pokemon.shinyImage : pokemon.image
  }, [pokemon, showShiny])

  function scrollTo(sectionId: string) {
    setActiveTab(sectionId)
    document.getElementById(`detail-${sectionId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  if (loading) {
    return (
      <div className="detail-view detail-view--loading" aria-busy="true">
        <header className="detail-topbar">
          <IconButton label="Torna al Pokédex" onClick={onBack}><ArrowLeftIcon /></IconButton>
          <span className="detail-topbar__title">Scheda Pokémon</span>
          <span className="detail-header-placeholder" />
        </header>
        <div className="detail-skeleton-hero skeleton" />
        <div className="detail-skeleton-line skeleton" />
        <div className="detail-skeleton-line detail-skeleton-line--short skeleton" />
        <div className="detail-skeleton-panel skeleton" />
      </div>
    )
  }

  if (error || !pokemon) {
    return (
      <div className="detail-view">
        <header className="detail-topbar">
          <IconButton label="Torna al Pokédex" onClick={onBack}><ArrowLeftIcon /></IconButton>
          <span className="detail-topbar__title">Scheda Pokémon</span>
          <span className="detail-header-placeholder" />
        </header>
        <div className="api-error detail-error" role="alert">
          <span aria-hidden="true">!</span>
          <div>
            <strong>Scheda non disponibile</strong>
            <p>{error || 'I dati del Pokémon non sono disponibili.'}</p>
            <button type="button" onClick={() => setReloadToken((value) => value + 1)}>Riprova</button>
          </div>
        </div>
      </div>
    )
  }

  const mainType = pokemon.types[0] ?? 'normal'
  const displayName = pokemon.italianName || pokemon.name

  return (
    <div className={`detail-view detail-theme--${mainType}`}>
      <header className="detail-topbar">
        <IconButton label="Torna al Pokédex" onClick={onBack}><ArrowLeftIcon /></IconButton>
        <span className="detail-topbar__title">Scheda Pokémon</span>
        <div className="detail-topbar__actions">
          <IconButton label={isFavorite ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'} onClick={() => onToggleFavorite(displayName)} active={isFavorite}>
            <HeartIcon />
          </IconButton>
          <IconButton label={isInTeam ? 'Apri la squadra' : 'Aggiungi alla squadra'} onClick={isInTeam ? onOpenTeam : onAddToTeam}>
            <UsersIcon />
          </IconButton>
        </div>
      </header>

      <section className="detail-hero" id="detail-overview">
        <div className="detail-hero__halo" aria-hidden="true" />
        <div className="detail-hero__heading">
          <span className="detail-number">{padId(pokemon.id)}</span>
          <h1>{displayName}</h1>
          {pokemon.name !== displayName && <small>{pokemon.name}</small>}
          <div className="detail-types">
            {pokemon.types.map((type) => (
              <span key={type} className={`type-pill type-pill--${type}`}>
                {italianTypeNames[type] ?? type}
              </span>
            ))}
          </div>
        </div>

        <div className="detail-artwork">
          {!imageFailed && heroImage ? (
            <img src={heroImage} alt={displayName} onError={() => setImageFailed(true)} />
          ) : (
            <span className="detail-artwork__fallback">◉</span>
          )}
        </div>

        {pokemon.shinyImage && (
          <button
            type="button"
            className={`shiny-toggle${showShiny ? ' is-active' : ''}`}
            onClick={() => {
              setShowShiny((value) => !value)
              setImageFailed(false)
            }}
          >
            <span>✦</span>{showShiny ? 'Versione normale' : 'Mostra shiny'}
          </button>
        )}
      </section>

      <section className="detail-description">
        <p>{pokemon.description}</p>
      </section>

      <div className="detail-favorite-action">
        <button
          type="button"
          className={isFavorite ? 'is-favorite' : ''}
          onClick={() => onToggleFavorite(displayName)}
          aria-pressed={isFavorite}
        >
          <HeartIcon />
          <span>
            <strong>{isFavorite ? 'Salvato nei preferiti' : 'Aggiungi ai preferiti'}</strong>
            <small>{isFavorite ? 'Premi per rimuoverlo dalla lista' : 'Ritrovalo subito nella tua raccolta'}</small>
          </span>
          <b>{isFavorite ? '✓' : '+'}</b>
        </button>
      </div>

      <div className="detail-collection-action">
        <button
          type="button"
          className={collectionEntry ? 'is-collected' : ''}
          onClick={collectionEntry ? onOpenCollection : () => onAddToCollection(displayName)}
        >
          <CollectionIcon />
          <span>
            <strong>{collectionEntry ? 'Pokémon catturato' : 'Segna come catturato'}</strong>
            <small>{collectionEntry ? 'Apri la collezione personale' : 'Aggiungilo al tuo archivio'}</small>
          </span>
          <b>{collectionEntry ? '→' : '+'}</b>
        </button>

        {collectionEntry && (
          <div className="detail-collection-traits" aria-label="Categorie della collezione">
            {([
              ['shiny', '✦', 'Shiny'],
              ['alpha', 'Α', 'Alpha'],
              ['gigantamax', 'G', 'Gigamax'],
              ['paradox', '∞', 'Paradox'],
              ['legendary', '★', 'Leggendario'],
            ] as Array<[CollectionTrait, string, string]>).map(([trait, symbol, label]) => (
              <button
                type="button"
                key={trait}
                className={collectionEntry.traits.includes(trait) ? 'is-active' : ''}
                onClick={() => onToggleCollectionTrait(trait, displayName)}
                aria-pressed={collectionEntry.traits.includes(trait)}
              >
                <span>{symbol}</span><small>{label}</small>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="detail-team-action">
        <button
          type="button"
          className={isInTeam ? 'is-added' : ''}
          disabled={!isInTeam && isTeamFull}
          onClick={isInTeam ? onOpenTeam : onAddToTeam}
        >
          <UsersIcon />
          <span>
            <strong>{isInTeam ? 'Nella squadra attiva' : isTeamFull ? 'Squadra completa' : 'Aggiungi alla squadra'}</strong>
            <small>{isInTeam ? 'Apri il Team Builder' : isTeamFull ? 'Rimuovi prima un Pokémon' : 'Salvataggio automatico'}</small>
          </span>
          <b>{isInTeam ? '→' : '+'}</b>
        </button>
      </div>

      <div className="detail-type-action">
        <button type="button" onClick={onOpenTypeCalculator}>
          <ChartIcon />
          <span>
            <strong>Analizza debolezze</strong>
            <small>Apri il calcolatore con i tipi di {displayName}</small>
          </span>
          <b>→</b>
        </button>
      </div>

      <section className="detail-facts" aria-label="Informazioni principali">
        <article>
          <span>Altezza</span>
          <strong>{formatNumber(pokemon.heightMetres)} m</strong>
        </article>
        <article>
          <span>Peso</span>
          <strong>{formatNumber(pokemon.weightKg)} kg</strong>
        </article>
        <article>
          <span>Categoria</span>
          <strong>{pokemon.category}</strong>
        </article>
        <article>
          <span>Generazione</span>
          <strong>{pokemon.generation}</strong>
        </article>
        {pokemon.habitat && (
          <article>
            <span>Habitat</span>
            <strong>{pokemon.habitat}</strong>
          </article>
        )}
        {pokemon.baseExperience !== null && (
          <article>
            <span>Esperienza base</span>
            <strong>{pokemon.baseExperience}</strong>
          </article>
        )}
      </section>

      <section className="detail-section abilities-section" aria-labelledby="abilities-title">
        <div className="detail-section__heading">
          <div>
            <p className="eyebrow">Tratti speciali</p>
            <h2 id="abilities-title">Abilità</h2>
          </div>
          <span>{pokemon.abilities.length}</span>
        </div>
        <div className="ability-list">
          {pokemon.abilities.map((ability) => (
            <article key={`${ability.id}-${ability.hidden}`} className="ability-card">
              <div>
                <strong>{ability.name}</strong>
                {ability.hidden && <span>Abilità nascosta</span>}
              </div>
              <p>{ability.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="detail-section stats-section" id="detail-stats" aria-labelledby="stats-title">
        <div className="detail-section__heading">
          <div>
            <p className="eyebrow">Potenziale naturale</p>
            <h2 id="stats-title">Statistiche base</h2>
          </div>
          <span>Totale {pokemon.totalStats}</span>
        </div>

        <div className="stats-layout">
          <div className="stats-list">
            {pokemon.stats.map((stat) => (
              <div className={`stat-row stat-row--${stat.id}`} key={stat.id}>
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
                <i><b style={{ width: `${Math.min((stat.value / 180) * 100, 100)}%` }} /></i>
              </div>
            ))}
          </div>
          <StatRadar stats={pokemon.stats} />
        </div>
      </section>

      <section className="detail-section evolution-section" id="detail-evolution" aria-labelledby="evolution-title">
        <div className="detail-section__heading">
          <div>
            <p className="eyebrow">Linea evolutiva</p>
            <h2 id="evolution-title">Evoluzioni</h2>
          </div>
          <span>{pokemon.evolutionPaths.length > 1 ? `${pokemon.evolutionPaths.length} rami` : 'Catena'}</span>
        </div>

        {pokemon.evolutionPaths.length === 0 ? (
          <div className="empty-state">
            <span>◇</span>
            <strong>Dati evolutivi non disponibili</strong>
            <p>PokéAPI non ha restituito una catena per questo Pokémon.</p>
          </div>
        ) : pokemon.evolutionPaths.every((path) => path.length === 1) ? (
          <div className="single-evolution">
            <img src={pokemon.evolutionPaths[0][0].image} alt="" onError={(event) => { event.currentTarget.src = './assets/capsuledex-mark.svg' }} />
            <div><strong>Non si evolve</strong><p>Non sono presenti altre forme nella catena evolutiva.</p></div>
          </div>
        ) : (
          <div className="evolution-paths">
            {pokemon.evolutionPaths.map((path, pathIndex) => (
              <div className="evolution-path" key={`${path.map((step) => step.id).join('-')}-${pathIndex}`}>
                {path.map((step, index) => (
                  <div className="evolution-segment" key={`${step.id}-${index}`}>
                    {index > 0 && (
                      <div className="evolution-arrow">
                        <span>→</span>
                        <small>{step.trigger ?? 'Evoluzione'}</small>
                      </div>
                    )}
                    <button
                      type="button"
                      className={`evolution-pokemon${step.id === pokemon.id ? ' is-current' : ''}`}
                      onClick={() => step.id === pokemon.id ? onToast(`${displayName} è già aperto.`) : onOpenPokemon(step.id)}
                    >
                      <img src={step.image} alt="" loading="lazy" onError={(event) => { event.currentTarget.src = './assets/capsuledex-mark.svg' }} />
                      <span>{padId(step.id)}</span>
                      <strong>{step.name}</strong>
                    </button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </section>

      {pokemon.variants.length > 1 && (
        <section className="detail-section variants-section" id="detail-variants" aria-labelledby="variants-title">
          <div className="detail-section__heading">
            <div>
              <p className="eyebrow">Forme disponibili</p>
              <h2 id="variants-title">Varianti</h2>
            </div>
            <span>{pokemon.variants.length}</span>
          </div>
          <div className="variant-scroller">
            {pokemon.variants.map((variant) => (
              <button
                type="button"
                key={variant.id}
                className={variant.id === pokemon.id ? 'is-current' : ''}
                onClick={() => variant.id === pokemon.id ? onToast('Questa variante è già aperta.') : onOpenPokemon(variant.id)}
              >
                <img src={variant.image} alt="" loading="lazy" onError={(event) => { event.currentTarget.src = './assets/capsuledex-mark.svg' }} />
                <span>{variant.isDefault ? 'Forma base' : 'Variante'}</span>
                <strong>{variant.name}</strong>
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="detail-pagination" aria-label="Pokémon precedente e successivo">
        <button type="button" disabled={pokemon.id <= 1} onClick={() => onOpenPokemon(pokemon.id - 1)}>
          <span>←</span><small>Precedente</small>
        </button>
        <button type="button" onClick={() => onOpenPokemon(pokemon.id + 1)}>
          <small>Successivo</small><span>→</span>
        </button>
      </div>

      <footer className="app-footer app-footer--detail">
        <img src="./assets/capsuledex-mark.svg" alt="" />
        <p>Dati forniti da PokéAPI · progetto fan-made non ufficiale.</p>
      </footer>

      <nav className="detail-nav" aria-label="Sezioni della scheda">
        <button type="button" className={activeTab === 'overview' ? 'is-active' : ''} onClick={() => scrollTo('overview')}>
          <InfoIcon /><small>Panoramica</small>
        </button>
        <button type="button" className={activeTab === 'stats' ? 'is-active' : ''} onClick={() => scrollTo('stats')}>
          <ChartIcon /><small>Statistiche</small>
        </button>
        <button type="button" className={activeTab === 'evolution' ? 'is-active' : ''} onClick={() => scrollTo('evolution')}>
          <EvolutionIcon /><small>Evoluzioni</small>
        </button>
        <button type="button" className={activeTab === 'variants' ? 'is-active' : ''} onClick={() => pokemon.variants.length > 1 ? scrollTo('variants') : onToast('Questo Pokémon non ha varianti disponibili.')}>
          <StarIcon /><small>Varianti</small>
        </button>
      </nav>
    </div>
  )
}
