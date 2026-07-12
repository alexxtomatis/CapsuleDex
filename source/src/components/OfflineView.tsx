import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react'
import {
  canInstallApp,
  clearOfflineRuntimeData,
  exportLocalBackup,
  formatBytes,
  getOfflineStats,
  importLocalBackup,
  isStandaloneMode,
  preparePokemonOffline,
  prepareSearchOffline,
  requestAppInstall,
  type OfflineProgress,
  type OfflineStats,
} from '../services/offline'
import { ArrowLeftIcon, IconButton } from './Icon'

type OfflineViewProps = {
  personalPokemonIds: number[]
  onBack: () => void
  onToast: (message: string) => void
}

const starterOfflinePack = [1, 4, 7, 25, 39, 52, 94, 133, 143, 150, 151, 196, 197, 248, 282, 384, 448, 658, 778, 908, 911, 914, 1000, 1007, 1008]

const emptyStats: OfflineStats = {
  cacheEntries: 0,
  appEntries: 0,
  apiEntries: 0,
  imageEntries: 0,
  usedBytes: null,
  quotaBytes: null,
}

export function OfflineView({ personalPokemonIds, onBack, onToast }: OfflineViewProps) {
  const [online, setOnline] = useState(navigator.onLine)
  const [stats, setStats] = useState<OfflineStats>(emptyStats)
  const [busy, setBusy] = useState<'search' | 'pokemon' | 'clear' | 'import' | null>(null)
  const [progress, setProgress] = useState<OfflineProgress | null>(null)
  const [installAvailable, setInstallAvailable] = useState(canInstallApp())
  const [standalone, setStandalone] = useState(isStandaloneMode())
  const fileInput = useRef<HTMLInputElement>(null)

  const offlinePokemonIds = useMemo(() => {
    const ids = personalPokemonIds.length > 0 ? personalPokemonIds : starterOfflinePack
    return [...new Set(ids)].sort((a, b) => a - b)
  }, [personalPokemonIds])

  async function refreshStats() {
    try {
      setStats(await getOfflineStats())
    } catch {
      setStats(emptyStats)
    }
  }

  useEffect(() => {
    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)
    const handleInstall = () => setInstallAvailable(true)
    const handleInstalled = () => {
      setInstallAvailable(false)
      setStandalone(true)
    }
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('capsuledex:install-available', handleInstall)
    window.addEventListener('capsuledex:installed', handleInstalled)
    void refreshStats()
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('capsuledex:install-available', handleInstall)
      window.removeEventListener('capsuledex:installed', handleInstalled)
    }
  }, [])

  async function runSearchDownload() {
    if (!online) {
      onToast('Collegati a internet per preparare nuovi dati offline.')
      return
    }
    setBusy('search')
    setProgress({ completed: 0, total: 19, label: 'Preparazione' })
    try {
      await prepareSearchOffline(setProgress)
      onToast('Ricerca, regioni e filtri sono pronti offline.')
      await refreshStats()
    } catch {
      onToast('Download interrotto: controlla la connessione e riprova.')
    } finally {
      setBusy(null)
      setProgress(null)
    }
  }

  async function runPokemonDownload() {
    if (!online) {
      onToast('Collegati a internet per preparare nuovi Pokémon offline.')
      return
    }
    setBusy('pokemon')
    setProgress({ completed: 0, total: offlinePokemonIds.length, label: 'Preparazione' })
    try {
      await preparePokemonOffline(offlinePokemonIds, setProgress)
      onToast(`${offlinePokemonIds.length} Pokémon preparati per la consultazione offline.`)
      await refreshStats()
    } catch {
      onToast('Download interrotto: alcuni dati potrebbero essere già disponibili.')
    } finally {
      setBusy(null)
      setProgress(null)
    }
  }

  async function clearCache() {
    const confirmed = window.confirm('Svuotare dati PokéAPI e immagini offline? Squadre, preferiti e collezione resteranno salvati.')
    if (!confirmed) return
    setBusy('clear')
    try {
      await clearOfflineRuntimeData()
      await refreshStats()
      onToast('Cache offline svuotata. I salvataggi personali sono intatti.')
    } catch {
      onToast('Non è stato possibile svuotare completamente la cache.')
    } finally {
      setBusy(null)
    }
  }

  async function installApp() {
    const result = await requestAppInstall()
    if (result === 'accepted') onToast('Installazione di CapsuleDex avviata.')
    else if (result === 'dismissed') onToast('Installazione annullata.')
    else onToast('Usa il menu del browser e scegli “Installa app” o “Aggiungi a Home”.')
  }

  async function importBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setBusy('import')
    try {
      const count = await importLocalBackup(file)
      onToast(`${count} salvataggi ripristinati. CapsuleDex verrà ricaricata.`)
      window.setTimeout(() => window.location.reload(), 900)
    } catch (error) {
      onToast(error instanceof Error ? error.message : 'Backup non valido.')
      setBusy(null)
    }
  }

  const percentage = progress && progress.total > 0
    ? Math.round((progress.completed / progress.total) * 100)
    : 0
  const quotaPercent = stats.usedBytes !== null && stats.quotaBytes
    ? Math.min(100, Math.round((stats.usedBytes / stats.quotaBytes) * 100))
    : 0

  return (
    <section className="database-view offline-view">
      <header className="subpage-header">
        <IconButton label="Torna alla Home" onClick={onBack}>
          <ArrowLeftIcon />
        </IconButton>
        <div>
          <p className="eyebrow">Fase 13</p>
          <h1>Modalità offline</h1>
        </div>
        <span className={`network-dot ${online ? 'is-online' : 'is-offline'}`} title={online ? 'Online' : 'Offline'} />
      </header>

      <article className={`offline-hero ${online ? 'is-online' : 'is-offline'}`}>
        <div className="offline-hero__icon" aria-hidden="true">{online ? '☁' : '⌁'}</div>
        <div>
          <p>{online ? 'Connessione disponibile' : 'CapsuleDex è offline'}</p>
          <h2>{online ? 'Prepara ora ciò che vuoi portare con te' : 'I dati già salvati restano consultabili'}</h2>
          <span>
            L’app, i salvataggi e le risorse visitate vengono conservati sul dispositivo. Le pagine mai aperte richiedono internet.
          </span>
        </div>
      </article>

      {progress && (
        <article className="offline-progress" aria-live="polite">
          <div>
            <strong>{progress.label}</strong>
            <span>{progress.completed} / {progress.total} · {percentage}%</span>
          </div>
          <div className="offline-progress__track"><i style={{ width: `${percentage}%` }} /></div>
        </article>
      )}

      <section className="offline-section" aria-labelledby="offline-download-title">
        <div className="section-heading section-heading--compact">
          <div>
            <p className="eyebrow">Download intelligenti</p>
            <h2 id="offline-download-title">Prepara i dati</h2>
          </div>
          <button type="button" onClick={() => void refreshStats()}>Aggiorna</button>
        </div>

        <div className="offline-action-grid">
          <article className="offline-action-card">
            <span className="offline-action-card__icon">⌕</span>
            <div>
              <strong>Ricerca e filtri</strong>
              <p>Catalogo nazionale e tutti i 18 tipi, per cercare e filtrare anche senza rete.</p>
            </div>
            <button type="button" disabled={busy !== null || !online} onClick={() => void runSearchDownload()}>
              {busy === 'search' ? 'Download…' : 'Prepara'}
            </button>
          </article>

          <article className="offline-action-card">
            <span className="offline-action-card__icon">◉</span>
            <div>
              <strong>{personalPokemonIds.length > 0 ? 'I miei Pokémon' : 'Pacchetto iniziale'}</strong>
              <p>
                {personalPokemonIds.length > 0
                  ? `${offlinePokemonIds.length} Pokémon tra squadre, preferiti e collezione, con schede, abilità, evoluzioni e immagini.`
                  : `${offlinePokemonIds.length} Pokémon iconici con schede, abilità, evoluzioni e immagini.`}
              </p>
            </div>
            <button type="button" disabled={busy !== null || !online} onClick={() => void runPokemonDownload()}>
              {busy === 'pokemon' ? 'Download…' : `Scarica ${offlinePokemonIds.length}`}
            </button>
          </article>
        </div>
      </section>

      <section className="offline-section" aria-labelledby="offline-storage-title">
        <div className="section-heading section-heading--compact">
          <div>
            <p className="eyebrow">Memoria del dispositivo</p>
            <h2 id="offline-storage-title">Stato della cache</h2>
          </div>
        </div>

        <div className="offline-stat-grid">
          <article><strong>{stats.cacheEntries}</strong><span>Risorse salvate</span></article>
          <article><strong>{stats.apiEntries}</strong><span>Dati PokéAPI</span></article>
          <article><strong>{stats.imageEntries}</strong><span>Immagini</span></article>
          <article><strong>{formatBytes(stats.usedBytes)}</strong><span>Spazio totale usato</span></article>
        </div>

        {stats.quotaBytes !== null && stats.usedBytes !== null && (
          <div className="storage-meter">
            <div><span>Uso memoria del sito</span><strong>{quotaPercent}% di {formatBytes(stats.quotaBytes)}</strong></div>
            <div className="storage-meter__track"><i style={{ width: `${quotaPercent}%` }} /></div>
          </div>
        )}

        <button className="danger-outline-button" type="button" disabled={busy !== null} onClick={() => void clearCache()}>
          {busy === 'clear' ? 'Pulizia…' : 'Svuota dati e immagini offline'}
        </button>
      </section>

      <section className="offline-section" aria-labelledby="backup-title">
        <div className="section-heading section-heading--compact">
          <div>
            <p className="eyebrow">Salvataggi personali</p>
            <h2 id="backup-title">Backup e ripristino</h2>
          </div>
        </div>
        <p className="offline-section__copy">
          Squadre, preferiti, collezione e cronologia restano nel browser. Esporta un backup prima di cancellare i dati del sito o cambiare dispositivo.
        </p>
        <div className="offline-inline-actions">
          <button type="button" onClick={exportLocalBackup}>Esporta backup</button>
          <button type="button" disabled={busy !== null} onClick={() => fileInput.current?.click()}>
            {busy === 'import' ? 'Importazione…' : 'Importa backup'}
          </button>
          <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={(event) => void importBackup(event)} />
        </div>
      </section>

      <section className="offline-section offline-install-card" aria-labelledby="install-title">
        <div className="offline-install-card__icon">▣</div>
        <div>
          <p className="eyebrow">Web app installabile</p>
          <h2 id="install-title">{standalone ? 'CapsuleDex è installata' : 'Installa CapsuleDex'}</h2>
          <p>
            {standalone
              ? 'La stai usando come app autonoma. Il contenuto offline continuerà a funzionare dal collegamento installato.'
              : 'Installala dal browser per aprirla dalla schermata Home o dal menu Start, senza barra degli indirizzi.'}
          </p>
        </div>
        {!standalone && (
          <button type="button" onClick={() => void installApp()}>
            {installAvailable ? 'Installa ora' : 'Come installare'}
          </button>
        )}
      </section>

      <article className="offline-note">
        <strong>Come funziona davvero</strong>
        <p>
          CapsuleDex salva automaticamente le pagine e le immagini mentre le visiti. La modalità offline non include in anticipo l’intero database: ciò che non è mai stato caricato richiederà una connessione.
        </p>
      </article>
    </section>
  )
}
