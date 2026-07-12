import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AppHeader } from './components/AppHeader'
import { BottomNav } from './components/BottomNav'
import { FavoritesView } from './components/FavoritesView'
import { FeatureCard } from './components/FeatureCard'
import { SearchIcon } from './components/Icon'
import { PokedexView } from './components/PokedexView'
import { PokemonDetailView } from './components/PokemonDetailView'
import { TeamView } from './components/TeamView'
import { Toast } from './components/Toast'
import { features, regions } from './data/features'
import { loadFavorites, saveFavorites } from './services/favoriteStorage'
import { createTeamId, loadActiveTeamId, loadTeams, saveActiveTeamId, saveTeams } from './services/teamStorage'
import type { FavoriteEntry, Feature, PokemonTeam } from './types'

const phaseLabels: Record<number, string> = {
  6: 'Collezione e zone',
  9: 'Database mosse',
  10: 'Database strumenti',
  11: 'Database abilità',
}

type Screen = 'home' | 'pokedex' | 'detail' | 'team' | 'favorites'
type DetailReturnScreen = Exclude<Screen, 'detail'>

function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [detailReturnScreen, setDetailReturnScreen] = useState<DetailReturnScreen>('pokedex')
  const [homeRegion, setHomeRegion] = useState('all')
  const [query, setQuery] = useState('')
  const [pokedexQuery, setPokedexQuery] = useState('')
  const [pokedexRegion, setPokedexRegion] = useState('all')
  const [selectedPokemonId, setSelectedPokemonId] = useState(6)
  const [activeNav, setActiveNav] = useState('home')
  const [toast, setToast] = useState('')
  const toastTimer = useRef<number | null>(null)

  const [favorites, setFavorites] = useState<FavoriteEntry[]>(() => loadFavorites())
  const [teams, setTeams] = useState<PokemonTeam[]>(() => loadTeams())
  const [activeTeamId, setActiveTeamId] = useState(() => loadActiveTeamId(loadTeams()))

  useEffect(() => saveFavorites(favorites), [favorites])
  useEffect(() => saveTeams(teams), [teams])
  useEffect(() => saveActiveTeamId(activeTeamId), [activeTeamId])

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
    showToast(`${label} sarà attivato in una fase successiva.`)
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
                  <span className="progress-chip">5 / 14</span>
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
                <article className="highlight-card highlight-card--favorites">
                  <div className="highlight-badge">FASE 5</div>
                  <div>
                    <p>Nuova funzione disponibile</p>
                    <h3>Preferiti</h3>
                    <span>Salva i Pokémon che ami, cercali e ordinali nella tua raccolta personale.</span>
                  </div>
                  <div className="completion-ring completion-ring--phase-five" aria-label="Fase 5 completata">
                    <strong>5/14</strong>
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
                setActiveNav(detailReturnScreen === 'team' ? 'team' : detailReturnScreen === 'favorites' ? 'favorites' : 'home')
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
