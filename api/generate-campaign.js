// Vercel Edge Function — generates a full campaign content package server-side
// and returns it directly in the response (no browser involved). For headless/
// backend-to-backend integrations (e.g. a marketplace calling this API directly)
// that need the actual generated copy back, not just a "received" acknowledgment.
export const config = { runtime: 'edge' }

const BASE_SCHEMA = (name, campaignDays) => `{
  "campaignName": "${name}",
  "emailSubject": "email subject line",
  "emailBody": "1-paragraph email body",
  "linkedinPost": "60-word LinkedIn post with 3 hashtags",
  "instagramCaption": "40-word caption with emojis and 3 hashtags",
  "facebookPost": "50-word Facebook post with CTA",
  "whatsappMessage": "30-word WhatsApp message",
  "smsMessage": "SMS under 160 chars",
  "seoTitle": "SEO title (60 chars max)",
  "seoDescription": "meta description (160 chars max)",
  "adHeadline": "ad headline (30 chars max)",
  "adBody": "ad copy (90 chars max)",
  "tiktokCaption": "TikTok caption with hook and 3 hashtags",
  "campaignCalendar": "${campaignDays || 7}-day action schedule",
  "positioningStatement": "1-sentence positioning statement"
}`

function buildPrompt(body) {
  const {
    campaignType = 'event', name = '', description = '', goal = '',
    targetAudience = [], brandName = '', date = '', time = '',
    location = '', eventUrl = '', campaignDays = 7,
  } = body

  const audience = Array.isArray(targetAudience) ? targetAudience.join(', ') : (targetAudience || '')
  const isEvent = campaignType === 'event' || campaignType === 'event_full'

  const context = isEvent
    ? `Event Name: ${name}
Description: ${description}
Date: ${date || 'TBD'}  Time: ${time || 'TBD'}
Location: ${location || 'TBD'}
Event URL: ${eventUrl || ''}
Goal: ${goal}
Target Audience: ${audience}`
    : `Campaign Type: ${campaignType}
Name/Title: ${name}
Description: ${description}
Goal: ${goal}
Target Audience: ${audience}
Brand/Company: ${brandName || name}`

  const eventUrlInstruction = (isEvent && eventUrl)
    ? `\nIMPORTANT: The event page URL is: ${eventUrl}\nYou MUST include this URL in every social media post, email body, and WhatsApp message so readers can register or learn more. Add it naturally at the end of each post (e.g. "Register here: ${eventUrl}").\n`
    : ''

  return `You are an expert AI CMO (Chief Marketing Officer) with 20+ years of experience. Generate a complete, professional ${campaignType.replace(/_/g, ' ')} package.

${context}
${eventUrlInstruction}
Return ONLY valid JSON matching this exact schema, no markdown, no explanation:
${BASE_SCHEMA(name, campaignDays)}`
}

// Same multi-strategy JSON extraction as the frontend uses, so behavior matches exactly.
function extractJson(text) {
  let raw = text.match(/```json\s*([\s\S]*?)```/)?.[1] ?? text.match(/```\s*([\s\S]*?)```/)?.[1]
  if (!raw) {
    const m = text.match(/\{[\s\S]*\}/)
    if (m) raw = m[0]
  }
  if (!raw) {
    const start = text.indexOf('{')
    if (start !== -1) raw = text.slice(start) + '}'
  }
  if (!raw) return null
  try { return JSON.parse(raw) } catch (_) {}
  const fixed = raw.replace(/"(?:[^"\\]|\\.)*"/g, (s) =>
    s.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t'),
  )
  try { return JSON.parse(fixed) } catch (_) { return null }
}

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, error: { message: 'Method not allowed' } }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }

  const apiKey = process.env.VITE_GROQ_API_KEY
  if (!apiKey) {
    return new Response(JSON.stringify({ success: false, error: { message: 'Groq API key not configured on server' } }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }

  let body
  try {
    body = await req.json()
  } catch (_) {
    return new Response(JSON.stringify({ success: false, error: { message: 'Invalid JSON body' } }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }

  if (!body.name || !body.description) {
    return new Response(JSON.stringify({ success: false, error: { message: 'name and description are required' } }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }

  const prompt = buildPrompt(body)

  let groqRes
  try {
    groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: 'You are an expert AI CMO. Respond ONLY with valid JSON — no markdown, no explanation, no extra text.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 3500,
      }),
    })
  } catch (networkErr) {
    return new Response(JSON.stringify({ success: false, error: { message: 'Network error calling Groq' } }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }

  if (!groqRes.ok) {
    const err = await groqRes.json().catch(() => ({}))
    const status = groqRes.status === 401 ? 500 : groqRes.status // never leak "key invalid" as a client 401
    return new Response(JSON.stringify({
      success: false,
      error: { message: err?.error?.message || `AI generation failed (${groqRes.status})` },
    }), {
      status,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }

  const groqData = await groqRes.json()
  const text = groqData.choices?.[0]?.message?.content || ''
  const parsed = extractJson(text)

  if (!parsed) {
    return new Response(JSON.stringify({ success: false, error: { message: 'AI returned no parseable content' } }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }

  return new Response(JSON.stringify({ success: true, data: parsed }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  })
}
