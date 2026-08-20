import React, { useState } from 'react'
import { Loader2, Zap, Download } from 'lucide-react'
import { generateEventPosterWithCanvas } from '../services/bannerService'
import { generateQRCode } from '../services/qrCodeService'

export default function EventBannerGenerator({
  eventData,
  onBannerGenerated,
  loading: parentLoading,
  disabled: parentDisabled,
}) {
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)
  const [banner, setBanner]     = useState(null)
  const [addQR, setAddQR]       = useState(true)

  const isLoading  = loading || parentLoading
  const isDisabled = parentDisabled || !eventData?.name?.trim()

  const handleGenerateBanner = async () => {
    if (!eventData?.name?.trim()) {
      setError('Enter an event name first')
      return
    }

    setError(null)
    setLoading(true)
    setBanner(null)

    try {
      // Fetch QR code first if needed
      let qrBase64 = null
      if (addQR && eventData.eventUrl) {
        try {
          const qrResult = await generateQRCode(eventData.eventUrl, 200)
          if (qrResult?.base64) {
            // Strip the data-URL prefix — canvas renderer expects raw base64
            qrBase64 = qrResult.base64.replace(/^data:image\/[^;]+;base64,/, '')
          }
        } catch (_) {
          // QR failure is non-fatal — poster still generates
        }
      }

      const result = await generateEventPosterWithCanvas(eventData, { qrBase64 })

      if (!result.success) {
        setError(result.error || 'Poster generation failed')
        return
      }

      setBanner({ imageUrl: result.imageUrl, hasQR: !!qrBase64 })
      if (onBannerGenerated) onBannerGenerated({ imageUrl: result.imageUrl })
    } catch (err) {
      setError(err.message || 'Poster generation failed')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (!banner?.imageUrl) return
    const a = document.createElement('a')
    a.href = banner.imageUrl
    a.download = `${(eventData.name || 'event').toLowerCase().replace(/\s+/g, '-')}-poster.png`
    a.click()
  }

  return (
    <div style={{ marginBottom: '12px' }}>

      {/* QR toggle */}
      {eventData?.eventUrl && (
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '12px',
            cursor: 'pointer',
            fontSize: '12px',
            color: 'rgba(255,255,255,0.7)',
          }}
        >
          <input
            type="checkbox"
            checked={addQR}
            onChange={(e) => setAddQR(e.target.checked)}
            disabled={isDisabled || isLoading}
            style={{ cursor: isDisabled ? 'not-allowed' : 'pointer' }}
          />
          <span>Add QR code to poster (event URL)</span>
        </label>
      )}

      {/* Generate button */}
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
            Generating Poster...
          </>
        ) : (
          <>
            <Zap size={17} />
            Generate Poster
          </>
        )}
      </button>

      {/* Error */}
      {error && (
        <div
          style={{
            marginTop: '8px',
            padding: '10px 12px',
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '8px',
            color: '#fca5a5',
            fontSize: '12px',
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* Preview */}
      {banner && (
        <div style={{ marginTop: '12px' }}>
          <div
            style={{
              width: '100%',
              aspectRatio: '16/9',
              background: '#000',
              border: '1px solid rgba(200,151,62,0.3)',
              borderRadius: '12px',
              overflow: 'hidden',
              marginBottom: '10px',
            }}
          >
            <img
              src={banner.imageUrl}
              alt="Generated poster"
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
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#d9a84f')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#c8973e')}
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
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
            >
              Regenerate
            </button>
          </div>

          <div
            style={{
              fontSize: '11px',
              color: 'rgba(255,255,255,0.5)',
              padding: '0 4px',
            }}
          >
            AI Generated Poster{banner.hasQR ? ' • QR code included' : ''}
          </div>
        </div>
      )}
    </div>
  )
}
