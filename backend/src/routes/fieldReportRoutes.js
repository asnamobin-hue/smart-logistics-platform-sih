const express = require('express')
const router = express.Router()
const upload = require('../middleware/upload')
const {
  getFieldReports,
  createFieldReport,
  updateReportStatus
} = require('../controllers/fieldReportController')

router.get('/', getFieldReports)
router.post('/', upload.single('photo'), createFieldReport)
router.patch('/:id/status', updateReportStatus)

module.exports = router
