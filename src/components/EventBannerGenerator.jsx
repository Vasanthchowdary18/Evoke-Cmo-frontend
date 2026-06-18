import React, { useState } from 'react'
import { Loader2, Zap, Download, ChevronDown } from 'lucide-react'
import { generateBanner } from '../services/bannerService'
import { generateQRCode, addQRCodeToCanvas } from '../services/qrCodeService'

export default function EventBannerGenerator({
  eventData,
  onBannerGenerated,
  loading: parentLoading,
  disabled: parentDisabled,
}) {
  const [loading, setLoading] = useState(false)
  const [provider] = useState('pollinations')
  const [error, setError] = useState(null)
  const [banner, setBanner] = useState(null)
  const [addQR, setAddQR] = useState(true)

  const isLoading = loading || parentLoading
  const isDisabled = parentDisabled || !eventData?.name?.trim()

  const handleGenerateBanner = async () => {
    if (!eventData?.name?.trim()) {
      setError('Enter an event name first')
      return
    }

    setError(null)
    setLoading(true)

    try {
      // Generate base banner
      const result = await generateBanner(eventData, { provider })

      if (!result.success) {
        setError(result.error || 'Banner generation failed')
        setLoading(false)
        return
      }

      // Add QR code if URL exists and user wants it
      if (addQR && eventData.eventUrl) {
        try {
          const qrData = await generateQRCode(eventData.eventUrl, 200)
          if (qrData?.base64) {
            // Create canvas and draw image + QR
            const img = new Image()
            img.onload = async () => {
              const canvas = document.createElement('canvas')
              canvas.width = img.width
              canvas.height = img.height

              const ctx = canvas.getContext('2d')
              ctx.drawImage(img, 0, 0)

              // Add QR code with label
              await addQRCodeToCanvas(canvas, qrData.base64, 'bottom-right', 140)

              // Add "SCAN TO REGISTER" label below QR
              ctx.fillStyle = '#c8973e'
              ctx.font = 'bold 14px Arial, sans-serif'
              ctx.textAlign = 'right'
              const labelY = canvas.height - 10
              const labelX = canvas.width - 20
              ctx.fillText('SCAN TO REGISTER', labelX, labelY)

              const finalImageUrl = canvas.toDataURL('image/png')
              setBanner({ imageUrl: finalImageUrl, provider: result.provider, hasQR: true })
              if (onBannerGenerated) onBannerGenerated({ imageUrl: finalImageUrl })
            }
            img.onerror = () => {
              // Fallback: use banner without QR
              setBanner({ imageUrl: result.imageUrl, provider: result.provider, hasQR: false })
              if (onBannerGenerated) onBannerGenerated({ imageUrl: result.imageUrl })
            }
            img.src = result.imageUrl
          } else {
            throw new Error('QR code generation failed')
          }
        } catch (qrErr) {
          console.warn('QR code failed, using banner without QR:', qrErr.message)
          setBanner({ imageUrl: result.imageUrl, provider: result.provider, hasQR: false })
          if (onBannerGenerated) onBannerGenerated({ imageUrl: result.imageUrl })
        }
      } else {
        setBanner({ imageUrl: result.imageUrl, provider: result.provider, hasQR: false })
        if (onBannerGenerated) onBannerGenerated({ imageUrl: result.imageUrl })
      }
    } catch (err) {
      setError(err.message || 'Banner generation failed')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    if (!banner?.imageUrl) return
    try {
      const response = await fetch(banner.imageUrl)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${(eventData.name || 'event').toLowerCase().replace(/\s+/g, '-')}-banner.png`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError('Download failed: ' + err.message)
    }
  }

  return (
    <div style={{ marginBottom: '12px' }}>
      {/* DALL-E 3 Badge */}
      <div
        style={{
          marginBottom: '12px',
          padding: '11px 14px',
          background: 'rgba(200, 151, 62, 0.08)',
          border: '1px solid rgba(200, 151, 62, 0.3)',
          borderRadius: '10px',
          color: '#c8973e',
          fontSize: '13px',
          fontWeight: '700',
          textTransform: 'uppercase',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <span style={{ fontSize: '16px' }}>✨</span>
        DALL-E 3 (Premium)
        <span style={{ fontSize: '14px', marginLeft: 'auto' }}>⭐</span>
      </div>

      {/* QR Code Toggle */}
      {eventData.eventUrl && (
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '12px',
            cursor: 'pointer',
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.7)',
          }}
        >
          <input
            type="checkbox"
            checked={addQR}
            onChange={(e) => setAddQR(e.target.checked)}
            disabled={isDisabled || isLoading}
            style={{ cursor: isDisabled ? 'not-allowed' : 'pointer' }}
          />
          <span>Add QR code to banner (event URL)</span>
        </label>
      )}

      {/* Main Generate Button */}
      <button
        onClick={handleGenerateBanner}
        disabled={isDisabled || isLoading}
        style={{
          width: '100%',
          padding: '14px 20px',
          background: isLoading
            ? 'rgba(255,255,255,0.05)'
            : 'linear-gradient(135deg, rgba(200,151,62,0.13), rgba(200,151,62,0.12))',
          border: '1px solid rgba(200,151,62,0.4)',
          borderRadius: '14px',
          color: isLoading || isDisabled ? 'rgba(255,255,255,0.4)' : '#f0d080',
          fontSize: '15px',
          fontWeight: '700',
          cursor: isDisabled || isLoading ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          transition: 'all 0.2s',
        }}
      >
        {isLoading ? (
          <>
            <Loader2 size={17} style={{ animation: 'spin 1s linear infinite' }} />
            Generating Premium Banner...
          </>
        ) : (
          <>
            <Zap size={17} />
            Generate Premium Banner
          </>
        )}
      </button>

      {/* Error Message */}
      {error && (
        <div
          style={{
            marginTop: '8px',
            padding: '10px 12px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            color: '#fca5a5',
            fontSize: '12px',
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* Banner Preview */}
      {banner && (
        <div style={{ marginTop: '12px' }}>
          <div
            style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '1',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(200,151,62,0.3)',
              borderRadius: '12px',
              overflow: 'hidden',
              marginBottom: '10px',
            }}
          >
            <img
              src={banner.imageUrl}
              alt="Generated banner"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <button
              onClick={handleDownload}
              style={{
                flex: 1,
                padding: '10px 12px',
                background: '#c8973e',
                color: '#0f172a',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => (e.target.style.background = '#d9a84f')}
              onMouseLeave={(e) => (e.target.style.background = '#c8973e')}
            >
              <Download size={14} /> Download
            </button>
            <button
              onClick={() => setBanner(null)}
              style={{
                flex: 1,
                padding: '10px 12px',
                background: 'rgba(255,255,255,0.1)',
                color: '#f1f5f9',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => (e.target.style.background = 'rgba(255,255,255,0.15)')}
              onMouseLeave={(e) => (e.target.style.background = 'rgba(255,255,255,0.1)')}
            >
              Regenerate
            </button>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '11px',
              color: 'rgba(255,255,255,0.5)',
              padding: '0 8px',
            }}
          >
            <span>
              Generated with <strong>DALL-E 3</strong> Premium
              {banner.hasQR && ' • QR code included'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
