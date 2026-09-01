const express = require('express')
const router = express.Router()
const { getLocations, getLocationById, createLocation } = require('../controllers/locationController')
const { locationValidation, mongoIdValidation } = require('../utils/validators')

router.get('/', getLocations)
router.get('/:id', mongoIdValidation, getLocationById)
router.post('/', locationValidation, createLocation)

module.exports = router