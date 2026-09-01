// Prototype / demo data for Emergency Assistance Mode (SIH 26002 — safety layer).
// NOTE: These are illustrative sample coordinates along the Guwahati <-> Shillong
// corridor (same NER region used elsewhere in the demo dataset), NOT verified
// real-time disaster-response information. Replace with a live feed / DB
// collection before any real deployment.

const shelters = [
  { id: 'shelter-01', name: 'Guwahati Community Relief Shelter', lat: 26.1445, lon: 91.7362, capacity: 250, status: 'open', address: 'GS Road, Guwahati, Assam' },
  { id: 'shelter-02', name: 'Byrnihat Transit Safe Point', lat: 25.9820, lon: 91.8760, capacity: 80, status: 'open', address: 'NH-6, Byrnihat, Ri-Bhoi' },
  { id: 'shelter-03', name: 'Nongpoh Government School Shelter', lat: 25.9075, lon: 91.8805, capacity: 150, status: 'limited', address: 'Nongpoh Town, Ri-Bhoi, Meghalaya' },
  { id: 'shelter-04', name: 'Shillong Civil Defence Shelter', lat: 25.5788, lon: 91.8933, capacity: 300, status: 'open', address: 'Police Bazar, Shillong, Meghalaya' }
]

const hospitals = [
  { id: 'hospital-01', name: 'Guwahati Medical College Hospital', lat: 26.1420, lon: 91.7480, address: 'Bhangagarh, Guwahati' },
  { id: 'hospital-02', name: 'Ri-Bhoi District Hospital', lat: 25.9100, lon: 91.8830, address: 'Nongpoh, Ri-Bhoi' },
  { id: 'hospital-03', name: 'Nazareth Hospital Shillong', lat: 25.5730, lon: 91.8890, address: 'Laitumkhrah, Shillong' }
]

const policeStations = [
  { id: 'police-01', name: 'Guwahati Central Police Station', lat: 26.1580, lon: 91.7480, address: 'Panbazar, Guwahati' },
  { id: 'police-02', name: 'Byrnihat Police Outpost', lat: 25.9840, lon: 91.8700, address: 'NH-6, Byrnihat' },
  { id: 'police-03', name: 'Sadar Police Station Shillong', lat: 25.5760, lon: 91.8820, address: 'Sadar, Shillong' }
]

// Illustrative reported hazards. `type` values line up with the frontend's
// existing DISRUPTION_EMOJI / disruption-marker types so the map layer can
// reuse the current Map component without any changes.
const hazards = [
  { id: 'hazard-01', type: 'landslide', lat: 25.75, lon: 91.88, label: 'Landslide near Nongpoh Ghat section', description: 'Prototype hazard — partial carriageway blockage reported.' },
  { id: 'hazard-02', type: 'flood', lat: 26.05, lon: 91.80, label: 'Flooding near Kamrup lowlands', description: 'Prototype hazard — low-lying stretch waterlogged.' },
  { id: 'hazard-03', type: 'blocked_road', lat: 25.90, lon: 91.86, label: 'NH-6 stretch blocked near Byrnihat', description: 'Prototype hazard — road reported blocked, use caution.' }
]

const emergencyContacts = [
  { id: 'contact-police', label: 'Police', phone: '100', type: 'police' },
  { id: 'contact-ambulance', label: 'Ambulance', phone: '108', type: 'ambulance' },
  { id: 'contact-fire', label: 'Fire & Emergency Response', phone: '101', type: 'fire' },
  { id: 'contact-disaster', label: 'State Disaster Management Authority (prototype)', phone: '1070', type: 'disaster_management' },
  { id: 'contact-control-room', label: 'NER-SETU Logistics Control Room (prototype)', phone: '1800-123-4567', type: 'control_room' }
]

module.exports = { shelters, hospitals, policeStations, hazards, emergencyContacts }
