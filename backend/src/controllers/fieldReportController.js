const FieldReport = require('../models/FieldReport')
const Alert = require('../models/Alert')
const { getIO } = require('../config/socket')

// GET /api/field-reports?district=..&incidentType=..&status=..&page=1&limit=20
async function getFieldReports(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20))
    const skip = (page - 1) * limit

    const filter = {}
    if (req.query.district) filter.district = req.query.district
    if (req.query.incidentType) filter.incidentType = req.query.incidentType
    if (req.query.status) filter.status = req.query.status

    const [reports, total] = await Promise.all([
      FieldReport.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('district', 'name state'),
      FieldReport.countDocuments(filter)
    ])

    res.json({
      data: reports.map(formatReport),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    })
  } catch (err) {
    next(err)
  }
}

// POST /api/field-reports  (multipart/form-data — photo optional via `photo` field)
// Implements requirement (f): field officials uploading geo-tagged updates,
// photographs, and incident reports from remote locations. Also supports the
// offline-sync workflow (requirement h): the client can send `clientCreatedAt`
// and `synced=false` for reports queued while offline, then re-POST once online.
async function createFieldReport(req, res, next) {
  try {
    const {
      reporterName,
      reporterRole,
      district,
      roadSegment,
      incidentType,
      description,
      lat,
      lon,
      language,
      clientCreatedAt,
      synced
    } = req.body

    const photoUrl = req.file ? `/uploads/field-reports/${req.file.filename}` : undefined

    const report = await FieldReport.create({
      reporterName,
      reporterRole,
      district: district || undefined,
      roadSegment: roadSegment || undefined,
      incidentType,
      description,
      lat: Number(lat),
      lon: Number(lon),
      photoUrl,
      language: language || 'en',
      clientCreatedAt: clientCreatedAt ? new Date(clientCreatedAt) : undefined,
      synced: synced !== 'false'
    })

    // Surface urgent incident types as automated alerts (requirement e)
    const urgentTypes = ['landslide', 'flood', 'bridge_damage', 'blocked_road']
    if (urgentTypes.includes(report.incidentType)) {
      const alert = await Alert.create({
        title: `Field report: ${report.incidentType.replace('_', ' ')}`,
        message: `${report.reporterName} reported "${report.incidentType.replace('_', ' ')}" — ${report.description}`,
        severity: 'high',
        type: report.incidentType === 'blocked_road' ? 'blocked_road' : 'inaccessible_region',
        district: report.district
      })
      getIO().emit('alert:new', { id: alert._id, title: alert.title, severity: alert.severity, type: alert.type })
    }

    const formatted = formatReport(report)
    getIO().emit('fieldreport:new', formatted)

    res.status(201).json(formatted)
  } catch (err) {
    next(err)
  }
}

// PATCH /api/field-reports/:id/status
async function updateReportStatus(req, res, next) {
  try {
    const { status } = req.body
    const report = await FieldReport.findByIdAndUpdate(req.params.id, { status }, { new: true })
    if (!report) return res.status(404).json({ error: 'Field report not found' })
    res.json(formatReport(report))
  } catch (err) {
    next(err)
  }
}

function formatReport(doc) {
  return {
    id: doc._id,
    reporterName: doc.reporterName,
    reporterRole: doc.reporterRole,
    district: doc.district?._id ? { id: doc.district._id, name: doc.district.name, state: doc.district.state } : doc.district,
    roadSegment: doc.roadSegment,
    incidentType: doc.incidentType,
    description: doc.description,
    lat: doc.lat,
    lon: doc.lon,
    photoUrl: doc.photoUrl,
    language: doc.language,
    clientCreatedAt: doc.clientCreatedAt,
    synced: doc.synced,
    status: doc.status,
    createdAt: doc.createdAt
  }
}

module.exports = { getFieldReports, createFieldReport, updateReportStatus, formatReport }
