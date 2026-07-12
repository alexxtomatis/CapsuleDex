import { FormEvent, useEffect, useMemo, useState } from 'react'
import { italianTypeNames, statLabels } from '../data/features'
import { calculateDefensiveProfile, isPokemonType, type PokemonType } from '../data/typeMatchups'
import { getPokemonCatalog, getPokemonDetail } from '../services/pokeapi'
import type { PokemonCatalogItem, PokemonDetailData, PokemonMovePreview } from '../types'
import { ArrowLeftIcon, IconButton, SearchIcon, VersusIcon } from './Icon'

const DEFAULT_LEFT_ID = 6
const DEFAULT_RIGHT_ID = 9

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, '-')
}

function padId(id: number) {
  return `N°${String(id).padStart(4, '0')}`
}

function formatNumber(value: number, digits = 1) {
  return new Intl.NumberFormat('it-IT', {
    minimumFractionDigits: value % 1 === 0 ? 0 : digits,
    maximumFractionDigits: digits,
  }).format(value)
}

function moveMethodLabel(method: string) {
  const labels: Record<string, string> = {
    'level-up': 'Livello',
    machine: 'MT',
    egg: 'Uovo',
    tutor: 'Tutor',
  }
  return labels[method] ?? method.replace(/-/g, ' ')
}

function offensiveMultiplier(attackerTypes: string[], defenderTypes: string[]) {
  const validDefenderTypes = defenderTypes.filter(isPokemonType)
  const validAttackerTypes = attackerTypes.filter(isPokemonType)
  if (validDefenderTypes.length === 0 || validAttackerTypes.length === 0) return 1

  const profile = calculateDefensiveProfile(validDefenderTypes)
  const multiplierByType = new Map(profile.map((entry) => [entry.type, entry.multiplier]))
  return Math.max(...validAttackerTypes.map((type) => multiplierByType.get(type) ?? 1))
}

function multiplierLabel(value: number) {
  if (value === 0) return '×0'
  return `×${String(value).replace('.', ',')}`
}

function getStat(pokemon: PokemonDetailData, id: string) {
  return pokemon.stats.find((stat) => stat.id === id)?.value ?? 0
}

function strongestMoves(moves: PokemonMovePreview[]) {
  const levelMoves = moves
    .filter((move) => move.method === 'level-up')
    .sort((a, b) => b.level - a.level || a.name.localeCompare(b.name, 'it'))
    .slice(0, 8)
  const machineMoves = moves
    .filter((move) => move.method === 'machine')
    .sort((a, b) => a.name.localeCompare(b.name, 'it'))
    .slice(0, 6)

  return [...levelMoves, ...machineMoves].slice(0, 10)
}

type Side = 'left' | 'right'

type PokemonPickerProps = {
  side: Side
  pokemon: PokemonDetailData | null
  loading: boolean
  error: string
  query: string
  suggestions: PokemonCatalogItem[]
  onQueryChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onSelect: (pokemon: PokemonCatalogItem) => void
  onOpenPokemon: (id: number) => void
}

