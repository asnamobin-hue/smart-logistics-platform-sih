import { useEffect, useState } from 'react'
import { ShieldCheck, ShieldQuestion, ShieldAlert, Package, AlertTriangle, Truck, MapPin, Activity, TrendingUp, Clock, CheckCircle, ArrowRight } from 'lucide-react'
import Map from '../components/Map.jsx'
import Loader from '../components/Loader.jsx'
import { getLocations, getDistrictSummary, getAlerts, getVehicles, getDeliveries } from '../services/api.js'
import { connectSocket, disconnectSocket } from '../services/socket.js'

function AnimatedNumber({ value }) {
  const [d, setD] = useState(0)
  useEffect(() => {
    if (!value || value === 0) { setD(0); return }
    let s = 0; const step = value / 50
    const t = setInterval(() => { s += step; if (s >= value) { setD(value); clearInterval(t) } else setD(Math.floor(s)) }, 16)
    return () => clearInterval(t)
  }, [value])
  return <span>{d}</span>
}

const statusMeta = {
  normal: { color: 'var(--success)', bg: 'rgba(32,201,151,0.12)', label: 'Normal' },
  partial: { color: 'var(--warning)', bg: 'rgba(245,166,35,0.12)', label: 'Partial' },
  disrupted: { color: 'var(--danger)', bg: 'rgba(239,71,111,0.12)', label: 'Disrupted' }
}

export default function Dashboard() {
  const [locations, setLocations] = useState([])
  const [districtSummary, setDistrictSummary] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [deliveries, setDeliveries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    Promise.all([getLocations(), getDistrictSummary(), getAlerts(), getVehicles(), getDeliveries()])
      .then(([locRes, distRes, alertRes, vehRes, delRes]) => {
        if (!mounted) return
        setLocations(locRes.data.data || [])
        setDistrictSummary(distRes.data)
        setAlerts(alertRes.data.data || [])
        setVehicles(vehRes.data.data || vehRes.data || [])
        setDeliveries(delRes.data.data || delRes.data || [])
      })
      .catch(() => { if (mounted) setError('Could not load dashboard data.') })
      .finally(() => { if (mounted) setLoading(false) })
    const socket = connectSocket()
    socket.on('location:update', (updated) => {
      setLocations((prev) => {
        const idx = prev.findIndex((l) => l.id === updated.id)
        if (idx === -1) return [...prev, updated]
        const copy = [...prev]; copy[idx] = updated; return copy
      })
    })
    return () => { mounted = false; socket.off('location:update'); disconnectSocket() }
  }, [])

  if (loading) return <Loader text='Loading live data...' />
  if (error) return <div className='card' style={{ padding: 24, textAlign: 'center' }}><p style={{ color: 'var(--danger)' }}>{error}</p></div>

  const essentialCount = locations.filter((l) => l.isEssentialCargo).length
  const delayedVehicles = vehicles.filter((v) => v.status === 'delayed').length
  const activeAlertCount = alerts.filter((a) => !a.resolved).length
  const inTransit = deliveries.filter((d) => d.status === 'in_transit').length
  const delayedDel = deliveries.filter((d) => d.status === 'delayed').length
  const blockedDel = deliveries.filter((d) => d.status === 'blocked').length
  const totalDel = deliveries.length || 1
  const normal = districtSummary ? (districtSummary.connectivityBreakdown.normal || 0) : 0
  const partial = districtSummary ? (districtSummary.connectivityBreakdown.partial || 0) : 0
  const disrupted = districtSummary ? (districtSummary.connectivityBreakdown.disrupted || 0) : 0
  const totalDistricts = normal + partial + disrupted

  const kpis = [
    { l: 'NORMAL', v: normal, c: 'var(--success)', bg: 'rgba(32,201,151,0.12)', ic: ShieldCheck },
    { l: 'PARTIAL', v: partial, c: 'var(--warning)', bg: 'rgba(245,166,35,0.12)', ic: ShieldQuestion },
    { l: 'DISRUPTED', v: disrupted, c: 'var(--danger)', bg: 'rgba(239,71,111,0.12)', ic: ShieldAlert },
    { l: 'ESSENTIAL', v: essentialCount, c: 'var(--pink)', bg: 'rgba(139,197,61,0.12)', ic: Package },
    { l: 'ALERTS', v: activeAlertCount, c: 'var(--danger)', bg: 'rgba(239,71,111,0.12)', ic: AlertTriangle },
    { l: 'DELAYED', v: delayedVehicles, c: 'var(--warning)', bg: 'rgba(245,166,35,0.12)', ic: Truck },
  ]
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.3px' }}>Live Dashboard</h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Real-time NER logistics monitoring</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--success)' }}>
          <span className='status-dot animated' style={{ background: 'var(--success)' }} /> Live
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
        {kpis.map((k, i) => (
          <div key={i} className='kpi-card card-warm stagger-child' style={{background:'rgba(214,189,152,0.28)',borderColor:'rgba(214,189,152,0.35)'}}>
            <div className='kpi-icon' style={{ background: k.bg }}><k.ic size={20} color={k.c} /></div>
            <div className='kpi-value' style={{ color: k.c }}><AnimatedNumber value={k.v} /></div>
            <div className='kpi-label'>{k.l}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        <div className='card' style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gradient-soft)' }}>
              <Activity size={18} color='var(--pink)' />
            </div>
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>Delivery Status</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { label: 'In Transit', count: inTransit, color: 'var(--info)', bg: 'rgba(77,163,255,0.15)' },
              { label: 'Delayed', count: delayedDel, color: 'var(--warning)', bg: 'rgba(245,166,35,0.15)' },
              { label: 'Blocked', count: blockedDel, color: 'var(--danger)', bg: 'rgba(239,71,111,0.15)' },
            ].map((item) => (
              <div key={item.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>{item.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: item.color }}>{item.count} / {deliveries.length}</span>
                </div>
                <div style={{ height: 8, background: 'var(--bg-secondary)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: ((item.count / totalDel) * 100) + '%', height: '100%', background: item.color, borderRadius: 4, transition: 'width 0.8s ease' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className='card' style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(239,71,111,0.12)' }}>
              <AlertTriangle size={18} color='var(--danger)' />
            </div>
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>Recent Alerts</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 200, overflow: 'auto' }}>
            {alerts.slice(0, 6).map((a) => (
              <div key={a.id} className='stagger-child' style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', background: 'var(--bg-secondary)', borderRadius: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: a.severity === 'high' ? 'var(--danger)' : a.severity === 'medium' ? 'var(--warning)' : 'var(--info)', marginTop: 4, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{a.createdAt ? new Date(a.createdAt).toLocaleString() : ''}</div>
                </div>
              </div>
            ))}
            {alerts.length === 0 && <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>No active alerts</p>}
          </div>
        </div>
      </div>
      <div className='card-gradient' style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gradient)' }}>
              <MapPin size={18} color='#fff' />
            </div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700 }}>Live Map</h3>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{locations.length} active location{locations.length !== 1 ? 's' : ''}</div>
            </div>
          </div>
        </div>
        <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
          <Map locations={locations} height='420px' />
        </div>
      </div>
    </div>
  )
}