import { CheckIcon, GridIcon, HeartIcon, MoreIcon, ScanIcon } from './Icon'

const entries = [
  { id: 'home', label: 'Esplora', icon: <GridIcon /> },
  { id: 'favorites', label: 'Preferiti', icon: <HeartIcon /> },
  { id: 'checklist', label: 'Checklist', icon: <CheckIcon /> },
  { id: 'scanner', label: 'Scanner', icon: <ScanIcon /> },
  { id: 'more', label: 'Altro', icon: <MoreIcon /> },
]

type BottomNavProps = {
  active: string
  onSelect: (id: string, label: string) => void
}

export function BottomNav({ active, onSelect }: BottomNavProps) {
  return (
    <nav className="bottom-nav" aria-label="Navigazione principale">
      {entries.map((entry) => (
        <button
          type="button"
          key={entry.id}
          className={active === entry.id ? 'is-active' : ''}
          onClick={() => onSelect(entry.id, entry.label)}
        >
          <span>{entry.icon}</span>
          <small>{entry.label}</small>
        </button>
      ))}
    </nav>
  )
}
