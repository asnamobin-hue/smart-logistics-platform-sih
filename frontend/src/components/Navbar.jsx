import { Bell, Wifi, WifiOff, Globe, Search, Sun, Moon, AlertOctagon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SUPPORTED_LANGUAGES } from '../utils/constants.js'
import { useTheme } from './ThemeProvider.jsx'
import { useEmergencyMode } from '../context/EmergencyModeContext.jsx'

export default function Navbar({ emergencyOpen = false, onToggleEmergency }) {
  const { t, i18n } = useTranslation()
  const { theme, toggle } = useTheme()
  const { active: emergencyActive } = useEmergencyMode()
  const [online, setOnline] = useState(navigator.onLine)

  useEffect(() => {
    const goOnline = () => setOnline(true)
    const goOffline = () => setOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => { window.removeEventListener('online', goOnline); window.removeEventListener('offline', goOffline) }
  }, [])

  const changeLanguage = (e) => {
    i18n.changeLanguage(e.target.value)
    localStorage.setItem('ner_lang', e.target.value)
  }

  const triggerSearch = () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))
  }

  return (
    <nav style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 24px', background: 'var(--surface)',
      borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 100,
      backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--gradient)', boxShadow: '0 2px 8px rgba(139,197,61,0.3)'
        }}>
          <span style={{ color: '#fff', fontWeight: 800, fontSize: 16 }}>N</span>
        </div>
        <div>
          <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.3px' }}>{t('appName')}</span>
          <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 500 }}>{t('extra.AI OPERATIONS COMMAND CENTER')}</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          onClick={onToggleEmergency}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
            background: 'var(--danger)', color: '#fff', border: 'none', borderRadius: 'var(--radius-pill)',
            fontSize: 12, fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(192,57,43,0.35)',
            animation: emergencyActive ? 'pulse 1.4s ease-in-out infinite' : 'none'
          }}
          title={emergencyOpen ? 'Turn off Emergency Mode' : (emergencyActive ? 'Emergency Mode is ACTIVE — open Emergency Mode' : 'Open Emergency Mode')}
        >
          <AlertOctagon size={15} /> {emergencyActive ? t('extra.EMERGENCY ACTIVE') : t('extra.Emergency')}
        </button>
        <button onClick={triggerSearch} className="btn-icon btn-ghost" title="Search (Ctrl+K)">
          <Search size={18} />
        </button>
        <button onClick={toggle} className="btn-icon btn-ghost" title="Toggle theme">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Globe size={14} color="var(--text-secondary)" />
          <select value={i18n.language} onChange={changeLanguage} className="form-select" style={{ padding: '4px 8px', fontSize: 11, width: 'auto', borderRadius: 8 }}>
            {SUPPORTED_LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: online ? 'var(--success)' : 'var(--danger)' }}>
          {online ? <Wifi size={14} /> : <WifiOff size={14} />}
        </div>
        <div style={{ position: 'relative' }}>
          <Bell size={18} color="var(--text-secondary)" style={{ cursor: 'pointer' }} />
          <div style={{
            position: 'absolute', top: -2, right: -2, width: 8, height: 8,
            borderRadius: '50%', background: 'var(--danger)', border: '2px solid var(--surface)'
          }} />
        </div>
      </div>
    </nav>
  )
}
