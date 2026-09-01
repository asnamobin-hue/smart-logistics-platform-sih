import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bot, X, AlertTriangle, TrendingUp, MapPin } from 'lucide-react'
import demoData from '../demo-data/demoData.json'

const severityIcon = { high: AlertTriangle, medium: MapPin, low: TrendingUp }
const severityColor = { high: 'var(--danger)', medium: 'var(--warning)', low: 'var(--purple)' }

function buildInsights() {
  const segments = [...(demoData.roads || []), ...(demoData.bridges || [])]
  const riskiest = [...segments].sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0)).slice(0, 2)
  const delayed = (demoData.vehicles || []).find((v) => v.status === 'delayed')

  const items = riskiest.map((s) => ({
    icon: severityIcon[s.riskLevel] || AlertTriangle,
    color: severityColor[s.riskLevel] || 'var(--warning)',
    text: `${s.name} has a ${s.riskLevel} disruption risk (score ${s.riskScore}).`
  }))
  if (delayed) {
    items.push({
      icon: TrendingUp,
      color: 'var(--purple)',
      text: `Vehicle ${delayed.vehicleId || delayed.id} carrying ${(delayed.supplyType || 'cargo').replace('_', ' ')} is delayed en route to ${delayed.destination}.`
    })
  }
  return items
}

export default function AICopilot() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const insights = buildInsights()
  return (
    <div style={{ position: 'fixed', bottom: 90, right: 24, zIndex: 997 }}>
      {open && (
        <div className="panel-slide-up" style={{ position: 'absolute', bottom: 56, right: 0, width: 320, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--gradient)', color: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14 }}><Bot size={18} /> AI Insights</div>
            <button onClick={() => setOpen(false)} style={{ color: '#fff', cursor: 'pointer', background: 'none', border: 'none', transition: 'opacity var(--dur-fast) var(--ease-out)' }} onMouseEnter={e=>e.currentTarget.style.opacity=0.7} onMouseLeave={e=>e.currentTarget.style.opacity=1}><X size={16} /></button>
          </div>
          <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {insights.length === 0 && <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>No active risk signals right now.</span>}
            {insights.map((ins, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <ins.icon size={16} color={ins.color} style={{ marginTop: 2, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.4 }}>{ins.text}</span>
              </div>
            ))}
          </div>
          <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)' }}>
            <button className="btn btn-primary" style={{ width: '100%', padding: 8, borderRadius: 12, fontSize: 13 }} onClick={() => { setOpen(false); navigate('/alerts') }}>View All Insights</button>
          </div>
        </div>
      )}
      <button onClick={() => setOpen(!open)} style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(139,197,61,0.4)', cursor: 'pointer', border: 'none', transition: 'transform var(--dur-fast) var(--ease-spring)' }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)' }
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)' }>
        <Bot size={22} color="#fff" />
      </button>
    </div>
  )
}