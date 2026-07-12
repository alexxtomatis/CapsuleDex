import { useEffect, useState } from 'react'
import { canInstallApp, isStandaloneMode, requestAppInstall } from '../services/offline'
import type { AppPreferences, ThemePreference } from '../services/preferences'

const themes: Array<{ value: ThemePreference; label: string; icon: string }> = [
  { value: 'system', label: 'Sistema', icon: '◐' },
  { value: 'dark', label: 'Scuro', icon: '☾' },
  { value: 'light', label: 'Chiaro', icon: '☀' },
]

type SettingsPanelProps = {
  open: boolean
  preferences: AppPreferences
  onChange: (preferences: AppPreferences) => void
  onClose: () => void
  onOpenOffline: () => void
  onToast: (message: string) => void
}

export function SettingsPanel({
  open,
  preferences,
  onChange,
  onClose,
  onOpenOffline,
  onToast,
}: SettingsPanelProps) {
  const [installAvailable, setInstallAvailable] = useState(canInstallApp())
  const standalone = isStandaloneMode()

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    const handleInstallAvailable = () => setInstallAvailable(true)
    const handleInstalled = () => setInstallAvailable(false)
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('capsuledex:install-available', handleInstallAvailable)
    window.addEventListener('capsuledex:installed', handleInstalled)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('capsuledex:install-available', handleInstallAvailable)
      window.removeEventListener('capsuledex:installed', handleInstalled)
    }
  }, [open, onClose])

  if (!open) return null

  async function install() {
    const result = await requestAppInstall()
    if (result === 'accepted') onToast('CapsuleDex è stata aggiunta al dispositivo.')
    else if (result === 'dismissed') onToast('Installazione annullata.')
    else onToast('Usa il menu del browser per aggiungere CapsuleDex alla schermata Home.')
  }

  function setTheme(theme: ThemePreference) {
    onChange({ ...preferences, theme })
  }

  return (
    <div className="settings-overlay" role="presentation" onMouseDown={onClose}>
      <section
        className="settings-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="settings-handle" aria-hidden="true" />
        <header className="settings-header">
          <div>
            <p className="eyebrow">CapsuleDex 1.0</p>
            <h2 id="settings-title">Aspetto e app</h2>
          </div>
          <button type="button" className="settings-close" onClick={onClose} aria-label="Chiudi impostazioni">×</button>
        </header>

        <div className="settings-group">
          <span className="settings-label">Tema</span>
          <div className="theme-picker" role="radiogroup" aria-label="Tema dell'app">
            {themes.map((theme) => (
              <button
                key={theme.value}
                type="button"
                role="radio"
                aria-checked={preferences.theme === theme.value}
                className={preferences.theme === theme.value ? 'is-selected' : ''}
                onClick={() => setTheme(theme.value)}
              >
                <span aria-hidden="true">{theme.icon}</span>
                {theme.label}
              </button>
            ))}
          </div>
        </div>

        <div className="settings-list">
          <label className="settings-row">
            <span>
              <strong>Riduci animazioni</strong>
              <small>Disattiva movimenti e transizioni decorative.</small>
            </span>
            <input
              type="checkbox"
              checked={preferences.reduceMotion}
              onChange={(event) => onChange({ ...preferences, reduceMotion: event.target.checked })}
            />
          </label>
          <label className="settings-row">
            <span>
              <strong>Layout compatto</strong>
              <small>Mostra più contenuti riducendo spazi e dimensioni.</small>
            </span>
            <input
              type="checkbox"
              checked={preferences.compactMode}
              onChange={(event) => onChange({ ...preferences, compactMode: event.target.checked })}
            />
          </label>
        </div>

        <div className="settings-actions">
          {!standalone && (
            <button type="button" className="settings-action settings-action--primary" onClick={install}>
              <span aria-hidden="true">＋</span>
              <span><strong>Installa CapsuleDex</strong><small>{installAvailable ? 'Installazione disponibile' : 'Aggiungi alla schermata Home'}</small></span>
            </button>
          )}
          <button
            type="button"
            className="settings-action"
            onClick={() => {
              onClose()
              onOpenOffline()
            }}
          >
            <span aria-hidden="true">⌁</span>
            <span><strong>Dati offline e backup</strong><small>Cache, installazione e salvataggi locali</small></span>
          </button>
        </div>

        <footer className="settings-footer">
          <span>Versione 1.0.0</span>
          <span>Fase 14 completata</span>
        </footer>
      </section>
    </div>
  )
}
