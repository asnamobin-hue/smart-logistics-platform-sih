import { Component } from 'react'
import { AlertTriangle } from 'lucide-react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('Uncaught error in component tree:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '64px 24px',
          textAlign: 'center',
          gap: '12px'
        }}>
          <AlertTriangle size={40} color="var(--color-danger)" />
          <h2>Something went wrong</h2>
          <p style={{ color: 'var(--color-text-muted)', maxWidth: '400px' }}>
            This part of the app hit an unexpected error. Try refreshing the page —
            if it keeps happening, let us know what you were doing.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{ padding: '10px 20px', background: 'var(--color-primary)', color: '#fff' }}
          >
            Refresh Page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}