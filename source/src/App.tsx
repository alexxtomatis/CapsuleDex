import { FormEvent, useCallback, useRef, useState } from 'react'
import { AppHeader } from './components/AppHeader'
import { BottomNav } from './components/BottomNav'
import { FeatureCard } from './components/FeatureCard'
import { SearchIcon } from './components/Icon'
import { PokedexView } from './components/PokedexView'
import { PokemonDetailView } from './components/PokemonDetailView'
import { Toast } from './components/Toast'
import { features, regions } from './data/features'
import type { Feature } from './types'

const phaseLabels: Record<number, string> = {
  4: 'Team Builder',
  6: 'Collezione e zone',
  9: 'Database mosse',
  10: 'Database strumenti',
  11: 'Database abilità',
}

type Screen = 'home' | 'pokedex' | 'detail'

function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [homeRegion, setHomeRegion] = useState('all')
  const [query, setQuery] = useState('')
  const [pokedexQuery, setPokedexQuery] = useState('')
  const [pokedexRegion, setPokedexRegion] = useState('all')
  const [selectedPokemonId, setSelectedPokemonId] = useState(6)
  const [activeNav, setActiveNav] = useState('home')
  const [toast, setToast] = useState('')
  const toastTimer = useRef<number | null>(null)

  const showToast = useCallback((message: string) => {
    setToast(message)
    if (toastTimer.current) window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(''), 2800)
  }, [])

  function openPokedex(search = '', region = 'all') {
    setPokedexQuery(search)
    setPokedexRegion(region)
    setScreen('pokedex')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function openPokemon(id: number) {
    setSelectedPokemonId(id)
    setScreen('detail')
    window.scrollTo({ top: 0, behavior: 'smooth' })
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
    const label = phaseLabels[feature.phase] ?? feature.title
    showToast(`${label}: prevista nella Fase ${feature.phase}.`)
  }

  function selectNav(id: string, label: string) {
    if (id === 'home') {
      setActiveNav(id)
      setScreen('home')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    showToast(`${label} sarà attivato in una fase successiva.`)
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
                  <span className="progress-chip">3 / 14</span>
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
                <article className="highlight-card">
                  <div className="highlight-badge">FASE 3</div>
                  <div>
                    <p>Nuova funzione disponibile</p>
                    <h3>Schede Pokémon complete</h3>
                    <span>Apri un Pokémon per vedere descrizione, abilità, statistiche, shiny, varianti e catena evolutiva.</span>
                  </div>
                  <div className="completion-ring completion-ring--phase-three" aria-label="Fase 3 completata">
                    <strong>3/14</strong>
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
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              onOpenPokemon={openPokemon}
              onToast={showToast}
            />
          )}

          {screen === 'detail' && (
            <PokemonDetailView
              pokemonId={selectedPokemonId}
              onBack={() => {
                setScreen('pokedex')
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              onOpenPokemon={openPokemon}
              onToast={showToast}
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
