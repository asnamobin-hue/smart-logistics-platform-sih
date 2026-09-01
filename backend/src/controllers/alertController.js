const Alert = require('../models/Alert')
const { getIO } = require('../config/socket')

// GET /api/alerts?page=1&limit=20&severity=high&resolved=false
async function getAlerts(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20))
    const skip = (page - 1) * limit

    const filter = {}
    if (req.query.severity) filter.severity = req.query.severity
    if (req.query.resolved != null) filter.resolved = req.query.resolved === 'true'

    const [alerts, total] = await Promise.all([
      Alert.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Alert.countDocuments(filter)
    ])

    res.json({
      data: alerts.map(formatAlert),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    })
  } catch (err) {
    next(err)
  }
}

// POST /api/alerts
async function createAlert(req, res, next) {
  try {
    const { title, message, severity, relatedLocation } = req.body
    const alert = await Alert.create({ title, message, severity, relatedLocation })
    const formatted = formatAlert(alert)

    getIO().emit('alert:new', formatted)

    res.status(201).json(formatted)
  } catch (err) {
    next(err)
  }
}

// PATCH /api/alerts/:id/resolve
async function resolveAlert(req, res, next) {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { resolved: true },
      { new: true }
    )
    if (!alert) return res.status(404).json({ error: 'Alert not found' })
    const formatted = formatAlert(alert)

    getIO().emit('alert:resolved', formatted)

    res.json(formatted)
  } catch (err) {
    next(err)
  }
}

function formatAlert(doc) {
  return {
    id: doc._id,
    title: doc.title,
    message: doc.message,
    severity: doc.severity,
    resolved: doc.resolved,
    createdAt: doc.createdAt
  }
}

module.exports = { getAlerts, createAlert, resolveAlert, formatAlert }