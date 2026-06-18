import axios from 'axios'

export async function generateBanner(eventData, options = {}) {
  const { provider = 'gemini' } = options

  const prompt = buildBannerPrompt(eventData)

  try {
    const res = await axios.post(`/api/generate-banner`, {
      prompt,
      provider,
    })

    if (res.data.base64Image) {
      const imageUrl = `data:${res.data.mimeType};base64,${res.data.base64Image}`
      return {
        success: true,
        imageUrl,
        provider: res.data.provider,
        revisedPrompt: res.data.revised_prompt,
      }
    } else {
      throw new Error(res.data.error || 'Failed to generate banner')
    }
  } catch (err) {
    console.error('Banner generation error:', err)
    return {
      success: false,
      error: err.response?.data?.error || err.message,
    }
  }
}

function buildBannerPrompt(eventData) {
  const {
    name = 'Event',
    tagline = '',
    date = '',
    location = '',
    style = 'luxury, professional',
    colorScheme = 'gold and black',
    brandName = '',
  } = eventData

  return `Create a professional marketing banner for an event with these specifications:

Event Name: ${name}
${tagline ? `Tagline: ${tagline}` : ''}
${date ? `Date: ${date}` : ''}
${location ? `Location: ${location}` : ''}
${brandName ? `Brand: ${brandName}` : ''}

Design Requirements:
- Style: ${style}
- Color scheme: ${colorScheme}
- Premium, elegant appearance suitable for luxury events
- Professional typography with clear hierarchy
- High-quality background with relevant imagery
- Balanced layout with room for event details
- 1024x1024 resolution
- Modern corporate design

Make the banner eye-catching and suitable for social media promotion and print materials.`
}

export async function generateBannerWithText(eventData, textOverlays, options = {}) {
  const banner = await generateBanner(eventData, options)

  if (!banner.success) {
    return banner
  }

  try {
    const canvas = document.createElement('canvas')
    canvas.width = 1024
    canvas.height = 1024

    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      ctx.drawImage(img, 0, 0)

      // Add text overlays
      ctx.fillStyle = '#c8973e' // Gold color
      ctx.font = 'bold 72px Arial, sans-serif'
      ctx.textAlign = 'center'

      if (textOverlays.title) {
        ctx.fillText(textOverlays.title, 512, 300)
      }

      if (textOverlays.subtitle) {
        ctx.font = '32px Arial, sans-serif'
        ctx.fillText(textOverlays.subtitle, 512, 400)
      }

      // Return data URL
      banner.imageUrl = canvas.toDataURL('image/png')
    }

    img.src = banner.imageUrl
    return banner
  } catch (err) {
    console.error('Error adding text overlay:', err)
    return banner // Return banner without text overlay if it fails
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
    console.error('Download error:', err)
    return { success: false, error: err.message }
  }
}

export function sanitizeBannerFilename(eventName = 'banner') {
  return eventName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 50) + '.png'
}
