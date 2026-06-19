import axios from 'axios'

// ── Public entry point ──────────────────────────────────────────────────────
export async function generateEventPosterWithCanvas(eventData, options = {}) {
  const { qrBase64 = null } = options

  let bgImageUrl = null
  try {
    const res = await axios.post('/api/generate-banner', {
      prompt: buildBackgroundPrompt(eventData),
      provider: 'pollinations',
    })
    if (res.data.base64Image) {
      bgImageUrl = `data:${res.data.mimeType};base64,${res.data.base64Image}`
    }
  } catch (_) { /* fall through to gradient background */ }

  return renderPosterCanvas(eventData, bgImageUrl, qrBase64)
}

// ── Canvas renderer ─────────────────────────────────────────────────────────
function renderPosterCanvas(eventData, bgImageUrl, qrBase64) {
  return new Promise((resolve) => {
    const SIZE = 1024
    const canvas = document.createElement('canvas')
    canvas.width = SIZE
    canvas.height = SIZE
    const ctx = canvas.getContext('2d')

    const draw = () => {
      const GOLD = '#c8973e'
      const GOLD_LIGHT = '#f0d080'

      // Dark readability overlay
      ctx.fillStyle = 'rgba(0,0,0,0.62)'
      ctx.fillRect(0, 0, SIZE, SIZE)

      // Top + bottom gold bars
      const barGrad = ctx.createLinearGradient(0, 0, SIZE, 0)
      barGrad.addColorStop(0,   'rgba(200,151,62,0)')
      barGrad.addColorStop(0.5, 'rgba(200,151,62,0.95)')
      barGrad.addColorStop(1,   'rgba(200,151,62,0)')
      ctx.fillStyle = barGrad
      ctx.fillRect(0, 0,        SIZE, 4)
      ctx.fillRect(0, SIZE - 4, SIZE, 4)

      // Corner brackets
      ctx.strokeStyle = GOLD
      ctx.lineWidth = 2.5
      drawCornerBrackets(ctx, SIZE, 44, 90)

      // Brand / organizer
      const brandName = (eventData.brandName || eventData.organizer || '').toUpperCase()
      let nextY = 78
      if (brandName) {
        ctx.fillStyle = 'rgba(200,151,62,0.9)'
        ctx.font = 'bold 20px Arial, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(brandName, SIZE / 2, nextY)
        nextY += 16
        ctx.fillStyle = 'rgba(200,151,62,0.4)'
        ctx.fillRect(SIZE / 2 - 80, nextY, 160, 1)
        nextY += 18
      }

      // ── Event name ──
      const name = (eventData.name || 'EVENT').toUpperCase()
      ctx.fillStyle = GOLD_LIGHT
      ctx.shadowColor = 'rgba(200,151,62,0.5)'
      ctx.shadowBlur = 24
      ctx.textAlign = 'center'

      const maxW = SIZE - 100
      let titleSize = 100
      ctx.font = `bold ${titleSize}px Arial, sans-serif`
      while (ctx.measureText(name).width > maxW && titleSize > 38) {
        titleSize -= 4
        ctx.font = `bold ${titleSize}px Arial, sans-serif`
      }

      const words = name.split(' ')
      const lines = []
      let cur = ''
      for (const w of words) {
        const test = cur ? cur + ' ' + w : w
        if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = w }
        else cur = test
      }
      if (cur) lines.push(cur)

      const lineH     = titleSize * 1.18
      const blockH    = lines.length * lineH
      let   titleY    = Math.max(nextY + titleSize, SIZE * 0.48 - blockH / 2)
      lines.forEach((ln, i) => ctx.fillText(ln, SIZE / 2, titleY + i * lineH))
      ctx.shadowBlur = 0

      // Gold divider below title
      const divY = titleY + (lines.length - 1) * lineH + 36
      const divGrad = ctx.createLinearGradient(160, 0, SIZE - 160, 0)
      divGrad.addColorStop(0,   'rgba(200,151,62,0)')
      divGrad.addColorStop(0.5, GOLD)
      divGrad.addColorStop(1,   'rgba(200,151,62,0)')
      ctx.fillStyle = divGrad
      ctx.fillRect(160, divY, SIZE - 320, 2)

      // Tagline
      let detailY = divY + 34
      if (eventData.tagline) {
        ctx.fillStyle = 'rgba(240,220,170,0.85)'
        ctx.font = 'italic 26px Georgia, serif'
        ctx.textAlign = 'center'
        ctx.fillText(eventData.tagline, SIZE / 2, detailY)
        detailY += 48
      }

      // ── Detail rows with drawn icons ──
      const iconSize  = 26
      const textSize  = titleSize > 60 ? 26 : 22
      const rowGap    = 46
      const detailX   = 80

      if (eventData.date) {
        let ds = eventData.date
        try { ds = new Date(ds + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) } catch (_) {}
        drawIconRow(ctx, 'calendar', ds, detailX, detailY, iconSize, textSize, GOLD)
        detailY += rowGap
      }
      if (eventData.time) {
        drawIconRow(ctx, 'clock', eventData.time, detailX, detailY, iconSize, textSize, GOLD)
        detailY += rowGap
      }
      if (eventData.location) {
        drawIconRow(ctx, 'pin', eventData.location, detailX, detailY, iconSize, textSize, GOLD)
        detailY += rowGap
      }

      // ── QR code panel ──
      const QR      = 170
      const qrPanelX = SIZE - QR - 50
      const qrPanelY = SIZE - QR - 70

      const finalize = () => resolve({ success: true, imageUrl: canvas.toDataURL('image/png') })

      if (qrBase64) {
        ctx.fillStyle = 'rgba(0,0,0,0.75)'
        roundRect(ctx, qrPanelX - 14, qrPanelY - 14, QR + 28, QR + 50, 10)
        ctx.fill()
        ctx.strokeStyle = GOLD
        ctx.lineWidth = 1
        ctx.stroke()

        const qrImg = new Image()
        qrImg.onload = () => {
          ctx.drawImage(qrImg, qrPanelX, qrPanelY, QR, QR)
          ctx.fillStyle = GOLD
          ctx.font = 'bold 13px Arial, sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText('SCAN TO REGISTER', qrPanelX + QR / 2, qrPanelY + QR + 28)
          finalize()
        }
        qrImg.onerror = finalize
        qrImg.src = 'data:image/png;base64,' + qrBase64
      } else {
        finalize()
      }
    }

    if (bgImageUrl) {
      const bgImg = new Image()
      bgImg.onload = () => { ctx.drawImage(bgImg, 0, 0, SIZE, SIZE); draw() }
      bgImg.onerror = () => { drawGradientBg(ctx, SIZE); draw() }
      bgImg.src = bgImageUrl
    } else {
      drawGradientBg(ctx, SIZE)
      draw()
    }
  })
}

