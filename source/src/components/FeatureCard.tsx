import { CURRENT_PHASE } from '../data/features'
import type { Feature } from '../types'

type FeatureCardProps = {
  feature: Feature
  onOpen: (feature: Feature) => void
}

export function FeatureCard({ feature, onOpen }: FeatureCardProps) {
  const ready = feature.phase <= CURRENT_PHASE
  return (
    <button
      type="button"
      className={`feature-card feature-card--${feature.accent}${ready ? ' feature-card--ready' : ''}`}
      onClick={() => onOpen(feature)}
      aria-label={ready ? `Apri ${feature.title}` : `${feature.title}, prevista nella fase ${feature.phase}`}
    >
      <span className="feature-copy">
        <strong>{feature.title}</strong>
        <small>{feature.subtitle}</small>
      </span>
      <span className="feature-icon" aria-hidden="true">{feature.icon}</span>
      <span className="phase-pill">{ready ? 'Disponibile' : `Fase ${feature.phase}`}</span>
    </button>
  )
}
