import { FormEvent, useMemo, useRef, useState } from 'react'
import { AppHeader } from './components/AppHeader'
import { BottomNav } from './components/BottomNav'
import { FeatureCard } from './components/FeatureCard'
import { SearchIcon } from './components/Icon'
import { Toast } from './components/Toast'
import { features, regions } from './data/features'
import type { Feature } from './types'

const phaseLabels: Record<number, string> = {
  2: 'Pokédex e ricerca',
  3: 'Scheda Pokémon',
  4: 'Team Builder',
  6: 'Collezione e zone',
  9: 'Database mosse',
  10: 'Database strumenti',
  11: 'Database abilità',
}

function App() {
  const [region, setRegion] = useState('Tutti')
  const [query, setQuery] = useState('')
  const [activeNav, setActiveNav] = useState('home')
  const [toast, setToast] = useState('')
  const toastTimer = useRef<number | null>(null)

  const filteredFeatures = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return features
    return features.filter((feature) =>
      `${feature.title} ${feature.subtitle}`.toLowerCase().includes(normalized),
    )
  }, [query])

  function showToast(message: string) {
    setToast(message)
    if (toastTimer.current) window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(''), 2800)
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!query.trim()) {
      showToast('Scrivi il nome di un Pokémon o di una sezione.')
      return
    }
    showToast('La ricerca completa arriverà nella Fase 2.')
  }

  function openFeature(feature: Feature) {
    const label = phaseLabels[feature.phase] ?? feature.title
    showToast(`${label}: prevista nella Fase ${feature.phase}.`)
  }

  function selectNav(id: string, label: string) {
    if (id === 'home') {
      setActiveNav(id)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    showToast(`${label} sarà attivato in una fase successiva.`)
  }

  return (
    <div className="page-shell">
      <main className="app-frame">
        <div className="ambient ambient--one" />
        <div className="ambient ambient--two" />

        <div className="content">
          <AppHeader onNotify={() => showToast('Nessuna nuova notifica.')} />

          <form className="search-bar" onSubmit={handleSearch}>
            <SearchIcon />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cerca Pokémon, mosse, strumenti..."
              aria-label="Cerca in CapsuleDex"
            />
            {query && (
              <button type="button" onClick={() => setQuery('')} aria-label="Cancella ricerca">×</button>
            )}
          </form>

          <div className="region-scroller" aria-label="Filtra per regione">
            {regions.map((item) => (
              <button
                type="button"
                key={item}
                className={region === item ? 'is-selected' : ''}
                onClick={() => {
                  setRegion(item)
                  showToast(item === 'Tutti' ? 'Mostro tutte le regioni.' : `Regione selezionata: ${item}.`)
                }}
              >
                {item}
              </button>
            ))}
          </div>

          <button className="hero-card" type="button" onClick={() => showToast('Il Pokédex completo arriverà nella Fase 2.')}>
            <span className="hero-grid" aria-hidden="true" />
            <span className="hero-copy">
              <span className="hero-kicker">Pokédex nazionale</span>
              <strong>Scopri ogni Pokémon</strong>
              <span>1025 specie · tutte le regioni</span>
              <span className="hero-action">Apri anteprima <b>→</b></span>
            </span>
            <span className="capsule-orb" aria-hidden="true">
              <i />
            </span>
          </button>

          <section aria-labelledby="explore-title">
            <div className="section-heading">
              <div>
                <p className="eyebrow">{region === 'Tutti' ? 'Tutto il mondo Pokémon' : `Regione di ${region}`}</p>
                <h2 id="explore-title">Esplora CapsuleDex</h2>
              </div>
              <span className="progress-chip">1 / 14</span>
            </div>

            <div className="feature-grid">
              {filteredFeatures.map((feature) => (
                <FeatureCard key={feature.id} feature={feature} onOpen={openFeature} />
              ))}
            </div>

            {filteredFeatures.length === 0 && (
              <div className="empty-state">
                <span>⌕</span>
                <strong>Nessuna sezione trovata</strong>
                <p>La ricerca dei Pokémon veri e propri sarà collegata nella Fase 2.</p>
              </div>
            )}
          </section>

          <section className="highlight-section" aria-labelledby="highlight-title">
            <div className="section-heading section-heading--compact">
              <h2 id="highlight-title">In evidenza</h2>
              <button type="button" onClick={() => showToast('Roadmap disponibile nel file ROADMAP.md.')}>Roadmap</button>
            </div>
            <article className="highlight-card">
              <div className="highlight-badge">FASE 1</div>
              <div>
                <p>Fondamenta completate</p>
                <h3>CapsuleDex prende vita</h3>
                <span>Interfaccia responsive, identità visiva, struttura React e pubblicazione GitHub Pages.</span>
              </div>
              <div className="completion-ring" aria-label="Fase 1 completata">
                <strong>100%</strong>
              </div>
            </article>
          </section>

          <footer className="app-footer">
            <img src="./assets/capsuledex-mark.svg" alt="" />
            <p>Progetto fan-made non ufficiale.</p>
          </footer>
        </div>

        <BottomNav active={activeNav} onSelect={selectNav} />
        <Toast message={toast} visible={Boolean(toast)} />
      </main>
    </div>
  )
}

export default App
