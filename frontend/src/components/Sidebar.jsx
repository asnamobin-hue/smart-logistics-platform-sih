import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard,
  Route,
  AlertTriangle,
  BarChart3,
  Home as HomeIcon,
  ShieldAlert,
  ClipboardEdit,
  Truck,
  Package,
  MapPin
} from 'lucide-react'

const links = [
  { to: '/', key: 'home', icon: HomeIcon },
  { to: '/dashboard', key: 'dashboard', icon: LayoutDashboard },
  { to: '/accessibility', key: 'accessibility', icon: ShieldAlert },
  { to: '/field-report', key: 'fieldReport', icon: ClipboardEdit },
  { to: '/routes', key: 'routes', icon: Route },
  { to: '/alerts', key: 'alerts', icon: AlertTriangle },
  { to: '/analytics', key: 'analytics', icon: BarChart3 },
  { to: '/vehicles', key: 'vehicles', icon: Truck },
  { to: '/supplies', key: 'supplies', icon: Package },
  { to: '/districts', key: 'districts', icon: MapPin }
]

export default function Sidebar() {
  const { t } = useTranslation()
  return (
    <aside style={{
      width: '220px',
      background: 'var(--color-surface)',
      borderRight: '1px solid var(--color-border)',
      padding: '16px 12px',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px'
    }}>
      {links.map(({ to, key, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          style={({ isActive }) => ({
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 12px',
            borderRadius: 'var(--radius)',
            color: isActive ? '#fff' : 'var(--color-text-muted)',
            background: isActive ? 'var(--color-primary)' : 'transparent',
            fontSize: '14px',
            fontWeight: 500,
            transition: 'background 0.15s'
          })}
        >
          <Icon size={18} />
          {t(`nav.${key}`)}
        </NavLink>
      ))}
    </aside>
  )
}
