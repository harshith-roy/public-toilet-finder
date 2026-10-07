interface CandidateToilet {
  id: string
  name: string
  distance_km?: number
  cleanliness_status: string
  operational_status: string
  facilities: string[]
  address?: string | null
  averageRating?: number | null
  totalReviews?: number
}

const VALID_CATEGORIES = ['cleanliness', 'damage', 'water_supply', 'lighting', 'safety', 'other'] as const

function sendJson(res: any, status: number, data: any) {
  if (typeof res.status === 'function') {
    res.status(status).json(data)
  } else {
    res.statusCode = status
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(data))
  }
}

// Rule-based deterministic recommendation fallback
function ruleBasedRecommend(query: string, candidateToilets: CandidateToilet[]) {
  const q = query.toLowerCase()
  const wantsAccessibility = q.includes('wheelchair') || q.includes('accessible') || q.includes('elderly') || q.includes('disabled')
  const wantsClean = q.includes('clean') || q.includes('hygien')
  const wantsWaterSoap = q.includes('water') || q.includes('soap') || q.includes('wash')
  const wantsClosest = q.includes('close') || q.includes('near') || q.includes('quick') || q.includes('fast')

  // Score candidates
  const scored = candidateToilets.map((t) => {
    let score = 0
    const reasons: string[] = []

    if (t.operational_status === 'operational') {
      score += 20
    } else {
      score -= 50
    }

    if (t.cleanliness_status === 'clean') {
      score += 15
      reasons.push('Verified clean status')
    } else if (t.cleanliness_status === 'moderate') {
      score += 5
    }

    if (wantsClean && t.cleanliness_status === 'clean') {
      score += 25
      reasons.push('Meets your priority for top cleanliness')
    }

    const facList = (t.facilities || []).map((f) => f.toLowerCase())
    const hasWheelchair = facList.some((f) => f.includes('wheelchair') || f.includes('accessible'))
    if (wantsAccessibility) {
      if (hasWheelchair) {
        score += 30
        reasons.push('Fully wheelchair and accessibility equipped')
      } else {
        score -= 20
      }
    }

    const hasWater = facList.some((f) => f.includes('water') || f.includes('fountain') || f.includes('tap'))
    const hasSoap = facList.some((f) => f.includes('soap'))
    if (wantsWaterSoap) {
      if (hasWater) { score += 10; reasons.push('Water supply available') }
      if (hasSoap) { score += 10; reasons.push('Soap dispenser available') }
    }

    if (typeof t.distance_km === 'number') {
      // Closer is better
      const distBonus = Math.max(0, 15 - t.distance_km * 3)
      score += distBonus
      if (wantsClosest || t.distance_km < 1.0) {
        reasons.push(`Conveniently close (${t.distance_km.toFixed(1)} km away)`)
      }
    }

    if (t.averageRating && t.averageRating >= 4.0) {
      score += 10
      reasons.push(`Strong citizen rating (${t.averageRating.toFixed(1)}/5)`)
    }

    return {
      toilet: t,
      score,
      reason: reasons.length > 0 ? reasons.join(' • ') : 'Operational facility matching search criteria.',
    }
  })

  scored.sort((a, b) => b.score - a.score)
  const top = scored.slice(0, 3)

  if (top.length === 0) {
    return {
      answer: "No suitable public toilets found in the current radius.",
      recommendations: [],
    }
  }

  const best = top[0]
  const distText = typeof best.toilet.distance_km === 'number' ? ` (${best.toilet.distance_km.toFixed(1)} km away)` : ''
  const answer = `Based on verified civic data and current operational status, I recommend ${best.toilet.name}${distText}. It is currently ${best.toilet.operational_status} with ${best.toilet.cleanliness_status} cleanliness rating.`

  return {
    answer,
    recommendations: top.map((item) => ({
      toilet_id: item.toilet.id,
      name: item.toilet.name,
      reason: item.reason,
      confidence: (item.score > 25 ? 'high' : 'medium') as 'high' | 'medium',
      distance_km: item.toilet.distance_km,
      cleanliness_status: item.toilet.cleanliness_status,
      operational_status: item.toilet.operational_status,
      facilities: item.toilet.facilities,
    })),
  }
}

