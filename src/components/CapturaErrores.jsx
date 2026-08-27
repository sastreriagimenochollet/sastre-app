import { Component } from 'react'

export default class CapturaErrores extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, fontFamily: 'sans-serif', color: '#241F1A', background: '#F6F3EC', minHeight: '100vh' }}>
          <h2 style={{ marginBottom: 8 }}>Algo salió mal</h2>
          <p style={{ fontSize: 14, opacity: 0.7, marginBottom: 16 }}>
            Copia este mensaje y compártelo para poder solucionarlo:
          </p>
          <pre style={{
            background: '#fff', padding: 12, borderRadius: 8, fontSize: 12,
            overflow: 'auto', border: '1px solid #eee', whiteSpace: 'pre-wrap'
          }}>
            {String(this.state.error?.message || this.state.error)}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: 16, padding: '10px 16px', borderRadius: 8, background: '#B4863A', color: 'white', border: 'none' }}
          >
            Recargar página
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
