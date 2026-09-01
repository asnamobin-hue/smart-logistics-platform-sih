const express = require('express')
const router = express.Router()
const { getEmergencyPoints } = require('../controllers/emergencyController')

router.get('/points', getEmergencyPoints)

module.exports = router
