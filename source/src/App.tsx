import { FormEvent, Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AppHeader } from './components/AppHeader'
import { BottomNav } from './components/BottomNav'
import { FeatureCard } from './components/FeatureCard'
import { SearchIcon } from './components/Icon'
import { SettingsPanel } from './components/SettingsPanel'
import { Toast } from './components/Toast'
import { features, regions } from './data/features'
import { loadCollection, saveCollection } from './services/collectionStorage'
import { loadFavorites, saveFavorites } from './services/favoriteStorage'
import { createTeamId, loadActiveTeamId, loadTeams, saveActiveTeamId, saveTeams } from './services/teamStorage'
import { activateWaitingServiceWorker } from './services/offline'
import { applyPreferences, loadPreferences, savePreferences } from './services/preferences'
import type { AppPreferences } from './services/preferences'
import type { CollectionEntry, CollectionTrait, FavoriteEntry, Feature, PokemonTeam } from './types'

const PokedexView = lazy(() => import('./components/PokedexView').then((module) => ({ default: module.PokedexView })))
const PokemonDetailView = lazy(() => import('./components/PokemonDetailView').then((module) => ({ default: module.PokemonDetailView })))
const TeamView = lazy(() => import('./components/TeamView').then((module) => ({ default: module.TeamView })))
const FavoritesView = lazy(() => import('./components/FavoritesView').then((module) => ({ default: module.FavoritesView })))
const CollectionView = lazy(() => import('./components/CollectionView').then((module) => ({ default: module.CollectionView })))
const TypeCalculatorView = lazy(() => import('./components/TypeCalculatorView').then((module) => ({ default: module.TypeCalculatorView })))
const BattleView = lazy(() => import('./components/BattleView').then((module) => ({ default: module.BattleView })))
const MoveView = lazy(() => import('./components/MoveView').then((module) => ({ default: module.MoveView })))
const ItemView = lazy(() => import('./components/ItemView').then((module) => ({ default: module.ItemView })))
const AbilityView = lazy(() => import('./components/AbilityView').then((module) => ({ default: module.AbilityView })))
const EvolutionView = lazy(() => import('./components/EvolutionView').then((module) => ({ default: module.EvolutionView })))
const OfflineView = lazy(() => import('./components/OfflineView').then((module) => ({ default: module.OfflineView })))
const EncounterView = lazy(() => import('./components/EncounterView').then((module) => ({ default: module.EncounterView })))
const GymLeaderView = lazy(() => import('./components/GymLeaderView').then((module) => ({ default: module.GymLeaderView })))

function AppLoading() {
  return (
    <div className="app-loading" role="status" aria-live="polite">
      <img src="./assets/capsuledex-mark.svg" alt="" />
      <span>Caricamento sezione…</span>
    </div>
  )
}

const phaseLabels: Record<number, string> = {
  14: 'Rifinitura finale',
  15: 'Luoghi e Capipalestra',
}

type Screen = 'home' | 'pokedex' | 'detail' | 'team' | 'favorites' | 'collection' | 'types' | 'battle' | 'moves' | 'items' | 'abilities' | 'evolutions' | 'offline' | 'encounters' | 'gyms'
type DetailReturnScreen = Exclude<Screen, 'detail'>

