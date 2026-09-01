const Location = require('../models/Location')
const Route = require('../models/Route')
const Alert = require('../models/Alert')

// GET /api/logistics/summary
// Combined overview used for a dashboard "at a glance" view
async function getSummary(req, res, next) {
  try {
    const [locationCount, activeRoutes, unresolvedAlerts, recentAlerts] = await Promise.all([
      Location.countDocuments(),
      Route.countDocuments({ status: 'active' }),
      Alert.countDocuments({ resolved: false }),
      Alert.find({ resolved: false }).sort({ createdAt: -1 }).limit(5)
    ])

    res.json({
      totalLocations: locationCount,
      activeRoutes,
      unresolvedAlerts,
      recentAlerts: recentAlerts.map((a) => ({
        id: a._id,
        title: a.title,
        severity: a.severity,
        createdAt: a.createdAt
      }))
    })
  } catch (err) {
    next(err)
  }
}

module.exports = { getSummary }