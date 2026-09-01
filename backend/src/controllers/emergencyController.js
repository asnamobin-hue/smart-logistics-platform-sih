const {
  shelters,
  hospitals,
  policeStations,
  hazards,
  emergencyContacts
} = require('../data/emergencyData')

// GET /api/emergency/points
// Static prototype data: deliberately independent of MongoDB.
function getEmergencyPoints(req, res, next) {
  try {
    return res.status(200).json({
      data: {
        shelters: Array.isArray(shelters) ? shelters : [],
        hospitals: Array.isArray(hospitals) ? hospitals : [],
        policeStations: Array.isArray(policeStations) ? policeStations : [],
        hazards: Array.isArray(hazards) ? hazards : [],
        emergencyContacts: Array.isArray(emergencyContacts) ? emergencyContacts : []
      },
      isPrototypeData: true,
      disclaimer:
        'These are predefined/prototype safe points and contacts for demonstration only — not a guarantee of real-time safety.'
    })
  } catch (error) {
    return next(error)
  }
}

module.exports = { getEmergencyPoints }
