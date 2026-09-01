// Rule-based disruption prediction — no external AI/ML service required to run,
// but structured so a trained model can be dropped in later (see ai/README.md).
//
// Implements SIH 26002 requirement (b): "Predicting possible route disruptions
// caused by landslides, floods, heavy rainfall, road damage, or traffic congestion".

const TERRAIN_BASE_RISK = {
  mountainous: 30,
  hilly: 20,
  riverine: 22,
  plains: 5
}

const WEATHER_RISK = {
  Rain: 15,
  Thunderstorm: 30,
  Drizzle: 8,
  Snow: 20,
  Fog: 10,
  Clear: 0,
  Clouds: 2,
  Unknown: 5
}

// Heavy rainfall (mm, last 24h) contributes additional risk on top of weather condition
function rainfallRisk(rainfallMm = 0) {
  if (rainfallMm >= 150) return 35 // extreme — very high landslide/flood likelihood
  if (rainfallMm >= 80) return 22
  if (rainfallMm >= 40) return 12
  if (rainfallMm >= 15) return 5
  return 0
}

function roadConditionRisk({ type = 'road', recentIncidentCount = 0, daysSinceInspection = 0 }) {
  let risk = 0
  if (type === 'bridge') risk += 8 // bridges fail more critically than open roads
  risk += Math.min(recentIncidentCount * 6, 30) // repeated field reports raise risk
  if (daysSinceInspection > 90) risk += 10
  else if (daysSinceInspection > 30) risk += 5
  return risk
}

function congestionRisk(recentRouteCount = 0) {
  if (recentRouteCount >= 15) return 15
  if (recentRouteCount >= 8) return 8
  return 0
}

function riskLevelFromScore(score) {
  if (score >= 70) return 'severe'
  if (score >= 45) return 'high'
  if (score >= 20) return 'moderate'
  return 'low'
}

/**
 * Predicts a 0-100 disruption risk score for a road/bridge segment.
 * @param {Object} params
 * @param {'road'|'bridge'} params.type
 * @param {'hilly'|'mountainous'|'plains'|'riverine'} params.terrain
 * @param {string} params.weatherCondition - e.g. 'Rain', 'Clear'
 * @param {number} params.rainfallMm - rainfall in the last 24h
 * @param {number} params.recentIncidentCount - field reports for this segment in the last 7 days
 * @param {number} params.daysSinceInspection
 * @param {number} params.recentRouteCount - vehicles routed through this segment recently
 * @returns {{ riskScore: number, riskLevel: string, riskFactors: string[] }}
 */
function predictDisruptionRisk({
  type = 'road',
  terrain = 'hilly',
  weatherCondition = 'Clear',
  rainfallMm = 0,
  recentIncidentCount = 0,
  daysSinceInspection = 0,
  recentRouteCount = 0
} = {}) {
  const factors = []

  const terrainRisk = TERRAIN_BASE_RISK[terrain] ?? TERRAIN_BASE_RISK.hilly
  const weatherRiskScore = WEATHER_RISK[weatherCondition] ?? WEATHER_RISK.Unknown
  const rainRisk = rainfallRisk(rainfallMm)
  const roadRisk = roadConditionRisk({ type, recentIncidentCount, daysSinceInspection })
  const trafficRisk = congestionRisk(recentRouteCount)

  if (terrain === 'mountainous' || terrain === 'hilly') factors.push('landslide')
  if (terrain === 'riverine' || rainfallMm >= 40) factors.push('flood')
  if (rainRisk > 0 || ['Rain', 'Thunderstorm', 'Drizzle'].includes(weatherCondition)) factors.push('heavy_rainfall')
  if (recentIncidentCount > 0 || daysSinceInspection > 30) factors.push('road_damage')
  if (trafficRisk > 0) factors.push('congestion')

  const total = Math.min(
    100,
    Math.round(terrainRisk + weatherRiskScore + rainRisk + roadRisk + trafficRisk)
  )

  return {
    riskScore: total,
    riskLevel: riskLevelFromScore(total),
    riskFactors: [...new Set(factors)]
  }
}

/**
 * Suggests whether an alternate route should be used and estimates the delay,
 * given the risk of the primary segment vs. an alternate.
 * Implements SIH 26002 requirement (c).
 */
function suggestAlternateRoute({ primaryRiskScore = 0, alternateRiskScore = 0, primaryEtaMinutes = 0, alternateEtaMinutes = 0 }) {
  const primaryBlocked = primaryRiskScore >= 70
  const alternateSafer = alternateRiskScore < primaryRiskScore - 15

  const useAlternate = primaryBlocked || alternateSafer
  const estimatedDelayMinutes = useAlternate
    ? Math.max(0, alternateEtaMinutes - primaryEtaMinutes)
    : 0

  return {
    useAlternate,
    reason: primaryBlocked
      ? 'Primary route risk is severe (likely blocked or unsafe).'
      : alternateSafer
        ? 'Alternate route has significantly lower disruption risk.'
        : 'Primary route remains the best option.',
    estimatedDelayMinutes
  }
}

module.exports = { predictDisruptionRisk, suggestAlternateRoute }
