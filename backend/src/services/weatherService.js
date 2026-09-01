const axios = require('axios')

const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather'

/**
 * Fetches current weather for a coordinate using OpenWeatherMap.
 * Requires WEATHER_API_KEY in backend/.env
 */
async function getCurrentWeather(lat, lon) {
  if (!process.env.WEATHER_API_KEY) {
    throw new Error('WEATHER_API_KEY is not set in backend/.env')
  }

  const response = await axios.get(BASE_URL, {
    params: {
      lat,
      lon,
      appid: process.env.WEATHER_API_KEY,
      units: 'metric'
    }
  })

  const data = response.data
  return {
    condition: data.weather?.[0]?.main || 'Unknown',
    description: data.weather?.[0]?.description || '',
    temperatureC: data.main?.temp,
    windSpeed: data.wind?.speed,
    humidity: data.main?.humidity
  }
}

module.exports = { getCurrentWeather }