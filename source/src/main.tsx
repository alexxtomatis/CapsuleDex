import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { ErrorBoundary } from './components/ErrorBoundary'
import { registerCapsuleDexServiceWorker } from './services/offline'
import { applyPreferences, loadPreferences } from './services/preferences'
import './styles.css'

applyPreferences(loadPreferences())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

void registerCapsuleDexServiceWorker()
