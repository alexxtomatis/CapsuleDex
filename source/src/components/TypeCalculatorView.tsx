import { FormEvent, useEffect, useMemo, useState } from 'react'
import { italianTypeNames } from '../data/features'
import {
  calculateDefensiveProfile,
  groupDefensiveProfile,
  isPokemonType,
  pokemonTypes,
  typeSymbols,
  type PokemonType,
  type TypeProfileEntry,
} from '../data/typeMatchups'
import { getPokemonCard, getPokemonCatalog } from '../services/pokeapi'
import type { PokemonCardData, PokemonCatalogItem } from '../types'
import { ArrowLeftIcon, ChartIcon, IconButton, SearchIcon } from './Icon'

const RECENT_STORAGE_KEY = 'capsuledex:type-calculator:recent:v1'

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, '-')
}

function padId(id: number) {
  return `N°${String(id).padStart(4, '0')}`
}

function readRecentIds(): number[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENT_STORAGE_KEY) ?? '[]') as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((value): value is number => Number.isInteger(value) && value > 0).slice(0, 6)
  } catch {
    return []
  }
}

function saveRecentId(id: number) {
  try {
    const next = [id, ...readRecentIds().filter((value) => value !== id)].slice(0, 6)
    localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Il calcolatore continua a funzionare anche se lo storage non è disponibile.
  }
}

function multiplierText(multiplier: number) {
  return multiplier === 0 ? 'Immune' : `×${multiplier}`
}

function EffectGroup({
  title,
  subtitle,
  entries,
  tone,
  emptyMessage,
}: {
  title: string
  subtitle: string
  entries: TypeProfileEntry[]
  tone: 'danger' | 'warning' | 'safe' | 'immune'
  emptyMessage: string
}) {
  return (
    <article className={`type-effect-card type-effect-card--${tone}`}>
      <header>
        <div>
          <strong>{title}</strong>
          <small>{subtitle}</small>
        </div>
        <span>{entries.length}</span>
      </header>
      {entries.length > 0 ? (
        <div className="type-effect-list">
          {entries.map((entry) => (
            <div key={entry.type} className={`type-effect-chip type-effect-chip--${entry.type}`}>
              <i>{typeSymbols[entry.type]}</i>
              <span>{italianTypeNames[entry.type]}</span>
              <b>{multiplierText(entry.multiplier)}</b>
            </div>
          ))}
        </div>
      ) : (
        <p>{emptyMessage}</p>
      )}
    </article>
  )
}

type TypeCalculatorViewProps = {
  initialPokemonId?: number | null
  onBack: () => void
  onOpenPokemon: (id: number) => void
  onSelectionChange: (id: number | null) => void
  onToast: (message: string) => void
}

