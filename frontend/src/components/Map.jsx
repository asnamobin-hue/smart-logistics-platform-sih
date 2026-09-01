import { useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import { TILE_LAYER_URL, TILE_LAYER_ATTRIBUTION, DEFAULT_CENTER, DEFAULT_ZOOM, createIcon, createDisruptionIcon } from '../services/mapService.js'
import { ROAD_STATUS_COLORS, SHELTER_STATUS_COLORS } from '../utils/constants.js'
import '../services/mapService.js'

// `roadSegments` renders road/bridge accessibility as color-coded polylines
// (green=open, amber=restricted, red=blocked) — used by the Accessibility
// dashboard (SIH 26002 requirement a & g).
// `shelters` renders relief-shelter locations (Emergency Mode).
//
// NOTE on center/zoom: these are only used to set the map's INITIAL view.
// react-leaflet's MapContainer does not re-pan/re-zoom when these props
// change later, so we intentionally compute `center` once (useMemo with an
// empty dependency array) rather than recalculating it from `locations` on
// every render — recalculating it was causing the map to visibly jump/zoom
// whenever live data (e.g. a socket update) reordered the locations array.
export default function Map({ locations = [], roadSegments = [], shelters = [], disruptionMarkers = [], height = '500px', center: centerProp, zoom: zoomProp }) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const center = useMemo(() => (
    centerProp || (locations.length > 0 ? [locations[0].lat, locations[0].lon] : DEFAULT_CENTER)
  ), [])
  const zoom = zoomProp || DEFAULT_ZOOM

  return (
    <div style={{ height, width: '100%' }}>
      <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }}>
        <TileLayer url={TILE_LAYER_URL} attribution={TILE_LAYER_ATTRIBUTION} />

        {roadSegments.map((seg) => (
          <Polyline
            key={seg.id}
            positions={seg.path}
            pathOptions={{
              color: ROAD_STATUS_COLORS[seg.status] || '#3b82f6',
              weight: seg.type === 'bridge' ? 6 : 4,
              dashArray: seg.type === 'bridge' ? '2 6' : undefined
            }}
          >
            <Popup>
              <strong>{seg.name}</strong>
              <div>Type: {seg.type}</div>
              <div>Status: {seg.status}</div>
              <div>Risk: {seg.riskLevel} ({seg.riskScore})</div>
              {seg.riskFactors?.length > 0 && <div>Factors: {seg.riskFactors.join(', ')}</div>}
            </Popup>
          </Polyline>
        ))}

        {disruptionMarkers.map((d) => (
          <Marker key={`hazard-${d.id}`} position={[d.lat, d.lon]} icon={createDisruptionIcon(d.type)}>
            <Popup>
              <strong>{d.label || d.type}</strong>
              {d.description && <div>{d.description}</div>}
            </Popup>
          </Marker>
        ))}

        {shelters.map((s) => (
          <Marker key={`shelter-${s.id}`} position={[s.lat, s.lon]} icon={createIcon(SHELTER_STATUS_COLORS[s.status] || '#3b82f6')}>
            <Popup>
              <strong>🏠 {s.name}</strong>
              <div>Status: {s.status}</div>
              <div>Capacity: {s.occupancy}/{s.capacity}</div>
              {s.contact && <div>Contact: {s.contact}</div>}
            </Popup>
          </Marker>
        ))}

        {locations.map((loc) => (
          <Marker
            key={loc.id}
            position={[loc.lat, loc.lon]}
            icon={createIcon(loc.color)}
          >
            <Popup>
              <strong>{loc.name}</strong>
              {loc.status && <div>Status: {loc.status}</div>}
              {loc.cargoType && loc.cargoType !== 'none' && <div>Cargo: {loc.cargoType.replace('_', ' ')}</div>}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}