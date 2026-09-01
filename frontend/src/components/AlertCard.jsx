import { AlertTriangle, CheckCircle } from 'lucide-react'

const severityColors = {
  high: 'var(--color-danger)',
  medium: 'var(--color-warning)',
  low: 'var(--color-primary)'
}

const typeLabels = {
  blocked_road: 'Blocked Road',
  inaccessible_region: 'Inaccessible Region',
  delayed_delivery: 'Delayed Delivery',
  high_risk_corridor: 'High-Risk Corridor',
  weather: 'Weather',
  general: null
}

export default function AlertCard({ alert, onResolve }) {
  const { id, title, message, severity = 'medium', createdAt, resolved, type } = alert
  const color = severityColors[severity] || severityColors.medium
  const typeLabel = typeLabels[type]

  return (
    <div className="card" style={{
      display: 'flex',
      gap: '12px',
      alignItems: 'flex-start',
      opacity: resolved ? 0.5 : 1,
      transition: 'opacity var(--dur-normal) var(--ease-out), box-shadow var(--dur-normal) var(--ease-out), border-color var(--dur-normal) var(--ease-out)'
    }}>
      <AlertTriangle size={20} color={color} style={{ flexShrink: 0, marginTop: '2px' }} />
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
          <strong>{title}</strong>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {typeLabel && (
              <span style={{
                fontSize: '10px',
                textTransform: 'uppercase',
                background: 'var(--color-surface-light)',
                color: 'var(--color-text-muted)',
                padding: '2px 6px',
                borderRadius: '4px',
                fontWeight: 600
              }}>
                {typeLabel}
              </span>
            )}
            <span style={{
              fontSize: '11px',
              textTransform: 'uppercase',
              color,
              fontWeight: 600
            }}>
              {severity}
            </span>
          </div>
        </div>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', margin: '4px 0' }}>
          {message}
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
            {createdAt ? new Date(createdAt).toLocaleString() : ''}
          </span>
          {!resolved && onResolve && (
            <button
              onClick={() => onResolve(id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
                background: 'var(--color-surface-light)',
                color: 'var(--color-text)',
                padding: '6px 10px',
                borderRadius: 'var(--radius-pill)',
                transition: 'all var(--dur-fast) var(--ease-out)'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--gradient)' ; e.currentTarget.style.color = '#fff' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-surface-light)' ; e.currentTarget.style.color = 'var(--color-text)' }}
            >
              <CheckCircle size={14} /> Resolve
            </button>
          )}
        </div>
      </div>
    </div>
  )
}