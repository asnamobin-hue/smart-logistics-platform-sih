const Route = require('../models/Route')
const { getDistanceKm, estimateEtaMinutes } = require('../services/mapService')

// GET /api/routes?page=1&limit=20&status=active
async function getRoutes(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20))
    const skip = (page - 1) * limit

    const filter = {}
    if (req.query.status) filter.status = req.query.status

    const [routes, total] = await Promise.all([
      Route.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Route.countDocuments(filter)
    ])

    res.json({
      data: routes.map(formatRoute),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    })
  } catch (err) {
    next(err)
  }
}

// POST /api/routes
async function createRoute(req, res, next) {
  try {
    const { origin, destination, originLat, originLon, destLat, destLon } = req.body

    let distanceKm, etaMinutes
    if (originLat != null && originLon != null && destLat != null && destLon != null) {
      distanceKm = getDistanceKm(originLat, originLon, destLat, destLon)
      etaMinutes = estimateEtaMinutes(distanceKm)
    }

    const route = await Route.create({
      origin, destination, originLat, originLon, destLat, destLon,
      distanceKm, etaMinutes
    })

    res.status(201).json(formatRoute(route))
  } catch (err) {
    next(err)
  }
}

// POST /api/routes/optimize
async function optimizeRoute(req, res, next) {
  try {
    const { distanceKm = 0, weatherCondition = 'Clear', recentRouteCount = 0 } = req.body
    const { getDelayRisk, getDemandEstimate } = require('../services/aiService')

    const [risk, demand] = await Promise.all([
      getDelayRisk(distanceKm, weatherCondition),
      getDemandEstimate(recentRouteCount)
    ])

    res.json({ suggestion: 'No changes needed', ...risk, ...demand })
  } catch (err) {
    next(err)
  }
}

function formatRoute(doc) {
  return {
    id: doc._id,
    origin: doc.origin,
    destination: doc.destination,
    originLat: doc.originLat,
    originLon: doc.originLon,
    destLat: doc.destLat,
    destLon: doc.destLon,
    distanceKm: doc.distanceKm,
    etaMinutes: doc.etaMinutes,
    status: doc.status,
    createdAt: doc.createdAt
  }
}

module.exports = { getRoutes, createRoute, optimizeRoute, formatRoute }