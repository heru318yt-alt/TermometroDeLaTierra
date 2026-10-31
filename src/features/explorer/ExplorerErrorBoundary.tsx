import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
export class ExplorerErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('Error del explorador climático', error, info.componentStack) }
  render() {
    if (this.state.failed) return <section className="panel" role="alert"><h2>No se pudo abrir el explorador</h2><p>Los datos o un recurso visual no se pudieron cargar. Recarga la página para volver a intentarlo.</p><button className="button" onClick={() => window.location.reload()}>Recargar página</button></section>
    return this.props.children
  }
}
