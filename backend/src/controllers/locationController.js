const Location = require('../models/Location')

// GET /api/locations?page=1&limit=20
async function getLocations(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20))
    const skip = (page - 1) * limit

    const [locations, total] = await Promise.all([
      Location.find().sort({ updatedAt: -1 }).skip(skip).limit(limit),
      Location.countDocuments()
    ])

    res.json({
      data: locations.map(formatLocation),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    })
  } catch (err) {
    next(err)
  }
}

// GET /api/locations/:id
async function getLocationById(req, res, next) {
  try {
    const location = await Location.findById(req.params.id)
    if (!location) return res.status(404).json({ error: 'Location not found' })
    res.json(formatLocation(location))
  } catch (err) {
    next(err)
  }
}

// POST /api/locations
async function createLocation(req, res, next) {
  try {
    const { name, type, lat, lon, status, color } = req.body
    const location = await Location.create({ name, type, lat, lon, status, color })
    res.status(201).json(formatLocation(location))
  } catch (err) {
    next(err)
  }
}

function formatLocation(doc) {
  return {
    id: doc._id,
    name: doc.name,
    type: doc.type,
    lat: doc.lat,
    lon: doc.lon,
    status: doc.status,
    color: doc.color,
    updatedAt: doc.updatedAt
  }
}

module.exports = { getLocations, getLocationById, createLocation, formatLocation }