function PokemonPicker({
  side,
  pokemon,
  loading,
  error,
  query,
  suggestions,
  onQueryChange,
  onSubmit,
  onSelect,
  onOpenPokemon,
}: PokemonPickerProps) {
  return (
    <article className={`battle-picker battle-picker--${side}`}>
      <span className="battle-picker__label">{side === 'left' ? 'Pokémon A' : 'Pokémon B'}</span>

      <form className="battle-search" onSubmit={onSubmit}>
        <SearchIcon />
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Nome o numero..."
          aria-label={`Cerca ${side === 'left' ? 'il primo' : 'il secondo'} Pokémon`}
          inputMode="search"
        />
        {query && <button type="button" onClick={() => onQueryChange('')} aria-label="Cancella ricerca">×</button>}
      </form>

      {query && (
        <div className="battle-suggestions">
          {suggestions.length > 0 ? suggestions.map((item) => (
            <button type="button" key={item.id} onClick={() => onSelect(item)}>
              <span>{padId(item.id)}</span>
              <strong>{item.name.replace(/-/g, ' ')}</strong>
              <b>→</b>
            </button>
          )) : <p>Nessun risultato.</p>}
        </div>
      )}

      {loading && (
        <div className="battle-pokemon-card battle-pokemon-card--loading" aria-busy="true">
          <span className="skeleton" />
          <div><i className="skeleton" /><i className="skeleton" /><i className="skeleton" /></div>
        </div>
      )}

      {!loading && error && (
        <div className="battle-picker__error" role="alert">
          <b>!</b><span>{error}</span>
        </div>
      )}

      {!loading && pokemon && (
        <button type="button" className="battle-pokemon-card" onClick={() => onOpenPokemon(pokemon.id)}>
          <div className="battle-pokemon-card__number">{padId(pokemon.id)}</div>
          <div className="battle-pokemon-card__artwork">
            {pokemon.image ? <img src={pokemon.image} alt="" /> : <span>◉</span>}
          </div>
          <strong>{pokemon.italianName || pokemon.name}</strong>
          <div className="battle-pokemon-card__types">
            {pokemon.types.filter(isPokemonType).map((type) => (
              <span key={type} className={`type-pill type-pill--${type}`}>{italianTypeNames[type]}</span>
            ))}
          </div>
          <small>Apri scheda →</small>
        </button>
      )}
    </article>
  )
}

type BattleViewProps = {
  initialPokemonId?: number | null
  onBack: () => void
  onOpenPokemon: (id: number) => void
  onToast: (message: string) => void
}

