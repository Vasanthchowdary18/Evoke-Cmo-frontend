import axios from 'axios'

// ── Public entry point ──────────────────────────────────────────────────────
export async function generateEventPosterWithCanvas(eventData, options = {}) {
  const { qrBase64 = null } = options

  // Try Gemini first (better quality), fall back to Pollinations
  let bgImageUrl = null
  for (const provider of ['gemini', 'pollinations']) {
    try {
      const res = await axios.post('/api/generate-banner', {
        prompt: buildBackgroundPrompt(eventData),
        provider,
      })
      if (res.data.base64Image) {
        bgImageUrl = `data:${res.data.mimeType || 'image/png'};base64,${res.data.base64Image}`
        break
      }
    } catch (_) { /* try next provider */ }
  }

  return renderPosterCanvas(eventData, bgImageUrl, qrBase64)
}

// ── Canvas renderer — landscape 1200×675, adaptive layout ─────────────────
function renderPosterCanvas(eventData, bgImageUrl, qrBase64) {
  return new Promise((resolve) => {
    const W = 1200, H = 675
    const canvas = document.createElement('canvas')
    canvas.width = W; canvas.height = H
    const ctx = canvas.getContext('2d')

    const GOLD       = '#c8973e'
    const GOLD_LIGHT = '#f5d060'
    const GOLD_DIM   = 'rgba(200,151,62,0.45)'

    // Layout: if QR exists use split (title left | QR+details right), else full width
    const hasQR     = !!qrBase64
    const PANEL_W   = 320                        // right panel width
    const CONTENT_W = hasQR ? W - PANEL_W : W   // title area width
    const PAD       = 50
    const maxW      = CONTENT_W - PAD * 2

    const draw = () => {
      // ── Dark overlay ──
      ctx.fillStyle = 'rgba(0,0,0,0.68)'
      ctx.fillRect(0, 0, W, H)

      // ── Top + bottom gold bars ──
      const barGrad = ctx.createLinearGradient(0, 0, W, 0)
      barGrad.addColorStop(0,   'rgba(200,151,62,0)')
      barGrad.addColorStop(0.5, 'rgba(200,151,62,0.95)')
      barGrad.addColorStop(1,   'rgba(200,151,62,0)')
      ctx.fillStyle = barGrad
      ctx.fillRect(0, 0, W, 3)
      ctx.fillRect(0, H - 3, W, 3)

      // ── Corner brackets (left side only) ──
      ctx.strokeStyle = GOLD; ctx.lineWidth = 2
      const m = 24, l = 52
      ctx.beginPath(); ctx.moveTo(m, m+l); ctx.lineTo(m, m); ctx.lineTo(m+l, m); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(m, H-m-l); ctx.lineTo(m, H-m); ctx.lineTo(m+l, H-m); ctx.stroke()

      // ── LEFT: brand + tagline + big title ──
      let y = 52

      const brand = (eventData.brandName || eventData.organizer || '').toUpperCase()
      if (brand) {
        ctx.fillStyle = 'rgba(200,151,62,0.85)'
        ctx.font = 'bold 18px Arial, sans-serif'
        ctx.textAlign = 'left'
        ctx.fillText(brand, PAD, y)
        y += 16
        ctx.fillStyle = GOLD_DIM
        ctx.fillRect(PAD, y, 200, 1)
        y += 16
      }

      if (eventData.tagline) {
        const tl = eventData.tagline.length > 55 ? eventData.tagline.slice(0, 55) + '…' : eventData.tagline
        ctx.fillStyle = 'rgba(240,220,170,0.78)'
        ctx.font = 'italic 17px Georgia, serif'
        ctx.textAlign = 'left'
        ctx.fillText(tl, PAD, y + 14)
        y += 36
      }

      // Big event name
      const name = (eventData.name || 'EVENT').toUpperCase()
      let titleSize = 130
      ctx.font = `900 ${titleSize}px Arial Black, Arial, sans-serif`
      while (ctx.measureText(name).width > maxW && titleSize > 40) {
        titleSize -= 4
        ctx.font = `900 ${titleSize}px Arial Black, Arial, sans-serif`
      }
      const words = name.split(' ')
      const titleLines = []
      let cur = ''
      for (const w of words) {
        const test = cur ? cur + ' ' + w : w
        if (ctx.measureText(test).width > maxW && cur) { titleLines.push(cur); cur = w }
        else cur = test
      }
      if (cur) titleLines.push(cur)

      const lineH = titleSize * 1.12
      const titleStartY = Math.max(y + titleSize + 8, H * 0.30)
      ctx.textAlign = 'left'
      titleLines.forEach((ln, i) => {
        const ty = titleStartY + i * lineH
        ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.font = `900 ${titleSize}px Arial Black, Arial, sans-serif`
        ctx.fillText(ln, PAD + 4, ty + 5)
        ctx.fillStyle = '#7a5010'; ctx.fillText(ln, PAD + 2, ty + 2)
        const tg = ctx.createLinearGradient(0, ty - titleSize, 0, ty + 10)
        tg.addColorStop(0, '#fff0a0'); tg.addColorStop(0.25, '#f5d060')
        tg.addColorStop(0.5, '#c8973e'); tg.addColorStop(0.75, '#f0c040'); tg.addColorStop(1, '#9a6810')
        ctx.fillStyle = tg; ctx.fillText(ln, PAD, ty)
        ctx.strokeStyle = 'rgba(255,245,180,0.45)'; ctx.lineWidth = titleSize * 0.012
        ctx.strokeText(ln, PAD, ty)
      })

      // ── RIGHT PANEL: single box with QR on top + details below ────────────
      const finalize = () => resolve({ success: true, imageUrl: canvas.toDataURL('image/png') })

      if (hasQR) {
        // Vertical gold divider
        const vdg = ctx.createLinearGradient(0, 30, 0, H - 30)
        vdg.addColorStop(0, 'rgba(200,151,62,0)'); vdg.addColorStop(0.2, GOLD)
        vdg.addColorStop(0.8, GOLD); vdg.addColorStop(1, 'rgba(200,151,62,0)')
        ctx.strokeStyle = vdg; ctx.lineWidth = 1
        ctx.beginPath(); ctx.moveTo(CONTENT_W, 30); ctx.lineTo(CONTENT_W, H - 30); ctx.stroke()

        // Panel box
        const fX  = CONTENT_W + 14
        const fY  = 28
        const fW  = PANEL_W - 24
        const fH  = H - 56
        const fCX = fX + fW / 2

        ctx.fillStyle = 'rgba(0,0,0,0.80)'
        roundRect(ctx, fX, fY, fW, fH, 14)
        ctx.fill()
        ctx.strokeStyle = GOLD; ctx.lineWidth = 1.5; ctx.stroke()

        // Top notch lines on box
        ctx.strokeStyle = GOLD_LIGHT; ctx.lineWidth = 2
        ;[fX + 10, fX + fW - 34].forEach(nx => {
          ctx.beginPath(); ctx.moveTo(nx, fY + 10); ctx.lineTo(nx + 24, fY + 10); ctx.stroke()
        })

        // QR code — sized to fit, positioned at top of box
        const qrSize = fW - 30
        const qrX    = fX + 15
        const qrY    = fY + 22

        const qrImg = new Image()
        qrImg.onload = () => {
          // White bg for QR
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(qrX - 4, qrY - 4, qrSize + 8, qrSize + 8)
          ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize)

          // "SCAN TO REQUEST AN INVITATION" label
          const labelY = qrY + qrSize + 20
          ctx.fillStyle = GOLD_LIGHT
          ctx.font = 'bold 12px Arial, sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText('SCAN TO REQUEST', fCX, labelY)
          ctx.fillText('AN INVITATION', fCX, labelY + 16)

          // Gold divider inside box
          const innerDivY = labelY + 30
          ctx.fillStyle = GOLD_DIM
          ctx.fillRect(fX + 16, innerDivY, fW - 32, 1)

          // Event details inside the same box
          const iconR   = 14
          const txtSize = 13
          const rowGap  = 36
          let detY = innerDivY + 22

          if (eventData.date) {
            let ds = eventData.date
            try { ds = new Date(ds + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', weekday: 'short' }) } catch (_) {}
            drawCircleIcon(ctx, 'calendar', fX + 18 + iconR, detY, iconR, GOLD)
            ctx.fillStyle = 'rgba(255,255,255,0.90)'; ctx.font = `${txtSize}px Arial, sans-serif`; ctx.textAlign = 'left'
            ctx.fillText(ds, fX + 18 + iconR * 2 + 8, detY + 5)
            detY += rowGap
          }
          if (eventData.location) {
            drawCircleIcon(ctx, 'pin', fX + 18 + iconR, detY, iconR, GOLD)
            ctx.fillStyle = 'rgba(255,255,255,0.90)'; ctx.font = `${txtSize}px Arial, sans-serif`; ctx.textAlign = 'left'
            ctx.fillText(eventData.location, fX + 18 + iconR * 2 + 8, detY + 5)
            detY += rowGap
          }
          if (eventData.venue && eventData.venue !== eventData.location) {
            drawCircleIcon(ctx, 'building', fX + 18 + iconR, detY, iconR, GOLD)
            ctx.fillStyle = 'rgba(255,255,255,0.90)'; ctx.font = `${txtSize}px Arial, sans-serif`; ctx.textAlign = 'left'
            ctx.fillText(eventData.venue, fX + 18 + iconR * 2 + 8, detY + 5)
            detY += rowGap
          }
          if (eventData.time) {
            drawCircleIcon(ctx, 'clock', fX + 18 + iconR, detY, iconR, GOLD)
            ctx.fillStyle = 'rgba(255,255,255,0.90)'; ctx.font = `${txtSize}px Arial, sans-serif`; ctx.textAlign = 'left'
            ctx.fillText(eventData.time, fX + 18 + iconR * 2 + 8, detY + 5)
          }

          finalize()
        }
        qrImg.onerror = finalize
        qrImg.src = 'data:image/png;base64,' + qrBase64

      } else {
        // No QR — show details on the left below the title
        const divY = titleStartY + (titleLines.length - 1) * lineH + 28
        const hdg = ctx.createLinearGradient(PAD, 0, CONTENT_W - PAD, 0)
        hdg.addColorStop(0, GOLD); hdg.addColorStop(0.6, GOLD); hdg.addColorStop(1, 'rgba(200,151,62,0)')
        ctx.fillStyle = hdg; ctx.fillRect(PAD, divY, CONTENT_W - PAD * 2, 2)

        let detY = divY + 44
        const iconR   = 18
        const txtSize = Math.min(23, Math.max(17, titleSize * 0.22))
        const rowGap  = iconR * 2 + 16

        if (eventData.date) {
          let ds = eventData.date
          try { ds = new Date(ds + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) } catch (_) {}
          drawCircleIcon(ctx, 'calendar', PAD + iconR, detY, iconR, GOLD)
          drawDetailText(ctx, ds, PAD + iconR * 2 + 14, detY + 8, txtSize)
          detY += rowGap
        }
        if (eventData.location) {
          drawCircleIcon(ctx, 'pin', PAD + iconR, detY, iconR, GOLD)
          drawDetailText(ctx, eventData.location, PAD + iconR * 2 + 14, detY + 8, txtSize)
          detY += rowGap
        }
        if (eventData.venue && eventData.venue !== eventData.location) {
          drawCircleIcon(ctx, 'building', PAD + iconR, detY, iconR, GOLD)
          drawDetailText(ctx, eventData.venue, PAD + iconR * 2 + 14, detY + 8, txtSize)
          detY += rowGap
        }
        if (eventData.time) {
          drawCircleIcon(ctx, 'clock', PAD + iconR, detY, iconR, GOLD)
          drawDetailText(ctx, eventData.time, PAD + iconR * 2 + 14, detY + 8, txtSize)
        }
        finalize()
      }
    }

    // Load background then draw overlay
    if (bgImageUrl) {
      const bgImg = new Image()
      bgImg.onload = () => {
        ctx.drawImage(bgImg, 0, 0, W, H)
        draw()
      }
      bgImg.onerror = () => { drawGradientBg(ctx, W, H); draw() }
      bgImg.src = bgImageUrl
    } else {
      drawGradientBg(ctx, W, H)
      draw()
    }
  })
}

// ── Circle-border icon ──────────────────────────────────────────────────────
function drawCircleIcon(ctx, type, cx, cy, r, color) {
  ctx.save()
  ctx.strokeStyle = color
  ctx.fillStyle   = color
  ctx.lineWidth   = 1.5

  // Outer circle
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke()

  const s = r * 0.9   // inner icon scale
  const ix = cx - s / 2
  const iy = cy - s / 2

  if (type === 'calendar') {
    // Rectangle body
    ctx.strokeRect(ix, iy, s, s)
    // Top filled bar
    ctx.fillRect(ix, iy, s, s * 0.28)
    // Date dots
    const dr = s * 0.07
    ;[[0.25,0.55],[0.5,0.55],[0.75,0.55],[0.25,0.80],[0.5,0.80]].forEach(([fx,fy]) => {
      ctx.beginPath(); ctx.arc(ix + s*fx, iy + s*fy, dr, 0, Math.PI*2); ctx.fill()
    })

  } else if (type === 'clock') {
    ctx.beginPath(); ctx.arc(cx, cy, s * 0.45, 0, Math.PI * 2); ctx.stroke()
    ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy - s * 0.30); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + s * 0.22, cy); ctx.stroke()
    ctx.beginPath(); ctx.arc(cx, cy, s * 0.05, 0, Math.PI * 2); ctx.fill()

  } else if (type === 'pin') {
    const pr = s * 0.30
    const pcy = cy - s * 0.10
    ctx.beginPath(); ctx.arc(cx, pcy, pr, 0, Math.PI * 2); ctx.stroke()
    ctx.beginPath(); ctx.arc(cx, pcy, pr * 0.30, 0, Math.PI * 2); ctx.fill()
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(cx - pr * 0.55, pcy + pr * 0.72)
    ctx.lineTo(cx, cy + s * 0.42)
    ctx.lineTo(cx + pr * 0.55, pcy + pr * 0.72)
    ctx.stroke()

  } else if (type === 'building') {
    // Simple building silhouette
    ctx.fillRect(ix + s*0.1,  iy + s*0.20, s*0.80, s*0.75)
    // roof triangle via clip
    ctx.fillStyle = 'rgba(0,0,0,0)'
    // windows (negative space — draw dark rects)
    ctx.fillStyle = 'rgba(0,0,0,0.6)'
    ;[[0.22,0.35],[0.55,0.35],[0.22,0.58],[0.55,0.58]].forEach(([fx,fy]) => {
      ctx.fillRect(ix + s*fx, iy + s*fy, s*0.18, s*0.16)
    })
    ctx.fillStyle = color
    // door
    ctx.fillRect(ix + s*0.35, iy + s*0.72, s*0.30, s*0.23)
    ctx.fillStyle = 'rgba(0,0,0,0.6)'
    ctx.fillRect(ix + s*0.36, iy + s*0.73, s*0.28, s*0.22)
  }

  ctx.restore()
}

