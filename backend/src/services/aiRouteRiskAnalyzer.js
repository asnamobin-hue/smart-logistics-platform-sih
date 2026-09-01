// Calls an AI provider to rank pre-computed routes by risk. The API key lives ONLY
// here on the backend (never sent to the frontend) and is read from backend/.env.
//
// The AI is only ever given already-computed distances/times/disruptions — it never
// calculates coordinates or route geometry (see ai/prompts/routeRiskPrompt.js).

const axios = require('axios')
const { buildRouteRiskPrompt } = require('../../../ai/prompts/routeRiskPrompt')

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
const AI_MODEL = process.env.AI_MODEL || 'claude-3-5-sonnet-20241022'
const HTTP_TIMEOUT_MS = 15000

function extractJson(text) {
  const cleaned = text.trim().replace(/^```(json)?/i, '').replace(/```$/, '').trim()
  return JSON.parse(cleaned)
}

/**
 * @param {{ routes: Array, cargo: string, priority: string }} params
 * @returns {Promise<Array<{id:string,label:string,riskLevel:string,status:string,delayMinutes:number,reasons:string[]}>>}
 */
async function analyzeWithAI({ routes, cargo, priority }) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not configured')
  }

  const prompt = buildRouteRiskPrompt({ routes, cargo, priority })

  const response = await axios.post(
    ANTHROPIC_URL,
    {
      model: AI_MODEL,
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }]
    },
    {
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      timeout: HTTP_TIMEOUT_MS
    }
  )

  const textBlock = response.data?.content?.find((c) => c.type === 'text')
  if (!textBlock) throw new Error('AI response contained no text block')

  const parsed = extractJson(textBlock.text)
  if (!Array.isArray(parsed.results)) throw new Error('AI response missing "results" array')

  // Validate the AI didn't invent route ids or drop any route.
  const knownIds = new Set(routes.map((r) => r.id))
  const valid = parsed.results.filter((r) => knownIds.has(r.id))
  if (valid.length !== routes.length) throw new Error('AI response did not cover every route')

  return valid
}

module.exports = { analyzeWithAI }
