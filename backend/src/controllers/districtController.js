const District = require('../models/District')
const RoadSegment = require('../models/RoadSegment')

// GET /api/districts
async function getDistricts(req, res, next) {
  try {
    const filter = {}
    if (req.query.state) filter.state = req.query.state
    if (req.query.connectivityStatus) filter.connectivityStatus = req.query.connectivityStatus

    const districts = await District.find(filter).sort({ name: 1 })
    res.json({ data: districts.map(formatDistrict) })
  } catch (err) {
    next(err)
  }
}

// GET /api/districts/:id
async function getDistrictById(req, res, next) {
  try {
    const district = await District.findById(req.params.id)
    if (!district) return res.status(404).json({ error: 'District not found' })

    const roadSegments = await RoadSegment.find({ district: district._id })
    res.json({ ...formatDistrict(district), roadSegments: roadSegments.map((r) => r._id) })
  } catch (err) {
    next(err)
  }
}

// GET /api/districts/summary — used by the district-wise connectivity dashboard
async function getDistrictSummary(req, res, next) {
  try {
    const districts = await District.find().sort({ name: 1 })

    const counts = { normal: 0, partial: 0, disrupted: 0 }
    districts.forEach((d) => {
      counts[d.connectivityStatus] = (counts[d.connectivityStatus] || 0) + 1
    })

    res.json({
      totalDistricts: districts.length,
      connectivityBreakdown: counts,
      districts: districts.map(formatDistrict)
    })
  } catch (err) {
    next(err)
  }
}

// Recomputes a district's connectivityStatus + activeDisruptions from its
// RoadSegments. Called after road segment status/risk changes.
async function recomputeConnectivity(districtId) {
  const segments = await RoadSegment.find({ district: districtId })
  const blocked = segments.filter((s) => s.status === 'blocked').length
  const restricted = segments.filter((s) => s.status === 'restricted').length
  const highRisk = segments.filter((s) => s.riskLevel === 'severe' || s.riskLevel === 'high').length

  let connectivityStatus = 'normal'
  if (blocked > 0) connectivityStatus = 'disrupted'
  else if (restricted > 0 || highRisk > 0) connectivityStatus = 'partial'

  await District.findByIdAndUpdate(districtId, {
    connectivityStatus,
    activeDisruptions: blocked + restricted
  })
}

function formatDistrict(doc) {
  return {
    id: doc._id,
    name: doc.name,
    state: doc.state,
    lat: doc.lat,
    lon: doc.lon,
    connectivityStatus: doc.connectivityStatus,
    terrain: doc.terrain,
    activeDisruptions: doc.activeDisruptions,
    updatedAt: doc.updatedAt
  }
}

module.exports = {
  getDistricts,
  getDistrictById,
  getDistrictSummary,
  recomputeConnectivity,
  formatDistrict
}
