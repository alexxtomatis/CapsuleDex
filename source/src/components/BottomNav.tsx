import { CollectionIcon, GridIcon, HeartIcon, MoreIcon, UsersIcon } from './Icon'

const entries = [
  { id: 'home', label: 'Esplora', icon: <GridIcon /> },
  { id: 'favorites', label: 'Preferiti', icon: <HeartIcon /> },
  { id: 'team', label: 'Squadra', icon: <UsersIcon /> },
  { id: 'collection', label: 'Collezione', icon: <CollectionIcon /> },
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
