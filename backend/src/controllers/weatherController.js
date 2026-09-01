const { getCurrentWeather } = require('../services/weatherService')

// GET /api/weather?lat=..&lon=..
async function getWeather(req, res, next) {
  try {
    const { lat, lon } = req.query
    if (lat == null || lon == null) {
      return res.status(400).json({ error: 'lat and lon query params are required' })
    }

    const weather = await getCurrentWeather(Number(lat), Number(lon))
    res.json(weather)
  } catch (err) {
    // If the API key isn't active yet, surface a clear message instead of a raw 500
    if (err.response?.status === 401) {
      return res.status(503).json({
        error: 'Weather service unavailable — API key may still be activating (can take up to 2 hours after signup).'
      })
    }
    next(err)
  }
}

module.exports = { getWeather }