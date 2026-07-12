import { useEffect, useMemo, useState } from 'react'
import { itemIndex } from '../data/itemIndex'
import { getItemDetail } from '../services/pokeapi'
import type { ItemDetailData, ItemIndexItem } from '../types'
import { ArrowLeftIcon, IconButton, SearchIcon } from './Icon'

const PAGE_SIZE = 32
const POKEMON_PAGE_SIZE = 18
const ITEM_SPRITE_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items'

export const itemPocketLabels: Record<string, string> = {
  all: 'Tutte le tasche',
  misc: 'Strumenti',
  medicine: 'Rimedi',
  pokeballs: 'Poké Ball',
  machines: 'Macchine',
  berries: 'Bacche',
  mail: 'Messaggi',
  battle: 'Lotta',
  key: 'Strumenti base',
}

export const itemCategoryLabels: Record<string, string> = {
  'stat-boosts': 'Potenziamenti statistiche',
  'effort-drop': 'Riduzione punti base',
  medicine: 'Medicina',
  other: 'Altro',
  'in-a-pinch': 'Effetto in emergenza',
  'picky-healing': 'Cura selettiva',
  'type-protection': 'Protezione dai tipi',
  'baking-only': 'Ingredienti da cucina',
  collectibles: 'Collezionabili',
  evolution: 'Evoluzione',
  spelunking: 'Esplorazione',
  'held-items': 'Strumenti da tenere',
  choice: 'Strumenti scelta',
  'effort-training': 'Allenamento punti base',
  'bad-held-items': 'Strumenti con svantaggi',
  training: 'Allenamento',
  plates: 'Lastre',
  'species-specific': 'Specifici per specie',
  'type-enhancement': 'Potenziamento dei tipi',
  'event-items': 'Strumenti evento',
  gameplay: 'Meccaniche di gioco',
  'plot-advancement': 'Avanzamento della storia',
  unused: 'Non utilizzati',
  loot: 'Tesori',
  'all-mail': 'Messaggi',
  vitamins: 'Vitamine',
  healing: 'Cura',
  'pp-recovery': 'Recupero PP',
  revival: 'Revitalizzanti',
  'status-cures': 'Cura degli stati',
  mulch: 'Fertilizzanti',
  'special-balls': 'Poké Ball speciali',
  'standard-balls': 'Poké Ball standard',
  'dex-completion': 'Completamento Pokédex',
  scarves: 'Foulard',
  'all-machines': 'MT e MN',
  flutes: 'Flauti',
  'apricorn-balls': 'Ball da Ghicocche',
  'apricorn-box': 'Ghicocche',
  'data-cards': 'Schede dati',
  jewels: 'Gemme',
  'miracle-shooter': 'Miracle Shooter',
  'mega-stones': 'Megapietre',
  memories: 'Memorie',
  'z-crystals': 'Cristalli Z',
  'species-candies': 'Caramelle specifiche',
  'catching-bonus': 'Bonus cattura',
  'dynamax-crystals': 'Cristalli Dynamax',
  'nature-mints': 'Mente',
  'curry-ingredients': 'Ingredienti curry',
  'tera-shard': 'Teraliti',
  'sandwich-ingredients': 'Ingredienti panini',
  'tm-materials': 'Materiali MT',
  picnic: 'Picnic',
}

const pocketFilters = ['all', 'misc', 'medicine', 'pokeballs', 'machines', 'berries', 'battle', 'key']

const familyFilters = [
  { id: 'all', label: 'Tutto', icon: '🎒' },
  { id: 'berries', label: 'Bacche', icon: '🍓' },
  { id: 'balls', label: 'Poké Ball', icon: '◉' },
  { id: 'healing', label: 'Cura', icon: '✚' },
  { id: 'machines', label: 'MT / MN', icon: '▣' },
  { id: 'evolution', label: 'Evoluzione', icon: '✦' },
  { id: 'held', label: 'Da tenere', icon: '◇' },
  { id: 'battle', label: 'Lotta', icon: '⚔' },
  { id: 'key', label: 'Strumenti base', icon: '🔑' },
]

const heldCategories = new Set([
  'held-items', 'choice', 'effort-training', 'bad-held-items', 'training', 'plates',
  'species-specific', 'type-enhancement', 'mega-stones', 'memories', 'jewels',
  'z-crystals', 'dynamax-crystals', 'tera-shard',
])

const healingCategories = new Set(['medicine', 'healing', 'pp-recovery', 'revival', 'status-cures', 'vitamins'])

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[\s_]+/g, '-')
}

