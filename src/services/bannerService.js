import axios from 'axios'

// ── Public entry point used by EventBannerGenerator ────────────────────────
// Fetches an AI background, then overlays all event text via Canvas.
export async function generateEventPosterWithCanvas(eventData, options = {}) {
  const { qrBase64 = null } = options

  // 1. Get a text-free background from AI
  let bgImageUrl = null
  try {
    const res = await axios.post('/api/generate-banner', {
      prompt: buildBackgroundPrompt(eventData),
      provider: 'pollinations',
    })
    if (res.data.base64Image) {
      bgImageUrl = `data:${res.data.mimeType};base64,${res.data.base64Image}`
    }
  } catch (_) {
    // Fallback to gradient-only background
  }

  // 2. Draw everything on a canvas
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

      // ── Dark overlay for readability ──
      ctx.fillStyle = 'rgba(0, 0, 0, 0.62)'
      ctx.fillRect(0, 0, SIZE, SIZE)

      // ── Top + bottom gold bars ──
      const barGrad = ctx.createLinearGradient(0, 0, SIZE, 0)
      barGrad.addColorStop(0, 'rgba(200,151,62,0)')
      barGrad.addColorStop(0.5, 'rgba(200,151,62,0.95)')
      barGrad.addColorStop(1, 'rgba(200,151,62,0)')
      ctx.fillStyle = barGrad
      ctx.fillRect(0, 0, SIZE, 4)
      ctx.fillRect(0, SIZE - 4, SIZE, 4)

      // ── Corner bracket accents ──
      ctx.strokeStyle = GOLD
      ctx.lineWidth = 2.5
      ;[
        [[44, 90], [44, 44], [90, 44]],
        [[SIZE - 44, SIZE - 90], [SIZE - 44, SIZE - 44], [SIZE - 90, SIZE - 44]],
      ].forEach(([[x1, y1], [x2, y2], [x3, y3]]) => {
        ctx.beginPath()
        ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3)
        ctx.stroke()
      })

      // ── Brand / organizer name ──
      const brandName = (eventData.brandName || eventData.organizer || '').toUpperCase()
      let nextY = 78
      if (brandName) {
        ctx.fillStyle = 'rgba(200,151,62,0.9)'
        ctx.font = 'bold 20px Arial, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(brandName, SIZE / 2, nextY)
        nextY += 16
        // thin separator under brand
        ctx.fillStyle = 'rgba(200,151,62,0.5)'
        ctx.fillRect(SIZE / 2 - 80, nextY, 160, 1)
        nextY += 18
      }

      // ── Event name (large, gold, word-wrapped) ──
      const name = (eventData.name || 'EVENT').toUpperCase()
      ctx.fillStyle = GOLD_LIGHT
      ctx.shadowColor = 'rgba(200,151,62,0.5)'
      ctx.shadowBlur = 24

      const maxW = SIZE - 100
      let titleSize = 100
      ctx.font = `bold ${titleSize}px Arial, sans-serif`
      ctx.textAlign = 'center'
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

      const lineH = titleSize * 1.18
      const blockH = lines.length * lineH
      // Centre the title block vertically in the upper half
      let titleY = Math.max(nextY + titleSize, (SIZE * 0.48) - blockH / 2)
      lines.forEach((ln, i) => ctx.fillText(ln, SIZE / 2, titleY + i * lineH))
      ctx.shadowBlur = 0

      // ── Gold divider ──
      const divY = titleY + (lines.length - 1) * lineH + 36
      const divGrad = ctx.createLinearGradient(160, 0, SIZE - 160, 0)
      divGrad.addColorStop(0, 'rgba(200,151,62,0)')
      divGrad.addColorStop(0.5, GOLD)
      divGrad.addColorStop(1, 'rgba(200,151,62,0)')
      ctx.fillStyle = divGrad
      ctx.fillRect(160, divY, SIZE - 320, 2)

      // ── Tagline ──
      let detailY = divY + 34
      if (eventData.tagline) {
        ctx.fillStyle = 'rgba(240,220,170,0.85)'
        ctx.font = 'italic 26px Georgia, serif'
        ctx.textAlign = 'center'
        ctx.fillText(eventData.tagline, SIZE / 2, detailY)
        detailY += 44
      }

      // ── Details: date / time / location ──
      const details = []
      if (eventData.date) {
        let ds = eventData.date
        try { ds = new Date(ds + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) } catch (_) {}
        details.push('📅  ' + ds)
      }
      if (eventData.time)     details.push('🕐  ' + eventData.time)
      if (eventData.location) details.push('📍  ' + eventData.location)

      ctx.textAlign = 'left'
      const detailX = 80
      details.forEach((line, i) => {
        ctx.fillStyle = 'rgba(255,255,255,0.88)'
        ctx.font = `${titleSize > 60 ? 26 : 22}px Arial, sans-serif`
        ctx.fillText(line, detailX, detailY + i * 44)
      })

      // ── QR code panel (bottom-right) ──
      const QR = 170
      const qrPanelX = SIZE - QR - 44
      const qrPanelY = SIZE - QR - 80

      const finalize = () => {
        const url = canvas.toDataURL('image/png')
        resolve({ success: true, imageUrl: url })
      }

      if (qrBase64) {
        // Panel background
        ctx.fillStyle = 'rgba(0,0,0,0.75)'
        roundRect(ctx, qrPanelX - 14, qrPanelY - 14, QR + 28, QR + 46, 10)
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
          ctx.fillText('SCAN TO REGISTER', qrPanelX + QR / 2, qrPanelY + QR + 24)
          finalize()
        }
        qrImg.onerror = finalize
        qrImg.src = 'data:image/png;base64,' + qrBase64
      } else {
        finalize()
      }
    }

    // Load AI background, then draw overlay
    if (bgImageUrl) {
      const bgImg = new Image()
      bgImg.onload = () => {
        ctx.drawImage(bgImg, 0, 0, SIZE, SIZE)
        draw()
      }
      bgImg.onerror = () => {
        drawGradientBackground(ctx, SIZE)
        draw()
      }
      bgImg.src = bgImageUrl
    } else {
      drawGradientBackground(ctx, SIZE)
      draw()
    }
  })
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function drawGradientBackground(ctx, SIZE) {
  const bg = ctx.createLinearGradient(0, 0, SIZE, SIZE)
  bg.addColorStop(0, '#0a0a10')
  bg.addColorStop(0.5, '#12100a')
  bg.addColorStop(1, '#0a0a10')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, SIZE, SIZE)

  // subtle glow blobs
  const g1 = ctx.createRadialGradient(SIZE * 0.8, SIZE * 0.2, 0, SIZE * 0.8, SIZE * 0.2, 320)
  g1.addColorStop(0, 'rgba(200,151,62,0.10)')
  g1.addColorStop(1, 'rgba(200,151,62,0)')
  ctx.fillStyle = g1
  ctx.fillRect(0, 0, SIZE, SIZE)

  const g2 = ctx.createRadialGradient(SIZE * 0.2, SIZE * 0.8, 0, SIZE * 0.2, SIZE * 0.8, 280)
  g2.addColorStop(0, 'rgba(124,58,237,0.12)')
  g2.addColorStop(1, 'rgba(124,58,237,0)')
  ctx.fillStyle = g2
  ctx.fillRect(0, 0, SIZE, SIZE)
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

function buildBackgroundPrompt(eventData) {
  const style = eventData.style || 'luxury, professional'
  const scheme = eventData.colorScheme || 'gold and black'
  return `Cinematic atmospheric background for an event poster. Style: ${style}. Color palette: ${scheme}.
IMPORTANT: NO text, NO letters, NO words, NO numbers anywhere in the image.
Pure visual background only: dramatic bokeh lighting, elegant abstract textures, luxury atmosphere, dark tones with gold accents.
High quality, photorealistic, suitable for overlaying event text on top.`
}

// ── Legacy helpers (kept for other callers) ─────────────────────────────────
export async function generateBanner(eventData, options = {}) {
  const { provider = 'pollinations' } = options
  try {
    const res = await axios.post('/api/generate-banner', {
      prompt: buildBackgroundPrompt(eventData),
      provider,
    })
    if (res.data.base64Image) {
      return {
        success: true,
        imageUrl: `data:${res.data.mimeType};base64,${res.data.base64Image}`,
        provider: res.data.provider,
      }
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
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

export function sanitizeBannerFilename(eventName = 'banner') {
  return eventName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 50) + '.png'
}
