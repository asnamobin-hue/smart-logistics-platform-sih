// Prompt template for the AI Route Risk Analyzer.
//
// The AI never computes coordinates, distance, or travel time — those come from the
// routing service. It only reasons over already-computed route metrics plus
// disruption reports (from field reports / road segments / alerts) to rank routes
// and explain the risk in plain language.

/**
 * @param {{ routes: Array<{id:string,name:string,distanceKm:number,etaMinutes:number,disruptions:Array<{type:string,severity:string,name:string}>}>, cargo: string, priority: string }} params
 * @returns {string}
 */
function buildRouteRiskPrompt({ routes, cargo, priority }) {
  const routeLines = routes
    .map((r, i) => {
      const disruptionText = r.disruptions.length
        ? r.disruptions.map((d) => `${d.type} (${d.severity}) near ${d.name}`).join('; ')
        : 'No known disruptions reported'
      return `Route ${i + 1} [id=${r.id}] "${r.name}": ${r.distanceKm} km, ${r.etaMinutes} min ETA. Disruptions: ${disruptionText}.`
    })
    .join('\n')

  return `You are an AI Route Risk Analyzer for a disaster-response logistics platform.

You are given several possible driving routes between the same origin and destination,
already computed by a routing service (distance and time are fixed and correct — do not
change them). You are also given known disruptions (from field reports and road
monitoring) near each route. Your job is ONLY to:
1. Judge disruption type and severity for each route.
2. Compare relative risk across routes, factoring in the cargo type and delivery priority below.
3. Rank the routes into exactly one "recommended", one "alternative", and treat any
   remaining routes as "avoid" (if only 2 routes are given, label the safer one
   "recommended" and the other "alternative" or "avoid" as appropriate; if only 1 route
   is given, label it "recommended" unless it has severe disruptions, in which case "avoid").
4. Give short, concrete reasons (max 3 short bullet phrases per route, under 12 words each).

Cargo type: ${cargo}
Delivery priority: ${priority}
(Emergency priority tolerates more delay-risk for a faster route. Medicines and Emergency
Supplies should weigh safety/accessibility more heavily than General Goods or Construction Material.)

Routes:
${routeLines}

Respond with ONLY valid JSON, no markdown fences, no commentary, matching exactly this shape:
{
  "results": [
    {
      "id": "<route id from above>",
      "label": "recommended" | "alternative" | "avoid",
      "riskLevel": "low" | "moderate" | "high" | "severe",
      "status": "Open" | "Limited" | "Blocked",
      "delayMinutes": <integer, extra minutes beyond the base ETA expected from disruptions, 0 if none>,
      "reasons": ["short reason", "short reason"]
    }
  ]
}`
}

module.exports = { buildRouteRiskPrompt }
