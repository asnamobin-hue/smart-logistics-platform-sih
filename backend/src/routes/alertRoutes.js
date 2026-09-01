const express = require('express')
const router = express.Router()
const { getAlerts, createAlert, resolveAlert } = require('../controllers/alertController')
const { alertValidation, mongoIdValidation } = require('../utils/validators')

router.get('/', getAlerts)
router.post('/', alertValidation, createAlert)
router.patch('/:id/resolve', mongoIdValidation, resolveAlert)

module.exports = router