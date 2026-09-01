// Shared constants used across the frontend

export const SEVERITY_LEVELS = ['low', 'medium', 'high']

export const ROUTE_STATUSES = ['pending', 'active', 'completed']

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || '/api'

export const REFRESH_INTERVAL_MS = 30000 // fallback polling interval if sockets disconnect

export const MAP_DEFAULTS = {
  center: [20.5937, 78.9629],
  zoom: 5
}

// --- North Eastern Region (NER) — SIH problem statement 26002 ---
export const NER_CENTER = [25.6, 92.9]
export const NER_ZOOM = 6.5

export const CONNECTIVITY_STATUSES = ['normal', 'partial', 'disrupted']

export const ROAD_STATUSES = ['open', 'restricted', 'blocked']

export const RISK_LEVELS = ['low', 'moderate', 'high', 'severe']

export const ROAD_STATUS_COLORS = {
  open: '#22c55e',
  restricted: '#f59e0b',
  blocked: '#ef4444'
}

export const RISK_LEVEL_COLORS = {
  low: '#22c55e',
  moderate: '#eab308',
  high: '#f97316',
  severe: '#ef4444'
}

export const CARGO_TYPES = [
  { value: 'medicine', label: 'Medicine' },
  { value: 'food_supplies', label: 'Food Supplies' },
  { value: 'agricultural_produce', label: 'Agricultural Produce' },
  { value: 'construction_material', label: 'Construction Material' },
  { value: 'general', label: 'General' }
]

export const INCIDENT_TYPES = [
  { value: 'landslide', label: 'Landslide' },
  { value: 'flood', label: 'Flood' },
  { value: 'road_damage', label: 'Road Damage' },
  { value: 'bridge_damage', label: 'Bridge Damage' },
  { value: 'blocked_road', label: 'Blocked Road' },
  { value: 'heavy_rainfall', label: 'Heavy Rainfall' },
  { value: 'traffic_congestion', label: 'Traffic Congestion' },
  { value: 'other', label: 'Other' }
]

// Field reports queued locally while offline (requirement h)
export const OFFLINE_QUEUE_KEY = 'ner_field_reports_offline_queue'

// --- Emergency Mode ---
export const INCIDENT_STATUSES = ['active', 'under_response', 'resolved']

export const INCIDENT_STATUS_META = {
  active: { label: 'Active', color: '#ef4444' },
  under_response: { label: 'Under Response', color: '#f59e0b' },
  resolved: { label: 'Resolved', color: '#22c55e' }
}

// Vehicle status while Emergency Mode is active — overlays the normal
// in_transit/delayed/idle status with emergency-specific states.
export const VEHICLE_EMERGENCY_STATUSES = ['on_route', 'rerouted', 'delayed', 'stuck_at_risk', 'delivered']

export const VEHICLE_EMERGENCY_STATUS_META = {
  on_route: { label: 'On Route', color: '#22c55e' },
  rerouted: { label: 'Rerouted', color: '#2E86AB' },
  delayed: { label: 'Delayed', color: '#f59e0b' },
  stuck_at_risk: { label: 'Stuck / At Risk', color: '#ef4444' },
  delivered: { label: 'Delivered', color: '#8BC53D' }
}

// Cargo types treated as "critical supplies" for emergency route prioritization
export const CRITICAL_CARGO_TYPES = ['medicine', 'food_supplies', 'rescue_equipment', 'emergency_supplies']

export const SHELTER_STATUS_COLORS = {
  open: '#22c55e',
  full: '#f59e0b',
  closed: '#ef4444'
}

export const RECOMMENDED_ACTIONS = {
  landslide: 'Reroute all traffic via nearest alternate corridor; avoid the flagged segment until cleared.',
  flood: 'Suspend non-essential movement through the area; prioritize essential-cargo rerouting.',
  bridge_damage: 'Close the bridge to all traffic; redirect essential cargo via an alternate river crossing.',
  road_damage: 'Restrict heavy vehicles and monitor; repair before reopening to full traffic.',
  blocked_road: 'Deploy an alternate route for essential cargo and coordinate with district authorities to clear the road.',
  heavy_rainfall: 'Monitor river- and landslide-prone segments closely; be ready to reroute at short notice.',
  traffic_congestion: 'Advise an alternate route or timing; no structural risk currently.',
  other: 'Assess on-site and classify severity.'
}

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'as', label: 'অসমীয়া' }
]
