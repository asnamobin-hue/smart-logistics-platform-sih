const RoadSegment = require('../models/RoadSegment')
const Alert = require('../models/Alert')
const FieldReport = require('../models/FieldReport')
const { getIO } = require('../config/socket')
const { getDisruptionRisk, getAlternateRouteSuggestion } = require('../services/aiService')
const { recomputeConnectivity } = require('./districtController')

// GET /api/roads?district=..&status=..&type=..&highRiskOnly=true
async function getRoadSegments(req, res, next) {
  try {
    const filter = {}
    if (req.query.district) filter.district = req.query.district
    if (req.query.status) filter.status = req.query.status
    if (req.query.type) filter.type = req.query.type
    if (req.query.highRiskOnly === 'true') filter.isHighRiskCorridor = true

    const segments = await RoadSegment.find(filter).populate('district', 'name state').sort({ riskScore: -1 })
    res.json({ data: segments.map(formatSegment) })
  } catch (err) {
    next(err)
  }
}

// GET /api/roads/:id
async function getRoadSegmentById(req, res, next) {
  try {
    const segment = await RoadSegment.findById(req.params.id).populate('district', 'name state')
    if (!segment) return res.status(404).json({ error: 'Road segment not found' })
    res.json(formatSegment(segment))
  } catch (err) {
    next(err)
  }
}

// POST /api/roads
async function createRoadSegment(req, res, next) {
  try {
    const { name, type, district, path, status, notes } = req.body
    const segment = await RoadSegment.create({ name, type, district, path, status, notes })
    await recomputeConnectivity(district)
    res.status(201).json(formatSegment(segment))
  } catch (err) {
    next(err)
  }
}

// POST /api/roads/:id/predict-risk
// Runs the AI disruption prediction (landslide/flood/rainfall/road-damage/congestion)
// against a road segment and persists the result. Implements requirement (b).
async function predictRisk(req, res, next) {
  try {
    const segment = await RoadSegment.findById(req.params.id).populate('district')
    if (!segment) return res.status(404).json({ error: 'Road segment not found' })

    const {
      weatherCondition = 'Clear',
      rainfallMm = 0,
      recentRouteCount = 0
    } = req.body

    const recentIncidentCount = await FieldReport.countDocuments({
      roadSegment: segment._id,
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    })

    const daysSinceInspection = segment.lastInspected
      ? Math.floor((Date.now() - segment.lastInspected.getTime()) / (24 * 60 * 60 * 1000))
      : 999

    const { riskScore, riskLevel, riskFactors } = await getDisruptionRisk({
      type: segment.type,
      terrain: segment.district?.terrain,
      weatherCondition,
      rainfallMm,
      recentIncidentCount,
      daysSinceInspection,
      recentRouteCount
    })

    segment.riskScore = riskScore
    segment.riskLevel = riskLevel
    segment.riskFactors = riskFactors
    segment.isHighRiskCorridor = riskLevel === 'high' || riskLevel === 'severe'
    if (riskLevel === 'severe' && segment.status !== 'blocked') segment.status = 'blocked'
    else if (riskLevel === 'high' && segment.status === 'open') segment.status = 'restricted'
    await segment.save()

    await recomputeConnectivity(segment.district._id)

    // Requirement (e): automated alerts for high-risk corridors / blocked roads
    if (segment.isHighRiskCorridor) {
      const alert = await Alert.create({
        title: `High-risk corridor: ${segment.name}`,
        message: `${segment.type === 'bridge' ? 'Bridge' : 'Road'} "${segment.name}" in ${segment.district.name} flagged ${riskLevel} risk (${riskFactors.join(', ') || 'general risk'}).`,
        severity: riskLevel === 'severe' ? 'high' : 'medium',
        type: segment.status === 'blocked' ? 'blocked_road' : 'high_risk_corridor',
        district: segment.district._id,
        roadSegment: segment._id
      })
      getIO().emit('alert:new', { id: alert._id, title: alert.title, severity: alert.severity, type: alert.type })
    }

    getIO().emit('road:risk-updated', formatSegment(segment))

    res.json(formatSegment(segment))
  } catch (err) {
    next(err)
  }
}

// POST /api/roads/:id/alternate — suggest an alternate segment and estimated delay
// Implements requirement (c): "AI-based alternate route suggestions and estimated travel delays"
async function suggestAlternate(req, res, next) {
  try {
    const primary = await RoadSegment.findById(req.params.id)
    if (!primary) return res.status(404).json({ error: 'Road segment not found' })

    const { alternateSegmentId, primaryEtaMinutes = 0, alternateEtaMinutes = 0 } = req.body
    let alternate = null
    if (alternateSegmentId) {
      alternate = await RoadSegment.findById(alternateSegmentId)
    } else {
      // naive fallback: pick the lowest-risk open segment in the same district
      alternate = await RoadSegment.findOne({
        district: primary.district,
        _id: { $ne: primary._id },
        status: { $ne: 'blocked' }
      }).sort({ riskScore: 1 })
    }

    const suggestion = await getAlternateRouteSuggestion({
      primaryRiskScore: primary.riskScore,
      alternateRiskScore: alternate?.riskScore ?? 100,
      primaryEtaMinutes,
      alternateEtaMinutes
    })

    res.json({
      primary: formatSegment(primary),
      alternate: alternate ? formatSegment(alternate) : null,
      ...suggestion
    })
  } catch (err) {
    next(err)
  }
}

function formatSegment(doc) {
  return {
    id: doc._id,
    name: doc.name,
    type: doc.type,
    district: doc.district?._id ? { id: doc.district._id, name: doc.district.name, state: doc.district.state } : doc.district,
    path: doc.path,
    status: doc.status,
    riskScore: doc.riskScore,
    riskLevel: doc.riskLevel,
    riskFactors: doc.riskFactors,
    isHighRiskCorridor: doc.isHighRiskCorridor,
    lastInspected: doc.lastInspected,
    notes: doc.notes,
    updatedAt: doc.updatedAt
  }
}

module.exports = {
  getRoadSegments,
  getRoadSegmentById,
  createRoadSegment,
  predictRisk,
  suggestAlternate,
  formatSegment
}
