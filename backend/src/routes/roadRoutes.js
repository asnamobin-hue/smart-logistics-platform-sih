const express = require('express')
const router = express.Router()
const {
  getRoadSegments,
  getRoadSegmentById,
  createRoadSegment,
  predictRisk,
  suggestAlternate
} = require('../controllers/roadController')

router.get('/', getRoadSegments)
router.get('/:id', getRoadSegmentById)
router.post('/', createRoadSegment)
router.post('/:id/predict-risk', predictRisk)
router.post('/:id/alternate', suggestAlternate)

module.exports = router
