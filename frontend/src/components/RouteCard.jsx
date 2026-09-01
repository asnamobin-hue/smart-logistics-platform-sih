import { MapPin, ArrowRight, Clock } from 'lucide-react'

export default function RouteCard({ route, onSelect }) {
  const { origin, destination, distanceKm, etaMinutes, status = 'pending' } = route

  const statusColors = {
    pending: 'var(--color-text-muted)',
    active: 'var(--color-primary)',
    completed: 'var(--color-success)'
  }

  return (
    <div
      className="card"
      onClick={() => onSelect && onSelect(route)}
      style={{ cursor: onSelect ? 'pointer' : 'default' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
        <MapPin size={16} color="var(--color-primary)" />
        <span>{origin}</span>
        <ArrowRight size={14} color="var(--color-text-muted)" />
        <span>{destination}</span>
      </div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '10px',
        fontSize: '13px',
        color: 'var(--color-text-muted)'
      }}>
        <span>{distanceKm ? `${distanceKm.toFixed(1)} km` : '—'}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Clock size={14} /> {etaMinutes ? `${etaMinutes} min` : '—'}
        </span>
        <span style={{
          textTransform: 'capitalize',
          color: statusColors[status] || statusColors.pending,
          fontWeight: 600
        }}>
          {status}
        </span>
      </div>
    </div>
  )
}