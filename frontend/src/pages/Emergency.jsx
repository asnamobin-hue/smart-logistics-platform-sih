import { useEffect, useState } from 'react'
import {
  AlertOctagon, MapPin, Truck, ShieldAlert, ShieldCheck, Phone, Radio,
  Home as ShelterIcon, ClipboardList, PlayCircle, XCircle, Package
} from 'lucide-react'
import {
  getIncidents, updateIncidentStatus, getVehicles, setVehicleEmergencyStatus,
  getShelters, getFieldReports, optimizeRoute, getRoadSegments
} from '../services/api.js'
import { getDistanceKm } from '../services/mapService.js'
import {
  INCIDENT_STATUS_META, VEHICLE_EMERGENCY_STATUS_META, CRITICAL_CARGO_TYPES,
  RECOMMENDED_ACTIONS, ROAD_STATUS_COLORS
} from '../utils/constants.js'
import { useEmergencyMode } from '../context/EmergencyModeContext.jsx'
import Map from '../components/Map.jsx'
import Loader from '../components/Loader.jsx'

const ROAD_STATUS_LABEL = { open: 'OPEN', restricted: 'RISKY', blocked: 'BLOCKED' }

export default function Emergency() {
  const emergency = useEmergencyMode()
  const [incidents, setIncidents] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [shelters, setShelters] = useState([])
  const [roadSegments, setRoadSegments] = useState([])
  const [fieldReports, setFieldReports] = useState([])
  const [fieldReportsError, setFieldReportsError] = useState(false)
  const [loading, setLoading] = useState(true)
  const [routingId, setRoutingId] = useState(null)
  const [routeResults, setRouteResults] = useState({}) // incidentId -> route result
  const [activateForm, setActivateForm] = useState({ name: '', role: 'District Authority' })
  const [showActivateForm, setShowActivateForm] = useState(false)

  function loadAll() {
    setLoading(true)
    Promise.all([
      getIncidents(),
      getVehicles(),
      getShelters(),
      getRoadSegments(),
      getFieldReports({ status: 'new' }).catch(() => { setFieldReportsError(true); return { data: { data: [] } } })
    ]).then(([incRes, vehRes, shelRes, roadRes, frRes]) => {
      setIncidents(incRes.data?.data || [])
      setVehicles(vehRes.data?.data || [])
      setShelters(shelRes.data?.data || [])
      setRoadSegments(roadRes.data?.data || [])
      setFieldReports(frRes.data?.data || [])
    }).finally(() => setLoading(false))
  }

  useEffect(() => { loadAll() }, [])

  const essentialVehicles = vehicles.filter((v) => v.isEssentialCargo)
  const criticalVehicles = essentialVehicles.filter((v) => CRITICAL_CARGO_TYPES.includes(v.supplyType))
  const affectedVehicles = essentialVehicles.filter((v) => ['delayed', 'stuck_at_risk'].includes(v.emergencyStatus))
  const reroutedVehicles = essentialVehicles.filter((v) => v.emergencyStatus === 'rerouted')
  const criticalDeliveries = criticalVehicles.filter((v) => v.emergencyStatus !== 'delivered')

  const activeIncidents = incidents.filter((i) => i.status !== 'resolved')
  const blockedRoads = roadSegments.filter((s) => s.status === 'blocked')
  const highRiskRoads = roadSegments.filter((s) => s.status === 'blocked' || s.status === 'restricted')

  const mapLocations = essentialVehicles.map((v) => ({
    id: v.id, name: `${v.vehicleId} → ${v.destination}`, lat: v.lat, lon: v.lon,
    status: v.emergencyStatus, cargoType: v.supplyType,
    color: VEHICLE_EMERGENCY_STATUS_META[v.emergencyStatus]?.color || '#4A8C20'
  }))

  function handleActivate(e) {
    e.preventDefault()
    emergency.activate({ name: activateForm.name || 'Duty Officer', role: activateForm.role })
    setShowActivateForm(false)
  }

  function handleDeactivate() {
    if (window.confirm('Deactivate Emergency Mode? This does not resolve any open incidents.')) {
      emergency.deactivate()
    }
  }

  function handleStatusChange(incidentId, status) {
    updateIncidentStatus(incidentId, status).then(() => loadAll())
  }

  function findAlternateRoute(incident) {
    if (!incident.district) return
    setRoutingId(incident.id)
    optimizeRoute({
      origin: 'Regional Control Centre',
      destination: incident.district.name,
      cargo: 'medicine',
      priority: 'critical'
    }).then((res) => {
      setRouteResults((prev) => ({ ...prev, [incident.id]: res.data }))
      // Mark nearby essential vehicles that are currently delayed/idle as rerouted —
      // "vehicles carrying critical supplies... prioritized for safe alternate routing"
      const nearby = essentialVehicles.filter((v) => (
        ['delayed', 'stuck_at_risk'].includes(v.emergencyStatus) &&
        getDistanceKm(v.lat, v.lon, incident.district.lat, incident.district.lon) < 250
      ))
      Promise.all(nearby.map((v) => setVehicleEmergencyStatus(v.id, 'rerouted'))).then(loadAll)
    }).finally(() => setRoutingId(null))
  }

  if (loading) return <Loader text="Loading emergency status..." />

  // --- Emergency Mode is OFF: compact readiness view + activation control ---
  if (!emergency.active) {
    return (
      <div>
        <div className="card-gradient" style={{ padding: 24, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)' }}>
              <ShieldCheck size={22} color="var(--success)" />
            </div>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800 }}>Emergency Mode — Off</h1>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Normal operations. Activate only during a major disruption or disaster.</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginTop: 12, fontSize: 12 }}>
            <span style={{ color: 'var(--warning)', fontWeight: 700 }}>{activeIncidents.length} unresolved incident(s) on record</span>
            <span style={{ color: 'var(--danger)', fontWeight: 700 }}>{blockedRoads.length} blocked corridor(s)</span>
            <span style={{ color: 'var(--purple)', fontWeight: 700 }}>{criticalDeliveries.length} critical delivery(ies) in transit</span>
          </div>
        </div>

        {!showActivateForm ? (
          <button className="btn btn-primary" onClick={() => setShowActivateForm(true)}>
            <PlayCircle size={16} /> Activate Emergency Mode
          </button>
        ) : (
          <form onSubmit={handleActivate} className="card" style={{ maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Confirm activation as an authorized official. (Prototype: no login system — this records who activated it for the log.)
            </div>
            <label style={{ fontSize: 13 }}>
              Name
              <input required value={activateForm.name} onChange={(e) => setActivateForm((f) => ({ ...f, name: e.target.value }))}
                className="form-input" style={{ marginTop: 4 }} />
            </label>
            <label style={{ fontSize: 13 }}>
              Role
              <select value={activateForm.role} onChange={(e) => setActivateForm((f) => ({ ...f, role: e.target.value }))}
                className="form-select" style={{ marginTop: 4 }}>
                <option>District Authority</option>
                <option>State Disaster Management Officer</option>
                <option>Control Room Operator</option>
              </select>
            </label>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" className="btn btn-primary"><PlayCircle size={16} /> Confirm Activation</button>
              <button type="button" className="btn btn-ghost" onClick={() => setShowActivateForm(false)}>Cancel</button>
            </div>
          </form>
        )}
      </div>
    )
  }

  // --- Emergency Mode is ON ---
  const summary = [
    { label: 'Active Emergencies', value: activeIncidents.length, color: 'var(--danger)' },
    { label: 'Blocked Roads', value: blockedRoads.length, color: 'var(--danger)' },
    { label: 'High/Critical Risk Roads', value: highRiskRoads.length, color: 'var(--warning)' },
    { label: 'Vehicles Affected', value: affectedVehicles.length, color: 'var(--warning)' },
    { label: 'Vehicles Rerouted', value: reroutedVehicles.length, color: 'var(--info)' },
    { label: 'Critical Deliveries', value: criticalDeliveries.length, color: 'var(--purple)' },
    { label: 'Pending Field Reports', value: fieldReports.length, color: 'var(--pink)' }
  ]

  return (
    <div>
      {/* Activation banner — clear, persistent visual indication (requirement 1) */}
      <div className="card-gradient" style={{
        padding: 24, marginBottom: 24, border: '2px solid var(--danger)',
        background: 'linear-gradient(135deg, rgba(192,57,43,0.1), rgba(192,57,43,0.02))'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--danger)' }} className="status-dot animated">
              <AlertOctagon size={22} color="#fff" />
            </div>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--danger)' }}>🚨 EMERGENCY MODE ACTIVE</h1>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Activated by {emergency.activatedBy} ({emergency.role}) · {emergency.activatedAt ? new Date(emergency.activatedAt).toLocaleString() : ''}
              </p>
            </div>
          </div>
          <button className="btn btn-ghost" onClick={handleDeactivate} style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>
            <XCircle size={16} /> Deactivate
          </button>
        </div>
      </div>

      {/* Emergency summary (requirement 9) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
        {summary.map((s) => (
          <div key={s.label} className="kpi-card">
            <div className="kpi-value" style={{ color: s.color }}>{s.value}</div>
            <div className="kpi-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Critical incidents — type, location, severity, affected road, status (requirement 2 & 10) */}
      <div className="card-gradient" style={{ padding: 24, marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <ShieldAlert size={18} color="var(--danger)" /> Critical Incidents
        </h2>
        {activeIncidents.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>No unresolved incidents.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[...activeIncidents].sort((a, b) => (b.severity === 'high' ? 1 : 0) - (a.severity === 'high' ? 1 : 0)).map((inc) => (
              <div key={inc.id} style={{
                padding: 14, background: 'var(--bg-secondary)', borderRadius: 10,
                borderLeft: `3px solid ${inc.severity === 'high' ? 'var(--danger)' : 'var(--warning)'}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, textTransform: 'capitalize' }}>
                      {inc.type.replace('_', ' ')} · {inc.district?.name || inc.location?.name}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{inc.description}</div>
                    {inc.roadSegment && (
                      <div style={{ fontSize: 11, marginTop: 6 }}>
                        Affected road: <strong>{inc.roadSegment.name}</strong>{' '}
                        <span style={{ color: ROAD_STATUS_COLORS[inc.roadSegment.status], fontWeight: 700 }}>
                          ({ROAD_STATUS_LABEL[inc.roadSegment.status] || inc.roadSegment.status})
                        </span>
                      </div>
                    )}
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 6, fontStyle: 'italic' }}>
                      Recommended: {RECOMMENDED_ACTIONS[inc.type] || 'Assess on-site and classify severity.'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, textTransform: 'uppercase', padding: '3px 10px', borderRadius: 999,
                      color: '#fff', background: inc.severity === 'high' ? 'var(--danger)' : 'var(--warning)'
                    }}>{inc.severity}</span>
                    <select
                      value={inc.status}
                      onChange={(e) => handleStatusChange(inc.id, e.target.value)}
                      className="form-select"
                      style={{ fontSize: 11, padding: '4px 8px', color: INCIDENT_STATUS_META[inc.status]?.color, fontWeight: 700 }}
                    >
                      <option value="active">Active</option>
                      <option value="under_response">Under Response</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>
                </div>
                {inc.district && (
                  <button
                    className="btn btn-ghost"
                    style={{ marginTop: 10, fontSize: 12, padding: '6px 12px' }}
                    disabled={routingId === inc.id}
                    onClick={() => findAlternateRoute(inc)}
                  >
                    <Radio size={14} /> {routingId === inc.id ? 'Calculating…' : (routeResults[inc.id] ? 'Recalculate alternate route' : 'Find alternate route for critical supplies')}
                  </button>
                )}
                {routeResults[inc.id] && (
                  <div style={{ marginTop: 10, padding: 12, background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)' }}>
                    <div style={{ fontWeight: 700, fontSize: 12 }}>{routeResults[inc.id].recommended.name}</div>
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', margin: '6px 0', fontSize: 11 }}>
                      <span><strong>{routeResults[inc.id].recommended.distance} km</strong></span>
                      <span><strong>{routeResults[inc.id].recommended.eta}h</strong> ETA</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Route changed due to {inc.type.replace('_', ' ')}: {routeResults[inc.id].recommended.reason}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Road / area status — read-only for this prototype (requirement 7) */}
      <div className="card-gradient" style={{ padding: 24, marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <MapPin size={18} color="var(--warning)" /> Road & Area Status
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          {roadSegments.filter((s) => s.status !== 'open').map((s) => (
            <div key={s.id} style={{ padding: 14, background: 'var(--bg-secondary)', borderRadius: 10, border: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{s.name}</div>
              <div style={{ fontSize: 11, marginTop: 4 }}>
                <span style={{ color: ROAD_STATUS_COLORS[s.status], fontWeight: 700 }}>{ROAD_STATUS_LABEL[s.status]}</span>
                {' · '}{s.riskLevel} risk ({s.riskScore})
              </div>
            </div>
          ))}
          {roadSegments.filter((s) => s.status !== 'open').length === 0 && (
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>All monitored roads currently OPEN.</p>
          )}
        </div>
      </div>

      {/* Vehicle tracking (requirements 3 & 6) */}
      <div className="card-gradient" style={{ padding: 24, marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Truck size={18} color="var(--purple)" /> Critical-Supply Vehicle Tracking
        </h2>
        <Map locations={mapLocations} shelters={shelters} height="360px" />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
          {Object.entries(VEHICLE_EMERGENCY_STATUS_META).map(([key, meta]) => (
            <span key={key} style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: meta.color, display: 'inline-block' }} />
              {meta.label} ({essentialVehicles.filter((v) => v.emergencyStatus === key).length})
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
          {essentialVehicles.map((v) => (
            <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: 8, fontSize: 12 }}>
              <span><Package size={12} style={{ verticalAlign: 'middle', marginRight: 6 }} />{v.vehicleId} — {v.supplyType.replace('_', ' ')} → {v.destination}</span>
              <span style={{ color: VEHICLE_EMERGENCY_STATUS_META[v.emergencyStatus]?.color, fontWeight: 700, fontSize: 11 }}>
                {VEHICLE_EMERGENCY_STATUS_META[v.emergencyStatus]?.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Shelters */}
      <div className="card-gradient" style={{ padding: 24, marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <ShelterIcon size={18} color="var(--success)" /> Relief Shelters
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          {shelters.map((s) => (
            <div key={s.id} style={{ padding: 14, background: 'var(--bg-secondary)', borderRadius: 10, border: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{s.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4, textTransform: 'capitalize' }}>
                {s.type.replace('_', ' ')} · {s.occupancy}/{s.capacity} occupied
              </div>
              <div style={{ fontSize: 11, marginTop: 4, fontWeight: 700, textTransform: 'uppercase', color: s.status === 'open' ? 'var(--success)' : s.status === 'full' ? 'var(--warning)' : 'var(--danger)' }}>
                {s.status}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Field officer reports (requirement 8) */}
      <div className="card-gradient" style={{ padding: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <ClipboardList size={18} color="var(--info)" /> Pending Field Reports
        </h2>
        {fieldReportsError ? (
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Field reports need the backend database connected — showing none for now.</p>
        ) : fieldReports.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>No new field reports pending review.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {fieldReports.map((r) => (
              <div key={r.id} style={{ padding: 12, background: 'var(--bg-secondary)', borderRadius: 8, fontSize: 12 }}>
                <strong style={{ textTransform: 'capitalize' }}>{r.incidentType.replace('_', ' ')}</strong> — {r.description}
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                  Reported by {r.reporterName} ({r.reporterRole}) · severity: {r.severity || 'n/a'}
                </div>
              </div>
            ))}
          </div>
        )}
        <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 10 }}>
          <a href="/field-report" style={{ color: 'var(--info)', fontWeight: 600 }}>Open the field report form →</a>
        </p>
      </div>

      <div style={{ marginTop: 20, textAlign: 'center', fontSize: 11, color: 'var(--text-secondary)' }}>
        <Phone size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
        For real emergencies, contact district disaster management authorities directly.
      </div>
    </div>
  )
}
