// Thin wrapper the rest of the backend calls — currently backed by rule-based
// logic in /ai/prediction. Swap internals later without touching controllers.

const { predictDelayRisk, predictDemand } = require('../../../ai/prediction/demandPrediction')
const { predictDisruptionRisk, suggestAlternateRoute } = require('../../../ai/prediction/disruptionPrediction')
const { rankRoutesRuleBased } = require('../../../ai/prediction/routeRiskPrediction')
const { analyzeWithAI } = require('./aiRouteRiskAnalyzer')
const logger = require('../utils/logger')

async function getDelayRisk(distanceKm, weatherCondition) {
  return predictDelayRisk(distanceKm, weatherCondition)
}

async function getDemandEstimate(recentRouteCount) {
  return predictDemand(recentRouteCount)
}

async function getDisruptionRisk(params) {
  return predictDisruptionRisk(params)
}

async function getAlternateRouteSuggestion(params) {
  return suggestAlternateRoute(params)
}

// AI Route Risk Analyzer — ranks pre-computed routes (Recommended/Alternative/Avoid).
// Tries the configured AI provider first; falls back to rule-based scoring on any
// failure (no key configured, network error, malformed AI response, etc.) so this
// feature always returns a result, with or without an AI API key.
async function analyzeRouteRisk({ routes, cargo, priority }) {
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const results = await analyzeWithAI({ routes, cargo, priority })
      return { results, usedAI: true }
    } catch (err) {
      logger.warn(`AI route risk analysis failed, falling back to rule-based scoring: ${err.message}`)
    }
  }
  return { results: rankRoutesRuleBased({ routes, cargo, priority }), usedAI: false }
}

module.exports = {
  getDelayRisk,
  getDemandEstimate,
  getDisruptionRisk,
  getAlternateRouteSuggestion,
  analyzeRouteRisk
}