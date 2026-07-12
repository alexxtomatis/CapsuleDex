import { BellIcon, IconButton, SettingsIcon } from './Icon'

type AppHeaderProps = {
  onNotify: () => void
  onOpenSettings: () => void
}

export function AppHeader({ onNotify, onOpenSettings }: AppHeaderProps) {
  return (
    <header className="app-header">
      <div className="brand-heading">
        <img src="./assets/capsuledex-mark.svg" alt="" className="brand-mark" />
        <div>
          <p className="eyebrow">Il tuo compagno digitale</p>
          <h1>Capsule<span>Dex</span></h1>
        </div>
      </div>

      <div className="header-actions">
        <IconButton label="Notifiche" onClick={onNotify}>
          <BellIcon />
        </IconButton>
        <IconButton label="Apri impostazioni" onClick={onOpenSettings}>
          <SettingsIcon />
        </IconButton>
      </div>
    </header>
  )
}