export function TypeCalculatorView({
  initialPokemonId,
  onBack,
  onOpenPokemon,
  onSelectionChange,
  onToast,
}: TypeCalculatorViewProps) {
  const [mode, setMode] = useState<'pokemon' | 'manual'>(initialPokemonId ? 'pokemon' : 'manual')
  const [catalog, setCatalog] = useState<PokemonCatalogItem[]>([])
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [catalogError, setCatalogError] = useState('')
  const [query, setQuery] = useState('')
  const [selectedPokemon, setSelectedPokemon] = useState<PokemonCardData | null>(null)
  const [pokemonLoading, setPokemonLoading] = useState(Boolean(initialPokemonId))
  const [pokemonError, setPokemonError] = useState('')
  const [manualTypes, setManualTypes] = useState<PokemonType[]>(['fire'])
  const [recentCards, setRecentCards] = useState<PokemonCardData[]>([])
  const [reloadToken, setReloadToken] = useState(0)

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
    const recentIds = readRecentIds()
    if (recentIds.length === 0) {
      setRecentCards([])
      return
    }

    const controller = new AbortController()
    Promise.all(recentIds.map((id) => getPokemonCard(id, controller.signal).catch(() => null)))
      .then((cards) => setRecentCards(cards.filter((card): card is PokemonCardData => Boolean(card))))

    return () => controller.abort()
  }, [selectedPokemon?.id])

  useEffect(() => {
    if (!initialPokemonId) return
    const controller = new AbortController()
    setMode('pokemon')
    setPokemonLoading(true)
    setPokemonError('')

    getPokemonCard(initialPokemonId, controller.signal)
      .then((card) => {
        setSelectedPokemon(card)
        saveRecentId(card.id)
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return
        const message = reason instanceof Error ? reason.message : 'Errore sconosciuto'
        setPokemonError(`Non riesco a caricare il Pokémon: ${message}.`)
      })
      .finally(() => {
        if (!controller.signal.aborted) setPokemonLoading(false)
      })

    return () => controller.abort()
  }, [initialPokemonId])

  const suggestions = useMemo(() => {
    const normalized = normalize(query)
    if (!normalized) return []
    const numeric = Number(normalized)

    return catalog
      .filter((pokemon) => (
        pokemon.name.includes(normalized) ||
        (Number.isInteger(numeric) && pokemon.id === numeric)
      ))
      .slice(0, 8)
  }, [catalog, query])

  const selectedTypes = useMemo<PokemonType[]>(() => {
    if (mode === 'manual') return manualTypes
    return selectedPokemon?.types.filter(isPokemonType).slice(0, 2) ?? []
  }, [manualTypes, mode, selectedPokemon])

  const profile = useMemo(() => calculateDefensiveProfile(selectedTypes), [selectedTypes])
  const grouped = useMemo(() => groupDefensiveProfile(profile), [profile])

  async function selectPokemon(item: PokemonCatalogItem | PokemonCardData) {
    setMode('pokemon')
    setQuery('')
    setPokemonLoading(true)
    setPokemonError('')

    try {
      const card = 'image' in item ? item : await getPokemonCard(item.id)
      setSelectedPokemon(card)
      saveRecentId(card.id)
      onSelectionChange(card.id)
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'Errore sconosciuto'
      setPokemonError(`Non riesco a caricare il Pokémon: ${message}.`)
      onToast('Dati del Pokémon non disponibili al momento.')
    } finally {
      setPokemonLoading(false)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const first = suggestions[0]
    if (!first) {
      onToast('Scrivi un nome o un numero Pokédex valido.')
      return
    }
    void selectPokemon(first)
  }

  function toggleManualType(type: PokemonType) {
    setMode('manual')
    setSelectedPokemon(null)
    onSelectionChange(null)
    setManualTypes((current) => {
      if (current.includes(type)) {
        return current.length === 1 ? current : current.filter((entry) => entry !== type)
      }
      if (current.length < 2) return [...current, type]
      return [current[0], type]
    })
  }

  return (
    <div className="type-calculator-view">
      <header className="pokedex-header type-calculator-header">
        <IconButton label="Torna alla home" onClick={onBack}><ArrowLeftIcon /></IconButton>
        <div>
          <p className="eyebrow">CapsuleDex</p>
          <h1>Calcolatore tipi</h1>
        </div>
        <span className="type-calculator-header__icon"><ChartIcon /></span>
      </header>

      <section className="type-calculator-hero">
        <span className="type-calculator-hero__grid" aria-hidden="true" />
        <div>
          <p className="eyebrow">Profilo difensivo</p>
          <h2>Scopri debolezze e resistenze</h2>
          <p>Seleziona un Pokémon oppure combina manualmente fino a due tipi.</p>
        </div>
        <div className="type-calculator-orb" aria-hidden="true"><i /><b /></div>
      </section>

      <div className="type-mode-switch" role="tablist" aria-label="Modalità del calcolatore">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'pokemon'}
          className={mode === 'pokemon' ? 'is-active' : ''}
          onClick={() => setMode('pokemon')}
        >
          Per Pokémon
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'manual'}
          className={mode === 'manual' ? 'is-active' : ''}
          onClick={() => {
            setMode('manual')
            onSelectionChange(null)
          }}
        >
          Tipi manuali
        </button>
      </div>

      {mode === 'pokemon' && (
        <section className="type-pokemon-picker" aria-labelledby="type-pokemon-title">
          <div className="section-heading section-heading--compact">
            <div>
              <p className="eyebrow">Ricerca rapida</p>
              <h2 id="type-pokemon-title">Scegli un Pokémon</h2>
            </div>
            <span className="results-counter">Nome o numero</span>
          </div>

          <form className="search-bar search-bar--type" onSubmit={handleSubmit}>
            <SearchIcon />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Es. Charizard o 006..."
              aria-label="Cerca il Pokémon da analizzare"
              inputMode="search"
            />
            {query && <button type="button" onClick={() => setQuery('')} aria-label="Cancella ricerca">×</button>}
          </form>

          {catalogError && (
            <div className="api-error type-catalog-error" role="alert">
              <span>!</span>
              <div>
                <strong>Ricerca non disponibile</strong>
                <p>{catalogError}</p>
                <button type="button" onClick={() => setReloadToken((value) => value + 1)}>Riprova</button>
              </div>
            </div>
          )}

          {query && !catalogError && (
            <div className="type-search-suggestions">
              {catalogLoading ? (
                <div className="type-search-loading"><span className="skeleton" /></div>
              ) : suggestions.length > 0 ? suggestions.map((pokemon) => (
                <button type="button" key={pokemon.id} onClick={() => void selectPokemon(pokemon)}>
                  <span>{padId(pokemon.id)}</span>
                  <strong>{pokemon.name.replace(/-/g, ' ')}</strong>
                  <b>→</b>
                </button>
              )) : (
                <p>Nessun Pokémon trovato.</p>
              )}
            </div>
          )}

          {pokemonLoading && (
            <div className="type-selected-pokemon type-selected-pokemon--loading" aria-busy="true">
              <span className="skeleton" />
              <div><i className="skeleton" /><i className="skeleton" /></div>
            </div>
          )}

          {!pokemonLoading && pokemonError && (
            <div className="api-error type-pokemon-error" role="alert">
              <span>!</span>
              <div><strong>Pokémon non disponibile</strong><p>{pokemonError}</p></div>
            </div>
          )}

          {!pokemonLoading && selectedPokemon && (
            <article className="type-selected-pokemon">
              <button type="button" className="type-selected-pokemon__main" onClick={() => onOpenPokemon(selectedPokemon.id)}>
                <div className="type-selected-pokemon__artwork">
                  {selectedPokemon.image ? <img src={selectedPokemon.image} alt="" /> : <span>◉</span>}
                </div>
                <div>
                  <span>{padId(selectedPokemon.id)}</span>
                  <strong>{selectedPokemon.name}</strong>
                  <div>
                    {selectedPokemon.types.filter(isPokemonType).map((type) => (
                      <i key={type} className={`type-pill type-pill--${type}`}>{italianTypeNames[type]}</i>
                    ))}
                  </div>
                </div>
                <b>Apri<br />scheda →</b>
              </button>
            </article>
          )}

          {!selectedPokemon && !pokemonLoading && recentCards.length > 0 && (
            <div className="type-recents">
              <span>Analisi recenti</span>
              <div>
                {recentCards.map((card) => (
                  <button type="button" key={card.id} onClick={() => void selectPokemon(card)}>
                    {card.image ? <img src={card.image} alt="" /> : <i>◉</i>}
                    <small>{card.name}</small>
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {mode === 'manual' && (
        <section className="manual-type-picker" aria-labelledby="manual-type-title">
          <div className="section-heading section-heading--compact">
            <div>
              <p className="eyebrow">Combinazione personalizzata</p>
              <h2 id="manual-type-title">Scegli uno o due tipi</h2>
            </div>
            <span className="results-counter">{manualTypes.length} / 2</span>
          </div>
          <div className="manual-type-grid">
            {pokemonTypes.map((type) => (
              <button
                type="button"
                key={type}
                className={`manual-type-button manual-type-button--${type}${manualTypes.includes(type) ? ' is-selected' : ''}`}
                onClick={() => toggleManualType(type)}
                aria-pressed={manualTypes.includes(type)}
              >
                <span>{typeSymbols[type]}</span>
                <small>{italianTypeNames[type]}</small>
                {manualTypes.includes(type) && <b>✓</b>}
              </button>
            ))}
          </div>
        </section>
      )}

      {selectedTypes.length > 0 && (
        <>
          <section className="type-profile-summary" aria-labelledby="type-results-title">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Risultato</p>
                <h2 id="type-results-title">Profilo difensivo</h2>
              </div>
              <div className="type-selected-badges">
                {selectedTypes.map((type) => (
                  <span key={type} className={`type-pill type-pill--${type}`}>{italianTypeNames[type]}</span>
                ))}
              </div>
            </div>

            <div className="type-profile-stats">
              <article><span>Debolezze</span><strong>{grouped.quadrupleWeaknesses.length + grouped.weaknesses.length}</strong><small>tipi superefficaci</small></article>
              <article><span>Resistenze</span><strong>{grouped.resistances.length + grouped.quarterResistances.length}</strong><small>danni ridotti</small></article>
              <article><span>Immunità</span><strong>{grouped.immunities.length}</strong><small>nessun danno</small></article>
            </div>
          </section>

          <section className="type-effect-grid" aria-label="Debolezze e resistenze">
            <EffectGroup
              title="Debolezza ×4"
              subtitle="Danno quadruplicato"
              entries={grouped.quadrupleWeaknesses}
              tone="danger"
              emptyMessage="Nessuna debolezza quadrupla."
            />
            <EffectGroup
              title="Debolezza ×2"
              subtitle="Danno raddoppiato"
              entries={grouped.weaknesses}
              tone="warning"
              emptyMessage="Nessuna debolezza doppia."
            />
            <EffectGroup
              title="Resistenza ×0,5"
              subtitle="Danno dimezzato"
              entries={grouped.resistances}
              tone="safe"
              emptyMessage="Nessuna resistenza semplice."
            />
            <EffectGroup
              title="Resistenza ×0,25"
              subtitle="Danno ridotto a un quarto"
              entries={grouped.quarterResistances}
              tone="safe"
              emptyMessage="Nessuna resistenza quadrupla."
            />
            <EffectGroup
              title="Immunità ×0"
              subtitle="Nessun danno ricevuto"
              entries={grouped.immunities}
              tone="immune"
              emptyMessage="Nessuna immunità di tipo."
            />
          </section>

          <section className="type-matrix" aria-labelledby="type-matrix-title">
            <div className="section-heading section-heading--compact">
              <div>
                <p className="eyebrow">Tutti gli attacchi</p>
                <h2 id="type-matrix-title">Matrice completa</h2>
              </div>
              <span className="results-counter">18 tipi</span>
            </div>
            <div className="type-matrix-grid">
              {profile.map((entry) => (
                <article
                  key={entry.type}
                  className={`type-matrix-cell type-matrix-cell--${entry.type} type-matrix-cell--m${String(entry.multiplier).replace('.', '-')}`}
                >
                  <span>{typeSymbols[entry.type]}</span>
                  <small>{italianTypeNames[entry.type]}</small>
                  <strong>{multiplierText(entry.multiplier)}</strong>
                </article>
              ))}
            </div>
          </section>

          <aside className="type-calculator-note">
            <span>i</span>
            <p>Il calcolo considera soltanto la combinazione di tipi. Abilità come Levitazione, Teracristal, strumenti, mosse e condizioni di lotta possono cambiare il risultato reale.</p>
          </aside>
        </>
      )}

      <footer className="app-footer app-footer--types">
        <img src="./assets/capsuledex-mark.svg" alt="" />
        <p>Tabella dei tipi integrata · dati Pokémon tramite PokéAPI.</p>
      </footer>
    </div>
  )
}
