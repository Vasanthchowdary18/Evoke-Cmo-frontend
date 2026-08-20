// Vercel edge function — proxies Eventbrite API to avoid browser CORS restrictions
export const config = { runtime: 'edge' }

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  })
}

async function ebFetch(accessToken, path, method = 'GET', body = null) {
  const res = await fetch(`https://www.eventbriteapi.com/v3${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  const data = await res.json()
  return { ok: res.ok, status: res.status, data }
}

export default async function handler(req) {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  let payload
  try {
    payload = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  const { action, accessToken } = payload
  if (!accessToken) return json({ error: 'accessToken required' }, 400)

  try {
    switch (action) {
      case 'create_venue': {
        const { organizationId, venue } = payload
        const r = await ebFetch(accessToken, `/organizations/${organizationId}/venues/`, 'POST', { venue })
        return json(r.data, r.status)
      }

      case 'create_event': {
        const { organizationId, event } = payload
        const r = await ebFetch(accessToken, `/organizations/${organizationId}/events/`, 'POST', { event })
        return json(r.data, r.status)
      }

      case 'create_ticket': {
        const { eventId, ticketClass } = payload
        const r = await ebFetch(accessToken, `/events/${eventId}/ticket_classes/`, 'POST', { ticket_class: ticketClass })
        return json(r.data, r.status)
      }

      case 'publish_event': {
        const { eventId } = payload
        const r = await ebFetch(accessToken, `/events/${eventId}/publish/`, 'POST')
        return json(r.data, r.status)
      }

      default:
        return json({ error: `Unknown action: ${action}` }, 400)
    }
  } catch (err) {
    return json({ error: err.message }, 500)
  }
}
