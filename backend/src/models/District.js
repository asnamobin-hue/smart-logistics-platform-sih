const mongoose = require('mongoose')

// Represents a district in the North Eastern Region (NER).
// connectivityStatus is a derived/settable rollup used by the district-wise
// dashboard required by SIH problem statement 26002 ("centralized dashboards
// for visualizing district-wise connectivity status").
const districtSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    state: {
      type: String,
      required: true,
      enum: [
        'Assam',
        'Arunachal Pradesh',
        'Manipur',
        'Meghalaya',
        'Mizoram',
        'Nagaland',
        'Sikkim',
        'Tripura'
      ]
    },
    lat: { type: Number, required: true },
    lon: { type: Number, required: true },
    connectivityStatus: {
      type: String,
      enum: ['normal', 'partial', 'disrupted'],
      default: 'normal'
    },
    terrain: {
      type: String,
      enum: ['hilly', 'mountainous', 'plains', 'riverine'],
      default: 'hilly'
    },
    // Rolled up from related RoadSegment risk levels; refreshed by
    // districtController.recomputeConnectivity()
    activeDisruptions: { type: Number, default: 0 }
  },
  { timestamps: true }
)

districtSchema.index({ connectivityStatus: 1 })
districtSchema.index({ state: 1 })

module.exports = mongoose.model('District', districtSchema)
