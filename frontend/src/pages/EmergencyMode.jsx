import { useEffect, useMemo, useState } from 'react'
import {
  X, LocateFixed, Navigation, Phone, AlertTriangle,
  ShieldAlert, Hospital, Landmark, Home as ShelterIcon
} from 'lucide-react'
import Map from '../components/Map.jsx'
import Loader from '../components/Loader.jsx'
import { getEmergencyData } from '../services/api.js'
import { getDistanceKm } from '../services/mapService.js'
import { NER_CENTER, NER_ZOOM } from '../utils/constants.js'

// Rough bounding box around the NER service area (Assam/Meghalaya/etc.) this
// prototype's shelters/hospitals/police data actually covers. If the device's
// real GPS reports a location way outside this box (e.g. testing the app from
// elsewhere in India), "nearest shelter" distances become meaningless, so we
// fall back to the NER reference point instead of showing a 1000+ km result.
const NER_BOUNDS = { minLat: 21.5, maxLat: 29.5, minLon: 87.5, maxLon: 97.5 }
const isWithinNER = (lat, lon) =>
  lat >= NER_BOUNDS.minLat && lat <= NER_BOUNDS.maxLat &&
  lon >= NER_BOUNDS.minLon && lon <= NER_BOUNDS.maxLon

const SHELTER_COLOR = '#22c55e'
const RECOMMENDED_COLOR = '#fbbf24'
const HOSPITAL_COLOR = '#ef4444'
const POLICE_COLOR = '#3b82f6'
const USER_COLOR = '#a855f7'

// How close (km) a known hazard needs to be to the straight line between the
// user and a shelter before we surface a route-disruption warning. This is a
// simple prototype heuristic, not real routing — see disclaimer in the UI.
const HAZARD_WARNING_THRESHOLD_KM = 12

// Rough point-to-segment distance using a handful of interpolated samples
// along the straight line — good enough for a prototype caution flag.
function minDistanceToLine(point, from, to, samples = 20) {
  let min = Infinity
  for (let i = 0; i <= samples; i += 1) {
    const t = i / samples
    const lat = from.lat + (to.lat - from.lat) * t
    const lon = from.lon + (to.lon - from.lon) * t
    const d = getDistanceKm(point.lat, point.lon, lat, lon)
    if (d < min) min = d
  }
  return min
}