// Rule-based report helper fallback
function ruleBasedReportAssist(draft: string) {
  const lower = draft.toLowerCase()
  let category: (typeof VALID_CATEGORIES)[number] = 'other'
  let priority: 'High' | 'Medium' | 'Low' = 'Medium'
  let reasoning = 'Categorized based on keywords.'

  if (lower.includes('water') || lower.includes('tap') || lower.includes('leak') || lower.includes('pipe') || lower.includes('flush')) {
    category = 'water_supply'
    priority = lower.includes('leak') || lower.includes('flood') ? 'High' : 'Medium'
    reasoning = 'Water supply or plumbing issue detected.'
  } else if (lower.includes('clean') || lower.includes('dirty') || lower.includes('smell') || lower.includes('odor') || lower.includes('trash') || lower.includes('unhygienic')) {
    category = 'cleanliness'
    priority = 'Medium'
    reasoning = 'Sanitation or hygiene concern reported.'
  } else if (lower.includes('broken') || lower.includes('damage') || lower.includes('door') || lower.includes('lock') || lower.includes('handle')) {
    category = 'damage'
    priority = lower.includes('lock') || lower.includes('door') ? 'High' : 'Medium'
    reasoning = 'Physical fixture or door hardware damage reported.'
  } else if (lower.includes('light') || lower.includes('dark') || lower.includes('bulb')) {
    category = 'lighting'
    priority = 'Medium'
    reasoning = 'Electrical or illumination issue reported.'
  } else if (lower.includes('safe') || lower.includes('danger') || lower.includes('threat') || lower.includes('harass')) {
    category = 'safety'
    priority = 'High'
    reasoning = 'Safety or public security concern flagged.'
  }

  const cleaned = draft.trim().replace(/\s+/g, ' ')
  const refined = cleaned.length > 5
    ? `Citizen reported: ${cleaned.charAt(0).toUpperCase() + cleaned.slice(1)}.`
    : 'Facility requires maintenance inspection.'

  return {
    suggestedCategory: category,
    suggestedDescription: refined,
    suggestedPriority: priority,
    reasoning,
  }
}

