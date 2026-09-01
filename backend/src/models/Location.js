const mongoose = require('mongoose')

const locationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ['vehicle', 'warehouse', 'hub'],
      default: 'vehicle'
    },
    lat: { type: Number, required: true },
    lon: { type: Number, required: true },
    status: {
      type: String,
      enum: ['active', 'idle', 'offline'],
      default: 'active'
    },
    color: { type: String, default: '#3b82f6' },
    // --- NER essential-commodity tracking (SIH 26002, requirement d) ---
    district: { type: mongoose.Schema.Types.ObjectId, ref: 'District' },
    cargoType: {
      type: String,
      enum: ['medicine', 'food_supplies', 'agricultural_produce', 'construction_material', 'general', 'none'],
      default: 'none'
    },
    isEssentialCargo: { type: Boolean, default: false }
  },
  { timestamps: true }
)

locationSchema.index({ status: 1 })
locationSchema.index({ type: 1 })
locationSchema.index({ updatedAt: -1 })
locationSchema.index({ isEssentialCargo: 1 })
locationSchema.index({ district: 1 })

module.exports = mongoose.model('Location', locationSchema)