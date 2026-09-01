import { useEffect, useState } from 'react'
import { MapPin, ShieldCheck, ShieldAlert, ShieldQuestion } from 'lucide-react'
import Map from '../components/Map.jsx'
import Loader from '../components/Loader.jsx'
import { getAllDistricts } from '../services/api.js'

const NER_STATES = ['All States', 'Assam', 'Arunachal Pradesh', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Sikkim', 'Tripura']
const statusMeta = {
  normal: { color: '#22c55e', bg: 'rgba(34,197,94,0.15)', label: 'Normal' },
  partial: { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', label: 'Partial' },
  disrupted: { color: '#ef4444', bg: 'rgba(239,68,68,0.15)', label: 'Disrupted' }
}

export default function DistrictMonitoring() {
  const [districts, setDistricts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedState, setSelectedState] = useState('All States')

  useEffect(() => {
    getAllDistricts().then((r) => setDistricts(r.data.data || r.data || [])).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const filtered = selectedState === 'All States' ? districts : districts.filter((d) => d.state === selectedState)
  const normal = filtered.filter((d) => d.connectivityStatus === 'normal').length
  const partial = filtered.filter((d) => d.connectivityStatus === 'partial').length
  const disrupted = filtered.filter((d) => d.connectivityStatus === 'disrupted').length
  const totalRoads = filtered.reduce((s, d) => s + (d.totalRoads || 0), 0)
  const openRoads = filtered.reduce((s, d) => s + (d.openRoads || 0), 0)
  const blockedRoads = filtered.reduce((s, d) => s + (d.blockedRoads || 0), 0)
  const totalIncidents = filtered.reduce((s, d) => s + (d.activeDisruptions || 0), 0)
  const accessiblePct = totalRoads > 0 ? Math.round((openRoads / totalRoads) * 100) : 0

  const mapLocations = filtered.map((d) => ({
    id: d.id, name: d.name + ', ' + d.state, lat: d.lat, lon: d.lon,
    color: statusMeta[d.connectivityStatus]?.color || '#3b82f6'
  }))

  if (loading) return <Loader text='Loading districts...' />

  return (
    <div>
      <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>District Monitoring</h1>
      <div style={{ marginBottom: '16px' }}>
        <select value={selectedState} onChange={(e) => setSelectedState(e.target.value)}
          style={{ padding: '8px 12px', background: 'var(--color-surface-light)', color: 'var(--color-text)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', fontSize: '14px' }}>
          {NER_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        <div className='card card-warm' style={{background:'rgba(214,189,152,0.28)',border:'1px solid rgba(214,189,152,0.35)','textAlign':'center'}}>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-primary)' }}>{filtered.length}</div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Districts</div>
        </div>
        <div className='card card-warm' style={{background:'rgba(214,189,152,0.28)',border:'1px solid rgba(214,189,152,0.35)','textAlign':'center'}}>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#22c55e' }}>{accessiblePct}%</div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Accessibility</div>
        </div>
        <div className='card card-warm' style={{background:'rgba(214,189,152,0.28)',border:'1px solid rgba(214,189,152,0.35)','textAlign':'center'}}>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#22c55e' }}>{openRoads}</div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Open Roads</div>
        </div>
        <div className='card card-warm' style={{background:'rgba(214,189,152,0.28)',border:'1px solid rgba(214,189,152,0.35)','textAlign':'center'}}>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#ef4444' }}>{blockedRoads}</div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Blocked Roads</div>
        </div>
        <div className='card card-warm' style={{background:'rgba(214,189,152,0.28)',border:'1px solid rgba(214,189,152,0.35)','textAlign':'center'}}>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#f59e0b' }}>{totalIncidents}</div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Active Incidents</div>
        </div>
      </div>
      <div className='card' style={{ marginBottom: '20px', padding: 0, overflow: 'hidden' }}>
        <Map locations={mapLocations} center={[25.6, 92.9]} zoom={6.5} height='400px' />
      </div>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
        {['normal', 'partial', 'disrupted'].map((s) => (
          <div key={s} style={{ padding: '6px 12px', borderRadius: 'var(--radius)', background: statusMeta[s].bg, color: statusMeta[s].color, fontSize: '13px', fontWeight: 600 }}>
            {statusMeta[s].label}: {s === 'normal' ? normal : s === 'partial' ? partial : disrupted}
          </div>
        ))}
      </div>
      <div className='card' style={{ overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ textAlign: 'left', color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border)' }}>
              <th style={{ padding: '10px 8px' }}>District</th><th style={{ padding: '10px 8px' }}>State</th><th style={{ padding: '10px 8px' }}>Status</th><th style={{ padding: '10px 8px' }}>Terrain</th><th style={{ padding: '10px 8px' }}>Roads</th><th style={{ padding: '10px 8px' }}>Open</th><th style={{ padding: '10px 8px' }}>Blocked</th><th style={{ padding: '10px 8px' }}>Incidents</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => {
              const st = statusMeta[d.connectivityStatus] || statusMeta.normal
              return (
                <tr key={d.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '10px 8px', fontWeight: 600 }}>{d.name}</td>
                  <td style={{ padding: '10px 8px' }}>{d.state}</td>
                  <td style={{ padding: '10px 8px' }}><span style={{ padding: '3px 8px', borderRadius: '4px', background: st.bg, color: st.text, fontSize: '11px', fontWeight: 600 }}>{st.label}</span></td>
                  <td style={{ padding: '10px 8px', textTransform: 'capitalize' }}>{d.terrain}</td>
                  <td style={{ padding: '10px 8px' }}>{d.totalRoads}</td>
                  <td style={{ padding: '10px 8px', color: '#22c55e' }}>{d.openRoads}</td>
                  <td style={{ padding: '10px 8px', color: '#ef4444' }}>{d.blockedRoads}</td>
                  <td style={{ padding: '10px 8px' }}>{d.activeDisruptions}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