function drawDetailText(ctx, text, x, y, size) {
  ctx.fillStyle = 'rgba(255,255,255,0.92)'
  ctx.font = `${size}px Arial, sans-serif`
  ctx.textAlign = 'left'
  ctx.fillText(text, x, y)
}

// ── Event-aware background prompt ───────────────────────────────────────────
function buildBackgroundPrompt(eventData) {
  const combined = ((eventData.name || '') + ' ' + (eventData.description || '')).toLowerCase()
  const scene    = detectEventScene(combined)
  const scheme   = eventData.colorScheme || 'gold and black'
  return `Ultra-realistic cinematic background photograph. Scene: ${scene}. Colors: ${scheme}.
CRITICAL: NO text, NO words, NO letters, NO numbers, NO logos anywhere.
Pure atmospheric visual: dramatic professional lighting, beautiful bokeh, depth of field.
Extremely high quality, photorealistic, 16:9 landscape orientation, dark luxurious mood.`
}

function detectEventScene(t) {
  if (/father|dad|papa/.test(t))           return 'warm golden hour, father and child embracing in sunlit forest, golden bokeh, emotional moment'
  if (/mother|mom|mama/.test(t))           return 'elegant garden party, pink and gold flowers in bloom, soft candlelight, warm maternal glow'
  if (/wedding|bride|groom|marriage/.test(t)) return 'luxury wedding venue, white roses and candles, crystal chandeliers, romantic ballroom'
  if (/birthday|bday/.test(t))             return 'upscale celebration, gold and black balloons, champagne glasses clinking, bokeh party lights'
  if (/christmas|xmas|holiday/.test(t))    return 'magical christmas, golden fairy lights, snow bokeh, warm cozy festive atmosphere'
  if (/new year/.test(t))                  return 'spectacular fireworks over glittering city skyline at midnight, gold and silver explosions'
  if (/conference|summit|forum/.test(t))   return 'modern professional conference hall, dramatic stage lighting, large empty stage, futuristic architecture'
  if (/product launch|launch/.test(t))     return 'sleek product reveal, dramatic spotlight on pedestal, dark studio, gold accent lighting'
  if (/gala|award|ceremony/.test(t))       return 'black-tie gala ballroom, crystal chandeliers, golden table settings, luxury red carpet'
  if (/concert|music|festival/.test(t))    return 'electric concert stage, dramatic light beams piercing darkness, energetic crowd bokeh'
  if (/tech|startup|digital|innovation/.test(t)) return 'futuristic city at night, neon reflections, sleek glass buildings, blue and gold digital grid'
  if (/food|culinar|chef|dining/.test(t))  return 'fine dining restaurant, candlelit table, gold cutlery, dark moody atmospheric lighting'
  if (/sport|game|match/.test(t))          return 'dramatic sports stadium at night, floodlights, empty field, atmospheric fog'
  if (/fashion|runway|style/.test(t))      return 'high-fashion runway with dramatic spotlights, sleek dark background, gold accents'
  if (/yoga|wellness|health/.test(t))      return 'serene misty sunrise over mountain lake, golden reflections, peaceful meditation atmosphere'
  if (/graduation|convocation/.test(t))    return 'grand university hall, sunlight through tall windows, confetti, celebratory atmosphere'
  if (/charity|fundrais/.test(t))          return 'hopeful sunrise over community, golden light rays through clouds, warm inspiring scene'
  return 'cinematic luxury event venue at night, dramatic gold and black lighting, elegant bokeh, Las Vegas style grandeur'
}

