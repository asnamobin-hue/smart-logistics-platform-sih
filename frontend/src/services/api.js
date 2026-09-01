import axios from 'axios'
import demoData from '../demo-data/demoData.json'
import { getDistanceKm } from './mapService.js'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000
})

// Attach auth token automatically if one exists (for future login support)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error('API Error:', error.response.status, error.response.data)
    } else if (error.request) {
      console.error('No response from server. Is the backend running?')
    } else {
      console.error('Request setup error:', error.message)
    }
    return Promise.reject(error)
  }
)

/* ============================================================================
 * DEMO DATA WIRING (temporary)
 * ----------------------------------------------------------------------------
 * The real backend endpoints below are commented out (not deleted) next to
 * each function so they can be swapped back in later — just uncomment the
 * `api.get/post/patch(...)` line and delete the demo-backed version.
 *
 * All demo data comes from ONE source: src/demo-data/demoData.json
 * (Guwahati → Shillong corridor only). Nothing here invents new data —
 * these helpers only reshape that one file into the same response shapes
 * the real API would return, so pages/components need no changes.
 * ========================================================================== */

const clone = (value) => JSON.parse(JSON.stringify(value))
const asAxiosResponse = (data) => Promise.resolve({ data })

// Mutable in-memory copies so demo "create route" / "resolve alert" actions
// feel real during a session, without touching demoData.json itself.
let demoRoutesState = clone(demoData.routes)
let demoAlertsState = null // lazily built the first time getAlerts() is called

// --- Emergency Mode (in-memory demo state, mirrors the pattern above) ---
let demoEmergencyState = { active: false, activatedBy: null, role: null, activatedAt: null, note: null }
// Incident lifecycle: active -> under_response -> resolved. Seeded from demoData.incidents.
let demoIncidentsState = clone(demoData.incidents)
// Roads whose status has reverted to 'open' because all incidents referencing them were resolved
let demoRoadOverrides = {}
// Per-vehicle emergency status set when a vehicle is rerouted/marked delivered during Emergency Mode
let demoVehicleEmergencyOverrides = {}

const segmentsById = () => {
  const all = [...demoData.roads, ...demoData.bridges]
  return Object.fromEntries(all.map((s) => [s.id, s]))
}

function buildRoadSegments() {
  const districts = Object.fromEntries(demoData.districts.map((d) => [d.id, d]))
  return [...demoData.roads, ...demoData.bridges].map((seg) => ({
    ...seg,
    status: demoRoadOverrides[seg.id] || seg.status,
    district: districts[seg.districtId] || null
  }))
}

function buildLocationsFromVehicles() {
  const statusMap = { in_transit: 'active', delayed: 'active', idle: 'idle', delivered: 'active' }
  const colorMap = {
    medicine: '#ef4444',
    food_supplies: '#22c55e',
    agricultural_produce: '#84cc16',
    construction_material: '#f59e0b',
    general: '#3b82f6'
  }
  return demoData.vehicles.map((v) => ({
    id: v.id,
    name: `${v.vehicleId} → ${v.destination}`,
    type: 'vehicle',
    lat: v.location.lat,
    lon: v.location.lon,
    status: statusMap[v.status] || 'active',
    color: colorMap[v.supplyType] || '#3b82f6',
    cargoType: v.supplyType,
    isEssentialCargo: v.isEssentialCargo
  }))
}

function buildDistrictSummary() {
  const breakdown = { normal: 0, partial: 0, disrupted: 0 }
  demoData.districts.forEach((d) => { breakdown[d.connectivityStatus] = (breakdown[d.connectivityStatus] || 0) + 1 })
  return {
    connectivityBreakdown: breakdown,
    districts: demoData.districts.map((d) => ({
      id: d.id, name: d.name, state: d.state,
      connectivityStatus: d.connectivityStatus, activeDisruptions: d.activeDisruptions
    }))
  }
}

// incident type -> Alert `type` enum used by the Alerts page/AlertCard
const incidentToAlertType = {
  landslide: 'high_risk_corridor',
  bridge_damage: 'high_risk_corridor',
  heavy_rainfall: 'weather',
  flood: 'weather',
  blocked_road: 'blocked_road',
  traffic_congestion: 'general',
  road_damage: 'general',
  other: 'general'
}

