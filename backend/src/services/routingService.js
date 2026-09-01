// Routing & geocoding for the Smart Route Intelligence feature.
//
// IMPORTANT: this file only ever computes paths/distance/time. It never asks an AI
// model to invent coordinates — that job belongs to routeRiskAnalyzer / the AI service.
//
// Uses free, no-API-key services (OSRM demo routing server + Nominatim geocoding),
// with offline fallbacks so the feature keeps working if those are unreachable
// (sandboxed environments, firewalls, or a genuine offline demo).

const axios = require('axios')
const { getDistanceKm } = require('./mapService')
const { matchKnownPlace, isCorridorPair, CORRIDOR_ROUTES } = require('../data/demoRouteCorridor')

const OSRM_BASE_URL = process.env.OSRM_BASE_URL || 'https://router.project-osrm.org'
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'
const HTTP_TIMEOUT_MS = 6000

class GeocodeError extends Error {
  constructor(message) {
    super(message)
    this.status = 422
  }
}

// Resolves a free-text place name ("Guwahati", "Shillong Civil Hospital", ...) to coordinates.
// 1. Known demo/corridor place names (instant, offline).
// 2. Nominatim (OpenStreetMap) geocoding, biased to India.
async function geocodePlace(text) {
  const known = matchKnownPlace(text)
  if (known) return known

  try {
    const res = await axios.get(NOMINATIM_URL, {
      params: { q: text, format: 'json', limit: 1, countrycodes: 'in' },
      headers: { 'User-Agent': 'smart-logistics-platform/route-intelligence' },
      timeout: HTTP_TIMEOUT_MS
    })
    const hit = res.data?.[0]
    if (!hit) throw new GeocodeError(`Could not find a location matching "${text}".`)
    return { name: hit.display_name.split(',').slice(0, 2).join(',').trim(), lat: Number(hit.lat), lon: Number(hit.lon) }
  } catch (err) {
    if (err instanceof GeocodeError) throw err
    throw new GeocodeError(`Could not resolve "${text}" to a location right now. Try a nearby town or city name.`)
  }
}

// Builds 2-3 synthetic route variants between two coordinates by offsetting the
// midpoint perpendicular to the straight line. Used only when OSRM is unreachable
// and the pair doesn't match the curated demo corridor.
function buildSyntheticRoutes(origin, destination) {
  const mid = { lat: (origin.lat + destination.lat) / 2, lon: (origin.lon + destination.lon) / 2 }
  const dLat = destination.lat - origin.lat
  const dLon = destination.lon - origin.lon
  const len = Math.hypot(dLat, dLon) || 1
  // unit perpendicular vector
  const perp = { lat: -dLon / len, lon: dLat / len }

  const straightKm = getDistanceKm(origin.lat, origin.lon, destination.lat, destination.lon)
  const makePath = (offsetFactor) => [
    [origin.lat, origin.lon],
    [mid.lat + perp.lat * offsetFactor, mid.lon + perp.lon * offsetFactor],
    [destination.lat, destination.lon]
  ]

  const variants = [
    { id: 'synthetic-direct', name: 'Direct route', offset: 0, distanceMultiplier: 1 },
    { id: 'synthetic-alternate', name: 'Alternate road via nearby town', offset: len * 0.18, distanceMultiplier: 1.12 },
    { id: 'synthetic-longer', name: 'Longer detour route', offset: -(len * 0.3), distanceMultiplier: 1.28 }
  ]

  return variants.map((v) => {
    const distanceKm = Math.round(straightKm * v.distanceMultiplier * 10) / 10
    return {
      id: v.id,
      name: v.name,
      distanceKm,
      etaMinutes: Math.round((distanceKm / 45) * 60),
      path: makePath(v.offset)
    }
  })
}

// Calls the public OSRM demo server for real driving directions with alternatives.
async function fetchOsrmRoutes(origin, destination) {
  const url = `${OSRM_BASE_URL}/route/v1/driving/${origin.lon},${origin.lat};${destination.lon},${destination.lat}`
  const res = await axios.get(url, {
    params: { alternatives: true, overview: 'full', geometries: 'geojson', steps: false },
    timeout: HTTP_TIMEOUT_MS
  })

  if (res.data?.code !== 'Ok' || !Array.isArray(res.data.routes) || res.data.routes.length === 0) {
    throw new Error('OSRM returned no routes')
  }

  return res.data.routes.slice(0, 3).map((r, idx) => ({
    id: `osrm-${idx}`,
    name: idx === 0 ? 'Fastest route' : `Alternate route ${idx}`,
    distanceKm: Math.round((r.distance / 1000) * 10) / 10,
    etaMinutes: Math.round(r.duration / 60),
    // GeoJSON coordinates are [lon, lat] — flip to [lat, lon] for Leaflet
    path: r.geometry.coordinates.map(([lon, lat]) => [lat, lon])
  }))
}

// Returns up to 3 route options between two geocoded points: { routes, source }
// source is one of 'osrm' | 'demo-corridor' | 'synthetic', purely for transparency/debugging.
async function getRouteOptions(origin, destination, originText, destinationText) {
  try {
    const routes = await fetchOsrmRoutes(origin, destination)
    if (routes.length >= 2) return { routes, source: 'osrm' }
    // Only one real route came back — pad with a synthetic alternate so the
    // three-way recommended/alternative/avoid comparison still has something to compare.
    const synthetic = buildSyntheticRoutes(origin, destination)
    return { routes: [...routes, ...synthetic.slice(1)], source: 'osrm+synthetic' }
  } catch {
    if (isCorridorPair(originText, destinationText)) {
      return { routes: CORRIDOR_ROUTES, source: 'demo-corridor' }
    }
    return { routes: buildSyntheticRoutes(origin, destination), source: 'synthetic' }
  }
}

module.exports = { geocodePlace, getRouteOptions, GeocodeError }