// ── Icon row: drawn icon + text ─────────────────────────────────────────────
function drawIconRow(ctx, iconType, text, x, y, iconSize, fontSize, goldColor) {
  const iconY = y - iconSize * 0.78   // top of icon aligned to text baseline
  drawIcon(ctx, iconType, x, iconY, iconSize, goldColor)

  ctx.fillStyle = 'rgba(255,255,255,0.90)'
  ctx.font = `${fontSize}px Arial, sans-serif`
  ctx.textAlign = 'left'
  ctx.fillText(text, x + iconSize + 14, y)
}

// ── Canvas icon shapes ───────────────────────────────────────────────────────
function drawIcon(ctx, type, x, y, size, color) {
  ctx.save()
  ctx.strokeStyle = color
  ctx.fillStyle   = color
  ctx.lineWidth   = size * 0.1
  ctx.lineCap     = 'round'
  ctx.lineJoin    = 'round'

  if (type === 'calendar') {
    const r = size * 0.12
    // outer rectangle
    roundRect(ctx, x, y, size, size, r)
    ctx.stroke()
    // top bar fill
    ctx.fillStyle = color
    roundRect(ctx, x, y, size, size * 0.30, r)
    // clip so bar stays inside rectangle
    ctx.save()
    roundRect(ctx, x, y, size, size, r)
    ctx.clip()
    ctx.fill()
    ctx.restore()
    // two "binding" nubs at top
    ctx.lineWidth = size * 0.08
    ;[[0.28, -0.08], [0.72, -0.08]].forEach(([fx, fy]) => {
      ctx.beginPath()
      ctx.moveTo(x + size * fx, y + size * (fy + 0.12))
      ctx.lineTo(x + size * fx, y + size * (fy + 0.0))
      ctx.stroke()
    })
    // date dots (2 rows × 3 cols)
    ctx.fillStyle = color
    const dotR = size * 0.055
    ;[[0.22,0.55],[0.5,0.55],[0.78,0.55],[0.22,0.78],[0.5,0.78]].forEach(([fx,fy]) => {
      ctx.beginPath()
      ctx.arc(x + size*fx, y + size*fy, dotR, 0, Math.PI*2)
      ctx.fill()
    })

  } else if (type === 'clock') {
    const cx = x + size / 2, cy = y + size / 2, r = size / 2
    // outer ring
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke()
    // minute hand (to 12)
    ctx.lineWidth = size * 0.08
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy - r * 0.58); ctx.stroke()
    // hour hand (to 3)
    ctx.lineWidth = size * 0.1
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + r * 0.42, cy); ctx.stroke()
    // center dot
    ctx.beginPath(); ctx.arc(cx, cy, size * 0.07, 0, Math.PI * 2); ctx.fill()

  } else if (type === 'pin') {
    const cx = x + size / 2
    const headR = size * 0.36
    const headCY = y + headR + size * 0.04
    // circle head
    ctx.beginPath(); ctx.arc(cx, headCY, headR, 0, Math.PI * 2); ctx.stroke()
    // inner filled dot
    ctx.beginPath(); ctx.arc(cx, headCY, size * 0.10, 0, Math.PI * 2); ctx.fill()
    // tail
    ctx.lineWidth = size * 0.09
    ctx.beginPath()
    ctx.moveTo(cx - headR * 0.55, headCY + headR * 0.72)
    ctx.lineTo(cx, y + size)
    ctx.lineTo(cx + headR * 0.55, headCY + headR * 0.72)
    ctx.stroke()
  }

  ctx.restore()
}

