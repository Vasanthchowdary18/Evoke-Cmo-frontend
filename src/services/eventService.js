import { db } from '../firebase'
import { doc, setDoc, getDoc } from 'firebase/firestore'

const LS_KEY = 'evoke_event_pages'

function slugify(name = '') {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 45)
}

export function buildEventSlug(name, date) {
  const base   = slugify(name)
  const year   = date ? new Date(date).getFullYear() : new Date().getFullYear()
  const suffix = Math.random().toString(36).slice(2, 7)
  return `${base}-${year}-${suffix}`
}

function lsSave(slug, data) {
  try {
    const store = JSON.parse(localStorage.getItem(LS_KEY) || '{}')
    store[slug] = data
    localStorage.setItem(LS_KEY, JSON.stringify(store))
  } catch {}
}

function lsGet(slug) {
  try {
    const store = JSON.parse(localStorage.getItem(LS_KEY) || '{}')
    return store[slug] || null
  } catch { return null }
}

export async function saveEventPage(slug, data) {
  const payload = { ...data, slug, createdAt: new Date().toISOString() }
  lsSave(slug, payload)
  try {
    await setDoc(doc(db, 'eventPages', slug), payload)
  } catch {}
  const appUrl = (import.meta.env.VITE_APP_URL || window.location.origin).replace(/\/$/, '')
  return `${appUrl}/event/${slug}`
}

export async function getEventPage(slug) {
  try {
    const snap = await getDoc(doc(db, 'eventPages', slug))
    if (snap.exists()) return snap.data()
  } catch {}
  return lsGet(slug)
}

