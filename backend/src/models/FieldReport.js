const mongoose = require('mongoose')

// Geo-tagged updates, photographs, and incident reports uploaded by field
// officials / local authorities from remote locations (SIH 26002, requirement f).
// `synced` supports the offline-first workflow: the mobile/web client can create
// reports locally while offline and mark them synced once uploaded (requirement h).
const fieldReportSchema = new mongoose.Schema(
  {
    reporterName: { type: String, required: true },
    reporterRole: {
      type: String,
      enum: ['field_officer', 'local_authority', 'district_admin', 'other'],
      default: 'field_officer'
    },
    district: { type: mongoose.Schema.Types.ObjectId, ref: 'District' },
    roadSegment: { type: mongoose.Schema.Types.ObjectId, ref: 'RoadSegment' },
    incidentType: {
      type: String,
      enum: [
        'landslide',
        'flood',
        'road_damage',
        'bridge_damage',
        'blocked_road',
        'heavy_rainfall',
        'traffic_congestion',
        'other'
      ],
      required: true
    },
    description: { type: String, required: true },
    lat: { type: Number, required: true },
    lon: { type: Number, required: true },
    photoUrl: { type: String },
    language: { type: String, default: 'en' }, // language the report was filed in
    clientCreatedAt: { type: Date }, // timestamp set on-device, may predate server receipt if offline
    synced: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ['new', 'acknowledged', 'resolved'],
      default: 'new'
    }
  },
  { timestamps: true }
)

fieldReportSchema.index({ district: 1 })
fieldReportSchema.index({ incidentType: 1 })
fieldReportSchema.index({ status: 1 })
fieldReportSchema.index({ createdAt: -1 })

module.exports = mongoose.model('FieldReport', fieldReportSchema)
