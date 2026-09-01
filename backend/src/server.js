require('dotenv').config()
const express = require('express')
const http = require('http')
const path = require('path')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const compression = require('compression')
const mongoSanitize = require('express-mongo-sanitize')
const rateLimit = require('express-rate-limit')

const validateEnv = require('./utils/validateEnv')
const logger = require('./utils/logger')
const connectDB = require('./config/db')
const { initSocket } = require('./config/socket')
const { notFound, errorHandler } = require('./middleware/errorHandler')

const locationRoutes = require('./routes/locationRoutes')
const routeRoutes = require('./routes/routeRoutes')
const alertRoutes = require('./routes/alertRoutes')
const analyticsRoutes = require('./routes/analyticsRoutes')
const weatherRoutes = require('./routes/weatherRoutes')
const logisticsRoutes = require('./routes/logisticsRoutes')
const districtRoutes = require('./routes/districtRoutes')
const roadRoutes = require('./routes/roadRoutes')
const fieldReportRoutes = require('./routes/fieldReportRoutes')
const emergencyRoutes = require('./routes/emergencyRoutes')

validateEnv()

const app = express()
const server = http.createServer(app)

// --- Security & parsing middleware ---
app.use(helmet())
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }))
app.use(compression())
app.use(express.json({ limit: '1mb' }))
app.use(mongoSanitize())
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))

// --- Rate limiting ---
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false
})
app.use('/api', limiter)

// --- Routes ---
app.use('/api/locations', locationRoutes)
app.use('/api/routes', routeRoutes)
app.use('/api/alerts', alertRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/weather', weatherRoutes)
app.use('/api/logistics', logisticsRoutes)
app.use('/api/districts', districtRoutes)
app.use('/api/roads', roadRoutes)
app.use('/api/field-reports', fieldReportRoutes)
app.use('/api/emergency', emergencyRoutes)

// Serve uploaded field-report photos (geo-tagged incident images)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')))

app.get('/api/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }))

// --- Error handling (must be last) ---
app.use(notFound)
app.use(errorHandler)

const PORT = process.env.PORT || 5001

connectDB().then(() => {
  initSocket(server)
  server.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`)
  })
})

// --- Graceful shutdown ---
process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

function shutdown() {
  logger.info('Shutting down gracefully...')
  server.close(() => {
    logger.info('HTTP server closed')
    require('mongoose').connection.close(false, () => {
      logger.info('MongoDB connection closed')
      process.exit(0)
    })
  })
}