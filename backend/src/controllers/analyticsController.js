const Route = require('../models/Route')
const Alert = require('../models/Alert')

// GET /api/analytics
async function getAnalytics(req, res, next) {
  try {
    // Route status breakdown
    const statusCounts = await Route.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ])
    const routeStatusBreakdown = statusCounts.map((s) => ({
      status: s._id,
      count: s.count
    }))

    // Alerts by severity
    const severityCounts = await Alert.aggregate([
      { $group: { _id: '$severity', count: { $sum: 1 } } }
    ])
    const alertsBySeverity = severityCounts.map((s) => ({
      severity: s._id,
      count: s.count
    }))

    // Delivery trend — completed routes grouped by day (last 14 days)
    const fourteenDaysAgo = new Date()
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

    const trend = await Route.aggregate([
      { $match: { status: 'completed', updatedAt: { $gte: fourteenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$updatedAt' } },
          deliveries: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ])
    const deliveryTrend = trend.map((t) => ({ date: t._id, deliveries: t.deliveries }))

    res.json({ deliveryTrend, routeStatusBreakdown, alertsBySeverity })
  } catch (err) {
    next(err)
  }
}

module.exports = { getAnalytics }