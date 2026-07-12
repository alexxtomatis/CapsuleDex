import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AbilityView } from './components/AbilityView'
import { AppHeader } from './components/AppHeader'
import { BottomNav } from './components/BottomNav'
import { BattleView } from './components/BattleView'
import { CollectionView } from './components/CollectionView'
import { FavoritesView } from './components/FavoritesView'
import { EvolutionView } from './components/EvolutionView'
import { ItemView } from './components/ItemView'
import { FeatureCard } from './components/FeatureCard'
import { SearchIcon } from './components/Icon'
import { PokedexView } from './components/PokedexView'
import { MoveView } from './components/MoveView'
import { PokemonDetailView } from './components/PokemonDetailView'
import { TeamView } from './components/TeamView'
import { TypeCalculatorView } from './components/TypeCalculatorView'
import { Toast } from './components/Toast'
import { features, regions } from './data/features'
import { abilityBySlug } from './data/abilityIndex'
import { itemBySlug } from './data/itemIndex'
import { moveBySlug } from './data/moveIndex'
import { loadCollection, saveCollection } from './services/collectionStorage'
import { loadFavorites, saveFavorites } from './services/favoriteStorage'
import { createTeamId, loadActiveTeamId, loadTeams, saveActiveTeamId, saveTeams } from './services/teamStorage'
import type { CollectionEntry, CollectionTrait, FavoriteEntry, Feature, PokemonTeam } from './types'

const phaseLabels: Record<number, string> = {
  6: 'Collezione personale',
  9: 'Database mosse',
}

type Screen = 'home' | 'pokedex' | 'detail' | 'team' | 'favorites' | 'collection' | 'types' | 'battle' | 'moves' | 'items' | 'abilities' | 'evolutions'
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
  const [activeNav, setActiveNav] = useState('home')
  const [toast, setToast] = useState('')
  const toastTimer = useRef<number | null>(null)

  const [collection, setCollection] = useState<CollectionEntry[]>(() => loadCollection())
  const [favorites, setFavorites] = useState<FavoriteEntry[]>(() => loadFavorites())
  const [teams, setTeams] = useState<PokemonTeam[]>(() => loadTeams())
  const [activeTeamId, setActiveTeamId] = useState(() => loadActiveTeamId(loadTeams()))

  useEffect(() => saveCollection(collection), [collection])
  useEffect(() => saveFavorites(favorites), [favorites])
  useEffect(() => saveTeams(teams), [teams])
  useEffect(() => saveActiveTeamId(activeTeamId), [activeTeamId])

  const collectionMap = useMemo(() => new Map(collection.map((entry) => [entry.pokemonId, entry])), [collection])
  const collectionIds = useMemo(() => new Set(collection.map((entry) => entry.pokemonId)), [collection])
  const favoriteIds = useMemo(() => new Set(favorites.map((favorite) => favorite.pokemonId)), [favorites])

  const activeTeam = useMemo(
    () => teams.find((team) => team.id === activeTeamId) ?? teams[0],
    [teams, activeTeamId],
  )

  const showToast = useCallback((message: string) => {
    setToast(message)
    if (toastTimer.current) window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(''), 2800)
  }, [])

  function goToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
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

  function openItems(itemKey: number | string | null = null) {
    const itemId = typeof itemKey === 'string' ? itemBySlug.get(itemKey)?.id ?? null : itemKey
    setSelectedItemId(itemId)
    setActiveNav('home')
    setScreen('items')
    goToTop()
  }

  function openMoves(moveKey: number | string | null = null) {
    const moveId = typeof moveKey === 'string' ? moveBySlug.get(moveKey)?.id ?? null : moveKey
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

  function openAbilities(abilityKey: number | string | null = null) {
    const abilityId = typeof abilityKey === 'string' ? abilityBySlug.get(abilityKey)?.id ?? null : abilityKey
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
      <main className={`app-frame app-frame--${screen}`}>
        <div className="ambient ambient--one" />
        <div className="ambient ambient--two" />

        <div className="content">
          {screen === 'home' && (
            <>
              <AppHeader onNotify={() => showToast('Nessuna nuova notifica.')} />

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
                  <span className="progress-chip">12 / 14</span>
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
                <article className="highlight-card highlight-card--evolutions">
                  <div className="highlight-badge">FASE 12</div>
                  <div>
                    <p>Nuova funzione disponibile</p>
                    <h3>Evoluzioni avanzate</h3>
                    <span>Esplora alberi completi, ramificazioni e requisiti come pietre, scambi, felicità, orari e meteo.</span>
                  </div>
                  <div className="completion-ring completion-ring--phase-twelve" aria-label="Fase 11 completata">
                    <strong>12/14</strong>
                  </div>
                </article>
              </section>

              <footer className="app-footer">
                <img src="./assets/capsuledex-mark.svg" alt="" />
                <p>Dati PokéAPI · progetto fan-made non ufficiale.</p>
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
              onToggleCollectionTrait={(trait, name) => toggleCollectionTrait(selectedPokemonId, trait, name)}
            />
          )}
        </div>

        {screen !== 'detail' && <BottomNav active={activeNav} onSelect={selectNav} />}
        <Toast message={toast} visible={Boolean(toast)} />
      </main>
    </div>
  )
}

export default App
