import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { hasError: boolean }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('CapsuleDex runtime error', error, info)
  }

  private reload = () => window.location.reload()

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <main className="fatal-error" role="alert">
        <img src="./assets/capsuledex-mark.svg" alt="" />
        <p className="eyebrow">CapsuleDex</p>
        <h1>Qualcosa è andato storto</h1>
        <p>Il problema può dipendere da una risposta di rete incompleta o da una vecchia cache dell’app.</p>
        <button type="button" onClick={this.reload}>Ricarica CapsuleDex</button>
      </main>
    )
  }
}