// ── Background prompt — event-aware ─────────────────────────────────────────
function buildBackgroundPrompt(eventData) {
  const name  = (eventData.name        || '').toLowerCase()
  const desc  = (eventData.description || '').toLowerCase()
  const combined = name + ' ' + desc

  const scene = detectEventScene(combined)
  const scheme = eventData.colorScheme || 'gold and black'

  return `Cinematic photorealistic background image. Scene: ${scene}. Color palette: ${scheme} tones.
STRICT RULE: absolutely NO text, NO letters, NO words, NO numbers anywhere.
Pure atmospheric visual only — dramatic lighting, bokeh, depth of field.
Ultra high quality, 1024x1024, dark luxurious mood, suitable for overlaying event information.`
}

function detectEventScene(text) {
  const t = text.toLowerCase()
  if (/father|dad|papa|paternal/.test(t))     return 'warm golden hour family celebration, father and children embracing, sunlit park, soft bokeh'
  if (/mother|mom|mama|maternal/.test(t))      return 'elegant floral celebration, soft pink and gold flowers, warm candlelight, beautiful garden'
  if (/wedding|bride|groom|marriage/.test(t))  return 'romantic wedding scene, elegant white roses, candlelight chandeliers, luxury ballroom'
  if (/birthday|birth day|bday/.test(t))       return 'festive celebration with gold and confetti, elegant bokeh lights, luxury party atmosphere'
  if (/christmas|xmas|holiday|festiv/.test(t)) return 'magical christmas atmosphere, golden lights, snow bokeh, warm cozy ambient glow'
  if (/new year|newyear/.test(t))              return 'spectacular new year fireworks over a glittering city skyline at midnight, gold and silver'
  if (/conference|summit|forum|congress/.test(t)) return 'modern professional conference hall, dramatic stage lighting, futuristic architecture'
  if (/product launch|launch event/.test(t))   return 'sleek modern product reveal, dramatic spotlight, dark studio with gold accent lighting'
  if (/gala|award|ceremony|dinner/.test(t))    return 'elegant black-tie gala ballroom, crystal chandeliers, golden table settings, luxury atmosphere'
  if (/sport|game|match|tournament/.test(t))   return 'dynamic sports arena, dramatic stadium lights, action energy, dark atmospheric background'
  if (/music|concert|festival|live/.test(t))   return 'electric concert stage with dramatic light beams, dark venue, vibrant energy, bokeh crowd'
  if (/tech|startup|innovation|digital/.test(t)) return 'futuristic technology cityscape, neon blue and gold, digital grid, modern architecture'
  if (/charity|fundrais|nonprofit/.test(t))    return 'warm hopeful sunrise over a community gathering, golden light rays, people silhouettes'
  if (/fashion|style|runway/.test(t))          return 'high fashion runway with dramatic lighting, sleek dark background, gold accent spotlights'
  if (/food|culinar|chef|dining|restaurant/.test(t)) return 'elegant fine dining scene, candlelit table, gold cutlery, dark moody restaurant atmosphere'
  if (/yoga|wellness|health|mindful/.test(t))  return 'serene sunrise meditation landscape, golden mist over mountains, soft peaceful bokeh'
  if (/graduation|convocation|degree/.test(t)) return 'grand university hall with sunlight streaming through tall windows, celebration confetti'
  // default: elegant luxury venue
  return 'cinematic luxury event venue, dramatic gold and black atmospheric lighting, elegant bokeh, dark sophisticated background'
}