// ── Canvas helpers ───────────────────────────────────────────────────────────
function drawGradientBg(ctx, W, H) {
  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0,   '#080810'); bg.addColorStop(0.5, '#100e08'); bg.addColorStop(1, '#080810')
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H)

  ;[[W*0.75, H*0.25, 260, 'rgba(200,151,62,0.12)'], [W*0.15, H*0.75, 200, 'rgba(124,58,237,0.10)']].forEach(([gx,gy,gr,gc]) => {
    const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr)
    g.addColorStop(0, gc); g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
  })
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath()
}

// ── Legacy helpers ───────────────────────────────────────────────────────────
export async function generateBanner(eventData, options = {}) {
  const { provider = 'pollinations' } = options
  try {
    const res = await axios.post('/api/generate-banner', { prompt: buildBackgroundPrompt(eventData), provider })
    if (res.data.base64Image) return { success: true, imageUrl: `data:${res.data.mimeType};base64,${res.data.base64Image}`, provider: res.data.provider }
    throw new Error(res.data.error || 'Failed')
  } catch (err) { return { success: false, error: err.response?.data?.error || err.message } }
}

export async function downloadBanner(imageUrl, filename = 'banner.png') {
  try {
    const r = await fetch(imageUrl); const b = await r.blob()
    const url = URL.createObjectURL(b); const a = document.createElement('a')
    a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url)
    return { success: true }
  } catch (err) { return { success: false, error: err.message } }
}

export function sanitizeBannerFilename(n = 'banner') {
  return n.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 50) + '.png'
}
