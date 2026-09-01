// Backend-side map/distance calculations (separate from frontend's mapService.js,
// which handles Leaflet-specific rendering). No API key needed — pure math.

// Haversine formula — distance in km between two lat/lon points
function getDistanceKm(lat1, lon1, lat2, lon2) {
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

// Rough ETA estimate assuming an average logistics truck speed of 50 km/h
function estimateEtaMinutes(distanceKm, avgSpeedKmh = 50) {
  return Math.round((distanceKm / avgSpeedKmh) * 60)
}

module.exports = { getDistanceKm, estimateEtaMinutes }