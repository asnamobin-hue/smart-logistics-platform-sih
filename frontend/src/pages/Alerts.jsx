import { useEffect, useState } from 'react'
import AlertCard from '../components/AlertCard.jsx'
import Loader from '../components/Loader.jsx'
import { getAlerts, resolveAlert } from '../services/api.js'
import { connectSocket, disconnectSocket } from '../services/socket.js'

export default function Alerts() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    getAlerts()
      .then((res) => setAlerts(res.data.data)) // { data: [...], pagination: {...} }
      .catch(() => setAlerts([]))
      .finally(() => setLoading(false))

    const socket = connectSocket()
    socket.on('alert:new', (alert) => {
      setAlerts((prev) => [alert, ...prev])
    })
    socket.on('alert:resolved', (updated) => {
      setAlerts((prev) => prev.map((a) => (a.id === updated.id ? updated : a)))
    })

    return () => {
      socket.off('alert:new')
      socket.off('alert:resolved')
      disconnectSocket()
    }
  }, [])

  const handleResolve = async (id) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, resolved: true } : a)))
    try {
      await resolveAlert(id)
    } catch {
      setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, resolved: false } : a)))
    }
  }

  const filtered = filter === 'all' ? alerts : alerts.filter((a) => a.severity === filter)

  return (
    <div>
      <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>Alerts</h1>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {['all', 'high', 'medium', 'low'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '6px 14px',
              fontSize: '13px',
              textTransform: 'capitalize',
              background: filter === f ? 'var(--gradient)' : 'var(--color-surface-light)',
              color: filter === f ? '#fff' : 'var(--color-text)',
              borderRadius: 'var(--radius-pill)',
              transition: 'all var(--dur-fast) var(--ease-out)',
              boxShadow: filter === f ? '0 2px 8px rgba(139,197,61,0.25)' : 'none'
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {loading && <Loader text="Loading alerts..." />}
      {!loading && filtered.length === 0 && (
        <p style={{ color: 'var(--color-text-muted)' }}>No alerts to show.</p>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filtered.map((alert) => (
          <AlertCard key={alert.id} alert={alert} onResolve={handleResolve} />
        ))}
      </div>
    </div>
  )
}