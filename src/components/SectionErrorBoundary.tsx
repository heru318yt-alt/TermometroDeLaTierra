import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

type Props = {
  children: ReactNode
  resetKey?: string | number | null
  title?: string
}

type State = {
  failed: boolean
}

export class SectionErrorBoundary extends Component<Props, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  componentDidUpdate(prevProps: Props) {
    if (this.state.failed && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ failed: false })
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Error al cargar la sección interactiva', error, info.componentStack)
  }

  render() {
    if (this.state.failed) {
      return (
        <section className="panel" role="alert">
          <h2>{this.props.title ?? 'No se pudo cargar este módulo'}</h2>
          <p>Ocurrió un problema inesperado al iniciar la vista interactiva. Puedes reintentar ahora o recargar la página.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <button type="button" className="button" onClick={() => this.setState({ failed: false })}>Reintentar</button>
            <button type="button" className="text-link" onClick={() => window.location.reload()}>Recargar página</button>
          </div>
        </section>
      )
    }
    return this.props.children
  }
}
