import { NavLink, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import {
  Home, LayoutDashboard, ShieldAlert, Route, AlertTriangle,
  MoreHorizontal, ClipboardEdit, BarChart3, MapPin,
  AlertOctagon, X
} from 'lucide-react'

const mainLinks = [
  { to: '/emergency', icon: AlertOctagon, key: 'emergency', danger: true },
  { to: '/', icon: Home, key: 'home' },
  { to: '/dashboard', icon: LayoutDashboard, key: 'dashboard' },
  { to: '/accessibility', icon: ShieldAlert, key: 'accessibility' },
  { to: '/routes', icon: Route, key: 'routes' },
  { to: '/alerts', icon: AlertTriangle, key: 'alerts' },
  { to: '/field-report', icon: ClipboardEdit, key: 'fieldReport' },
]

const moreLinks = [
  { to: '/analytics', icon: BarChart3, key: 'analytics' },
  { to: '/districts', icon: MapPin, key: 'districts' },
]

const navItemBase = {
  display: 'flex', flexDirection: 'column', alignItems: 'center',
  gap: '2px', padding: '8px 16px', borderRadius: 'var(--radius-pill)',
  fontSize: '10px', fontWeight: 600, textDecoration: 'none',
  transition: 'all var(--dur-fast) var(--ease-out)',
  minWidth: '64px'
}

export default function BottomNav() {
  const { t } = useTranslation()
  const location = useLocation()
  const [showMore, setShowMore] = useState(false)
  const isMoreActive = moreLinks.some((l) => l.to === location.pathname)

  return (
    <>
      {showMore && (
        <div
          onClick={() => setShowMore(false)}
          className="overlay-backdrop"
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 998 }}
        />
      )}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 999,
        display: 'flex', justifyContent: 'center', padding: '0 16px 12px'
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '4px',
          background: 'var(--surface)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-pill)',
          padding: '6px 8px',
          boxShadow: 'var(--shadow-lg)'
        }}>
          {mainLinks.map(({ to, icon: Icon, key, danger }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              style={({ isActive }) => ({
                ...navItemBase,
                color: isActive ? '#fff' : (danger ? 'var(--danger)' : 'var(--text-secondary)'),
                background: isActive ? (danger ? 'var(--danger)' : 'var(--gradient)') : 'transparent',
                boxShadow: isActive ? (danger ? '0 4px 12px rgba(192,57,43,0.35)' : '0 4px 12px rgba(139,197,61,0.3)') : 'none',
              })}
            >
              <Icon size={20} />
              <span>{key === 'emergency' ? 'Emergency' : t('nav.' + key)}</span>
            </NavLink>
          ))}
          <div style={{ width: 1, height: 32, background: 'var(--border)', margin: '0 4px' }} />
          <button
            onClick={() => setShowMore(!showMore)}
            style={{
              ...navItemBase,
              cursor: 'pointer',
              color: isMoreActive || showMore ? '#fff' : 'var(--text-secondary)',
              background: isMoreActive || showMore ? 'var(--gradient)' : 'transparent',
              boxShadow: isMoreActive || showMore ? '0 4px 12px rgba(139,197,61,0.3)' : 'none',
            }}
          >
            {showMore ? <X size={20} /> : <MoreHorizontal size={20} />}
            <span>{showMore ? 'Close' : 'More'}</span>
          </button>
        </div>
      </nav>

      {showMore && (
        <div className="panel-slide-up" style={{
          position: 'fixed', bottom: '80px', left: '50%', transform: 'translateX(-50%)',
          zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '4px',
          background: 'var(--surface)', backdropFilter: 'blur(20px)',
          border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
          padding: '8px', boxShadow: 'var(--shadow-lg)', minWidth: '220px'
        }}>
          {moreLinks.map(({ to, icon: Icon, key }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setShowMore(false)}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 16px', borderRadius: '12px',
                fontSize: '13px', fontWeight: 500, textDecoration: 'none',
                color: isActive ? '#fff' : 'var(--text)',
                background: isActive ? 'var(--gradient)' : 'transparent',
                transition: 'all var(--dur-fast) var(--ease-out)'
              })}
            >
              <Icon size={18} />
              {t('nav.' + key)}
            </NavLink>
          ))}
        </div>
      )}
    </>
  )
}