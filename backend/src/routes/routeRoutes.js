const express = require('express')
const router = express.Router()
const { getRoutes, createRoute, optimizeRoute } = require('../controllers/routeController')
const { analyzeRoute } = require('../controllers/routeAnalysisController')
const { routeValidation, routeAnalysisValidation } = require('../utils/validators')

router.get('/', getRoutes)
router.post('/', routeValidation, createRoute)
router.post('/optimize', optimizeRoute)
// Smart Route Intelligence — AI Route Risk Analyzer (Recommended/Alternative/Avoid)
router.post('/analyze', routeAnalysisValidation, analyzeRoute)

module.exports = router