export function BattleView({ initialPokemonId, onBack, onOpenPokemon, onToast }: BattleViewProps) {
  const [catalog, setCatalog] = useState<PokemonCatalogItem[]>([])
  const [catalogError, setCatalogError] = useState('')
  const [leftId, setLeftId] = useState(initialPokemonId ?? DEFAULT_LEFT_ID)
  const [rightId, setRightId] = useState(initialPokemonId === DEFAULT_RIGHT_ID ? DEFAULT_LEFT_ID : DEFAULT_RIGHT_ID)
  const [leftPokemon, setLeftPokemon] = useState<PokemonDetailData | null>(null)
  const [rightPokemon, setRightPokemon] = useState<PokemonDetailData | null>(null)
  const [leftLoading, setLeftLoading] = useState(true)
  const [rightLoading, setRightLoading] = useState(true)
  const [leftError, setLeftError] = useState('')
  const [rightError, setRightError] = useState('')
  const [leftQuery, setLeftQuery] = useState('')
  const [rightQuery, setRightQuery] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    getPokemonCatalog(controller.signal)
      .then(setCatalog)
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return
        const message = reason instanceof Error ? reason.message : 'Errore sconosciuto'
        setCatalogError(message)
      })
    return () => controller.abort()
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    setLeftLoading(true)
    setLeftError('')
    getPokemonDetail(leftId, controller.signal)
      .then(setLeftPokemon)
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return
        setLeftError(reason instanceof Error ? reason.message : 'Dati non disponibili')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLeftLoading(false)
      })
    return () => controller.abort()
  }, [leftId])

  useEffect(() => {
    const controller = new AbortController()
    setRightLoading(true)
    setRightError('')
    getPokemonDetail(rightId, controller.signal)
      .then(setRightPokemon)
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return
        setRightError(reason instanceof Error ? reason.message : 'Dati non disponibili')
      })
      .finally(() => {
        if (!controller.signal.aborted) setRightLoading(false)
      })
    return () => controller.abort()
  }, [rightId])

  function suggestionsFor(query: string) {
    const value = normalize(query)
    if (!value) return []
    const numeric = Number(value)
    return catalog
      .filter((pokemon) => pokemon.name.includes(value) || (Number.isInteger(numeric) && pokemon.id === numeric))
      .slice(0, 6)
  }

  const leftSuggestions = useMemo(() => suggestionsFor(leftQuery), [catalog, leftQuery])
  const rightSuggestions = useMemo(() => suggestionsFor(rightQuery), [catalog, rightQuery])

  function selectPokemon(side: Side, item: PokemonCatalogItem) {
    if (side === 'left') {
      setLeftId(item.id)
      setLeftQuery('')
    } else {
      setRightId(item.id)
      setRightQuery('')
    }
  }

  function submitPicker(side: Side, event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const item = side === 'left' ? leftSuggestions[0] : rightSuggestions[0]
    if (!item) {
      onToast(catalogError ? 'Il catalogo non è disponibile al momento.' : 'Scrivi un nome o numero Pokédex valido.')
      return
    }
    selectPokemon(side, item)
  }

  function swapPokemon() {
    setLeftId(rightId)
    setRightId(leftId)
    setLeftQuery('')
    setRightQuery('')
  }

  const ready = Boolean(leftPokemon && rightPokemon && !leftLoading && !rightLoading)
  const leftOffense = ready ? offensiveMultiplier(leftPokemon!.types, rightPokemon!.types) : 1
  const rightOffense = ready ? offensiveMultiplier(rightPokemon!.types, leftPokemon!.types) : 1
  const statIds = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed']

  const comparisonScore = useMemo(() => {
    if (!leftPokemon || !rightPokemon) return { left: 0, right: 0, ties: 0 }
    let left = 0
    let right = 0
    let ties = 0
    statIds.forEach((statId) => {
      const leftValue = getStat(leftPokemon, statId)
      const rightValue = getStat(rightPokemon, statId)
      if (leftValue > rightValue) left += 1
      else if (rightValue > leftValue) right += 1
      else ties += 1
    })
    if (leftOffense > rightOffense) left += 1
    else if (rightOffense > leftOffense) right += 1
    else ties += 1
    return { left, right, ties }
  }, [leftPokemon, rightPokemon, leftOffense, rightOffense])

  const leftMoves = useMemo(() => leftPokemon ? strongestMoves(leftPokemon.moves) : [], [leftPokemon])
  const rightMoves = useMemo(() => rightPokemon ? strongestMoves(rightPokemon.moves) : [], [rightPokemon])

  const provisionalWinner = !ready || !leftPokemon || !rightPokemon
    ? null
    : comparisonScore.left === comparisonScore.right
      ? null
      : comparisonScore.left > comparisonScore.right ? leftPokemon : rightPokemon

  return (
    <div className="battle-view">
      <header className="pokedex-header battle-header">
        <IconButton label="Torna alla home" onClick={onBack}><ArrowLeftIcon /></IconButton>
        <div>
          <p className="eyebrow">CapsuleDex</p>
          <h1>Battle Dex</h1>
        </div>
        <span className="battle-header__icon"><VersusIcon /></span>
      </header>

      <section className="battle-hero">
        <span className="battle-hero__grid" aria-hidden="true" />
        <div>
          <p className="eyebrow">Confronto diretto</p>
          <h2>Chi ha i dati migliori?</h2>
          <p>Metti fianco a fianco statistiche, tipi, abilità e mosse apprendibili.</p>
        </div>
        <div className="battle-hero__badge" aria-hidden="true"><b>VS</b></div>
      </section>

      {catalogError && (
        <aside className="battle-catalog-warning">
          <b>!</b><p>La ricerca non è disponibile, ma il confronto già selezionato continua a funzionare.</p>
        </aside>
      )}

      <section className="battle-arena" aria-label="Pokémon da confrontare">
        <PokemonPicker
          side="left"
          pokemon={leftPokemon}
          loading={leftLoading}
          error={leftError}
          query={leftQuery}
          suggestions={leftSuggestions}
          onQueryChange={setLeftQuery}
          onSubmit={(event) => submitPicker('left', event)}
          onSelect={(item) => selectPokemon('left', item)}
          onOpenPokemon={onOpenPokemon}
        />

        <button type="button" className="battle-swap" onClick={swapPokemon} aria-label="Scambia i due Pokémon">
          <span>⇄</span><small>Scambia</small>
        </button>

        <PokemonPicker
          side="right"
          pokemon={rightPokemon}
          loading={rightLoading}
          error={rightError}
          query={rightQuery}
          suggestions={rightSuggestions}
          onQueryChange={setRightQuery}
          onSubmit={(event) => submitPicker('right', event)}
          onSelect={(item) => selectPokemon('right', item)}
          onOpenPokemon={onOpenPokemon}
        />
      </section>

      {ready && leftPokemon && rightPokemon && (
        <>
          <section className="battle-verdict" aria-labelledby="battle-verdict-title">
            <div className="battle-verdict__score">
              <span>{comparisonScore.left}</span>
              <b>—</b>
              <span>{comparisonScore.right}</span>
            </div>
            <div>
              <p className="eyebrow">Indice comparativo</p>
              <h2 id="battle-verdict-title">
                {provisionalWinner ? `${provisionalWinner.italianName || provisionalWinner.name} è avanti` : 'Confronto in equilibrio'}
              </h2>
              <p>Il punteggio assegna un punto per ogni statistica base superiore e uno per il vantaggio offensivo dei tipi.</p>
            </div>
            <span className="battle-verdict__ties">{comparisonScore.ties} pari</span>
          </section>

          <section className="battle-quick-grid" aria-label="Confronto rapido">
            <article>
              <span>BST</span>
              <strong>{leftPokemon.totalStats}</strong>
              <i>Totale statistiche</i>
              <b className={leftPokemon.totalStats >= rightPokemon.totalStats ? 'is-winning' : ''}>{leftPokemon.italianName || leftPokemon.name}</b>
            </article>
            <article>
              <span>BST</span>
              <strong>{rightPokemon.totalStats}</strong>
              <i>Totale statistiche</i>
              <b className={rightPokemon.totalStats >= leftPokemon.totalStats ? 'is-winning' : ''}>{rightPokemon.italianName || rightPokemon.name}</b>
            </article>
            <article>
              <span>Velocità</span>
              <strong>{getStat(leftPokemon, 'speed')}</strong>
              <i>Statistica base</i>
              <b className={getStat(leftPokemon, 'speed') >= getStat(rightPokemon, 'speed') ? 'is-winning' : ''}>{leftPokemon.italianName || leftPokemon.name}</b>
            </article>
            <article>
              <span>Velocità</span>
              <strong>{getStat(rightPokemon, 'speed')}</strong>
              <i>Statistica base</i>
              <b className={getStat(rightPokemon, 'speed') >= getStat(leftPokemon, 'speed') ? 'is-winning' : ''}>{rightPokemon.italianName || rightPokemon.name}</b>
            </article>
          </section>

          <section className="battle-section" aria-labelledby="battle-stats-title">
            <div className="section-heading">
              <div><p className="eyebrow">Sei parametri</p><h2 id="battle-stats-title">Statistiche base</h2></div>
              <span className="results-counter">BST {leftPokemon.totalStats} · {rightPokemon.totalStats}</span>
            </div>

            <div className="battle-stat-table">
              <div className="battle-stat-table__names">
                <strong>{leftPokemon.italianName || leftPokemon.name}</strong>
                <span>VS</span>
                <strong>{rightPokemon.italianName || rightPokemon.name}</strong>
              </div>
              {statIds.map((statId) => {
                const leftValue = getStat(leftPokemon, statId)
                const rightValue = getStat(rightPokemon, statId)
                const maximum = Math.max(leftValue, rightValue, 180)
                return (
                  <div className="battle-stat-row" key={statId}>
                    <div className={leftValue > rightValue ? 'is-winning' : ''}>
                      <strong>{leftValue}</strong>
                      <i><b style={{ width: `${(leftValue / maximum) * 100}%` }} /></i>
                    </div>
                    <span>{statLabels[statId] ?? statId}</span>
                    <div className={rightValue > leftValue ? 'is-winning' : ''}>
                      <i><b style={{ width: `${(rightValue / maximum) * 100}%` }} /></i>
                      <strong>{rightValue}</strong>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          <section className="battle-section" aria-labelledby="battle-types-title">
            <div className="section-heading">
              <div><p className="eyebrow">STAB contro difesa</p><h2 id="battle-types-title">Confronto dei tipi</h2></div>
              <span className="results-counter">Senza abilità</span>
            </div>

            <div className="battle-type-matchup">
              <article className={leftOffense > rightOffense ? 'is-winning' : ''}>
                <div>
                  {leftPokemon.types.filter(isPokemonType).map((type) => (
                    <span key={type} className={`type-pill type-pill--${type}`}>{italianTypeNames[type]}</span>
                  ))}
                </div>
                <strong>{multiplierLabel(leftOffense)}</strong>
                <p>Miglior moltiplicatore dei tipi di {leftPokemon.italianName || leftPokemon.name} contro {rightPokemon.italianName || rightPokemon.name}.</p>
              </article>
              <span className="battle-type-matchup__versus">VS</span>
              <article className={rightOffense > leftOffense ? 'is-winning' : ''}>
                <div>
                  {rightPokemon.types.filter(isPokemonType).map((type) => (
                    <span key={type} className={`type-pill type-pill--${type}`}>{italianTypeNames[type]}</span>
                  ))}
                </div>
                <strong>{multiplierLabel(rightOffense)}</strong>
                <p>Miglior moltiplicatore dei tipi di {rightPokemon.italianName || rightPokemon.name} contro {leftPokemon.italianName || leftPokemon.name}.</p>
              </article>
            </div>
          </section>

          <section className="battle-section" aria-labelledby="battle-abilities-title">
            <div className="section-heading">
              <div><p className="eyebrow">Tratti passivi</p><h2 id="battle-abilities-title">Abilità</h2></div>
              <span className="results-counter">Normali e nascoste</span>
            </div>
            <div className="battle-dual-columns">
              {[leftPokemon, rightPokemon].map((pokemon) => (
                <article key={pokemon.id} className="battle-ability-column">
                  <header><img src={pokemon.sprite ?? pokemon.image ?? './assets/capsuledex-mark.svg'} alt="" /><strong>{pokemon.italianName || pokemon.name}</strong></header>
                  <div>
                    {pokemon.abilities.map((ability) => (
                      <span key={`${ability.id}-${ability.hidden}`}>
                        <b>{ability.name}</b><small>{ability.hidden ? 'Nascosta' : 'Standard'}</small>
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="battle-section" aria-labelledby="battle-moves-title">
            <div className="section-heading">
              <div><p className="eyebrow">Anteprima del repertorio</p><h2 id="battle-moves-title">Mosse apprendibili</h2></div>
              <span className="results-counter">{leftPokemon.moves.length} · {rightPokemon.moves.length}</span>
            </div>
            <div className="battle-dual-columns">
              {[
                { pokemon: leftPokemon, moves: leftMoves },
                { pokemon: rightPokemon, moves: rightMoves },
              ].map(({ pokemon, moves }) => (
                <article key={pokemon.id} className="battle-move-column">
                  <header>
                    <strong>{pokemon.italianName || pokemon.name}</strong>
                    <span>{pokemon.moves.length} totali</span>
                  </header>
                  <div>
                    {moves.map((move) => (
                      <span key={`${move.id}-${move.method}-${move.level}`}>
                        <b>{move.name}</b>
                        <small>{moveMethodLabel(move.method)}{move.method === 'level-up' && move.level > 0 ? ` · Lv. ${move.level}` : ''}</small>
                      </span>
                    ))}
                    {moves.length === 0 && <p>Nessuna mossa disponibile.</p>}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="battle-section battle-physical" aria-labelledby="battle-physical-title">
            <div className="section-heading section-heading--compact">
              <div><p className="eyebrow">Dati fisici</p><h2 id="battle-physical-title">Dimensioni</h2></div>
            </div>
            <div>
              <article><span>{leftPokemon.italianName || leftPokemon.name}</span><strong>{formatNumber(leftPokemon.heightMetres)} m</strong><small>{formatNumber(leftPokemon.weightKg)} kg</small></article>
              <i>⇄</i>
              <article><span>{rightPokemon.italianName || rightPokemon.name}</span><strong>{formatNumber(rightPokemon.heightMetres)} m</strong><small>{formatNumber(rightPokemon.weightKg)} kg</small></article>
            </div>
          </section>

          <aside className="battle-note">
            <span>i</span>
            <p>Battle Dex confronta dati base, non simula una lotta reale. Livello, natura, EV, IV, mosse scelte, strumenti, abilità e regole del formato possono ribaltare il risultato.</p>
          </aside>
        </>
      )}

      <footer className="app-footer app-footer--battle">
        <img src="./assets/capsuledex-mark.svg" alt="" />
        <p>Confronto informativo · dati Pokémon tramite PokéAPI.</p>
      </footer>
    </div>
  )
}