async function callOpenAICompatible(messages: any[], temperature = 0.2) {
  const apiKey =
    process.env.AI_API_KEY ||
    process.env.GROQ_API_KEY ||
    ''

  let baseUrl = process.env.AI_BASE_URL || ''
  let model = process.env.AI_MODEL || ''

  if (!baseUrl) {
    if (apiKey.startsWith('freellmapi-')) {
      baseUrl = 'http://127.0.0.1:31415/v1'
      model = model || 'gemini-2.5-flash'
    } else {
      baseUrl = 'https://api.groq.com/openai/v1'
      model = model || 'qwen/qwen3.8-27b'
    }
  } else if (!model) {
    model = baseUrl.includes('groq.com') ? 'qwen/qwen3.8-27b' : 'gemini-2.5-flash'
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 6000)

  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Upstream AI HTTP ${res.status}: ${errText.slice(0, 200)}`)
    }

    const data = await res.json()
    const content = data?.choices?.[0]?.message?.content
    if (!content) {
      throw new Error('Empty response from AI upstream')
    }

    return JSON.parse(content)
  } catch (err: any) {
    clearTimeout(timeoutId)
    throw err
  }
}

export default async function handler(req: any, res: any) {
  // Enable CORS
  res.setHeader?.('Access-Control-Allow-Credentials', 'true')
  res.setHeader?.('Access-Control-Allow-Origin', '*')
  res.setHeader?.('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader?.(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )

  if (req.method === 'OPTIONS') {
    res.statusCode = 200
    res.end()
    return
  }

  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed. Only POST is supported.' })
    return
  }

  try {
    let body = req.body
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body)
      } catch {
        // keep as is
      }
    } else if (!body && typeof req.on === 'function') {
      // Parse body stream if not pre-parsed
      body = await new Promise((resolve, reject) => {
        let raw = ''
        req.on('data', (chunk: any) => (raw += chunk))
        req.on('end', () => {
          try {
            resolve(raw ? JSON.parse(raw) : {})
          } catch {
            resolve({})
          }
        })
        req.on('error', reject)
      })
    }

    const { action } = body || {}

    // ACTION 1: RECOMMEND TOILET
    if (action === 'recommend') {
      const query = String(body.query || '').trim().slice(0, 500)
      const candidateToilets: CandidateToilet[] = Array.isArray(body.candidateToilets)
        ? body.candidateToilets.slice(0, 25)
        : []

      if (candidateToilets.length === 0) {
        sendJson(res, 200, {
          answer: "No verified public toilets were found within your current search area. Try increasing your search radius.",
          recommendations: [],
          timestamp: new Date().toISOString(),
        })
        return
      }

      try {
        const systemPrompt = `You are the AI Smart City Toilet Assistant for a public civic discovery platform.
You reason over real public toilet records to provide citizens with helpful, factual recommendations.
RULES:
1. ONLY recommend toilets that exist in the provided Candidate Toilets list. NEVER invent toilets or toilet IDs.
2. Distinguish database facts (cleanliness status, operational status, distance, facilities) from your recommendation reasoning.
3. Prioritize operational toilets. Explain WHY each recommendation was selected.
4. Output MUST be valid JSON with the following exact schema:
{
  "answer": "A friendly, concise 1-3 sentence explanation answering the citizen's request.",
  "recommendations": [
    {
      "toilet_id": "<exact ID from candidates>",
      "reason": "<specific reason based on verified facilities, cleanliness, distance, or ratings>",
      "confidence": "high" | "medium"
    }
  ]
}`

        const userPrompt = `Citizen Query: "${query || 'Recommend the best nearby toilet'}"

Candidate Toilets (${candidateToilets.length} found near user):
${JSON.stringify(
  candidateToilets.map((t) => ({
    id: t.id,
    name: t.name,
    distance_km: t.distance_km,
    cleanliness_status: t.cleanliness_status,
    operational_status: t.operational_status,
    facilities: t.facilities,
    address: t.address,
    averageRating: t.averageRating,
  })),
  null,
  2
)}`

        const aiResponse = await callOpenAICompatible([
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ])

        // Strictly validate recommendations against candidate list
        const candidateMap = new Map(candidateToilets.map((c) => [c.id, c]))
        const rawRecs = Array.isArray(aiResponse.recommendations) ? aiResponse.recommendations : []

        const validatedRecs = rawRecs
          .filter((rec: any) => rec && rec.toilet_id && candidateMap.has(rec.toilet_id))
          .map((rec: any) => {
            const match = candidateMap.get(rec.toilet_id)!
            return {
              toilet_id: match.id,
              name: match.name,
              reason: rec.reason || 'Verified facility matching your criteria.',
              confidence: (rec.confidence === 'medium' ? 'medium' : 'high') as 'high' | 'medium',
              distance_km: match.distance_km,
              cleanliness_status: match.cleanliness_status,
              operational_status: match.operational_status,
              facilities: match.facilities,
            }
          })

        if (validatedRecs.length === 0) {
          // If model returned no valid IDs, fall back to rule-based ranking
          const fallback = ruleBasedRecommend(query, candidateToilets)
          sendJson(res, 200, {
            ...fallback,
            timestamp: new Date().toISOString(),
          })
          return
        }

        sendJson(res, 200, {
          answer: aiResponse.answer || `Based on verified civic data, here are the best options for you.`,
          recommendations: validatedRecs,
          timestamp: new Date().toISOString(),
        })
        return
      } catch (err: any) {
        console.warn('AI upstream failed, using intelligent rule-based engine:', err.message)
        const fallback = ruleBasedRecommend(query, candidateToilets)
        sendJson(res, 200, {
          ...fallback,
          timestamp: new Date().toISOString(),
        })
        return
      }
    }

    // ACTION 2: ASSIST REPORT
    if (action === 'assist_report') {
      const draft = String(body.draftDescription || '').trim().slice(0, 500)
      const toiletName = String(body.toiletName || 'Public Toilet')

      if (!draft) {
        sendJson(res, 200, ruleBasedReportAssist(''))
        return
      }

      try {
        const systemPrompt = `You are a municipal dispatch assistant helping citizens submit clear maintenance reports for public toilets.
Categories allowed: "cleanliness", "damage", "water_supply", "lighting", "safety", "other".
Priorities allowed: "High", "Medium", "Low".
Output MUST be valid JSON with this schema:
{
  "suggestedCategory": "<one of the 6 allowed categories>",
  "suggestedDescription": "<clean, polite, descriptive 1-2 sentence municipal issue statement>",
  "suggestedPriority": "High" | "Medium" | "Low",
  "reasoning": "<brief explanation for the chosen category and priority>"
}`

        const userPrompt = `Facility: ${toiletName}\nCitizen's raw description: "${draft}"`

        const aiResponse = await callOpenAICompatible([
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ])

        const category = VALID_CATEGORIES.includes(aiResponse.suggestedCategory)
          ? aiResponse.suggestedCategory
          : 'other'

        sendJson(res, 200, {
          suggestedCategory: category,
          suggestedDescription: aiResponse.suggestedDescription || draft,
          suggestedPriority: ['High', 'Medium', 'Low'].includes(aiResponse.suggestedPriority)
            ? aiResponse.suggestedPriority
            : 'Medium',
          reasoning: aiResponse.reasoning || 'Categorized for dispatch.',
        })
        return
      } catch (err: any) {
        console.warn('AI report assist upstream failed, using fallback:', err.message)
        sendJson(res, 200, ruleBasedReportAssist(draft))
        return
      }
    }

    // ACTION 3: AUTHORITY INSIGHTS
    if (action === 'authority_insights') {
      const summary = body.summary || {}
      const totalComplaints = Number(summary.totalComplaints || 0)

      if (totalComplaints === 0) {
        // Honest response for 0 complaints as mandated by specification
        sendJson(res, 200, {
          insight: "No active complaint data is currently available for analysis. All monitored municipal facilities are reporting nominal status with 0 pending maintenance tickets.",
          urgency: "normal",
          suggestedAction: "Continue routine sanitation schedules and preventive maintenance inspections.",
          hasData: false,
        })
        return
      }

      try {
        const systemPrompt = `You are an AI Smart City Operations Analyst for municipal toilet infrastructure.
Analyze the provided complaint aggregation and generate actionable operational insights.
Output MUST be valid JSON:
{
  "insight": "<concise 2-sentence executive summary of maintenance trends>",
  "urgency": "normal" | "elevated" | "critical",
  "suggestedAction": "<concrete operational priority for municipal sanitation teams>",
  "hasData": true
}`

        const userPrompt = `Complaints Summary:\n${JSON.stringify(summary, null, 2)}`

        const aiResponse = await callOpenAICompatible([
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ])

        sendJson(res, 200, {
          insight: aiResponse.insight || `Analysis of ${totalComplaints} active complaints completed.`,
          urgency: ['normal', 'elevated', 'critical'].includes(aiResponse.urgency) ? aiResponse.urgency : 'normal',
          suggestedAction: aiResponse.suggestedAction || 'Prioritize facilities with open tickets.',
          hasData: true,
        })
        return
      } catch (err: any) {
        console.warn('AI authority insights failed, using fallback:', err.message)
        sendJson(res, 200, {
          insight: `Currently tracking ${totalComplaints} total complaints across municipal facilities. Priority dispatch recommended for facilities with unresolved tickets.`,
          urgency: totalComplaints > 5 ? 'elevated' : 'normal',
          suggestedAction: 'Dispatch field inspection teams to address pending complaints.',
          hasData: true,
        })
        return
      }
    }

    sendJson(res, 400, { error: `Unknown action: ${action}` })
  } catch (err: any) {
    console.error('API /api/ai handler error:', err)
    sendJson(res, 500, { error: 'Internal server error processing AI request' })
  }
}
