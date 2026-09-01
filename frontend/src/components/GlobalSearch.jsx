import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X, ShieldAlert, Route, AlertTriangle, BarChart3, ClipboardEdit, MapPin, AlertOctagon } from 'lucide-react'

const items = [
  { label: 'Emergency Mode', path: '/emergency', icon: AlertOctagon },
  { label: 'Dashboard', path: '/dashboard', icon: ShieldAlert },
  { label: 'Live Map', path: '/accessibility', icon: ShieldAlert },
  { label: 'Route Planning', path: '/routes', icon: Route },
  { label: 'Alerts', path: '/alerts', icon: AlertTriangle },
  { label: 'Field Reports', path: '/field-report', icon: ClipboardEdit },
  { label: 'Analytics', path: '/analytics', icon: BarChart3 },
  { label: 'Districts', path: '/districts', icon: MapPin },
]

export default function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const ref = useRef(null)
  const nav = useNavigate()

  useEffect(() => {
    const h = e => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") { e.preventDefault(); setOpen(o => !o) }
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", h)
    return () => window.removeEventListener("keydown", h)
  }, [])

  useEffect(() => { if (open && ref.current) ref.current.focus() }, [open])

  const list = query ? items.filter(i => i.label.toLowerCase().includes(query.toLowerCase())) : items

  if (!open) return null

  return (
    <div onClick={() => setOpen(false)} className="overlay-backdrop" style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: "15vh", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
      <div onClick={e => e.stopPropagation()} className="panel-enter" style={{ width: "100%", maxWidth: 520, margin: "0 16px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-lg)", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", borderBottom: "1px solid var(--border)" }}>
          <Search size={18} color="var(--text-secondary)" />
          <input ref={ref} value={query} onChange={e => setQuery(e.target.value)} placeholder="Search pages (Ctrl+K)..." style={{ flex: 1, background: "none", border: "none", outline: "none", color: "var(--text)", fontSize: 15 }} />
          <button onClick={() => setOpen(false)} style={{ color: "var(--text-secondary)", cursor: "pointer", background: "none", border: "none" }}><X size={16} /></button>
        </div>
        <div style={{ maxHeight: 320, overflowY: "auto", padding: 8 }}>
          {list.map(item => (
            <button key={item.path} onClick={() => { nav(item.path); setOpen(false); setQuery("") }}
              style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "10px 14px", borderRadius: 12, textAlign: "left", color: "var(--text)", cursor: "pointer", background: "none", border: "none", transition: "background var(--dur-fast) var(--ease-out)" }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--bg-secondary)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <item.icon size={18} color="var(--purple)" />
              <span style={{ fontWeight: 500, fontSize: 14 }}>{item.label}</span>
            </button>
          ))}
          {list.length === 0 && <div style={{ padding: 24, textAlign: "center", color: "var(--text-secondary)" }}>No results</div>}
        </div>
        <div style={{ padding: "8px 18px", borderTop: "1px solid var(--border)", fontSize: 11, color: "var(--text-secondary)", display: "flex", gap: 12 }}>
          <span>Ctrl+K toggle</span><span>Esc close</span>
        </div>
      </div>
    </div>
  )
}