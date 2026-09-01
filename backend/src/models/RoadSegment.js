const mongoose = require('mongoose')

// A monitored road or bridge segment. This is the core entity for
// "Monitoring real-time road, bridge, and transport accessibility across
// districts and remote locations" (SIH 26002, requirement a).
const roadSegmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ['road', 'bridge'],
      default: 'road'
    },
    district: { type: mongoose.Schema.Types.ObjectId, ref: 'District', required: true },
    // Simplified path as an ordered list of [lat, lon] points for map rendering
    path: {
      type: [[Number]],
      required: true,
      validate: (v) => Array.isArray(v) && v.length >= 2
    },
    status: {
      type: String,
      enum: ['open', 'restricted', 'blocked'],
      default: 'open'
    },
    // 0-100 predicted disruption risk, produced by the disruption prediction service
    riskScore: { type: Number, default: 0, min: 0, max: 100 },
    riskLevel: {
      type: String,
      enum: ['low', 'moderate', 'high', 'severe'],
      default: 'low'
    },
    riskFactors: {
      type: [String], // e.g. ['landslide', 'flood', 'heavy_rainfall', 'road_damage', 'congestion']
      default: []
    },
    isHighRiskCorridor: { type: Boolean, default: false },
    lastInspected: { type: Date },
    notes: { type: String }
  },
  { timestamps: true }
)

roadSegmentSchema.index({ district: 1 })
roadSegmentSchema.index({ status: 1 })
roadSegmentSchema.index({ riskLevel: 1 })
roadSegmentSchema.index({ isHighRiskCorridor: 1 })

module.exports = mongoose.model('RoadSegment', roadSegmentSchema)
