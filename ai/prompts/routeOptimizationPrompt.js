// Prompt template for future LLM-based route optimization.
// Not called yet — kept ready for when a real AI provider is connected (see ai/README.md).

/**
 * Builds a prompt asking an LLM to suggest route optimizations.
 * @param {{ origin: string, destination: string, distanceKm: number, weather: string }} routeInfo
 * @returns {string}
 */
function buildRouteOptimizationPrompt({ origin, destination, distanceKm, weather }) {
  return `You are a logistics route optimization assistant.

Route: ${origin} to ${destination}
Distance: ${distanceKm} km
Current weather: ${weather}

Suggest whether this route should be adjusted for efficiency or safety, and briefly explain why.
Respond in JSON: { "suggestion": string, "reason": string }`
}

module.exports = { buildRouteOptimizationPrompt }