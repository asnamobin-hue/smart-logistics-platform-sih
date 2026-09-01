// Rule-based demand/delay prediction — no external AI required.
// Swap this out for a real model call later (see ai/README.md).

/**
 * Estimates delivery delay risk based on distance and current weather condition.
 * @param {number} distanceKm
 * @param {string} weatherCondition - e.g. 'Rain', 'Clear', 'Snow'
 * @returns {{ riskLevel: 'low'|'medium'|'high', reason: string }}
 */
function predictDelayRisk(distanceKm = 0, weatherCondition = 'Clear') {
  const badWeather = ['Rain', 'Snow', 'Thunderstorm', 'Fog'].includes(weatherCondition)

  if (distanceKm > 300 && badWeather) {
    return { riskLevel: 'high', reason: 'Long distance combined with poor weather conditions.' }
  }
  if (distanceKm > 300 || badWeather) {
    return { riskLevel: 'medium', reason: badWeather ? 'Weather conditions may cause delays.' : 'Long route distance.' }
  }
  return { riskLevel: 'low', reason: 'Normal conditions expected.' }
}

/**
 * Simple demand estimate for a location, based on recent route count.
 * @param {number} recentRouteCount - number of routes touching this location in the last period
 * @returns {{ demandLevel: 'low'|'medium'|'high' }}
 */
function predictDemand(recentRouteCount = 0) {
  if (recentRouteCount >= 10) return { demandLevel: 'high' }
  if (recentRouteCount >= 4) return { demandLevel: 'medium' }
  return { demandLevel: 'low' }
}

module.exports = { predictDelayRisk, predictDemand }