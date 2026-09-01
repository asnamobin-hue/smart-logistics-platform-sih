// Demo/fallback data for the Smart Route Intelligence feature.
//
// Used in two situations only:
//   1. The live routing API (OSRM) can't be reached (offline demo / sandbox / firewall).
//   2. The database has no relevant RoadSegment/FieldReport disruptions for the analysis.
//
// The coordinates mirror the same Guwahati <-> Shillong corridor already used in
// frontend/src/demo-data/demoData.json, so the demo tells one consistent story
// whether the backend, the database, or pure frontend demo mode is answering.

// Known place names -> coordinates. Matched case-insensitively as substrings so
// "Guwahati", "guwahati regional hub", "Guwahati, Assam" etc. all resolve.
const KNOWN_PLACES = [
  { match: ['guwahati regional hub'], name: 'Guwahati Regional Hub', lat: 26.1445, lon: 91.7362 },
  { match: ['guwahati'], name: 'Guwahati', lat: 26.1445, lon: 91.7362 },
  { match: ['khanapara'], name: 'Khanapara, Guwahati', lat: 26.1445, lon: 91.7362 },
  { match: ['jorabat'], name: 'Jorabat', lat: 26.098, lon: 91.81 },
  { match: ['sonapur'], name: 'Sonapur', lat: 26.072, lon: 91.806 },
  { match: ['byrnihat'], name: 'Byrnihat', lat: 25.9985, lon: 91.873 },
  { match: ['nongpoh'], name: 'Nongpoh', lat: 25.9, lon: 91.88 },
  { match: ['shillong medical supply warehouse'], name: 'Shillong Medical Supply Warehouse', lat: 25.5788, lon: 91.8933 },
  { match: ['shillong civil hospital'], name: 'Shillong Civil Hospital', lat: 25.575, lon: 91.883 },
  { match: ['shillong'], name: 'Shillong', lat: 25.5788, lon: 91.8933 },
  { match: ['dispur'], name: 'Dispur', lat: 26.14, lon: 91.79 }
]

// Hand-built alternative paths for the Guwahati <-> Shillong corridor. Distances/times
// are illustrative, matching the scale of demoData.json's seeded route (100km / 165min).
const CORRIDOR_ROUTES = [
  {
    id: 'demo-corridor-primary',
    name: 'Via GS Road & NH-40 (through Byrnihat)',
    distanceKm: 100,
    etaMinutes: 165,
    path: [
      [26.1445, 91.7362],
      [26.12, 91.78],
      [26.098, 91.81],
      [26.072, 91.806],
      [25.9985, 91.873],
      [25.9, 91.88],
      [25.72, 91.885],
      [25.5788, 91.8933]
    ]
  },
  {
    id: 'demo-corridor-alternate',
    name: 'Via Baksa bypass (west of Byrnihat)',
    distanceKm: 118,
    etaMinutes: 195,
    path: [
      [26.1445, 91.7362],
      [26.1, 91.74],
      [26.02, 91.75],
      [25.93, 91.79],
      [25.82, 91.82],
      [25.72, 91.86],
      [25.5788, 91.8933]
    ]
  },
  {
    id: 'demo-corridor-hill-cutting',
    name: 'Via Byrnihat-Nongpoh hill cutting (direct)',
    distanceKm: 92,
    etaMinutes: 150,
    path: [
      [26.1445, 91.7362],
      [26.11, 91.79],
      [26.05, 91.83],
      [25.98, 91.877],
      [25.95, 91.877],
      [25.72, 91.89],
      [25.5788, 91.8933]
    ]
  }
]

// Fallback disruptions, mirroring frontend demoData.json's incidents, used only when
// the database has nothing relevant for the requested corridor.
const DEMO_DISRUPTIONS = [
  {
    type: 'landslide',
    severity: 'high',
    name: 'Byrnihat-Nongpoh hill cutting',
    lat: 25.95,
    lon: 91.877,
    description: 'Debris from a hill cutting has blocked one lane; traffic is single-file with delays.'
  },
  {
    type: 'flood',
    severity: 'moderate',
    name: 'Digaru River Bridge, Sonapur',
    lat: 26.07,
    lon: 91.805,
    description: 'Rising water levels near the bridge approach; passable but monitored.'
  },
  {
    type: 'heavy_rainfall',
    severity: 'moderate',
    name: 'Nongpoh corridor',
    lat: 25.9,
    lon: 91.88,
    description: 'Sustained heavy rainfall reported over the last 24 hours.'
  }
]

function normalize(text = '') {
  return String(text).trim().toLowerCase()
}

// Returns { name, lat, lon } if the free-text place matches a known demo location.
function matchKnownPlace(text) {
  const needle = normalize(text)
  if (!needle) return null
  const found = KNOWN_PLACES.find((p) => p.match.some((m) => needle.includes(m)))
  return found ? { name: found.name, lat: found.lat, lon: found.lon } : null
}

// True if both endpoints fall within the seeded Guwahati<->Shillong demo corridor,
// so the richer hand-built route set can be used instead of a generic straight line.
function isCorridorPair(originText, destinationText) {
  const a = normalize(originText)
  const b = normalize(destinationText)
  const inCorridor = (t) => ['guwahati', 'khanapara', 'jorabat', 'sonapur', 'byrnihat', 'dispur'].some((k) => t.includes(k))
    || ['shillong', 'nongpoh'].some((k) => t.includes(k))
  return inCorridor(a) && inCorridor(b)
}

module.exports = { KNOWN_PLACES, CORRIDOR_ROUTES, DEMO_DISRUPTIONS, matchKnownPlace, isCorridorPair }
