const mongoose = require('mongoose')

const alertSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    resolved: { type: Boolean, default: false },
    relatedLocation: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
    // --- NER accessibility alerting (SIH 26002, requirement e) ---
    type: {
      type: String,
      enum: [
        'blocked_road',
        'inaccessible_region',
        'delayed_delivery',
        'high_risk_corridor',
        'weather',
        'general'
      ],
      default: 'general'
    },
    district: { type: mongoose.Schema.Types.ObjectId, ref: 'District' },
    roadSegment: { type: mongoose.Schema.Types.ObjectId, ref: 'RoadSegment' }
  },
  { timestamps: true }
)

alertSchema.index({ resolved: 1 })
alertSchema.index({ severity: 1 })
alertSchema.index({ createdAt: -1 })
alertSchema.index({ type: 1 })
alertSchema.index({ district: 1 })

module.exports = mongoose.model('Alert', alertSchema)