/* ── Standalone HTML event page generator ── */
function fmtDate(d) {
  if (!d) return ''
  try { return new Date(d).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) }
  catch { return d }
}
function fmtTime(t) {
  if (!t) return ''
  try {
    const [h, m] = t.split(':').map(Number)
    const ampm = h >= 12 ? 'PM' : 'AM'
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`
  } catch { return t }
}

export function generateEventHtml(data) {
  const {
    name = '', description = '', date = '', endDate = '', time = '',
    location = '', locations = [], imageUrl = '',
    brandName = '', targetAudience = [], registrationUrl = '',
    contactEmail = '', price = '',
  } = data

  const locationStr = Array.isArray(locations) && locations.length
    ? locations.join(' · ')
    : location

  const audienceStr = Array.isArray(targetAudience)
    ? targetAudience.join(', ')
    : targetAudience

  const dateStr = fmtDate(date)
  const endDateStr = endDate ? fmtDate(endDate) : ''
  const timeStr = fmtTime(time)

  const chips = [
    dateStr && `<div class="chip"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c8973e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg><div><div class="chip-label">Date</div><div class="chip-val">${dateStr}${endDateStr ? ' — ' + endDateStr : ''}</div></div></div>`,
    timeStr && `<div class="chip"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c8973e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg><div><div class="chip-label">Time</div><div class="chip-val">${timeStr}</div></div></div>`,
    locationStr && `<div class="chip"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c8973e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg><div><div class="chip-label">Location</div><div class="chip-val">${locationStr}</div></div></div>`,
    audienceStr && `<div class="chip"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c8973e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg><div><div class="chip-label">Audience</div><div class="chip-val">${audienceStr}</div></div></div>`,
    price && `<div class="chip"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c8973e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg><div><div class="chip-label">Price</div><div class="chip-val">${price}</div></div></div>`,
  ].filter(Boolean).join('')

  const heroStyle = imageUrl
    ? `background: linear-gradient(to bottom, rgba(15,23,42,0.5) 0%, rgba(15,23,42,0.95) 100%), url('${imageUrl}') center/cover no-repeat;`
    : `background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);`

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${name || 'Event'}</title>
<meta property="og:title" content="${name}">
<meta property="og:description" content="${description.slice(0, 150)}">
${imageUrl ? `<meta property="og:image" content="${imageUrl}">` : ''}
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#0f172a;color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;min-height:100vh}
  a{color:inherit;text-decoration:none}
  .hero{min-height:${imageUrl ? '420px' : '260px'};${heroStyle}display:flex;flex-direction:column;justify-content:flex-end;padding:32px;position:relative}
  .nav{display:flex;align-items:center;justify-content:space-between;padding:20px 32px;position:absolute;top:0;left:0;right:0}
  .logo{display:flex;align-items:center;gap:8px;font-weight:800;font-size:16px;letter-spacing:1px;color:#c8973e}
  .logo-badge{font-size:11px;background:rgba(200,151,62,0.2);color:#c8973e;border:1px solid rgba(200,151,62,0.3);border-radius:6px;padding:2px 7px;font-weight:700}
  .powered{font-size:12px;color:rgba(255,255,255,0.35)}
  .brand-tag{font-size:12px;font-weight:700;letter-spacing:1.5px;color:#c8973e;text-transform:uppercase;margin-bottom:10px}
  h1{font-size:clamp(28px,5vw,52px);font-weight:800;line-height:1.15;max-width:720px}
  .body{max-width:860px;margin:0 auto;padding:0 24px 80px}
  .chips{display:flex;flex-wrap:wrap;gap:12px;padding:24px 0;border-bottom:1px solid rgba(255,255,255,0.07);margin-bottom:36px}
  .chip{display:flex;align-items:flex-start;gap:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:10px 16px}
  .chip-label{font-size:11px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:.5px}
  .chip-val{font-size:13px;font-weight:600;margin-top:2px}
  .grid{display:grid;grid-template-columns:${imageUrl ? '1fr 1fr' : '1fr'};gap:32px;align-items:start}
  @media(max-width:640px){.grid{grid-template-columns:1fr}}
  h2{font-size:18px;font-weight:700;margin-bottom:14px}
  p{font-size:15px;line-height:1.75;color:#94a3b8;white-space:pre-wrap}
  .cta-row{margin-top:32px;display:flex;gap:12px;flex-wrap:wrap}
  .btn-primary{display:inline-flex;align-items:center;gap:8px;padding:13px 28px;background:#c8973e;color:#0f172a;border-radius:12px;font-weight:800;font-size:15px;cursor:pointer;border:none}
  .btn-secondary{display:inline-flex;align-items:center;gap:8px;padding:13px 20px;background:rgba(255,255,255,0.06);color:#f1f5f9;border-radius:12px;font-weight:700;font-size:14px;border:1px solid rgba(255,255,255,0.1);cursor:pointer}
  .event-img{width:100%;border-radius:16px;border:1px solid rgba(255,255,255,0.08)}
  .footer{border-top:1px solid rgba(255,255,255,0.06);padding:20px 32px;display:flex;align-items:center;justify-content:center;gap:8px}
  .footer span{font-size:12px;color:#334155}
  .footer strong{font-size:12px;font-weight:800;color:#c8973e;letter-spacing:.5px}
</style>
</head>
<body>
<div class="hero">
  <div class="nav">
    <div class="logo">EVOKE <span class="logo-badge">CMO</span></div>
    <span class="powered">Powered by EVOX AI</span>
  </div>
  <div>
    ${brandName ? `<div class="brand-tag">${brandName}</div>` : ''}
    <h1>${name}</h1>
  </div>
</div>

<div class="body">
  <div class="chips">${chips}</div>

  <div class="grid">
    <div>
      ${description ? `<h2>About this Event</h2><p>${description}</p>` : ''}
      <div class="cta-row">
        ${registrationUrl
          ? `<a href="${registrationUrl}" target="_blank" class="btn-primary">Register Now ↗</a>`
          : `<button class="btn-primary" onclick="this.textContent='Link copied!';navigator.clipboard&&navigator.clipboard.writeText(window.location.href)">Copy Event Link</button>`
        }
        <button class="btn-secondary" onclick="navigator.clipboard&&navigator.clipboard.writeText(window.location.href);this.textContent='Copied!'">📋 Share</button>
      </div>
      ${contactEmail ? `<p style="margin-top:20px;font-size:13px;color:#64748b">Contact: <a href="mailto:${contactEmail}" style="color:#c8973e">${contactEmail}</a></p>` : ''}
    </div>
    ${imageUrl ? `<div><img src="${imageUrl}" alt="${name}" class="event-img"></div>` : ''}
  </div>
</div>

<div class="footer">
  <span>Event page created with</span>
  <strong>EVOX AI</strong>
</div>
</body>
</html>`
}

export function downloadEventHtml(data) {
  const html = generateEventHtml(data)
  const blob = new Blob([html], { type: 'text/html' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `${slugify(data.name || 'event')}-page.html`
  a.click()
  URL.revokeObjectURL(url)
}
