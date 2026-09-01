import L from 'leaflet'

// Fix a well-known react-leaflet issue: default marker icons are broken out of
// the box because Leaflet's asset paths don't resolve correctly under bundlers like Vite.
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
})

// Free OpenStreetMap tile layer — no API key required
export const TILE_LAYER_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
export const TILE_LAYER_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

// Default map center (used when no locations are loaded yet)
export const DEFAULT_CENTER = [20.5937, 78.9629] // India, roughly center
export const DEFAULT_ZOOM = 5

// Warning-triangle marker for reported hazards/disruptions (Emergency Mode
// safety locator: landslide, flood, road blocked, etc.)
const DISRUPTION_EMOJI = {
  landslide: '⛰', flood: '🌊', road_damage: '🚧', bridge_damage: '🌉',
  blocked_road: '⛔', heavy_rainfall: '🌧', traffic_congestion: '🚦', other: '⚠'
}

// Custom colored icons for different marker types (vehicle, warehouse, alert)
export const createIcon = (color = '#3b82f6') =>
  L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background:${color};
      width:16px;height:16px;
      border-radius:50%;
      border:2px solid white;
      box-shadow:0 0 4px rgba(0,0,0,0.5);
    "></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  })

export const createDisruptionIcon = (type = 'other') =>
  L.divIcon({
    className: 'disruption-marker',
    html: `<div style="
      background:#1e293b;
      width:26px;height:26px;
      border-radius:50%;
      border:2px solid #f59e0b;
      display:flex;align-items:center;justify-content:center;
      font-size:14px;
      box-shadow:0 0 6px rgba(245,158,11,0.6);
    ">${DISRUPTION_EMOJI[type] || '⚠'}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13]
  })

// Haversine formula — distance in km between two lat/lon points
export const getDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}