// Fails fast at startup if required environment variables are missing,
// instead of failing later with a confusing error mid-request.

function validateEnv() {
  const required = ['MONGO_URI', 'PORT']
  const missing = required.filter((key) => !process.env[key])

  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`)
    console.error('Check backend/.env against the README.')
    process.exit(1)
  }

  if (!process.env.WEATHER_API_KEY) {
    console.warn('WEATHER_API_KEY not set — /api/weather will return errors until it is added.')
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('ANTHROPIC_API_KEY not set — Smart Route Intelligence will use rule-based risk scoring instead of AI.')
  }
}

module.exports = validateEnv