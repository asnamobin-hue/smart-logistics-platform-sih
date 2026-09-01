import { Link } from 'react-router-dom'
import { MapPinOff } from 'lucide-react'

export default function NotFound() {
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
      <MapPinOff size={40} color="var(--color-text-muted)" />
      <h2>Page not found</h2>
      <p style={{ color: 'var(--color-text-muted)' }}>
        The page you're looking for doesn't exist.
      </p>
      <Link
        to="/"
        style={{ padding: '10px 20px', background: 'var(--gradient)', color: '#fff', borderRadius: 'var(--radius-pill)', boxShadow: '0 4px 12px rgba(139,197,61,0.3)', transition: 'all var(--dur-fast) var(--ease-out)' }}
        onMouseEnter={e=>e.currentTarget.style.transform='scale(1.03)'}
        onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}
      >
        Back to Home
      </Link>
    </div>
  )
}