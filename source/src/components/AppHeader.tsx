import { BellIcon, IconButton } from './Icon'

type AppHeaderProps = {
  onNotify: () => void
}

export function AppHeader({ onNotify }: AppHeaderProps) {
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
        <img className="avatar" src="./assets/icon-192.png" alt="Profilo allenatore" />
      </div>
    </header>
  )
}
