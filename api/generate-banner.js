// Vercel Edge Function — generates marketing banners using GPT Image 2 or Gemini
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
    const { prompt, provider = 'gemini', size = '1024x1024' } = await req.json()
    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    let imageData
    if (provider === 'dalle') {
      imageData = await generateWithDalle(prompt, size)
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

// ── GPT Image 2 Implementation ──
async function generateWithDalle(prompt, size = '1024x1024') {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OpenAI API key not configured. Add OPENAI_API_KEY to your .env file.')
  }

  const validSizes = ['1024x1024', '1536x1024', '1024x1536']
  const safeSize = validSizes.includes(size) ? size : '1024x1024'

  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-image-1',
      prompt: prompt,
      n: 1,
      size: safeSize,
      quality: 'high',
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `OpenAI API error ${res.status}`)
  }

  const data = await res.json()
  const base64Image = data.data?.[0]?.b64_json
  if (!base64Image) {
    throw new Error('gpt-image-1 returned no image data')
  }

  return {
    base64Image,
    mimeType: 'image/png',
    provider: 'gpt-image-1',
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
