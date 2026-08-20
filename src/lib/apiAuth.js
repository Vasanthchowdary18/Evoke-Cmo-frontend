/**
 * apiAuth.js
 * Calls the Supabase-backed Node API routes (api/brand-kb.js, api/campaign-history.js)
 * with whatever identity signal is available: a verified Firebase ID token in
 * production, or the plain uid on localhost (mirrors the app's existing
 * dev-bypass convention — see api/_lib/verifyUser.js).
 */
import { auth } from '../firebase'

export async function authedFetch(url, { uid, method = 'POST', body = {} } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  const idToken = await auth.currentUser?.getIdToken().catch(() => null)
  if (idToken) headers.Authorization = `Bearer ${idToken}`

  const finalUrl = method === 'GET'
    ? `${url}${url.includes('?') ? '&' : '?'}uid=${encodeURIComponent(uid || '')}`
    : url

  const res = await fetch(finalUrl, {
    method,
    headers,
    body: method === 'GET' ? undefined : JSON.stringify({ uid, ...body }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`)
  return json
}