// ── Canvas helpers ───────────────────────────────────────────────────────────
function drawCornerBrackets(ctx, SIZE, margin, length) {
  ;[
    [[margin, margin + length], [margin, margin], [margin + length, margin]],
    [[SIZE-margin, SIZE-margin-length], [SIZE-margin, SIZE-margin], [SIZE-margin-length, SIZE-margin]],
  ].forEach(([[x1,y1],[x2,y2],[x3,y3]]) => {
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.lineTo(x3,y3); ctx.stroke()
  })
}

function drawGradientBg(ctx, SIZE) {
  const bg = ctx.createLinearGradient(0, 0, SIZE, SIZE)
  bg.addColorStop(0,   '#0a0a10')
  bg.addColorStop(0.5, '#12100a')
  bg.addColorStop(1,   '#0a0a10')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, SIZE, SIZE)

  const g1 = ctx.createRadialGradient(SIZE*0.8, SIZE*0.2, 0, SIZE*0.8, SIZE*0.2, 320)
  g1.addColorStop(0, 'rgba(200,151,62,0.10)'); g1.addColorStop(1, 'rgba(200,151,62,0)')
  ctx.fillStyle = g1; ctx.fillRect(0, 0, SIZE, SIZE)

  const g2 = ctx.createRadialGradient(SIZE*0.2, SIZE*0.8, 0, SIZE*0.2, SIZE*0.8, 280)
  g2.addColorStop(0, 'rgba(124,58,237,0.12)'); g2.addColorStop(1, 'rgba(124,58,237,0)')
  ctx.fillStyle = g2; ctx.fillRect(0, 0, SIZE, SIZE)
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

// ── Legacy helpers ───────────────────────────────────────────────────────────
export async function generateBanner(eventData, options = {}) {
  const { provider = 'pollinations' } = options
  try {
    const res = await axios.post('/api/generate-banner', {
      prompt: buildBackgroundPrompt(eventData),
      provider,
    })
    if (res.data.base64Image) {
      return { success: true, imageUrl: `data:${res.data.mimeType};base64,${res.data.base64Image}`, provider: res.data.provider }
    }
    throw new Error(res.data.error || 'Failed to generate banner')
  } catch (err) {
    return { success: false, error: err.response?.data?.error || err.message }
  }
}

export async function downloadBanner(imageUrl, filename = 'banner.png') {
  try {
    const response = await fetch(imageUrl)
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = filename; a.click()
    URL.revokeObjectURL(url)
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

export function sanitizeBannerFilename(eventName = 'banner') {
  return eventName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 50) + '.png'
}
