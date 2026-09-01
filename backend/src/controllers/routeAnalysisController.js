const RoadSegment = require('../models/RoadSegment')
const FieldReport = require('../models/FieldReport')
const { geocodePlace, getRouteOptions, GeocodeError } = require('../services/routingService')
const { getDistanceKm } = require('../services/mapService')
const { analyzeRouteRisk } = require('../services/aiService')
const { DEMO_DISRUPTIONS } = require('../data/demoRouteCorridor')

const NEAR_ROUTE_THRESHOLD_KM = 15
const FIELD_REPORT_LOOKBACK_DAYS = 14

const INCIDENT_TYPE_LABELS = {
  landslide: 'landslide',
  flood: 'flood',
  road_damage: 'road_damage',
  bridge_damage: 'bridge_damage',
  blocked_road: 'blocked_road',
  heavy_rainfall: 'heavy_rainfall',
  traffic_congestion: 'traffic_congestion',
  other: 'other'
}

const ROAD_STATUS_TO_SEVERITY = { open: 'low', restricted: 'moderate', blocked: 'severe' }

// Minimum distance (km) from a point to any vertex of a route path.
function minDistanceToPath(point, path) {
  let min = Infinity
  // Sample every 3rd point for performance on long OSRM geometries — dense enough
  // for a 10-20km "near this route" check.
  for (let i = 0; i < path.length; i += 3) {
    const [lat, lon] = path[i]
    const d = getDistanceKm(point.lat, point.lon, lat, lon)
    if (d < min) min = d
  }
  return min
}

// Pulls live disruptions from the database (blocked/restricted roads + recent,
// unresolved field reports). Falls back to curated demo disruptions if the DB
// has nothing relevant or isn't reachable — so the feature still works without data.
async function collectDisruptions() {
  try {
    const since = new Date(Date.now() - FIELD_REPORT_LOOKBACK_DAYS * 24 * 60 * 60 * 1000)
    const [riskySegments, reports] = await Promise.all([
      RoadSegment.find({ status: { $ne: 'open' } }).limit(50),
      FieldReport.find({ status: { $ne: 'resolved' }, createdAt: { $gte: since } }).limit(50)
    ])

    const fromSegments = riskySegments
      .filter((s) => Array.isArray(s.path) && s.path.length > 0)
      .map((s) => ({
        type: s.riskFactors?.[0] || (s.type === 'bridge' ? 'bridge_damage' : 'road_damage'),
        severity: s.riskLevel || ROAD_STATUS_TO_SEVERITY[s.status] || 'moderate',
        name: s.name,
        lat: s.path[Math.floor(s.path.length / 2)][0],
        lon: s.path[Math.floor(s.path.length / 2)][1]
      }))

    const fromReports = reports
      .filter((r) => r.lat != null && r.lon != null)
      .map((r) => ({
        type: INCIDENT_TYPE_LABELS[r.incidentType] || 'other',
        severity: ['landslide', 'flood', 'bridge_damage', 'blocked_road'].includes(r.incidentType) ? 'high' : 'moderate',
        name: r.description?.slice(0, 60) || 'Field report',
        lat: r.lat,
        lon: r.lon
      }))

    const combined = [...fromSegments, ...fromReports]
    return combined.length > 0 ? combined : DEMO_DISRUPTIONS
  } catch {
    // DB unreachable (e.g. offline demo) — use curated fallback data instead of failing.
    return DEMO_DISRUPTIONS
  }
}

// POST /api/routes/analyze
// Body: { origin, destination, cargo, priority }
async function analyzeRoute(req, res, next) {
  try {
    const { origin: originText, destination: destinationText, cargo, priority } = req.body

    let origin, destination
    try {
      ;[origin, destination] = await Promise.all([geocodePlace(originText), geocodePlace(destinationText)])
    } catch (err) {
      if (err instanceof GeocodeError) return res.status(422).json({ error: err.message })
      throw err
    }

    const { routes: routeOptions, source } = await getRouteOptions(origin, destination, originText, destinationText)
    const disruptions = await collectDisruptions()

    // Attach nearby disruptions to each route.
    const routesWithDisruptions = routeOptions.map((route) => ({
      ...route,
      disruptions: disruptions.filter((d) => minDistanceToPath(d, route.path) <= NEAR_ROUTE_THRESHOLD_KM)
    }))

    const routeSummaries = routesWithDisruptions.map((r) => ({
      id: r.id,
      name: r.name,
      distanceKm: r.distanceKm,
      etaMinutes: r.etaMinutes,
      disruptions: r.disruptions.map(({ type, severity, name }) => ({ type, severity, name }))
    }))

    const { results, usedAI } = await analyzeRouteRisk({ routes: routeSummaries, cargo, priority })
    const resultById = Object.fromEntries(results.map((r) => [r.id, r]))

    const rankOrder = { recommended: 0, alternative: 1, avoid: 2 }
    const merged = routesWithDisruptions
      .map((route) => {
        const analysis = resultById[route.id] || {
          label: 'alternative',
          riskLevel: 'moderate',
          status: 'Open',
          delayMinutes: 0,
          reasons: ['No additional risk data available for this route']
        }
        return {
          id: route.id,
          label: analysis.label,
          name: route.name,
          status: analysis.status,
          distanceKm: route.distanceKm,
          etaMinutes: route.etaMinutes,
          delayMinutes: analysis.delayMinutes,
          riskLevel: analysis.riskLevel,
          reasons: analysis.reasons,
          path: route.path,
          disruptions: route.disruptions
        }
      })
      .sort((a, b) => (rankOrder[a.label] ?? 3) - (rankOrder[b.label] ?? 3))
      .map((r, idx) => ({ rank: idx + 1, ...r }))

    res.json({
      origin,
      destination,
      cargo,
      priority,
      usedAI,
      source,
      generatedAt: new Date().toISOString(),
      routes: merged
    })
  } catch (err) {
    next(err)
  }
}

module.exports = { analyzeRoute }
