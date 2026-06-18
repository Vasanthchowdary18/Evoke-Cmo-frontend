import BannerGenerator from '../components/BannerGenerator'

export default function BannerGeneratorExample() {
  // Example event data - replace with real data from your form
  const exampleEvent = {
    name: 'Freedom Bell Conference',
    tagline: 'Where Vision Meets Innovation',
    date: 'January 6-10, 2027',
    location: 'Las Vegas, Nevada',
    style: 'luxury, professional, elegant',
    colorScheme: 'gold and black with luxury accents',
    brandName: 'ELEVATE × EVOKE',
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      padding: '40px 20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '800',
            color: '#c8973e',
            marginBottom: '8px',
          }}>
            Event Banner Generator
          </h1>
          <p style={{
            fontSize: '16px',
            color: '#94a3b8',
            maxWidth: '600px',
          }}>
            Create professional marketing banners for your events using AI. Choose between fast Gemini
            generation (default) or premium DALL-E 3 quality.
          </p>
        </div>

        <BannerGenerator eventData={exampleEvent} />

        <div style={{
          marginTop: '60px',
          padding: '24px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}>
          <h3 style={{ color: '#c8973e', fontSize: '16px', fontWeight: '700', marginBottom: '12px' }}>
            📚 Quick Integration Guide
          </h3>
          <div style={{ color: '#94a3b8', lineHeight: '1.8', fontSize: '14px' }}>
            <p><strong>1. Import Component:</strong></p>
            <code style={{
              display: 'block',
              background: 'rgba(0, 0, 0, 0.3)',
              padding: '12px',
              borderRadius: '6px',
              overflow: 'auto',
              marginBottom: '12px',
            }}>
              import BannerGenerator from './components/BannerGenerator'
            </code>

            <p><strong>2. Use in Your Event Form:</strong></p>
            <code style={{
              display: 'block',
              background: 'rgba(0, 0, 0, 0.3)',
              padding: '12px',
              borderRadius: '6px',
              overflow: 'auto',
              marginBottom: '12px',
            }}>
              &lt;BannerGenerator eventData={'{'}eventName, date, location{'}'} /&gt;
            </code>

            <p><strong>3. Access Generated Banner URL:</strong></p>
            <code style={{
              display: 'block',
              background: 'rgba(0, 0, 0, 0.3)',
              padding: '12px',
              borderRadius: '6px',
              overflow: 'auto',
              marginBottom: '12px',
            }}>
              import {'{'}generateBanner{'}'} from './services/bannerService'<br />
              const result = await generateBanner(eventData)<br />
              // Save result.imageUrl to Firestore with event
            </code>

            <p><strong>📖 Full Guide:</strong> See <code style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '2px 6px', borderRadius: '4px' }}>BANNER_SETUP.md</code></p>
          </div>
        </div>
      </div>
    </div>
  )
}
