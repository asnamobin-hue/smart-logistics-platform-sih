const express = require('express')
const router = express.Router()
const { getSummary } = require('../controllers/logisticsController')

router.get('/summary', getSummary)

module.exports = router