import { FormEvent, useEffect, useMemo, useState } from 'react'
import { getEvolutionChainForPokemon, getPokemonCatalog } from '../services/pokeapi'
import type {
  EvolutionChainData,
  EvolutionMethodGroup,
  EvolutionNodeData,
  EvolutionRequirement,
  PokemonCatalogItem,
} from '../types'
import { ArrowLeftIcon, EvolutionIcon, IconButton, SearchIcon } from './Icon'

const RECENT_KEY = 'capsuledex:evolution-recent:v1'
const RECENT_LIMIT = 8

const methodMeta: Record<EvolutionMethodGroup, { label: string; icon: string; description: string }> = {
  level: { label: 'Livello', icon: '↗', description: 'Livello minimo o aumento di livello.' },
  item: { label: 'Strumento', icon: '◆', description: 'Pietre, strumenti usati o tenuti.' },
  trade: { label: 'Scambio', icon: '⇄', description: 'Scambio semplice o con condizioni.' },
  friendship: { label: 'Felicità', icon: '♥', description: 'Felicità o affetto sufficienti.' },
  time: { label: 'Orario', icon: '◐', description: 'Evoluzione di giorno o di notte.' },
  weather: { label: 'Meteo', icon: '☂', description: 'Condizioni meteorologiche richieste.' },
  move: { label: 'Mossa', icon: '⚡', description: 'Mossa o tipo di mossa conosciuto.' },
  location: { label: 'Luogo', icon: '⌖', description: 'Zona specifica del mondo di gioco.' },
  party: { label: 'Squadra', icon: '●', description: 'Pokémon o tipo presente in squadra.' },
  stats: { label: 'Statistiche', icon: '▥', description: 'Rapporto tra Attacco e Difesa.' },
  special: { label: 'Speciale', icon: '✦', description: 'Genere, rotazione o altri metodi unici.' },
}

const popularChains = [
  { id: 1, label: 'Bulbasaur', note: 'Catena classica' },
  { id: 133, label: 'Eevee', note: 'Molte ramificazioni' },
  { id: 236, label: 'Tyrogue', note: 'Statistiche' },
  { id: 265, label: 'Wurmple', note: 'Evoluzione ramificata' },
  { id: 840, label: 'Applin', note: 'Strumenti speciali' },
  { id: 935, label: 'Charcadet', note: 'Evoluzioni alternative' },
]

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[\s_]+/g, '-')
}

