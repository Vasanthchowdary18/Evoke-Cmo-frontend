// Vercel Edge Function — sends transactional/campaign email via Resend
export const config = { runtime: 'edge' }

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
    return new Response('Method not allowed', { status: 405 })
  }

  const cors = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }

  try {
    const { to, subject, html, text, from } = await req.json()

    if (!to || !subject || (!html && !text)) {
      return new Response(
        JSON.stringify({ error: 'to, subject, and html or text are required' }),
        { status: 400, headers: cors }
      )
    }

    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Email sending is not configured yet. Add RESEND_API_KEY to your environment variables (see resend.com).' }),
        { status: 501, headers: cors }
      )
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: from || process.env.RESEND_FROM_EMAIL || 'EVOX AI CMO <onboarding@resend.dev>',
        to: Array.isArray(to) ? to : [to],
        subject,
        html: html || undefined,
        text: text || undefined,
      }),
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: data?.message || `Resend API error ${res.status}` }),
        { status: res.status, headers: cors }
      )
    }

    return new Response(JSON.stringify({ id: data.id, sent: true }), { status: 200, headers: cors })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: cors })
  }
}
