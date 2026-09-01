const mongoose = require('mongoose')

const routeSchema = new mongoose.Schema(
  {
    origin: { type: String, required: true },
    destination: { type: String, required: true },
    originLat: { type: Number },
    originLon: { type: Number },
    destLat: { type: Number },
    destLon: { type: Number },
    distanceKm: { type: Number },
    etaMinutes: { type: Number },
    status: {
      type: String,
      enum: ['pending', 'active', 'completed'],
      default: 'pending'
    }
  },
  { timestamps: true }
)

routeSchema.index({ status: 1 })
routeSchema.index({ createdAt: -1 })
routeSchema.index({ status: 1, updatedAt: -1 }) // supports the analytics delivery-trend query

module.exports = mongoose.model('Route', routeSchema)