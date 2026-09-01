const { body, param, query, validationResult } = require('express-validator')

// Call this after any validation chain to actually enforce it
function validate(req, res, next) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg })
  }
  next()
}

const locationValidation = [
  body('name').isString().trim().notEmpty().withMessage('name is required'),
  body('lat').isFloat({ min: -90, max: 90 }).withMessage('lat must be between -90 and 90'),
  body('lon').isFloat({ min: -180, max: 180 }).withMessage('lon must be between -180 and 180'),
  validate
]

const routeValidation = [
  body('origin').isString().trim().notEmpty().withMessage('origin is required'),
  body('destination').isString().trim().notEmpty().withMessage('destination is required'),
  validate
]

const alertValidation = [
  body('title').isString().trim().notEmpty().withMessage('title is required'),
  body('message').isString().trim().notEmpty().withMessage('message is required'),
  body('severity').optional().isIn(['low', 'medium', 'high']).withMessage('invalid severity'),
  validate
]

const mongoIdValidation = [
  param('id').isMongoId().withMessage('invalid id format'),
  validate
]

const weatherQueryValidation = [
  query('lat').isFloat({ min: -90, max: 90 }).withMessage('lat is required and must be valid'),
  query('lon').isFloat({ min: -180, max: 180 }).withMessage('lon is required and must be valid'),
  validate
]

// Smart Route Intelligence — POST /api/routes/analyze
const routeAnalysisValidation = [
  body('origin').isString().trim().notEmpty().withMessage('origin is required'),
  body('destination').isString().trim().notEmpty().withMessage('destination is required'),
  body('cargo')
    .isIn(['Medicines', 'Food Supplies', 'Emergency Supplies', 'Construction Material', 'General Goods'])
    .withMessage('cargo must be one of: Medicines, Food Supplies, Emergency Supplies, Construction Material, General Goods'),
  body('priority')
    .isIn(['Normal', 'High', 'Emergency'])
    .withMessage('priority must be one of: Normal, High, Emergency'),
  validate
]

module.exports = {
  locationValidation,
  routeValidation,
  alertValidation,
  mongoIdValidation,
  weatherQueryValidation,
  routeAnalysisValidation
}