function buildAlertsFromIncidents() {
  const segments = segmentsById()
  return demoIncidentsState.map((inc) => {
    const segment = segments[inc.relatedSegmentId]
    return {
      id: inc.id,
      title: `${segment ? segment.name : inc.location.name} — ${inc.type.replace('_', ' ')}`,
      message: inc.description,
      severity: inc.severity,
      type: incidentToAlertType[inc.type] || 'general',
      resolved: inc.status === 'resolved',
      status: inc.status,
      incidentType: inc.type,
      location: inc.location,
      roadSegment: segment ? { id: segment.id, name: segment.name, status: demoRoadOverrides[segment.id] || segment.status } : null,
      createdAt: inc.reportedAt
    }
  })
}

// Recompute whether a road segment's status should revert to 'open' — true once
// every incident referencing it has been resolved (SIH requirement: once
// resolved, the affected road/route status returns to the appropriate normal state).
function recomputeRoadOverride(segmentId) {
  if (!segmentId) return
  const related = demoIncidentsState.filter((i) => i.relatedSegmentId === segmentId)
  const allResolved = related.length > 0 && related.every((i) => i.status === 'resolved')
  if (allResolved) demoRoadOverrides[segmentId] = 'open'
  else delete demoRoadOverrides[segmentId]
}

// ---- Emergency Mode ----
export const getEmergencyStatus = () => asAxiosResponse({ ...demoEmergencyState })
export const activateEmergencyMode = ({ name, role, note } = {}) => {
  demoEmergencyState = {
    active: true,
    activatedBy: name || 'Duty Officer',
    role: role || 'District Authority',
    activatedAt: new Date().toISOString(),
    note: note || null
  }
  return asAxiosResponse({ ...demoEmergencyState })
}
export const deactivateEmergencyMode = () => {
  demoEmergencyState = { active: false, activatedBy: null, role: null, activatedAt: null, note: null }
  return asAxiosResponse({ ...demoEmergencyState })
}

// ---- Incidents (Emergency Mode's incident lifecycle: active/under_response/resolved) ----
export const getIncidents = () => {
  const segments = segmentsById()
  const districts = Object.fromEntries(demoData.districts.map((d) => [d.id, d]))
  const data = demoIncidentsState.map((inc) => {
    const segment = segments[inc.relatedSegmentId]
    const district = segment ? districts[segment.districtId] : null
    return {
      ...inc,
      roadSegment: segment ? { id: segment.id, name: segment.name, status: demoRoadOverrides[segment.id] || segment.status, riskLevel: segment.riskLevel } : null,
      district: district ? { id: district.id, name: district.name, state: district.state, lat: district.lat, lon: district.lon } : null
    }
  })
  return asAxiosResponse({ data })
}
export const updateIncidentStatus = (id, status) => {
  demoIncidentsState = demoIncidentsState.map((i) => (i.id === id ? { ...i, status } : i))
  const inc = demoIncidentsState.find((i) => i.id === id)
  if (inc?.relatedSegmentId) recomputeRoadOverride(inc.relatedSegmentId)
  demoAlertsState = buildAlertsFromIncidents()
  return asAxiosResponse(demoAlertsState.find((a) => a.id === id))
}

