const path = require('path')
const mongoose = require('mongoose')
require('dotenv').config({ path: path.resolve(__dirname, '../../backend/.env') })

const Location = require('../../backend/src/models/Location')
const Route = require('../../backend/src/models/Route')
const Alert = require('../../backend/src/models/Alert')
const District = require('../../backend/src/models/District')
const RoadSegment = require('../../backend/src/models/RoadSegment')
const FieldReport = require('../../backend/src/models/FieldReport')

// --- North Eastern Region (NER) districts (SIH 26002 scope) ---
const sampleDistricts = [
  { name: 'East Khasi Hills', state: 'Meghalaya', lat: 25.5788, lon: 91.8933, terrain: 'hilly' },
  { name: 'West Garo Hills', state: 'Meghalaya', lat: 25.5138, lon: 90.2201, terrain: 'hilly' },
  { name: 'Dima Hasao', state: 'Assam', lat: 25.3667, lon: 93.0167, terrain: 'mountainous' },
  { name: 'Kamrup Metropolitan', state: 'Assam', lat: 26.1445, lon: 91.7362, terrain: 'plains' },
  { name: 'Tawang', state: 'Arunachal Pradesh', lat: 27.5859, lon: 91.8594, terrain: 'mountainous' },
  { name: 'Senapati', state: 'Manipur', lat: 25.2667, lon: 94.0167, terrain: 'hilly' },
  { name: 'Aizawl', state: 'Mizoram', lat: 23.7271, lon: 92.7176, terrain: 'mountainous' },
  { name: 'Kohima', state: 'Nagaland', lat: 25.6751, lon: 94.1086, terrain: 'hilly' },
  { name: 'West Sikkim', state: 'Sikkim', lat: 27.2833, lon: 88.2167, terrain: 'mountainous' },
  { name: 'West Tripura', state: 'Tripura', lat: 23.8315, lon: 91.2868, terrain: 'riverine' }
]

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    console.log('Connected to MongoDB for seeding...')

    await Promise.all([
      Location.deleteMany({}),
      Route.deleteMany({}),
      Alert.deleteMany({}),
      District.deleteMany({}),
      RoadSegment.deleteMany({}),
      FieldReport.deleteMany({})
    ])

    const districts = await District.insertMany(sampleDistricts)
    console.log(`Inserted ${districts.length} NER districts`)

    const byName = Object.fromEntries(districts.map((d) => [d.name, d]))

    // --- Roads & bridges (requirement a: accessibility monitoring) ---
    const roadSegments = await RoadSegment.insertMany([
      {
        name: 'NH-6 Shillong–Silchar Stretch',
        type: 'road',
        district: byName['East Khasi Hills']._id,
        path: [[25.5788, 91.8933], [25.30, 92.30], [24.8333, 92.7789]],
        status: 'restricted',
        riskScore: 62,
        riskLevel: 'high',
        riskFactors: ['landslide', 'heavy_rainfall'],
        isHighRiskCorridor: true,
        lastInspected: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000)
      },
      {
        name: 'Kupli River Bridge',
        type: 'bridge',
        district: byName['Dima Hasao']._id,
        path: [[25.36, 93.02], [25.372, 93.03]],
        status: 'blocked',
        riskScore: 81,
        riskLevel: 'severe',
        riskFactors: ['flood', 'road_damage'],
        isHighRiskCorridor: true,
        lastInspected: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000),
        notes: 'Bridge deck damaged after recent flooding; heavy vehicles rerouted.'
      },
      {
        name: 'Tawang–Bomdila Highway',
        type: 'road',
        district: byName['Tawang']._id,
        path: [[27.5859, 91.8594], [27.30, 92.20], [27.2645, 92.4159]],
        status: 'open',
        riskScore: 38,
        riskLevel: 'moderate',
        riskFactors: ['landslide'],
        isHighRiskCorridor: false,
        lastInspected: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
      },
      {
        name: 'Aizawl–Champhai Road',
        type: 'road',
        district: byName['Aizawl']._id,
        path: [[23.7271, 92.7176], [23.60, 93.20], [23.4589, 93.3273]],
        status: 'open',
        riskScore: 18,
        riskLevel: 'low',
        riskFactors: [],
        isHighRiskCorridor: false,
        lastInspected: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      },
      {
        name: 'Kohima Bypass Bridge',
        type: 'bridge',
        district: byName['Kohima']._id,
        path: [[25.6751, 94.1086], [25.68, 94.12]],
        status: 'open',
        riskScore: 25,
        riskLevel: 'moderate',
        riskFactors: ['heavy_rainfall'],
        isHighRiskCorridor: false,
        lastInspected: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
      }
    ])
    console.log(`Inserted ${roadSegments.length} road/bridge segments`)

    // Recompute district connectivity from seeded road data
    const { recomputeConnectivity } = require('../../backend/src/controllers/districtController')
    for (const d of districts) {
      await recomputeConnectivity(d._id)
    }

    // --- Essential-commodity vehicle/warehouse locations (requirement d) ---
    const sampleLocations = [
      { name: 'Guwahati Regional Hub', type: 'hub', lat: 26.1445, lon: 91.7362, status: 'active', color: '#3b82f6', district: byName['Kamrup Metropolitan']._id, cargoType: 'none', isEssentialCargo: false },
      { name: 'Shillong Medical Supply Warehouse', type: 'warehouse', lat: 25.5788, lon: 91.8933, status: 'active', color: '#22c55e', district: byName['East Khasi Hills']._id, cargoType: 'medicine', isEssentialCargo: true },
      { name: 'Medicine Truck NER-101', type: 'vehicle', lat: 25.45, lon: 92.10, status: 'active', color: '#ef4444', district: byName['East Khasi Hills']._id, cargoType: 'medicine', isEssentialCargo: true },
      { name: 'Agri-Produce Truck NER-102', type: 'vehicle', lat: 25.30, lon: 93.00, status: 'active', color: '#84cc16', district: byName['Dima Hasao']._id, cargoType: 'agricultural_produce', isEssentialCargo: true },
      { name: 'Construction Material Carrier NER-103', type: 'vehicle', lat: 27.40, lon: 92.00, status: 'idle', color: '#a855f7', district: byName['Tawang']._id, cargoType: 'construction_material', isEssentialCargo: true },
      { name: 'Food Supply Truck NER-104', type: 'vehicle', lat: 23.70, lon: 92.90, status: 'active', color: '#f59e0b', district: byName['Aizawl']._id, cargoType: 'food_supplies', isEssentialCargo: true }
    ]
    const locations = await Location.insertMany(sampleLocations)
    console.log(`Inserted ${locations.length} locations (including essential-cargo vehicles)`)

    const routes = await Route.insertMany([
      {
        origin: 'Guwahati Regional Hub', destination: 'Shillong Medical Supply Warehouse',
        originLat: 26.1445, originLon: 91.7362, destLat: 25.5788, destLon: 91.8933,
        distanceKm: 100, etaMinutes: 150, status: 'active'
      },
      {
        origin: 'Shillong', destination: 'Silchar (via NH-6)',
        originLat: 25.5788, originLon: 91.8933, destLat: 24.8333, destLon: 92.7789,
        distanceKm: 175, etaMinutes: 300, status: 'pending'
      }
    ])
    console.log(`Inserted ${routes.length} routes`)

    const alerts = await Alert.insertMany([
      {
        title: 'Bridge blocked: Kupli River Bridge',
        message: 'Kupli River Bridge in Dima Hasao is blocked due to flood damage. Essential cargo being rerouted.',
        severity: 'high',
        type: 'blocked_road',
        district: byName['Dima Hasao']._id,
        roadSegment: roadSegments[1]._id
      },
      {
        title: 'High-risk corridor: NH-6 Shillong–Silchar Stretch',
        message: 'Landslide risk elevated due to heavy rainfall on NH-6 near East Khasi Hills.',
        severity: 'medium',
        type: 'high_risk_corridor',
        district: byName['East Khasi Hills']._id,
        roadSegment: roadSegments[0]._id
      },
      {
        title: 'Medicine delivery delayed',
        message: 'Medicine Truck NER-101 delayed near East Khasi Hills due to road restrictions.',
        severity: 'medium',
        type: 'delayed_delivery',
        relatedLocation: locations[2]._id,
        district: byName['East Khasi Hills']._id
      }
    ])
    console.log(`Inserted ${alerts.length} alerts`)

    // --- Field reports (requirement f: geo-tagged updates from field officials) ---
    const fieldReports = await FieldReport.insertMany([
      {
        reporterName: 'R. Marak',
        reporterRole: 'field_officer',
        district: byName['Dima Hasao']._id,
        roadSegment: roadSegments[1]._id,
        incidentType: 'bridge_damage',
        description: 'Bridge deck cracked after flooding; unsafe for heavy vehicles.',
        lat: 25.365, lon: 93.025,
        language: 'en',
        synced: true,
        status: 'acknowledged'
      },
      {
        reporterName: 'L. Sangma',
        reporterRole: 'local_authority',
        district: byName['East Khasi Hills']._id,
        roadSegment: roadSegments[0]._id,
        incidentType: 'landslide',
        description: 'Minor landslide debris on NH-6 near Shillong outskirts; single-lane passable.',
        lat: 25.50, lon: 92.10,
        language: 'en',
        synced: true,
        status: 'new'
      }
    ])
    console.log(`Inserted ${fieldReports.length} field reports`)

    console.log('Seeding complete.')
  } catch (err) {
    console.error('Seeding failed:', err.message)
  } finally {
    await mongoose.disconnect()
  }
}

seed()
