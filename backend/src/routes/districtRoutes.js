const express = require('express')
const router = express.Router()
const { getDistricts, getDistrictById, getDistrictSummary } = require('../controllers/districtController')

router.get('/summary', getDistrictSummary)
router.get('/', getDistricts)
router.get('/:id', getDistrictById)

module.exports = router