// ---- Shelters ----
export const getShelters = () => asAxiosResponse({ data: demoData.shelters || [] })
export const getNearestShelters = (lat, lon, limit = 3) => {
  const list = (demoData.shelters || [])
    .map((s) => ({ ...s, distanceKm: Math.round(getDistanceKm(lat, lon, s.lat, s.lon) * 10) / 10 }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit)
  return asAxiosResponse({ data: list })
}

// ---- Vehicle emergency status (On Route / Rerouted / Delayed / Stuck-At-Risk / Delivered) ----
function deriveVehicleEmergencyStatus(v) {
  if (demoVehicleEmergencyOverrides[v.id]) return demoVehicleEmergencyOverrides[v.id]
  if (v.status === 'delayed') return 'delayed'
  if (v.status === 'idle') return 'stuck_at_risk'
  return 'on_route'
}
export const setVehicleEmergencyStatus = (id, status) => {
  demoVehicleEmergencyOverrides[id] = status
  return asAxiosResponse({ id, emergencyStatus: status })
}

// ---- Locations ----
// export const getLocations = () => api.get('/locations')
export const getLocations = () => asAxiosResponse({ data: buildLocationsFromVehicles() })
export const getLocationById = (id) => api.get(`/locations/${id}`)

// ---- Routes ----
// export const getRoutes = () => api.get('/routes')
export const getRoutes = () => asAxiosResponse({ data: demoRoutesState, pagination: { total: demoRoutesState.length } })
// export const createRoute = (data) => api.post('/routes', data)
export const createRoute = (data) => {
  const newRoute = {
    id: `demo-route-${String(demoRoutesState.length + 1).padStart(2, '0')}`,
    status: 'pending',
    ...data
  }
  demoRoutesState = [...demoRoutesState, newRoute]
  return asAxiosResponse(newRoute)
}
// export const optimizeRoute = (data) => api.post('/routes/optimize', data)
export const optimizeRoute = (data) => {
  const { origin = 'Origin', destination = 'Destination', cargo = 'medicine', priority = 'high' } = data || {}

  // Find a road/bridge segment with a live risk score to base the AI reasoning on,
  // so the numbers stay consistent with the rest of the demo dataset.
  const segments = [...demoData.roads, ...demoData.bridges]
  const riskiest = segments.reduce((a, b) => (b.riskScore > (a?.riskScore || 0) ? b : a), null)
  const safest = segments.reduce((a, b) => (b.riskScore < (a?.riskScore ?? 999) ? b : a), null)

  const baseDistance = 120 + Math.round((origin.length + destination.length) * 3.2)
  const priorityBoost = { critical: 0.7, high: 0.85, medium: 1, low: 1.15 }[priority] || 1
  const distance = Math.round(baseDistance * priorityBoost)
  const eta = Math.max(2, Math.round(distance / 42))

  const result = {
    id: `demo-opt-${Date.now()}`,
    from: { name: origin },
    to: { name: destination },
    cargo,
    priority,
    recommended: {
      name: `${origin} – ${safest?.name || 'Main Corridor'} – ${destination}`,
      distance,
      eta,
      riskLevel: safest?.riskLevel || 'low',
      reason: `Avoids ${riskiest?.name || 'the highest-risk segment'} (risk score ${riskiest?.riskScore ?? 'N/A'}) and routes via ${safest?.name || 'a lower-risk corridor'} — best fit for ${priority}-priority ${cargo.replace('_', ' ')} cargo.`
    },
    alternatives: [
      {
        name: `${origin} – ${riskiest?.name || 'Alternate Corridor'} – ${destination}`,
        distance: Math.round(distance * 0.9),
        eta: Math.max(2, Math.round((distance * 0.9) / 38)),
        riskLevel: riskiest?.riskLevel || 'high',
        reason: `Shorter but passes through ${riskiest?.name || 'a flagged segment'} — higher disruption risk in current conditions.`
      }
    ]
  }

  return asAxiosResponse(result)
}

// ---- Alerts ----
// export const getAlerts = () => api.get('/alerts')
export const getAlerts = () => {
  if (!demoAlertsState) demoAlertsState = buildAlertsFromIncidents()
  return asAxiosResponse({ data: demoAlertsState, pagination: { total: demoAlertsState.length } })
}
// export const resolveAlert = (id) => api.patch(`/alerts/${id}/resolve`)
export const resolveAlert = (id) => updateIncidentStatus(id, 'resolved')

// ---- Analytics ----
// export const getAnalytics = () => api.get('/analytics')
export const getAnalytics = () => {
  const deliveryTrend = Object.entries(
    demoData.deliveries.reduce((acc, d) => {
      const date = d.dispatchedAt.slice(0, 10)
      acc[date] = (acc[date] || 0) + 1
      return acc
    }, {})
  ).sort(([a], [b]) => a.localeCompare(b)).map(([date, deliveries]) => ({ date, deliveries }))

  const routeStatusBreakdown = Object.entries(
    demoRoutesState.reduce((acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc }, {})
  ).map(([status, count]) => ({ status, count }))

  const alertsBySeverity = Object.entries(
    demoData.incidents.reduce((acc, i) => { acc[i.severity] = (acc[i.severity] || 0) + 1; return acc }, {})
  ).map(([severity, count]) => ({ severity, count }))

  return asAxiosResponse({ deliveryTrend, routeStatusBreakdown, alertsBySeverity })
}

// ---- Weather ----
export const getWeather = (lat, lon) => api.get(`/weather?lat=${lat}&lon=${lon}`)

// ---- Districts (district-wise connectivity dashboard) ----
export const getDistricts = (params) => api.get('/districts', { params })
// export const getDistrictSummary = () => api.get('/districts/summary')
export const getDistrictSummary = () => asAxiosResponse(buildDistrictSummary())
export const getDistrictById = (id) => api.get(`/districts/${id}`)

// ---- Road / bridge accessibility & disruption prediction ----
// export const getRoadSegments = (params) => api.get('/roads', { params })
export const getRoadSegments = () => asAxiosResponse({ data: buildRoadSegments() })
export const getRoadSegmentById = (id) => api.get(`/roads/${id}`)
export const predictRoadRisk = (id, data) => api.post(`/roads/${id}/predict-risk`, data)
// export const suggestAlternateRoad = (id, data) => api.post(`/roads/${id}/alternate`, data)
export const suggestAlternateRoad = (id) => {
  const segments = segmentsById()
  const segment = segments[id]
  if (!segment) return asAxiosResponse({ useAlternate: false, reason: 'Segment not found in demo data.' })

  const isRisky = segment.riskLevel === 'high' || segment.riskLevel === 'severe'
  if (!isRisky) {
    return asAxiosResponse({ useAlternate: false, reason: 'Primary route risk is currently within acceptable limits.' })
  }
  const alternate = [...demoData.roads, ...demoData.bridges]
    .filter((s) => s.id !== id && (s.riskLevel === 'low' || s.riskLevel === 'moderate'))
    .sort((a, b) => a.riskScore - b.riskScore)[0]

  return asAxiosResponse({
    useAlternate: true,
    reason: `${segment.name} is flagged ${segment.riskLevel} risk (${segment.riskFactors.join(', ') || 'general risk'}).`,
    alternate: alternate ? { id: alternate.id, name: alternate.name, riskScore: alternate.riskScore } : null,
    estimatedDelayMinutes: alternate ? 25 : null
  })
}

// ---- Field reports (geo-tagged incident reporting, offline-sync aware) ----
export const getFieldReports = (params) => api.get('/field-reports', { params })
export const createFieldReport = (formData) =>
  api.post('/field-reports', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
export const updateFieldReportStatus = (id, status) =>
  api.patch(`/field-reports/${id}/status`, { status })


// ---- Vehicles (detailed tracking) ----
export const getVehicles = () => asAxiosResponse({
  data: (demoData.vehicles || []).map((v) => ({ ...v, emergencyStatus: deriveVehicleEmergencyStatus(v) }))
})
export const getVehicleById = (id) => {
  const v = (demoData.vehicles || []).find((v) => v.id === id)
  return v ? asAxiosResponse(v) : Promise.reject(new Error('Vehicle not found'))
}

// ---- Deliveries (supply monitoring) ----
export const getDeliveries = () => asAxiosResponse({ data: demoData.deliveries || [] })
export const getDeliveryById = (id) => {
  const d = (demoData.deliveries || []).find((d) => d.id === id)
  return d ? asAxiosResponse(d) : Promise.reject(new Error('Delivery not found'))
}

// ---- All Districts (for district monitoring page) ----
export const getAllDistricts = () => asAxiosResponse({ data: demoData.districts || [] })

// ---- Route Suggestions (for AI route optimizer) ----
export const getRouteSuggestions = () => asAxiosResponse({ data: demoData.routeSuggestions || [] })
export const getRouteSuggestionById = (id) => {
  const rs = (demoData.routeSuggestions || []).find((r) => r.id === id)
  return rs ? asAxiosResponse(rs) : Promise.reject(new Error('Suggestion not found'))
}

/* ============================================================================
 * EMERGENCY SAFETY LOCATOR (Emergency Mode overlay — shelters/hospitals/police
 * near the user, NER region only). Tries the real backend first, falls back
 * to the local emergencyData.json demo file, same pattern as everything else
 * in this file. Additive only — does not touch the existing Emergency Mode
 * activation flow (getEmergencyStatus/activate/deactivate above).
 * ========================================================================== */
import emergencyDemoData from '../demo-data/emergencyData.json'

export const getEmergencyData = async () => {
  try {
    return await api.get('/emergency/points')
  } catch (err) {
    // Emergency Mode is a safety-assistance demo and must remain usable even
    // when the backend endpoint is unavailable or returns a server error.
    console.warn('Emergency API unavailable; using local prototype emergency data.')
    return asAxiosResponse({
      data: clone(emergencyDemoData),
      isPrototypeData: true,
      disclaimer: 'These are predefined/prototype safe points and contacts for demonstration only — not a guarantee of real-time safety.',
      source: 'local-demo-fallback'
    })
  }
}

export default api