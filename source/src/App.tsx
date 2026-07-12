import { FormEvent, useCallback, useRef, useState } from 'react'
import { AppHeader } from './components/AppHeader'
import { BottomNav } from './components/BottomNav'
import { FeatureCard } from './components/FeatureCard'
import { SearchIcon } from './components/Icon'
import { PokedexView } from './components/PokedexView'
import { Toast } from './components/Toast'
import { features, regions } from './data/features'
import type { Feature } from './types'

const phaseLabels: Record<number, string> = {
  3: 'Scheda Pokémon',
  4: 'Team Builder',
  6: 'Collezione e zone',
  9: 'Database mosse',
  10: 'Database strumenti',
  11: 'Database abilità',
}

type Screen = 'home' | 'pokedex'

function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [homeRegion, setHomeRegion] = useState('all')
  const [query, setQuery] = useState('')
  const [pokedexQuery, setPokedexQuery] = useState('')
  const [pokedexRegion, setPokedexRegion] = useState('all')
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
      <main className={`app-frame${screen === 'pokedex' ? ' app-frame--pokedex' : ''}`}>
        <div className="ambient ambient--one" />
        <div className="ambient ambient--two" />

        <div className="content">
          {screen === 'home' ? (
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
                  <span>Ricerca, regioni, tipi e artwork</span>
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
                  <span className="progress-chip">2 / 14</span>
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
                  <div className="highlight-badge">FASE 2</div>
                  <div>
                    <p>Nuova funzione disponibile</p>
                    <h3>Il Pokédex è online</h3>
                    <span>Cerca per nome o numero, filtra per regione e tipo, poi carica progressivamente l’elenco.</span>
                  </div>
                  <div className="completion-ring completion-ring--phase-two" aria-label="Fase 2 completata">
                    <strong>2/14</strong>
                  </div>
                </article>
              </section>

              <footer className="app-footer">
                <img src="./assets/capsuledex-mark.svg" alt="" />
                <p>Dati PokéAPI · progetto fan-made non ufficiale.</p>
              </footer>
            </>
          ) : (
            <PokedexView
              initialQuery={pokedexQuery}
              initialRegion={pokedexRegion}
              onBack={() => {
                setScreen('home')
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              onToast={showToast}
            />
          )}
        </div>

        <BottomNav active={activeNav} onSelect={selectNav} />
        <Toast message={toast} visible={Boolean(toast)} />
      </main>
    </div>
  )
}

export default App