export default function EmergencyMode({ onClose }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isPrototypeData, setIsPrototypeData] = useState(true)

  const [userLocation, setUserLocation] = useState(null)
  const [locationStatus, setLocationStatus] = useState('idle') // idle | requesting | granted | denied | unsupported | outside_ner
  const [selectedShelterId, setSelectedShelterId] = useState(null)

  useEffect(() => {
    let mounted = true
    getEmergencyData()
      .then((res) => {
        if (!mounted) return
        setData(res.data.data || res.data)
        setIsPrototypeData(res.data.isPrototypeData !== false)
      })
      .catch(() => {
        if (mounted) setError('Could not load emergency assistance data.')
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => { mounted = false }
  }, [])

  const requestLocation = () => {
    if (!('geolocation' in navigator)) {
      setLocationStatus('unsupported')
      return
    }
    setLocationStatus('requesting')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords
        if (!isWithinNER(lat, lon)) {
          // Real GPS location is outside the NER service area this prototype
          // covers — don't compute misleading distances, use the NER reference point.
          setUserLocation(null)
          setLocationStatus('outside_ner')
          return
        }
        setUserLocation({ lat, lon })
        setLocationStatus('granted')
      },
      () => setLocationStatus('denied'),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  // Auto-request location once on entering Emergency Mode
  useEffect(() => {
    requestLocation()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const referencePoint = userLocation
    || (data?.shelters?.length ? { lat: data.shelters[0].lat, lon: data.shelters[0].lon } : { lat: NER_CENTER[0], lon: NER_CENTER[1] })

  const sheltersWithDistance = useMemo(() => {
    if (!data?.shelters) return []
    return data.shelters
      .map((s) => ({ ...s, distanceKm: getDistanceKm(referencePoint.lat, referencePoint.lon, s.lat, s.lon) }))
      .sort((a, b) => {
        if (a.distanceKm == null || b.distanceKm == null) return 0
        return a.distanceKm - b.distanceKm
      })
  }, [data, referencePoint])

  // Prefer the nearest shelter that is not flagged limited/closed, unless
  // every open shelter happens to sit right next to a known hazard.
  const recommendedShelter = useMemo(() => {
    if (sheltersWithDistance.length === 0) return null
    const openOnes = sheltersWithDistance.filter((s) => s.status === 'open')
    return (openOnes[0] || sheltersWithDistance[0])
  }, [sheltersWithDistance])

  useEffect(() => {
    if (!selectedShelterId && recommendedShelter) {
      setSelectedShelterId(recommendedShelter.id)
    }
  }, [recommendedShelter, selectedShelterId])

  const selectedShelter = sheltersWithDistance.find((s) => s.id === selectedShelterId) || recommendedShelter

  const routeHazardWarning = useMemo(() => {
    if (!selectedShelter || !userLocation || !data?.hazards) return null
    const nearby = data.hazards.find(
      (h) => minDistanceToLine(h, userLocation, selectedShelter) <= HAZARD_WARNING_THRESHOLD_KM
    )
    return nearby || null
  }, [selectedShelter, userLocation, data])

  const mapLocations = useMemo(() => {
    if (!data) return []
    const list = []
    if (userLocation) {
      list.push({ id: 'user-location', name: 'You are here', lat: userLocation.lat, lon: userLocation.lon, color: USER_COLOR, status: 'active' })
    }
    data.shelters?.forEach((s) => {
      list.push({
        id: s.id,
        name: `🏠 ${s.name}${s.id === recommendedShelter?.id ? ' (Recommended)' : ''}`,
        lat: s.lat,
        lon: s.lon,
        color: s.id === recommendedShelter?.id ? RECOMMENDED_COLOR : SHELTER_COLOR,
        status: s.status
      })
    })
    data.hospitals?.forEach((h) => {
      list.push({ id: h.id, name: `🏥 ${h.name}`, lat: h.lat, lon: h.lon, color: HOSPITAL_COLOR })
    })
    data.policeStations?.forEach((p) => {
      list.push({ id: p.id, name: `👮 ${p.name}`, lat: p.lat, lon: p.lon, color: POLICE_COLOR })
    })
    return list
  }, [data, userLocation, recommendedShelter])

  const disruptionMarkers = useMemo(() => (data?.hazards || []).map((h) => ({
    id: h.id, type: h.type, lat: h.lat, lon: h.lon, label: h.label, description: h.description
  })), [data])

  const mapCenter = userLocation ? [userLocation.lat, userLocation.lon] : NER_CENTER
  const mapZoom = userLocation ? 10 : NER_ZOOM

  const navigateToShelter = () => {
    if (!selectedShelter) return
    const origin = userLocation ? `${userLocation.lat},${userLocation.lon}` : ''
    const destination = `${selectedShelter.lat},${selectedShelter.lon}`
    const url = origin
      ? `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`
      : `https://www.google.com/maps/search/?api=1&query=${destination}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div style={overlayStyle}>
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldAlert size={22} color="#fff" />
          <span style={{ fontWeight: 700, fontSize: '16px', letterSpacing: '0.5px' }}>EMERGENCY MODE ACTIVE</span>
        </div>
        <button onClick={onClose} style={closeButtonStyle}>
          <X size={16} /> Turn Off Emergency Mode
        </button>
      </div>

      <div style={{ padding: '16px', overflowY: 'auto', flex: 1 }}>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', marginBottom: '16px' }}>
          This is a prototype safety-assistance layer for landslides, floods, road blockages, and other logistics
          emergencies. Shelters and hazard data shown below are <strong>predefined/prototype points</strong>, not a
          guarantee of real-time safety.
        </p>

        {loading && <Loader text="Loading emergency assistance data..." />}
        {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}

        {!loading && !error && (
          <div style={gridStyle}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Location status card */}
              <div className="card">
                <div style={cardTitleStyle}><LocateFixed size={16} /> Current Location</div>
                {locationStatus === 'requesting' && <p style={mutedText}>Requesting location permission…</p>}
                {locationStatus === 'granted' && userLocation && (
                  <p style={mutedText}>Lat {userLocation.lat.toFixed(4)}, Lon {userLocation.lon.toFixed(4)}</p>
                )}
                {locationStatus === 'denied' && (
                  <p style={{ ...mutedText, color: 'var(--warning)' }}>
                    Location permission denied. Showing predefined emergency locations relative to the NER region instead.
                  </p>
                )}
                {locationStatus === 'unsupported' && (
                  <p style={{ ...mutedText, color: 'var(--warning)' }}>
                    Geolocation isn't supported on this device/browser. Showing predefined emergency locations instead.
                  </p>
                )}
                {locationStatus === 'outside_ner' && (
                  <p style={{ ...mutedText, color: 'var(--warning)' }}>
                    Your detected location is outside the North Eastern Region. This prototype's shelters, hospitals
                    and hazard data only cover the NER service area, so we're showing distances from the NER
                    reference point instead of your real location.
                  </p>
                )}
                {(locationStatus === 'denied' || locationStatus === 'idle' || locationStatus === 'outside_ner') && (
                  <button onClick={requestLocation} style={secondaryButtonStyle}>Try location again</button>
                )}
              </div>

              {/* Recommended shelter card */}
              {recommendedShelter && (
                <div className="card" style={{ border: '1px solid var(--warning)' }}>
                  <div style={cardTitleStyle}><ShelterIcon size={16} color={RECOMMENDED_COLOR} /> Recommended Safe Point</div>
                  <p style={{ fontWeight: 600 }}>{recommendedShelter.name}</p>
                  <p style={mutedText}>
                    {recommendedShelter.distanceKm != null
                      ? `Approx. ${recommendedShelter.distanceKm.toFixed(1)} km away`
                      : 'Distance unavailable — enable location for an estimate'}
                  </p>
                  <p style={mutedText}>Status: {recommendedShelter.status} · {recommendedShelter.address}</p>
                </div>
              )}

              {/* Shelter list */}
              <div className="card">
                <div style={cardTitleStyle}><ShelterIcon size={16} /> Nearby Verified Shelters</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {sheltersWithDistance.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedShelterId(s.id)}
                      style={{
                        ...shelterListItemStyle,
                        border: s.id === selectedShelterId ? '1px solid var(--color-primary)' : '1px solid var(--color-border)'
                      }}
                    >
                      <span>{s.name}</span>
                      <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                        {s.distanceKm != null ? `${s.distanceKm.toFixed(1)} km` : '—'} · {s.status}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected shelter details + navigate */}
              {selectedShelter && (
                <div className="card">
                  <div style={cardTitleStyle}><Navigation size={16} /> Selected Shelter</div>
                  <p style={{ fontWeight: 600 }}>{selectedShelter.name}</p>
                  <p style={mutedText}>{selectedShelter.address}</p>
                  <p style={mutedText}>
                    {selectedShelter.distanceKm != null ? `Approx. ${selectedShelter.distanceKm.toFixed(1)} km away` : 'Distance unavailable'}
                    {' · '}Capacity: {selectedShelter.capacity} · Status: {selectedShelter.status}
                  </p>

                  {routeHazardWarning && (
                    <div style={warningBoxStyle}>
                      <AlertTriangle size={16} color="var(--danger)" />
                      <span>Caution: Reported route disruption detected — {routeHazardWarning.label}.</span>
                    </div>
                  )}

                  <button onClick={navigateToShelter} style={primaryButtonStyle}>
                    <Navigation size={16} /> Navigate to Shelter
                  </button>
                  <p style={{ ...mutedText, marginTop: '8px' }}>
                    This shelter is a verified/predefined prototype safe point, not a guarantee of real-time safety.
                  </p>
                </div>
              )}

              {/* Emergency contacts */}
              <div className="card">
                <div style={cardTitleStyle}><Phone size={16} /> Emergency Contacts</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {data?.emergencyContacts?.map((c) => (
                    <a key={c.id} href={`tel:${c.phone}`} style={contactRowStyle}>
                      <span>{c.label}</span>
                      <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{c.phone}</span>
                    </a>
                  ))}
                </div>
                {isPrototypeData && (
                  <p style={{ ...mutedText, marginTop: '8px' }}>
                    Prototype contact numbers shown for demonstration — replace with verified local emergency numbers before real deployment.
                  </p>
                )}
              </div>
            </div>

            {/* Map */}
            <div>
              <Map
                locations={mapLocations}
                disruptionMarkers={disruptionMarkers}
                center={mapCenter}
                zoom={mapZoom}
                height="calc(100vh - 180px)"
              />
              <div style={legendStyle}>
                <span><LegendDot color={USER_COLOR} /> You</span>
                <span><LegendDot color={RECOMMENDED_COLOR} /> Recommended</span>
                <span><LegendDot color={SHELTER_COLOR} /> Shelter</span>
                <span><Hospital size={12} color={HOSPITAL_COLOR} /> Hospital</span>
                <span><Landmark size={12} color={POLICE_COLOR} /> Police</span>
                <span><AlertTriangle size={12} color="var(--warning)" /> Hazard</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function LegendDot({ color }) {
  return <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: color, marginRight: '4px' }} />
}

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  zIndex: 2000,
  background: 'var(--color-bg)',
  display: 'flex',
  flexDirection: 'column'
}

const headerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '14px 20px',
  background: 'var(--danger)',
  color: '#fff'
}

const closeButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  background: 'rgba(255,255,255,0.15)',
  color: '#fff',
  padding: '8px 14px',
  fontSize: '13px',
  fontWeight: 600
}

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'minmax(280px, 380px) 1fr',
  gap: '16px',
  alignItems: 'start'
}

const cardTitleStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontWeight: 600,
  marginBottom: '8px',
  fontSize: '14px'
}

const mutedText = { fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }

const secondaryButtonStyle = {
  marginTop: '8px',
  background: 'var(--color-surface-light)',
  color: 'var(--color-text)',
  padding: '6px 12px',
  fontSize: '12px'
}

const primaryButtonStyle = {
  marginTop: '12px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  background: 'var(--color-primary)',
  color: '#fff',
  padding: '10px 16px',
  fontSize: '14px',
  fontWeight: 600,
  width: '100%',
  justifyContent: 'center'
}

const shelterListItemStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  background: 'var(--color-surface-light)',
  padding: '8px 10px',
  borderRadius: 'var(--radius)',
  fontSize: '13px',
  color: 'var(--color-text)',
  textAlign: 'left'
}

const contactRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  background: 'var(--color-surface-light)',
  padding: '8px 10px',
  borderRadius: 'var(--radius)',
  fontSize: '13px'
}

const warningBoxStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  background: 'rgba(239,68,68,0.12)',
  border: '1px solid var(--danger)',
  borderRadius: 'var(--radius)',
  padding: '8px 10px',
  fontSize: '12px',
  marginTop: '10px'
}

const legendStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '12px',
  fontSize: '11px',
  color: 'var(--color-text-muted)',
  marginTop: '8px',
  alignItems: 'center'
}