function displayPokemonName(slug: string) {
  return slug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function padId(id: number) {
  return `N°${String(id).padStart(4, '0')}`
}

function artwork(id: number) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`
}

function loadRecent(): number[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter((value): value is number => Number.isInteger(value) && value > 0).slice(0, RECENT_LIMIT) : []
  } catch {
    return []
  }
}

function saveRecent(ids: number[]) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(ids.slice(0, RECENT_LIMIT)))
  } catch {
    // Lo storico è un miglioramento facoltativo: l'app continua a funzionare senza storage.
  }
}

function requirementMatches(requirement: EvolutionRequirement, filter: 'all' | EvolutionMethodGroup) {
  return filter === 'all' || requirement.groups.includes(filter)
}

function chainContainsMethod(node: EvolutionNodeData, filter: 'all' | EvolutionMethodGroup): boolean {
  if (filter === 'all') return true
  if (node.requirements.some((requirement) => requirementMatches(requirement, filter))) return true
  return node.evolvesTo.some((child) => chainContainsMethod(child, filter))
}

function collectSummary(node: EvolutionNodeData, depth = 0): string[] {
  const indent = '  '.repeat(depth)
  const lines = [`${indent}${padId(node.id)} ${node.name}`]
  node.evolvesTo.forEach((child) => {
    const requirements = child.requirements.map((requirement) => requirement.summary).join(' oppure ')
    lines.push(`${indent}  → ${requirements || 'Evoluzione'} → ${child.name}`)
    lines.push(...collectSummary(child, depth + 1).slice(1))
  })
  return lines
}

type RequirementCardProps = {
  requirement: EvolutionRequirement
  filter: 'all' | EvolutionMethodGroup
  onOpenItem: (slug: string) => void
  onOpenMove: (slug: string) => void
}

function RequirementCard({ requirement, filter, onOpenItem, onOpenMove }: RequirementCardProps) {
  const matches = requirementMatches(requirement, filter)
  return (
    <article className={`evolution-db-requirement${matches ? ' is-match' : ' is-muted'}`}>
      <header>
        <span>{requirement.groups[0] ? methodMeta[requirement.groups[0]].icon : '→'}</span>
        <strong>{requirement.trigger}</strong>
      </header>
      {requirement.details.length > 0 && (
        <ul>
          {requirement.details.map((detail) => <li key={detail}>{detail}</li>)}
        </ul>
      )}
      {requirement.resources.length > 0 && (
        <div className="evolution-db-requirement__links">
          {requirement.resources.map((resource) => (
            <button
              type="button"
              key={`${resource.kind}-${resource.slug}`}
              onClick={() => resource.kind === 'item' ? onOpenItem(resource.slug) : onOpenMove(resource.slug)}
            >
              {resource.kind === 'item' ? 'Apri strumento' : 'Apri mossa'}: {resource.name} <b>→</b>
            </button>
          ))}
        </div>
      )}
    </article>
  )
}

type EvolutionNodeProps = {
  node: EvolutionNodeData
  filter: 'all' | EvolutionMethodGroup
  selectedPokemonId: number | null
  onOpenPokemon: (id: number) => void
  onOpenItem: (slug: string) => void
  onOpenMove: (slug: string) => void
  onToast: (message: string) => void
}

function EvolutionTreeNode({ node, filter, selectedPokemonId, onOpenPokemon, onOpenItem, onOpenMove, onToast }: EvolutionNodeProps) {
  const containsMatch = chainContainsMethod(node, filter)
  return (
    <div className={`evolution-db-tree-node${containsMatch ? '' : ' is-muted'}`}>
      <button
        type="button"
        className={`evolution-db-pokemon${node.id === selectedPokemonId ? ' is-selected' : ''}`}
        onClick={() => node.id === selectedPokemonId ? onToast(`${node.name} è già il Pokémon selezionato.`) : onOpenPokemon(node.id)}
      >
        <span className="evolution-db-pokemon__number">{padId(node.id)}</span>
        <span className="evolution-db-pokemon__image">
          <img
            src={node.image}
            alt=""
            loading="lazy"
            onError={(event) => { event.currentTarget.src = './assets/capsuledex-mark.svg' }}
          />
        </span>
        <strong>{node.name}</strong>
        {node.name !== node.englishName && <small>{node.englishName}</small>}
        {node.isBaby && <i>Baby Pokémon</i>}
        <span className="evolution-db-pokemon__open">Scheda Pokémon <b>→</b></span>
      </button>

      {node.evolvesTo.length > 0 && (
        <div className="evolution-db-children">
          {node.evolvesTo.map((child) => (
            <div className="evolution-db-child" key={child.id}>
              <div className="evolution-db-connector" aria-hidden="true"><span>↓</span></div>
              <div className="evolution-db-requirements">
                {child.requirements.length > 0 ? child.requirements.map((requirement, index) => (
                  <RequirementCard
                    key={`${child.id}-${requirement.summary}-${index}`}
                    requirement={requirement}
                    filter={filter}
                    onOpenItem={onOpenItem}
                    onOpenMove={onOpenMove}
                  />
                )) : (
                  <article className="evolution-db-requirement is-match">
                    <header><span>→</span><strong>Metodo non specificato</strong></header>
                  </article>
                )}
              </div>
              <EvolutionTreeNode
                node={child}
                filter={filter}
                selectedPokemonId={selectedPokemonId}
                onOpenPokemon={onOpenPokemon}
                onOpenItem={onOpenItem}
                onOpenMove={onOpenMove}
                onToast={onToast}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

type EvolutionViewProps = {
  initialPokemonId: number | null
  onBack: () => void
  onOpenPokemon: (id: number) => void
  onOpenItem: (slug: string) => void
  onOpenMove: (slug: string) => void
  onSelectionChange: (id: number | null) => void
  onToast: (message: string) => void
}

export function EvolutionView({ initialPokemonId, onBack, onOpenPokemon, onOpenItem, onOpenMove, onSelectionChange, onToast }: EvolutionViewProps) {
  const [catalog, setCatalog] = useState<PokemonCatalogItem[]>([])
  const [catalogError, setCatalogError] = useState('')
  const [query, setQuery] = useState('')
  const [chain, setChain] = useState<EvolutionChainData | null>(null)
  const [selectedPokemonId, setSelectedPokemonId] = useState<number | null>(initialPokemonId)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [methodFilter, setMethodFilter] = useState<'all' | EvolutionMethodGroup>('all')
  const [recent, setRecent] = useState<number[]>(loadRecent)

  useEffect(() => {
    const controller = new AbortController()
    getPokemonCatalog(controller.signal)
      .then(setCatalog)
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return
        setCatalogError(reason instanceof Error ? reason.message : 'Catalogo non disponibile.')
      })
    return () => controller.abort()
  }, [])

  function remember(id: number) {
    setRecent((current) => {
      const next = [id, ...current.filter((entry) => entry !== id)].slice(0, RECENT_LIMIT)
      saveRecent(next)
      return next
    })
  }

  function loadChain(key: number | string, preferredId?: number) {
    const controller = new AbortController()
    setLoading(true)
    setError('')
    setMethodFilter('all')
    getEvolutionChainForPokemon(key, controller.signal)
      .then((result) => {
        setChain(result)
        const nextId = preferredId ?? (typeof key === 'number' ? key : result.root.id)
        setSelectedPokemonId(nextId)
        onSelectionChange(nextId)
        remember(nextId)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return
        setChain(null)
        setError(reason instanceof Error ? reason.message : 'Impossibile caricare la catena evolutiva.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return controller
  }

  useEffect(() => {
    if (!initialPokemonId) return
    const controller = loadChain(initialPokemonId, initialPokemonId)
    return () => controller.abort()
    // `loadChain` usa solo setter stabili e deve reagire al Pokémon selezionato dall'esterno.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPokemonId])

  const suggestions = useMemo(() => {
    const normalized = normalize(query)
    if (!normalized || catalog.length === 0) return []
    const numeric = Number(query.trim())
    return catalog
      .filter((pokemon) => (
        (Number.isInteger(numeric) && pokemon.id === numeric)
        || normalize(pokemon.name).includes(normalized)
      ))
      .sort((a, b) => {
        const aStarts = normalize(a.name).startsWith(normalized) ? 0 : 1
        const bStarts = normalize(b.name).startsWith(normalized) ? 0 : 1
        return aStarts - bStarts || a.id - b.id
      })
      .slice(0, 8)
  }, [catalog, query])

  const recentPokemon = useMemo(() => recent
    .map((id) => catalog.find((pokemon) => pokemon.id === id) ?? { id, name: `pokemon-${id}` }), [catalog, recent])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const clean = query.trim()
    if (!clean) {
      onToast('Inserisci un nome o un numero Pokédex.')
      return
    }
    const numeric = Number(clean)
    if (Number.isInteger(numeric) && numeric > 0) {
      loadChain(numeric, numeric)
      return
    }
    const normalized = normalize(clean)
    const match = catalog.find((pokemon) => normalize(pokemon.name) === normalized)
      ?? catalog.find((pokemon) => normalize(pokemon.name).startsWith(normalized))
      ?? catalog.find((pokemon) => normalize(pokemon.name).includes(normalized))
    loadChain(match?.id ?? normalized, match?.id)
  }

  function choosePokemon(pokemon: PokemonCatalogItem) {
    setQuery('')
    loadChain(pokemon.id, pokemon.id)
  }

  async function copyChain() {
    if (!chain) return
    const text = `CapsuleDex — Catena evolutiva #${chain.id}\n${collectSummary(chain.root).join('\n')}`
    try {
      await navigator.clipboard.writeText(text)
      onToast('Catena evolutiva copiata.')
    } catch {
      onToast('Il browser non consente di copiare automaticamente.')
    }
  }

  return (
    <div className="evolution-db-view">
      <header className="subpage-header">
        <IconButton label="Torna alla Home" onClick={onBack}><ArrowLeftIcon /></IconButton>
        <div><p className="eyebrow">Atlante evolutivo</p><h1>Evoluzioni</h1></div>
        <span className="evolution-db-phase">FASE 12</span>
      </header>

      <section className="evolution-db-intro">
        <div className="evolution-db-intro__icon"><EvolutionIcon /></div>
        <div>
          <span>GUIDA COMPLETA</span>
          <h2>Scopri ogni percorso evolutivo</h2>
          <p>Cerca un Pokémon e visualizza ramificazioni, livelli, pietre, scambi, felicità, orari, meteo e condizioni speciali.</p>
        </div>
      </section>

      <form className="evolution-db-search" onSubmit={handleSubmit}>
        <SearchIcon />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Cerca Pokémon per nome o numero..."
          aria-label="Cerca una catena evolutiva"
          inputMode="search"
        />
        {query && <button type="button" onClick={() => setQuery('')} aria-label="Cancella ricerca">×</button>}
        <button type="submit">Analizza</button>
      </form>

      {query && suggestions.length > 0 && (
        <div className="evolution-db-suggestions">
          {suggestions.map((pokemon) => (
            <button type="button" key={pokemon.id} onClick={() => choosePokemon(pokemon)}>
              <img src={artwork(pokemon.id)} alt="" loading="lazy" onError={(event) => { event.currentTarget.src = './assets/capsuledex-mark.svg' }} />
              <span><strong>{displayPokemonName(pokemon.name)}</strong><small>{padId(pokemon.id)}</small></span>
              <b>→</b>
            </button>
          ))}
        </div>
      )}

      {catalogError && <p className="evolution-db-catalog-note">Il suggerimento automatico non è disponibile: puoi comunque cercare con nome inglese o numero.</p>}

      {!chain && !loading && !error && (
        <>
          <section className="evolution-db-quick" aria-labelledby="evolution-popular-title">
            <div className="section-heading section-heading--compact">
              <div><p className="eyebrow">Esempi utili</p><h2 id="evolution-popular-title">Catene da esplorare</h2></div>
            </div>
            <div className="evolution-db-quick-grid">
              {popularChains.map((pokemon) => (
                <button type="button" key={pokemon.id} onClick={() => loadChain(pokemon.id, pokemon.id)}>
                  <img src={artwork(pokemon.id)} alt="" loading="lazy" />
                  <span><strong>{pokemon.label}</strong><small>{pokemon.note}</small></span>
                  <b>→</b>
                </button>
              ))}
            </div>
          </section>

          {recentPokemon.length > 0 && (
            <section className="evolution-db-recent" aria-labelledby="evolution-recent-title">
              <div className="section-heading section-heading--compact">
                <h2 id="evolution-recent-title">Consultate di recente</h2>
                <button type="button" onClick={() => { setRecent([]); saveRecent([]) }}>Cancella</button>
              </div>
              <div className="evolution-db-recent-list">
                {recentPokemon.map((pokemon) => (
                  <button type="button" key={pokemon.id} onClick={() => loadChain(pokemon.id, pokemon.id)}>
                    <img src={artwork(pokemon.id)} alt="" loading="lazy" />
                    <span>{displayPokemonName(pokemon.name)}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          <section className="evolution-db-guide" aria-labelledby="evolution-guide-title">
            <div className="section-heading section-heading--compact">
              <div><p className="eyebrow">Legenda</p><h2 id="evolution-guide-title">Metodi riconosciuti</h2></div>
            </div>
            <div className="evolution-db-guide-grid">
              {(Object.entries(methodMeta) as Array<[EvolutionMethodGroup, typeof methodMeta[EvolutionMethodGroup]]>).map(([id, meta]) => (
                <article key={id}><span>{meta.icon}</span><div><strong>{meta.label}</strong><p>{meta.description}</p></div></article>
              ))}
            </div>
          </section>
        </>
      )}

      {loading && (
        <div className="evolution-db-loading" aria-busy="true">
          <span className="skeleton" /><span className="skeleton" /><span className="skeleton" />
          <p>Ricostruzione della catena evolutiva…</p>
        </div>
      )}

      {error && !loading && (
        <div className="error-panel evolution-db-error" role="alert">
          <span>!</span><strong>Catena non disponibile</strong><p>{error}</p>
          <button type="button" onClick={() => { setError(''); setChain(null) }}>Nuova ricerca</button>
        </div>
      )}

      {chain && !loading && (
        <>
          <section className="evolution-db-summary">
            <div>
              <span>CATENA #{String(chain.id).padStart(3, '0')}</span>
              <h2>{chain.root.name} e famiglia evolutiva</h2>
              <p>{chain.speciesCount === 1 ? 'Questo Pokémon non possiede evoluzioni registrate.' : `La catena comprende ${chain.speciesCount} specie e ${chain.branchCount} ${chain.branchCount === 1 ? 'percorso finale' : 'percorsi finali'}.`}</p>
            </div>
            <button type="button" onClick={() => { setChain(null); setError(''); setQuery(''); onSelectionChange(null) }}>Cambia Pokémon</button>
          </section>

          <div className="evolution-db-stats" aria-label="Riepilogo della catena">
            <article><span>Specie</span><strong>{chain.speciesCount}</strong><small>nella famiglia</small></article>
            <article><span>Stadi</span><strong>{chain.maxDepth}</strong><small>profondità massima</small></article>
            <article><span>Finali</span><strong>{chain.branchCount}</strong><small>rami conclusivi</small></article>
          </div>

          {chain.babyTriggerItem && (
            <div className="evolution-db-baby-trigger">
              <span>◇</span>
              <div><strong>Condizione Baby Pokémon</strong><p>Per ottenere il Baby Pokémon della catena è associato lo strumento {chain.babyTriggerItem.name}.</p></div>
              <button type="button" onClick={() => onOpenItem(chain.babyTriggerItem!.slug)}>Apri <b>→</b></button>
            </div>
          )}

          {chain.methodGroups.length > 0 && (
            <section className="evolution-db-method-filter" aria-labelledby="evolution-method-filter-title">
              <div className="section-heading section-heading--compact">
                <div><p className="eyebrow">Evidenzia condizioni</p><h2 id="evolution-method-filter-title">Filtra per metodo</h2></div>
                <button type="button" onClick={() => setMethodFilter('all')}>Azzera</button>
              </div>
              <div className="evolution-db-method-chips">
                <button type="button" className={methodFilter === 'all' ? 'is-selected' : ''} onClick={() => setMethodFilter('all')}>Tutti</button>
                {chain.methodGroups.map((group) => (
                  <button type="button" key={group} className={methodFilter === group ? 'is-selected' : ''} onClick={() => setMethodFilter(group)}>
                    <span>{methodMeta[group].icon}</span>{methodMeta[group].label}
                  </button>
                ))}
              </div>
              {methodFilter !== 'all' && <p>Le condizioni che non appartengono a “{methodMeta[methodFilter].label}” vengono attenuate, senza nascondere i rami della catena.</p>}
            </section>
          )}

          <section className="evolution-db-tree" aria-labelledby="evolution-tree-title">
            <div className="section-heading">
              <div><p className="eyebrow">Albero completo</p><h2 id="evolution-tree-title">Percorso evolutivo</h2></div>
              <span className="progress-chip">{chain.speciesCount} specie</span>
            </div>
            <EvolutionTreeNode
              node={chain.root}
              filter={methodFilter}
              selectedPokemonId={selectedPokemonId}
              onOpenPokemon={onOpenPokemon}
              onOpenItem={onOpenItem}
              onOpenMove={onOpenMove}
              onToast={onToast}
            />
          </section>

          <button type="button" className="evolution-db-copy" onClick={copyChain}>Copia riepilogo della catena</button>
          <p className="evolution-db-note"><span>i</span>I requisiti possono variare tra giochi e generazioni. CapsuleDex mostra le condizioni disponibili nei dati di PokéAPI.</p>
        </>
      )}

      <footer className="app-footer app-footer--evolutions">
        <img src="./assets/capsuledex-mark.svg" alt="" />
        <p>Dati PokéAPI · progetto fan-made non ufficiale.</p>
      </footer>
    </div>
  )
}