function itemImage(slug: string) {
  return `${ITEM_SPRITE_BASE}/${slug}.png`
}

function padItemId(id: number) {
  return `I${String(id).padStart(4, '0')}`
}

function formatCost(cost: number) {
  return cost > 0 ? `₽ ${cost.toLocaleString('it-IT')}` : '—'
}

function titleCase(value: string) {
  return value.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')
}

function categoryLabel(value: string) {
  return itemCategoryLabels[value] ?? titleCase(value)
}

function pocketLabel(value: string) {
  return itemPocketLabels[value] ?? titleCase(value)
}

function matchesFamily(item: ItemIndexItem, family: string) {
  if (family === 'all') return true
  if (family === 'berries') return item.pocket === 'berries'
  if (family === 'balls') return item.pocket === 'pokeballs'
  if (family === 'healing') return item.pocket === 'medicine' || healingCategories.has(item.category)
  if (family === 'machines') return item.pocket === 'machines' || item.category === 'all-machines'
  if (family === 'evolution') return item.category === 'evolution' || item.category === 'mega-stones'
  if (family === 'held') return heldCategories.has(item.category)
  if (family === 'battle') return item.pocket === 'battle'
  if (family === 'key') return item.pocket === 'key'
  return true
}

function sortItems(items: ItemIndexItem[], sort: string) {
  const copy = [...items]
  if (sort === 'name') return copy.sort((a, b) => a.name.localeCompare(b.name, 'it'))
  if (sort === 'cost-high') return copy.sort((a, b) => b.cost - a.cost || a.id - b.id)
  if (sort === 'cost-low') return copy.sort((a, b) => a.cost - b.cost || a.id - b.id)
  if (sort === 'fling') return copy.sort((a, b) => (b.flingPower ?? -1) - (a.flingPower ?? -1) || a.id - b.id)
  return copy.sort((a, b) => a.id - b.id)
}

function ItemCard({ item, onOpen }: { item: ItemIndexItem; onOpen: () => void }) {
  return (
    <button type="button" className={`item-card item-card--${item.pocket}`} onClick={onOpen}>
      <span className="item-card__shine" aria-hidden="true" />
      <header>
        <span>{padItemId(item.id)}</span>
        <i>{pocketLabel(item.pocket)}</i>
      </header>
      <div className="item-card__image">
        <img
          src={itemImage(item.slug)}
          alt=""
          loading="lazy"
          onError={(event) => { event.currentTarget.src = './assets/capsuledex-mark.svg' }}
        />
      </div>
      <strong>{item.name}</strong>
      {item.name !== item.englishName && <small>{item.englishName}</small>}
      <span className="item-card__category">{categoryLabel(item.category)}</span>
      <dl>
        <div><dt>Prezzo</dt><dd>{formatCost(item.cost)}</dd></div>
        <div><dt>Lancio</dt><dd>{item.flingPower ?? '—'}</dd></div>
      </dl>
      <span className="item-card__open">Apri scheda <b>→</b></span>
    </button>
  )
}

type ItemDetailScreenProps = {
  itemId: number
  onBack: () => void
  onOpenPokemon: (id: number) => void
  onOpenMove: (moveSlug: string) => void
  onToast: (message: string) => void
}

