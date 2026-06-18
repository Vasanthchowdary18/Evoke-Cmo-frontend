// QR Code generation using QR Server API (free, no setup required)
export async function generateQRCode(data, size = 200) {
  try {
    const encoded = encodeURIComponent(data)
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}`

    // Fetch and convert to base64
    const response = await fetch(qrUrl)
    if (!response.ok) throw new Error('QR code generation failed')

    const blob = await response.blob()
    const reader = new FileReader()

    return new Promise((resolve, reject) => {
      reader.onload = () => {
        const base64 = reader.result
        resolve({ base64, url: base64 })
      }
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch (err) {
    console.error('QR Code error:', err)
    return null
  }
}

// Embed QR code on canvas
export async function addQRCodeToCanvas(canvas, qrBase64, position = 'bottom-right', size = 120) {
  return new Promise((resolve) => {
    const ctx = canvas.getContext('2d')
    const qrImg = new Image()

    qrImg.onload = () => {
      // Calculate position based on parameter
      let x, y
      const margin = 15

      switch (position) {
        case 'bottom-right':
          x = canvas.width - size - margin
          y = canvas.height - size - margin
          break
        case 'bottom-left':
          x = margin
          y = canvas.height - size - margin
          break
        case 'top-right':
          x = canvas.width - size - margin
          y = margin
          break
        case 'top-left':
          x = margin
          y = margin
          break
        default:
          x = canvas.width - size - margin
          y = canvas.height - size - margin
      }

      // Add slight background for QR visibility
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
      ctx.fillRect(x - 8, y - 8, size + 16, size + 16)

      // Draw QR code
      ctx.drawImage(qrImg, x, y, size, size)
      resolve({ x, y, size })
    }

    qrImg.onerror = () => resolve(null)
    qrImg.src = qrBase64
  })
}
