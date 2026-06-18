// Vercel Edge Function — generates marketing banners using DALL-E 3 or Gemini
export const config = { runtime: 'edge' }

export default async function handler(req) {
  // CORS preflight
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
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const { prompt, provider = 'gemini' } = await req.json()
    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    let imageData
    if (provider === 'dalle') {
      imageData = await generateWithDalle(prompt)
    } else {
      imageData = await generateWithGemini(prompt)
    }

    return new Response(JSON.stringify(imageData), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    )
  }
}

// ── DALL-E 3 Implementation ──
async function generateWithDalle(prompt) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OpenAI API key not configured. Add OPENAI_API_KEY to your .env file.')
  }

  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: '1024x1024',
      quality: 'hd',
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `OpenAI API error ${res.status}`)
  }

  const data = await res.json()
  const imageUrl = data.data?.[0]?.url
  if (!imageUrl) {
    throw new Error('DALL-E returned no image URL')
  }

  // Download image and convert to base64
  const imgRes = await fetch(imageUrl)
  const buffer = await imgRes.arrayBuffer()
  const base64Image = btoa(String.fromCharCode(...new Uint8Array(buffer)))

  return {
    base64Image,
    mimeType: 'image/png',
    provider: 'dalle-3',
    revised_prompt: data.data?.[0]?.revised_prompt || prompt,
  }
}

// ── Gemini Implementation ──
async function generateWithGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('Gemini API key not configured. Add GEMINI_API_KEY to your .env file.')
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
      }),
    }
  )

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `Gemini API error ${res.status}`)
  }

  const data = await res.json()
  const parts = data.candidates?.[0]?.content?.parts || []
  const imagePart = parts.find(p => p.inlineData?.data)
  const base64Image = imagePart?.inlineData?.data || null
  const mimeType = imagePart?.inlineData?.mimeType || 'image/png'

  if (!base64Image) {
    throw new Error('Gemini returned no image')
  }

  return {
    base64Image,
    mimeType,
    provider: 'gemini',
  }
}