function ItemDetailScreen({ itemId, onBack, onOpenPokemon, onOpenMove, onToast }: ItemDetailScreenProps) {
  const [item, setItem] = useState<ItemDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pokemonLimit, setPokemonLimit] = useState(POKEMON_PAGE_SIZE)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError('')
    setItem(null)
    setPokemonLimit(POKEMON_PAGE_SIZE)
    getItemDetail(itemId, controller.signal)
      .then(setItem)
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return
        setError(reason instanceof Error ? reason.message : 'Impossibile caricare lo strumento.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [itemId])

  if (loading) {
    return (
      <div className="item-view item-detail-view">
        <header className="subpage-header">
          <IconButton label="Torna agli strumenti" onClick={onBack}><ArrowLeftIcon /></IconButton>
          <div><p className="eyebrow">Database strumenti</p><h1>Caricamento...</h1></div>
          <span className="subpage-header__spacer" />
        </header>
        <div className="item-detail-skeleton" aria-busy="true">
          <span className="skeleton" /><span className="skeleton" /><span className="skeleton" />
        </div>
      </div>
    )
  }

  if (!item || error) {
    return (
      <div className="item-view item-detail-view">
        <header className="subpage-header">
          <IconButton label="Torna agli strumenti" onClick={onBack}><ArrowLeftIcon /></IconButton>
          <div><p className="eyebrow">Database strumenti</p><h1>Errore</h1></div>
          <span className="subpage-header__spacer" />
        </header>
        <div className="error-panel" role="alert">
          <span>!</span><strong>Dati non disponibili</strong><p>{error || 'Riprova tra poco.'}</p>
          <button type="button" onClick={onBack}>Torna all’elenco</button>
        </div>
      </div>
    )
  }

  const generationLabel = item.generation ? `Generazione ${['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'][item.generation] ?? item.generation}` : 'Generazione non indicata'

  return (
    <div className="item-view item-detail-view">
      <header className="subpage-header">
        <IconButton label="Torna agli strumenti" onClick={onBack}><ArrowLeftIcon /></IconButton>
        <div><p className="eyebrow">Scheda strumento</p><h1>{item.name}</h1></div>
        <span className="item-id-badge">{padItemId(item.id)}</span>
      </header>

      <section className={`item-detail-hero item-detail-hero--${item.pocket}`}>
        <span className="item-detail-hero__rings" aria-hidden="true" />
        <div className="item-detail-hero__image">
          <img
            src={item.image ?? itemImage(item.slug)}
            alt={item.name}
            onError={(event) => { event.currentTarget.src = './assets/capsuledex-mark.svg' }}
          />
        </div>
        <article>
          <div className="item-detail-hero__chips">
            <span>{pocketLabel(item.pocket)}</span>
            <span>{categoryLabel(item.category)}</span>
          </div>
          <h2>{item.name}</h2>
          {item.name !== item.englishName && <p className="item-detail-hero__english">{item.englishName}</p>}
          <p>{item.description}</p>
          <small>{generationLabel}</small>
        </article>
      </section>

      <section className="item-core-stats" aria-label="Dati principali dello strumento">
        <article><span>Prezzo</span><strong>{formatCost(item.cost)}</strong><small>Prezzo base nei negozi</small></article>
        <article><span>Potenza lancio</span><strong>{item.flingPower ?? '—'}</strong><small>Mossa Lancio</small></article>
        <article><span>Tasca</span><strong>{pocketLabel(item.pocket)}</strong><small>Posizione nella Borsa</small></article>
      </section>

      <section className="item-info-section" aria-labelledby="item-effect-title">
        <div className="section-heading">
          <div><p className="eyebrow">Utilizzo</p><h2 id="item-effect-title">Effetto</h2></div>
          <span className="results-counter">{categoryLabel(item.category)}</span>
        </div>
        <article className="item-effect-card">
          <span>✦</span>
          <div><strong>{item.effect}</strong><p>{item.description}</p></div>
        </article>
      </section>

      {(item.attributes.length > 0 || item.babyTrigger) && (
        <section className="item-info-section" aria-labelledby="item-attributes-title">
          <div className="section-heading">
            <div><p className="eyebrow">Proprietà</p><h2 id="item-attributes-title">Caratteristiche</h2></div>
          </div>
          <div className="item-attribute-grid">
            {item.attributes.map((attribute) => <span key={attribute}>✓ {attribute}</span>)}
            {item.babyTrigger && <span>✦ Necessario per ottenere un Pokémon Baby</span>}
          </div>
        </section>
      )}

      {(item.flingPower !== null || item.flingEffect) && (
        <section className="item-info-section" aria-labelledby="item-fling-title">
          <div className="section-heading">
            <div><p className="eyebrow">In lotta</p><h2 id="item-fling-title">Mossa Lancio</h2></div>
            {item.flingPower !== null && <span className="results-counter">Potenza {item.flingPower}</span>}
          </div>
          <article className="item-fling-card">
            <span>↗</span><p>{item.flingEffect ?? 'Lo strumento può essere lanciato senza un effetto secondario specifico.'}</p>
          </article>
        </section>
      )}

      {item.machines.length > 0 && (
        <section className="item-info-section" aria-labelledby="item-machines-title">
          <div className="section-heading">
            <div><p className="eyebrow">Compatibilità</p><h2 id="item-machines-title">Mosse associate</h2></div>
            <span className="results-counter">{item.machines.length}</span>
          </div>
          <div className="item-machine-list">
            {item.machines.map((machine) => (
              <button type="button" key={`${machine.id}-${machine.versionGroup}`} onClick={() => onOpenMove(machine.moveSlug)}>
                <span>MT</span><div><strong>{machine.moveName}</strong><small>{machine.versionGroup}</small></div><b>→</b>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="item-info-section" aria-labelledby="item-held-title">
        <div className="section-heading">
          <div><p className="eyebrow">In natura</p><h2 id="item-held-title">Pokémon che possono tenerlo</h2></div>
          <span className="results-counter">{item.heldByPokemon.length}</span>
        </div>
        {item.heldByPokemon.length > 0 ? (
          <>
            <div className="item-holder-grid">
              {item.heldByPokemon.slice(0, pokemonLimit).map((pokemon) => (
                <button type="button" key={pokemon.id} onClick={() => onOpenPokemon(pokemon.id)}>
                  <img src={pokemon.image} alt="" loading="lazy" onError={(event) => { event.currentTarget.src = './assets/capsuledex-mark.svg' }} />
                  <span>N°{String(pokemon.id).padStart(4, '0')}</span>
                  <strong>{pokemon.name}</strong>
                  {pokemon.rarity !== null && <small>Probabilità fino al {pokemon.rarity}%</small>}
                </button>
              ))}
            </div>
            {pokemonLimit < item.heldByPokemon.length && (
              <button type="button" className="load-more-button" onClick={() => setPokemonLimit((value) => value + POKEMON_PAGE_SIZE)}>
                Mostra altri Pokémon
              </button>
            )}
          </>
        ) : (
          <div className="empty-state item-empty-state"><span>◇</span><strong>Nessun Pokémon elencato</strong><p>Questo strumento non risulta tra quelli tenuti dai Pokémon selvatici.</p></div>
        )}
      </section>

      <aside className="item-note">
        <span>i</span><p>Prezzi, descrizioni ed effetti possono cambiare tra giochi e generazioni. CapsuleDex mostra i dati correnti disponibili su PokéAPI.</p>
      </aside>

      <button type="button" className="item-copy-button" onClick={() => {
        const text = `${item.name} · ${categoryLabel(item.category)} · ${pocketLabel(item.pocket)} · Prezzo ${formatCost(item.cost)} · ${item.description}`
        navigator.clipboard?.writeText(text)
          .then(() => onToast('Riepilogo dello strumento copiato.'))
          .catch(() => onToast('Copia non disponibile su questo browser.'))
      }}>Copia riepilogo</button>

      <footer className="app-footer app-footer--items">
        <img src="./assets/capsuledex-mark.svg" alt="" />
        <p>Database strumenti · dati tramite PokéAPI.</p>
      </footer>
    </div>
  )
}

type ItemViewProps = {
  initialItemId?: number | null
  onBack: () => void
  onOpenPokemon: (id: number) => void
  onOpenMove: (moveSlug: string) => void
  onSelectionChange?: (id: number | null) => void
  onToast: (message: string) => void
}

export function ItemView({ initialItemId, onBack, onOpenPokemon, onOpenMove, onSelectionChange, onToast }: ItemViewProps) {
  const [query, setQuery] = useState('')
  const [pocketFilter, setPocketFilter] = useState('all')
  const [familyFilter, setFamilyFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sort, setSort] = useState('id')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [selectedItemId, setSelectedItemId] = useState<number | null>(initialItemId ?? null)
  const [filtersOpen, setFiltersOpen] = useState(false)

  useEffect(() => {
    if (initialItemId) setSelectedItemId(initialItemId)
  }, [initialItemId])

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [query, pocketFilter, familyFilter, categoryFilter, sort])

  const availableCategories = useMemo(() => (
    [...new Set(itemIndex.map((item) => item.category))]
      .sort((a, b) => categoryLabel(a).localeCompare(categoryLabel(b), 'it'))
  ), [])

  const filtered = useMemo(() => {
    const normalizedQuery = normalize(query)
    const numericQuery = Number(query.trim())
    const results = itemIndex.filter((item) => {
      const matchesQuery = !normalizedQuery
        || normalize(item.name).includes(normalizedQuery)
        || normalize(item.englishName).includes(normalizedQuery)
        || item.slug.includes(normalizedQuery)
        || (Number.isInteger(numericQuery) && item.id === numericQuery)
      const matchesPocket = pocketFilter === 'all' || item.pocket === pocketFilter
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter
      return matchesQuery && matchesPocket && matchesCategory && matchesFamily(item, familyFilter)
    })
    return sortItems(results, sort)
  }, [query, pocketFilter, familyFilter, categoryFilter, sort])

  function openItem(id: number) {
    setSelectedItemId(id)
    onSelectionChange?.(id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function closeItem() {
    setSelectedItemId(null)
    onSelectionChange?.(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function clearFilters() {
    setQuery('')
    setPocketFilter('all')
    setFamilyFilter('all')
    setCategoryFilter('all')
    setSort('id')
  }

  if (selectedItemId !== null) {
    return (
      <ItemDetailScreen
        itemId={selectedItemId}
        onBack={closeItem}
        onOpenPokemon={onOpenPokemon}
        onOpenMove={onOpenMove}
        onToast={onToast}
      />
    )
  }

  const activeFilterCount = [pocketFilter !== 'all', categoryFilter !== 'all', familyFilter !== 'all'].filter(Boolean).length

  return (
    <div className="item-view">
      <header className="subpage-header">
        <IconButton label="Torna alla Home" onClick={onBack}><ArrowLeftIcon /></IconButton>
        <div><p className="eyebrow">Fase 10</p><h1>Database strumenti</h1></div>
        <span className="item-count-badge">{itemIndex.length}</span>
      </header>

      <section className="item-intro-card">
        <div><span>🎒</span></div>
        <article><p className="eyebrow">Borsa completa</p><h2>Ogni strumento, sempre con te</h2><p>Consulta Poké Ball, bacche, rimedi, MT, pietre evolutive e strumenti da tenere.</p></article>
      </section>

      <div className="item-search-row">
        <label className="search-bar item-search">
          <SearchIcon />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cerca Pozione, Master Ball o 17..." inputMode="search" />
          {query && <button type="button" onClick={() => setQuery('')} aria-label="Cancella ricerca">×</button>}
        </label>
        <button type="button" className={filtersOpen || activeFilterCount > 0 ? 'item-filter-toggle is-active' : 'item-filter-toggle'} onClick={() => setFiltersOpen((value) => !value)}>
          <span>☷</span>{activeFilterCount > 0 && <b>{activeFilterCount}</b>}
        </button>
      </div>

      <div className="item-family-scroller" aria-label="Filtra per famiglia">
        {familyFilters.map((family) => (
          <button type="button" key={family.id} className={familyFilter === family.id ? 'is-selected' : ''} onClick={() => setFamilyFilter(family.id)}>
            <span>{family.icon}</span>{family.label}
          </button>
        ))}
      </div>

      <div className="item-pocket-scroller" aria-label="Filtra per tasca">
        {pocketFilters.map((pocket) => (
          <button type="button" key={pocket} className={pocketFilter === pocket ? 'is-selected' : ''} onClick={() => setPocketFilter(pocket)}>
            {itemPocketLabels[pocket]}
          </button>
        ))}
      </div>

      {filtersOpen && (
        <section className="item-filter-panel" aria-label="Filtri avanzati">
          <div>
            <label htmlFor="item-category-filter">Categoria</label>
            <select id="item-category-filter" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
              <option value="all">Tutte le categorie</option>
              {availableCategories.map((category) => <option key={category} value={category}>{categoryLabel(category)}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="item-sort">Ordina</label>
            <select id="item-sort" value={sort} onChange={(event) => setSort(event.target.value)}>
              <option value="id">Numero</option>
              <option value="name">Nome</option>
              <option value="cost-high">Prezzo più alto</option>
              <option value="cost-low">Prezzo più basso</option>
              <option value="fling">Potenza Lancio</option>
            </select>
          </div>
          <button type="button" onClick={clearFilters}>Azzera filtri</button>
        </section>
      )}

      <div className="item-results-heading">
        <div><strong>{filtered.length}</strong><span>{filtered.length === 1 ? 'strumento trovato' : 'strumenti trovati'}</span></div>
        <small>{sort === 'id' ? 'Ordine archivio' : sort === 'name' ? 'Ordine alfabetico' : sort === 'fling' ? 'Potenza Lancio' : 'Prezzo'}</small>
      </div>

      {filtered.length > 0 ? (
        <>
          <div className="item-grid">
            {filtered.slice(0, visibleCount).map((item) => <ItemCard key={item.id} item={item} onOpen={() => openItem(item.id)} />)}
          </div>
          {visibleCount < filtered.length && (
            <button type="button" className="load-more-button" onClick={() => setVisibleCount((value) => value + PAGE_SIZE)}>
              Carica altri {Math.min(PAGE_SIZE, filtered.length - visibleCount)} strumenti
            </button>
          )}
        </>
      ) : (
        <div className="empty-state item-empty-state">
          <span>🎒</span><strong>Nessuno strumento trovato</strong><p>Prova un altro nome oppure azzera i filtri.</p><button type="button" onClick={clearFilters}>Azzera filtri</button>
        </div>
      )}

      <footer className="app-footer app-footer--items">
        <img src="./assets/capsuledex-mark.svg" alt="" />
        <p>{itemIndex.length} strumenti indicizzati · dettagli tramite PokéAPI.</p>
      </footer>
    </div>
  )
}
