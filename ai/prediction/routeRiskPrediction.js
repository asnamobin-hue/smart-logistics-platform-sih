// Rule-based fallback for the AI Route Risk Analyzer — used when no AI API key is
// configured, or when the AI call fails/errors for any reason. Keeps the Smart Route
// Intelligence feature fully functional with zero external dependencies.

const SEVERITY_WEIGHT = { low: 5, moderate: 15, high: 30, severe: 50 }

// Cargo that should weigh safety much more heavily than speed.
const SAFETY_SENSITIVE_CARGO = new Set(['Medicines', 'Emergency Supplies'])

function statusFromDisruptions(disruptions) {
  if (disruptions.some((d) => d.severity === 'severe')) return 'Blocked'
  if (disruptions.some((d) => d.severity === 'high' || d.severity === 'moderate')) return 'Limited'
  return 'Open'
}

function riskLevelFromScore(score) {
  if (score >= 60) return 'severe'
  if (score >= 35) return 'high'
  if (score >= 15) return 'moderate'
  return 'low'
}

function buildReasons(route, disruptions, label) {
  const reasons = []
  if (disruptions.length === 0) {
    reasons.push('No known disruptions on this route')
  } else {
    disruptions.slice(0, 2).forEach((d) => {
      reasons.push(`${d.severity} ${d.type.replace('_', ' ')} near ${d.name}`)
    })
  }
  if (label === 'recommended') reasons.unshift('Best balance of safety and speed')
  if (label === 'avoid' && disruptions.length > 0) reasons.push('Risk too high for reliable delivery')
  return reasons.slice(0, 3)
}

/**
 * Ranks pre-computed routes (distance/time already known) into
 * recommended / alternative / avoid using disruption severity, cargo, and priority.
 *
 * @param {{ routes: Array<{id:string,name:string,distanceKm:number,etaMinutes:number,disruptions:Array<{type:string,severity:string,name:string}>}>, cargo: string, priority: string }} params
 */
function rankRoutesRuleBased({ routes, cargo, priority }) {
  const safetyFirst = SAFETY_SENSITIVE_CARGO.has(cargo)
  const speedTolerant = priority === 'Emergency'
  const timeWeight = speedTolerant ? 0.05 : 0.15

  const scored = routes.map((route) => {
    const disruptionScore = route.disruptions.reduce(
      (sum, d) => sum + (SEVERITY_WEIGHT[d.severity] || 5),
      0
    )
    const safetyMultiplier = safetyFirst ? 1.3 : 1
    const timePenalty = route.etaMinutes * timeWeight
    const score = disruptionScore * safetyMultiplier + timePenalty
    return { route, score, disruptionScore }
  })

  scored.sort((a, b) => a.score - b.score)

  return scored.map((entry, index) => {
    let label = 'avoid'
    if (index === 0) label = 'recommended'
    else if (index === 1) label = 'alternative'

    // Even the "best" route should be marked avoid if it's genuinely severe.
    if (label === 'recommended' && entry.route.disruptions.some((d) => d.severity === 'severe')) {
      label = 'avoid'
    }

    const riskLevel = riskLevelFromScore(entry.disruptionScore)
    const status = statusFromDisruptions(entry.route.disruptions)
    const delayMinutes = entry.route.disruptions.reduce((sum, d) => {
      const perSeverityDelay = { low: 5, moderate: 15, high: 35, severe: 60 }
      return sum + (perSeverityDelay[d.severity] || 0)
    }, 0)

    return {
      id: entry.route.id,
      label,
      riskLevel,
      status,
      delayMinutes,
      reasons: buildReasons(entry.route, entry.route.disruptions, label)
    }
  })
}

module.exports = { rankRoutesRuleBased }
