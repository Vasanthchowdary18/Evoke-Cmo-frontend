import { useState } from 'react'
import { generateBanner, downloadBanner, sanitizeBannerFilename } from '../services/bannerService'
import { Zap, Download, RotateCcw } from 'lucide-react'

export default function BannerGenerator({ eventData = {} }) {
  const [loading, setLoading] = useState(false)
  const [banner, setBanner] = useState(null)
  const [error, setError] = useState(null)
  const [provider, setProvider] = useState('pollinations')
  const [formData, setFormData] = useState({
    name: eventData.name || '',
    tagline: eventData.tagline || '',
    date: eventData.date || '',
    location: eventData.location || '',
    style: eventData.style || 'luxury, professional',
    colorScheme: eventData.colorScheme || 'gold and black',
    brandName: eventData.brandName || '',
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleGenerate = async () => {
    setError(null)
    setLoading(true)

    const result = await generateBanner(formData, { provider })

    if (result.success) {
      setBanner(result)
    } else {
      setError(result.error || 'Failed to generate banner')
    }

    setLoading(false)
  }

  const handleDownload = async () => {
    if (banner?.imageUrl) {
      const filename = sanitizeBannerFilename(formData.name || 'banner')
      await downloadBanner(banner.imageUrl, filename)
    }
  }

  const handleReset = () => {
    setBanner(null)
    setError(null)
    setFormData({
      name: '',
      tagline: '',
      date: '',
      location: '',
      style: 'luxury, professional',
      colorScheme: 'gold and black',
      brandName: '',
    })
  }

  return (
    <div className="banner-generator">
      <style>{`
        .banner-generator {
          max-width: 1200px;
          margin: 0 auto;
          padding: 24px;
          background: #0f172a;
          border-radius: 12px;
          color: #f1f5f9;
        }

        .banner-generator h2 {
          font-size: 24px;
          font-weight: 800;
          margin-bottom: 24px;
          color: #c8973e;
        }

        .generator-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
          align-items: start;
        }

        @media (max-width: 768px) {
          .generator-layout {
            grid-template-columns: 1fr;
          }
        }

        .form-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-group label {
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #94a3b8;
        }

        .form-group input,
        .form-group textarea,
        .form-group select {
          padding: 12px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: #f1f5f9;
          font-family: inherit;
          font-size: 14px;
          transition: all 0.2s;
        }

        .form-group input:focus,
        .form-group textarea:focus,
        .form-group select:focus {
          outline: none;
          background: rgba(255, 255, 255, 0.08);
          border-color: #c8973e;
          box-shadow: 0 0 0 2px rgba(200, 151, 62, 0.1);
        }

        .provider-selector {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
        }

        .provider-btn {
          flex: 1;
          padding: 10px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: #94a3b8;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .provider-btn:hover {
          background: rgba(255, 255, 255, 0.08);
        }

        .provider-btn.active {
          background: #c8973e;
          color: #0f172a;
          border-color: #c8973e;
        }

        .button-group {
          display: flex;
          gap: 12px;
          margin-top: 24px;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .btn-primary {
          background: #c8973e;
          color: #0f172a;
          flex: 1;
        }

        .btn-primary:hover:not(:disabled) {
          background: #d9a84f;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(200, 151, 62, 0.3);
        }

        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.1);
          color: #f1f5f9;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.15);
        }

        .preview-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .preview-box {
          position: relative;
          width: 100%;
          aspect-ratio: 1;
          background: rgba(255, 255, 255, 0.05);
          border: 2px solid rgba(200, 151, 62, 0.2);
          border-radius: 12px;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .preview-box img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .preview-placeholder {
          text-align: center;
          color: #64748b;
        }

        .preview-placeholder svg {
          width: 64px;
          height: 64px;
          margin-bottom: 12px;
          opacity: 0.5;
        }

        .loading-spinner {
          display: inline-block;
          width: 20px;
          height: 20px;
          border: 3px solid rgba(255, 255, 255, 0.2);
          border-top-color: #c8973e;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .error-message {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 8px;
          padding: 12px;
          color: #fca5a5;
          font-size: 13px;
        }

        .success-message {
          background: rgba(34, 197, 94, 0.1);
          border: 1px solid rgba(34, 197, 94, 0.3);
          border-radius: 8px;
          padding: 12px;
          color: #86efac;
          font-size: 13px;
        }

        .banner-info {
          font-size: 12px;
          color: #64748b;
          text-align: center;
          margin-top: 8px;
        }
      `}</style>

      <h2>🎨 Banner Generator</h2>

      <div className="generator-layout">
        {/* Form Section */}
        <div className="form-section">
          <div className="provider-selector">
            <button
              className={`provider-btn ${provider === 'pollinations' ? 'active' : ''}`}
              onClick={() => setProvider('pollinations')}
            >
              EVOX AI (Free)
            </button>
            <button
              className={`provider-btn ${provider === 'dalle' ? 'active' : ''}`}
              onClick={() => setProvider('dalle')}
              title="Requires OPENAI_API_KEY"
            >
              GPT Image 2 (Premium)
            </button>
          </div>

          <div className="form-group">
            <label>Event Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., Freedom Bell Conference"
            />
          </div>

          <div className="form-group">
            <label>Tagline</label>
            <input
              type="text"
              name="tagline"
              value={formData.tagline}
              onChange={handleInputChange}
              placeholder="e.g., Where Vision Meets Innovation"
            />
          </div>

          <div className="form-group">
            <label>Date</label>
            <input
              type="text"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              placeholder="e.g., January 6-10, 2027"
            />
          </div>

          <div className="form-group">
            <label>Location</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="e.g., Las Vegas, Nevada"
            />
          </div>

          <div className="form-group">
            <label>Brand Name</label>
            <input
              type="text"
              name="brandName"
              value={formData.brandName}
              onChange={handleInputChange}
              placeholder="e.g., ELEVATE"
            />
          </div>

          <div className="form-group">
            <label>Style</label>
            <input
              type="text"
              name="style"
              value={formData.style}
              onChange={handleInputChange}
              placeholder="e.g., luxury, professional, modern"
            />
          </div>

          <div className="form-group">
            <label>Color Scheme</label>
            <input
              type="text"
              name="colorScheme"
              value={formData.colorScheme}
              onChange={handleInputChange}
              placeholder="e.g., gold and black, blue and silver"
            />
          </div>

          <div className="button-group">
            <button
              className="btn btn-primary"
              onClick={handleGenerate}
              disabled={loading || !formData.name}
            >
              {loading ? (
                <>
                  <span className="loading-spinner"></span>
                  Generating...
                </>
              ) : (
                <>
                  <Zap size={16} />
                  Generate Banner
                </>
              )}
            </button>
            {banner && (
              <button className="btn btn-secondary" onClick={handleReset}>
                <RotateCcw size={16} />
              </button>
            )}
          </div>

          {error && <div className="error-message">⚠️ {error}</div>}
        </div>

        {/* Preview Section */}
        <div className="preview-section">
          <div className="preview-box">
            {banner?.imageUrl ? (
              <img src={banner.imageUrl} alt="Generated banner" />
            ) : (
              <div className="preview-placeholder">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
                <p>Your banner will appear here</p>
              </div>
            )}
          </div>

          {banner && (
            <>
              <button className="btn btn-primary" onClick={handleDownload}>
                <Download size={16} />
                Download Banner
              </button>
              <div className="banner-info">
                Generated with {banner.provider}
                {banner.revisedPrompt && ' • Prompt refined by AI'}
              </div>
              <div className="success-message">✓ Banner ready! Download or use the URL above.</div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
