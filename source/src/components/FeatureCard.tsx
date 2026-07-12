import type { Feature } from '../types'

type FeatureCardProps = {
  feature: Feature
  onOpen: (feature: Feature) => void
}

export function FeatureCard({ feature, onOpen }: FeatureCardProps) {
  return (
    <button
      type="button"
      className={`feature-card feature-card--${feature.accent}`}
      onClick={() => onOpen(feature)}
      aria-label={`${feature.title}, prevista nella fase ${feature.phase}`}
    >
      <span className="feature-copy">
        <strong>{feature.title}</strong>
        <small>{feature.subtitle}</small>
      </span>
      <span className="feature-icon" aria-hidden="true">{feature.icon}</span>
      <span className="phase-pill">Fase {feature.phase}</span>
    </button>
  )
}
