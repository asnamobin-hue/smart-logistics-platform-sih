// Static sample data — used for local demos or as fallback content.
// Different from database/seed/seed.js: that script writes directly into MongoDB;
// this file is plain JS data any part of the app can import in-memory (e.g. a demo
// mode, or a "reset to sample data" admin endpoint) without touching the database.

// NER (North Eastern Region) sample data — matches SIH problem statement 26002.
const sampleLocations = [
  { name: 'Guwahati Regional Hub', type: 'hub', lat: 26.1445, lon: 91.7362, status: 'active', color: '#3b82f6', cargoType: 'none', isEssentialCargo: false },
  { name: 'Shillong Medical Supply Warehouse', type: 'warehouse', lat: 25.5788, lon: 91.8933, status: 'active', color: '#22c55e', cargoType: 'medicine', isEssentialCargo: true },
  { name: 'Medicine Truck NER-101', type: 'vehicle', lat: 25.45, lon: 92.1, status: 'active', color: '#ef4444', cargoType: 'medicine', isEssentialCargo: true },
  { name: 'Agri-Produce Truck NER-102', type: 'vehicle', lat: 25.3, lon: 93.0, status: 'idle', color: '#84cc16', cargoType: 'agricultural_produce', isEssentialCargo: true }
]

const sampleRoutes = [
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
]

const sampleAlerts = [
  { title: 'Bridge blocked: Kupli River Bridge', message: 'Kupli River Bridge in Dima Hasao is blocked due to flood damage.', severity: 'high', type: 'blocked_road', resolved: false },
  { title: 'High-risk corridor: NH-6', message: 'Landslide risk elevated on NH-6 near East Khasi Hills.', severity: 'medium', type: 'high_risk_corridor', resolved: false }
]

module.exports = { sampleLocations, sampleRoutes, sampleAlerts }