function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [detailReturnScreen, setDetailReturnScreen] = useState<DetailReturnScreen>('pokedex')
  const [homeRegion, setHomeRegion] = useState('all')
  const [query, setQuery] = useState('')
  const [pokedexQuery, setPokedexQuery] = useState('')
  const [pokedexRegion, setPokedexRegion] = useState('all')
  const [selectedPokemonId, setSelectedPokemonId] = useState(6)
  const [typeCalculatorPokemonId, setTypeCalculatorPokemonId] = useState<number | null>(null)
  const [battlePokemonId, setBattlePokemonId] = useState<number | null>(null)
  const [selectedMoveId, setSelectedMoveId] = useState<number | null>(null)
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null)
  const [selectedAbilityId, setSelectedAbilityId] = useState<number | null>(null)
  const [selectedEvolutionPokemonId, setSelectedEvolutionPokemonId] = useState<number | null>(null)
  const [selectedEncounterPokemonId, setSelectedEncounterPokemonId] = useState<number | null>(null)
  const [activeNav, setActiveNav] = useState('home')
  const [toast, setToast] = useState('')
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [preferences, setPreferences] = useState<AppPreferences>(() => loadPreferences())
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [updateReady, setUpdateReady] = useState(false)
  const toastTimer = useRef<number | null>(null)

  const [collection, setCollection] = useState<CollectionEntry[]>(() => loadCollection())
  const [favorites, setFavorites] = useState<FavoriteEntry[]>(() => loadFavorites())
  const [teams, setTeams] = useState<PokemonTeam[]>(() => loadTeams())
  const [activeTeamId, setActiveTeamId] = useState(() => loadActiveTeamId(loadTeams()))

  useEffect(() => saveCollection(collection), [collection])
  useEffect(() => saveFavorites(favorites), [favorites])
  useEffect(() => saveTeams(teams), [teams])
  useEffect(() => saveActiveTeamId(activeTeamId), [activeTeamId])

  useEffect(() => {
    savePreferences(preferences)
    applyPreferences(preferences)

    if (preferences.theme !== 'system') return undefined
    const media = window.matchMedia('(prefers-color-scheme: light)')
    const updateSystemTheme = () => applyPreferences(preferences)
    media.addEventListener('change', updateSystemTheme)
    return () => media.removeEventListener('change', updateSystemTheme)
  }, [preferences])

  const collectionMap = useMemo(() => new Map(collection.map((entry) => [entry.pokemonId, entry])), [collection])
  const collectionIds = useMemo(() => new Set(collection.map((entry) => entry.pokemonId)), [collection])
  const favoriteIds = useMemo(() => new Set(favorites.map((favorite) => favorite.pokemonId)), [favorites])

  const activeTeam = useMemo(
    () => teams.find((team) => team.id === activeTeamId) ?? teams[0],
    [teams, activeTeamId],
  )

  const personalPokemonIds = useMemo(() => [...new Set([
    ...favorites.map((entry) => entry.pokemonId),
    ...collection.map((entry) => entry.pokemonId),
    ...teams.flatMap((team) => team.pokemonIds),
  ])], [favorites, collection, teams])

  const showToast = useCallback((message: string) => {
    setToast(message)
    if (toastTimer.current) window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(''), 2800)
  }, [])

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      showToast('Connessione ripristinata.')
    }
    const handleOffline = () => {
      setIsOnline(false)
      showToast('Modalità offline attiva: userò i dati già salvati.')
    }
    const handleUpdate = () => {
      setUpdateReady(true)
      showToast('È disponibile un aggiornamento di CapsuleDex.')
    }
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('capsuledex:update-ready', handleUpdate)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('capsuledex:update-ready', handleUpdate)
    }
  }, [showToast])


  function goToTop() {
    window.scrollTo({ top: 0, behavior: preferences.reduceMotion ? 'auto' : 'smooth' })
  }

  async function applyUpdate() {
    let reloaded = false
    const reload = () => {
      if (reloaded) return
      reloaded = true
      window.location.reload()
    }
    navigator.serviceWorker?.addEventListener('controllerchange', reload, { once: true })
    const activated = await activateWaitingServiceWorker()
    if (!activated) reload()
  }

  function openPokedex(search = '', region = 'all') {
    setPokedexQuery(search)
    setPokedexRegion(region)
    setActiveNav('home')
    setScreen('pokedex')
    goToTop()
  }

  function openTeam() {
    setActiveNav('team')
    setScreen('team')
    goToTop()
  }

  function openFavorites() {
    setActiveNav('favorites')
    setScreen('favorites')
    goToTop()
  }

  function openCollection() {
    setActiveNav('collection')
    setScreen('collection')
    goToTop()
  }

  function openTypeCalculator(pokemonId: number | null = null) {
    setTypeCalculatorPokemonId(pokemonId)
    setActiveNav('types')
    setScreen('types')
    goToTop()
  }

  async function openItems(itemKey: number | string | null = null) {
    const itemId = typeof itemKey === 'string'
      ? (await import('./data/itemIndex')).itemBySlug.get(itemKey)?.id ?? null
      : itemKey
    setSelectedItemId(itemId)
    setActiveNav('home')
    setScreen('items')
    goToTop()
  }

  async function openMoves(moveKey: number | string | null = null) {
    const moveId = typeof moveKey === 'string'
      ? (await import('./data/moveIndex')).moveBySlug.get(moveKey)?.id ?? null
      : moveKey
    setSelectedMoveId(moveId)
    setActiveNav('home')
    setScreen('moves')
    goToTop()
  }

  function openBattle(pokemonId: number | null = null) {
    setBattlePokemonId(pokemonId)
    setActiveNav('home')
    setScreen('battle')
    goToTop()
  }

  async function openAbilities(abilityKey: number | string | null = null) {
    const abilityId = typeof abilityKey === 'string'
      ? (await import('./data/abilityIndex')).abilityBySlug.get(abilityKey)?.id ?? null
      : abilityKey
    setSelectedAbilityId(abilityId)
    setActiveNav('home')
    setScreen('abilities')
    goToTop()
  }

  function openEvolutions(pokemonId: number | null = null) {
    setSelectedEvolutionPokemonId(pokemonId)
    setActiveNav('home')
    setScreen('evolutions')
    goToTop()
  }

  function openOffline() {
    setActiveNav('home')
    setScreen('offline')
    goToTop()
  }

  function openEncounters(pokemonId: number | null = null) {
    setSelectedEncounterPokemonId(pokemonId)
    setActiveNav('home')
    setScreen('encounters')
    goToTop()
  }

  function openGyms() {
    setActiveNav('home')
    setScreen('gyms')
    goToTop()
  }

  function openPokemon(id: number, returnScreen?: DetailReturnScreen) {
    setSelectedPokemonId(id)
    if (returnScreen) setDetailReturnScreen(returnScreen)
    else if (screen !== 'detail') setDetailReturnScreen(screen)
    setScreen('detail')
    goToTop()
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    openPokedex(query.trim(), homeRegion)
  }

  function openFeature(feature: Feature) {
    if (feature.id === 'pokemon') {
      openPokedex('', homeRegion)
      return
    }
    if (feature.id === 'team') {
      openTeam()
      return
    }
    if (feature.id === 'favorites') {
      openFavorites()
      return
    }
    if (feature.id === 'collection') {
      openCollection()
      return
    }
    if (feature.id === 'types') {
      openTypeCalculator()
      return
    }
    if (feature.id === 'battle') {
      openBattle()
      return
    }
    if (feature.id === 'moves') {
      openMoves()
      return
    }
    if (feature.id === 'items') {
      openItems()
      return
    }
    if (feature.id === 'abilities') {
      openAbilities()
      return
    }
    if (feature.id === 'evolutions') {
      openEvolutions()
      return
    }
    if (feature.id === 'locations') {
      openEncounters()
      return
    }
    if (feature.id === 'gyms') {
      openGyms()
      return
    }
    if (feature.id === 'offline') {
      openOffline()
      return
    }
    const label = phaseLabels[feature.phase] ?? feature.title
    showToast(`${label}: prevista nella Fase ${feature.phase}.`)
  }

  function selectNav(id: string, label: string) {
    if (id === 'home') {
      setActiveNav(id)
      setScreen('home')
      goToTop()
      return
    }
    if (id === 'team') {
      openTeam()
      return
    }
    if (id === 'favorites') {
      openFavorites()
      return
    }
    if (id === 'collection') {
      openCollection()
      return
    }
    if (id === 'types') {
      openTypeCalculator()
      return
    }
    showToast(`${label} sarà attivato in una fase successiva.`)
  }

  function addPokemonToCollection(pokemonId: number, pokemonName?: string) {
    if (collectionMap.has(pokemonId)) {
      showToast(`${pokemonName ?? 'Pokémon'} è già nella collezione.`)
      return
    }
    const now = Date.now()
    setCollection((current) => [
      { pokemonId, traits: [], addedAt: now, updatedAt: now },
      ...current.filter((entry) => entry.pokemonId !== pokemonId),
    ])
    showToast(`${pokemonName ?? 'Pokémon'} segnato come catturato.`)
  }

  function removePokemonFromCollection(pokemonId: number, pokemonName?: string) {
    setCollection((current) => current.filter((entry) => entry.pokemonId !== pokemonId))
    showToast(`${pokemonName ?? 'Pokémon'} rimosso dalla collezione.`)
  }

  function toggleCollectionTrait(pokemonId: number, trait: CollectionTrait, pokemonName?: string) {
    const currentEntry = collectionMap.get(pokemonId)
    if (!currentEntry) {
      const now = Date.now()
      setCollection((current) => [{ pokemonId, traits: [trait], addedAt: now, updatedAt: now }, ...current])
      showToast(`${pokemonName ?? 'Pokémon'} aggiunto alla collezione.`)
      return
    }

    const hasTrait = currentEntry.traits.includes(trait)
    setCollection((current) => current.map((entry) => {
      if (entry.pokemonId !== pokemonId) return entry
      return {
        ...entry,
        traits: hasTrait ? entry.traits.filter((value) => value !== trait) : [...entry.traits, trait],
        updatedAt: Date.now(),
      }
    }))
    const labels: Record<CollectionTrait, string> = {
      shiny: 'Shiny',
      alpha: 'Alpha',
      gigantamax: 'Gigamax',
      paradox: 'Paradox',
      legendary: 'Leggendario',
    }
    showToast(`${labels[trait]} ${hasTrait ? 'rimosso da' : 'aggiunto a'} ${pokemonName ?? 'questo Pokémon'}.`)
  }

  function clearCollection() {
    if (collection.length === 0) return
    const confirmed = window.confirm(`Rimuovere tutti i ${collection.length} Pokémon dalla collezione?`)
    if (!confirmed) return
    setCollection([])
    showToast('Collezione svuotata.')
  }

  function toggleFavorite(pokemonId: number, pokemonName?: string) {
    const exists = favoriteIds.has(pokemonId)
    if (exists) {
      setFavorites((current) => current.filter((favorite) => favorite.pokemonId !== pokemonId))
      showToast(`${pokemonName ?? 'Pokémon'} rimosso dai preferiti.`)
      return
    }

    setFavorites((current) => [
      { pokemonId, addedAt: Date.now() },
      ...current.filter((favorite) => favorite.pokemonId !== pokemonId),
    ])
    showToast(`${pokemonName ?? 'Pokémon'} aggiunto ai preferiti.`)
  }

  function clearFavorites() {
    if (favorites.length === 0) return
    const confirmed = window.confirm(`Rimuovere tutti i ${favorites.length} Pokémon dai preferiti?`)
    if (!confirmed) return
    setFavorites([])
    showToast('Lista dei preferiti svuotata.')
  }

  function createTeam(name: string) {
    const team: PokemonTeam = {
      id: createTeamId(),
      name: name.trim().slice(0, 30) || `Squadra ${teams.length + 1}`,
      pokemonIds: [],
      createdAt: Date.now(),
    }
    setTeams((current) => [...current, team])
    setActiveTeamId(team.id)
    showToast(`“${team.name}” creata.`)
  }

  function renameTeam(teamId: string, name: string) {
    const cleanName = name.trim().slice(0, 30)
    if (!cleanName) return
    setTeams((current) => current.map((team) => team.id === teamId ? { ...team, name: cleanName } : team))
    showToast('Nome della squadra aggiornato.')
  }

  function deleteTeam(teamId: string) {
    const remaining = teams.filter((team) => team.id !== teamId)
    if (remaining.length > 0) {
      setTeams(remaining)
      setActiveTeamId(remaining[0].id)
    } else {
      const replacement: PokemonTeam = {
        id: createTeamId(),
        name: 'Nuova Squadra',
        pokemonIds: [],
        createdAt: Date.now(),
      }
      setTeams([replacement])
      setActiveTeamId(replacement.id)
    }
    showToast('Squadra eliminata.')
  }

  function addPokemonToTeam(pokemonId: number) {
    if (!activeTeam) return
    if (activeTeam.pokemonIds.includes(pokemonId)) {
      showToast('Questo Pokémon è già nella squadra attiva.')
      return
    }
    if (activeTeam.pokemonIds.length >= 6) {
      showToast('La squadra è completa: rimuovi un Pokémon prima di aggiungerne un altro.')
      return
    }
    setTeams((current) => current.map((team) => (
      team.id === activeTeam.id ? { ...team, pokemonIds: [...team.pokemonIds, pokemonId] } : team
    )))
    showToast('Pokémon aggiunto alla squadra.')
  }

  function removePokemonFromTeam(pokemonId: number) {
    if (!activeTeam) return
    setTeams((current) => current.map((team) => (
      team.id === activeTeam.id ? { ...team, pokemonIds: team.pokemonIds.filter((id) => id !== pokemonId) } : team
    )))
    showToast('Pokémon rimosso dalla squadra.')
  }

  const selectedHomeRegion = regions.find((region) => region.id === homeRegion) ?? regions[0]

  return (
    <div className="page-shell">
      <a className="skip-link" href="#main-content">Vai al contenuto</a>
      <main id="main-content" className={`app-frame app-frame--${screen}`}>
        <div className="ambient ambient--one" />
        <div className="ambient ambient--two" />

        <div className="content screen-enter" key={screen}>
          {updateReady && (
            <div className="update-banner" role="status">
              <span>✦</span>
              <div><strong>Aggiornamento pronto</strong><small>Installa la versione più recente senza perdere i salvataggi.</small></div>
              <button type="button" onClick={applyUpdate}>Aggiorna</button>
            </div>
          )}
          {!isOnline && screen !== 'offline' && (
            <button type="button" className="global-offline-banner" onClick={openOffline}>
              <span>⌁</span> Modalità offline attiva · Apri gestione offline
            </button>
          )}
          <Suspense fallback={<AppLoading />}>
          {screen === 'home' && (
            <>
              <AppHeader
                onNotify={() => showToast('Nessuna nuova notifica.')}
                onOpenSettings={() => setSettingsOpen(true)}
              />

              <form className="search-bar" onSubmit={handleSearch}>
                <SearchIcon />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Cerca un Pokémon per nome o numero..."
                  aria-label="Cerca un Pokémon in CapsuleDex"
                  inputMode="search"
                />
                {query && (
                  <button type="button" onClick={() => setQuery('')} aria-label="Cancella ricerca">×</button>
                )}
              </form>

              <div className="region-scroller" aria-label="Scegli la regione del Pokédex">
                {regions.map((region) => (
                  <button
                    type="button"
                    key={region.id}
                    className={homeRegion === region.id ? 'is-selected' : ''}
                    onClick={() => setHomeRegion(region.id)}
                  >
                    {region.label}
                  </button>
                ))}
              </div>

              <button className="hero-card" type="button" onClick={() => openPokedex(query.trim(), homeRegion)}>
                <span className="hero-grid" aria-hidden="true" />
                <span className="hero-copy">
                  <span className="hero-kicker">Pokédex nazionale</span>
                  <strong>Scopri ogni Pokémon</strong>
                  <span>Schede, statistiche ed evoluzioni</span>
                  <span className="hero-action">Apri Pokédex <b>→</b></span>
                </span>
                <span className="capsule-orb" aria-hidden="true"><i /></span>
              </button>

              <section aria-labelledby="explore-title">
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">
                      {homeRegion === 'all' ? 'Tutto il mondo Pokémon' : `Regione di ${selectedHomeRegion.label}`}
                    </p>
                    <h2 id="explore-title">Esplora CapsuleDex</h2>
                  </div>
                  <span className="progress-chip progress-chip--complete">15 / 15</span>
                </div>

                <div className="feature-grid">
                  {features.map((feature) => (
                    <FeatureCard key={feature.id} feature={feature} onOpen={openFeature} />
                  ))}
                </div>
              </section>

              <section className="highlight-section" aria-labelledby="highlight-title">
                <div className="section-heading section-heading--compact">
                  <h2 id="highlight-title">In evidenza</h2>
                  <button type="button" onClick={() => showToast('La roadmap è inclusa nel file ROADMAP.md.')}>Roadmap</button>
                </div>
                <article className="highlight-card highlight-card--release">
                  <div className="highlight-badge">AGGIORNAMENTO 1.1</div>
                  <div>
                    <p>Roadmap completata</p>
                    <h3>Luoghi e Capipalestra</h3>
                    <span>Scopri dove incontrare i Pokémon e consulta le squadre dei Capipalestra per ogni gioco supportato.</span>
                  </div>
                  <div className="completion-ring completion-ring--complete" aria-label="Roadmap completata">
                    <strong>15/15</strong>
                  </div>
                </article>
              </section>

              <footer className="app-footer">
                <img src="./assets/capsuledex-mark.svg" alt="" />
                <p>CapsuleDex 1.1 · Dati PokéAPI · progetto fan-made non ufficiale.</p>
              </footer>
            </>
          )}

          {screen === 'pokedex' && (
            <PokedexView
              initialQuery={pokedexQuery}
              initialRegion={pokedexRegion}
              onBack={() => {
                setScreen('home')
                setActiveNav('home')
                goToTop()
              }}
              onOpenPokemon={(id) => openPokemon(id, 'pokedex')}
              onToast={showToast}
              favoriteIds={favoriteIds}
              onToggleFavorite={toggleFavorite}
              collectionIds={collectionIds}
              onAddToCollection={addPokemonToCollection}
            />
          )}

          {screen === 'favorites' && (
            <FavoritesView
              favorites={favorites}
              onBack={() => {
                setScreen('home')
                setActiveNav('home')
                goToTop()
              }}
              onOpenPokedex={() => openPokedex()}
              onOpenPokemon={(id) => openPokemon(id, 'favorites')}
              onToggleFavorite={toggleFavorite}
              onClearFavorites={clearFavorites}
              onToast={showToast}
            />
          )}

          {screen === 'collection' && (
            <CollectionView
              entries={collection}
              onBack={() => {
                setScreen('home')
                setActiveNav('home')
                goToTop()
              }}
              onOpenPokemon={(id) => openPokemon(id, 'collection')}
              onAddPokemon={addPokemonToCollection}
              onRemovePokemon={removePokemonFromCollection}
              onToggleTrait={toggleCollectionTrait}
              onClear={clearCollection}
              onToast={showToast}
            />
          )}

          {screen === 'types' && (
            <TypeCalculatorView
              initialPokemonId={typeCalculatorPokemonId}
              onBack={() => {
                setScreen('home')
                setActiveNav('home')
                goToTop()
              }}
              onOpenPokemon={(id) => openPokemon(id, 'types')}
              onSelectionChange={setTypeCalculatorPokemonId}
              onToast={showToast}
            />
          )}

          {screen === 'moves' && (
            <MoveView
              initialMoveId={selectedMoveId}
              onBack={() => {
                setScreen('home')
                setActiveNav('home')
                goToTop()
              }}
              onOpenPokemon={(id) => openPokemon(id, 'moves')}
              onSelectionChange={setSelectedMoveId}
              onToast={showToast}
            />
          )}

          {screen === 'items' && (
            <ItemView
              initialItemId={selectedItemId}
              onBack={() => {
                setScreen('home')
                setActiveNav('home')
                goToTop()
              }}
              onOpenPokemon={(id) => openPokemon(id, 'items')}
              onOpenMove={(moveSlug) => openMoves(moveSlug)}
              onSelectionChange={setSelectedItemId}
              onToast={showToast}
            />
          )}

          {screen === 'abilities' && (
            <AbilityView
              initialAbilityId={selectedAbilityId}
              onBack={() => {
                setScreen('home')
                setActiveNav('home')
                goToTop()
              }}
              onOpenPokemon={(id) => openPokemon(id, 'abilities')}
              onSelectionChange={setSelectedAbilityId}
              onToast={showToast}
            />
          )}

          {screen === 'evolutions' && (
            <EvolutionView
              initialPokemonId={selectedEvolutionPokemonId}
              onBack={() => {
                setScreen('home')
                setActiveNav('home')
                goToTop()
              }}
              onOpenPokemon={(id) => openPokemon(id, 'evolutions')}
              onOpenItem={(itemSlug) => openItems(itemSlug)}
              onOpenMove={(moveSlug) => openMoves(moveSlug)}
              onSelectionChange={setSelectedEvolutionPokemonId}
              onToast={showToast}
            />
          )}

          {screen === 'encounters' && (
            <EncounterView
              initialPokemonId={selectedEncounterPokemonId}
              onBack={() => {
                setScreen('home')
                setActiveNav('home')
                goToTop()
              }}
              onOpenPokemon={(id) => openPokemon(id, 'encounters')}
              onSelectionChange={setSelectedEncounterPokemonId}
              onToast={showToast}
            />
          )}

          {screen === 'gyms' && (
            <GymLeaderView
              onBack={() => {
                setScreen('home')
                setActiveNav('home')
                goToTop()
              }}
              onOpenPokemon={(id) => openPokemon(id, 'gyms')}
              onToast={showToast}
            />
          )}

          {screen === 'offline' && (
            <OfflineView
              personalPokemonIds={personalPokemonIds}
              onBack={() => {
                setScreen('home')
                setActiveNav('home')
                goToTop()
              }}
              onToast={showToast}
            />
          )}

          {screen === 'battle' && (
            <BattleView
              initialPokemonId={battlePokemonId}
              onBack={() => {
                setScreen('home')
                setActiveNav('home')
                goToTop()
              }}
              onOpenPokemon={(id) => openPokemon(id, 'battle')}
              onToast={showToast}
            />
          )}

          {screen === 'team' && (
            <TeamView
              teams={teams}
              activeTeamId={activeTeam?.id ?? ''}
              onBack={() => {
                setScreen('home')
                setActiveNav('home')
                goToTop()
              }}
              onSelectTeam={setActiveTeamId}
              onCreateTeam={createTeam}
              onRenameTeam={renameTeam}
              onDeleteTeam={deleteTeam}
              onAddPokemon={addPokemonToTeam}
              onRemovePokemon={removePokemonFromTeam}
              onOpenPokemon={(id) => openPokemon(id, 'team')}
              onToast={showToast}
            />
          )}

          {screen === 'detail' && (
            <PokemonDetailView
              pokemonId={selectedPokemonId}
              onBack={() => {
                setScreen(detailReturnScreen)
                setActiveNav(detailReturnScreen === 'team' ? 'team' : detailReturnScreen === 'favorites' ? 'favorites' : detailReturnScreen === 'collection' ? 'collection' : detailReturnScreen === 'types' ? 'types' : 'home')
                goToTop()
              }}
              onOpenPokemon={(id) => openPokemon(id)}
              onToast={showToast}
              isInTeam={Boolean(activeTeam?.pokemonIds.includes(selectedPokemonId))}
              isTeamFull={Boolean(activeTeam && activeTeam.pokemonIds.length >= 6)}
              onAddToTeam={() => addPokemonToTeam(selectedPokemonId)}
              onOpenTeam={openTeam}
              isFavorite={favoriteIds.has(selectedPokemonId)}
              onToggleFavorite={(name) => toggleFavorite(selectedPokemonId, name)}
              collectionEntry={collectionMap.get(selectedPokemonId)}
              onAddToCollection={(name) => addPokemonToCollection(selectedPokemonId, name)}
              onOpenCollection={openCollection}
              onOpenTypeCalculator={() => openTypeCalculator(selectedPokemonId)}
              onOpenBattle={() => openBattle(selectedPokemonId)}
              onOpenMove={(moveSlug) => openMoves(moveSlug)}
              onOpenAbility={(abilitySlug) => openAbilities(abilitySlug)}
              onOpenEvolution={() => openEvolutions(selectedPokemonId)}
              onOpenEncounters={() => openEncounters(selectedPokemonId)}
              onToggleCollectionTrait={(trait, name) => toggleCollectionTrait(selectedPokemonId, trait, name)}
            />
          )}
          </Suspense>
        </div>

        {screen !== 'detail' && <BottomNav active={activeNav} onSelect={selectNav} />}
        <Toast message={toast} visible={Boolean(toast)} />
        <SettingsPanel
          open={settingsOpen}
          preferences={preferences}
          onChange={setPreferences}
          onClose={() => setSettingsOpen(false)}
          onOpenOffline={openOffline}
          onToast={showToast}
        />
      </main>
    </div>
  )
}

export default App
