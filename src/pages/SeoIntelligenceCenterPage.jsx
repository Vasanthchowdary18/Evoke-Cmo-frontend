import React from 'react'
import { useNavigate } from 'react-router-dom'
import { FileSearch2, Search, ChevronRight } from 'lucide-react'
import AppSidebar from '../components/AppSidebar.jsx'
import StrategyTopBar from '../components/StrategyTopBar.jsx'

const BG     = '#0A0A0F'
const CARD   = '#111118'
const GOLD   = '#c8973e'
const TEXT2  = '#9b9bb0'
const TEXT3  = 'rgba(240,235,224,0.26)'
const BORDER = '#2A2A3A'

// No SEMrush/Ahrefs/Search Console integration exists anywhere in this app —
// Domain Authority, Organic Traffic, Keywords Ranked, Backlinks, and the
// keyword table below all have zero real data source, so they're honest
// "Not tracked" placeholders rather than fabricated numbers.
const KPIS = [
  { label: 'Domain Authority',   hint: 'Requires a Search Console / SEO audit integration' },
  { label: 'Organic Traffic Ingest', hint: 'Not tracked' },
  { label: 'Keywords Ranked',    hint: 'Not tracked' },
  { label: 'Indexable Backlinks', hint: 'Not tracked' },
]

// Content Optimization routes to the real, already-working SEO content
// generator (Groq-powered, saves to Firestore). Keyword Research has no
// backend anywhere in the app, so it's honestly marked Coming Soon.
const TOOLS = [
  { key: 'content', label: 'Content Optimization', desc: 'Audit text relevancy versus search intent.', icon: FileSearch2, route: '/seo-agent' },
  { key: 'keywords', label: 'Keyword Research', desc: 'Track ranking position, volume, and difficulty over time.', icon: Search, comingSoon: true },
]

export default function SeoIntelligenceCenterPage() {
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: "'Inter',sans-serif" }}>
      <AppSidebar />
      <div style={{ marginLeft: 'var(--evox-sidebar-w, 220px)', minHeight: '100vh', transition: 'margin-left 0.22s cubic-bezier(0.4,0,0.2,1)' }}>

        <StrategyTopBar
          title="SEO Intelligence Center"
          subtitle="Workspace: Active Domain Optimization Strategy"
          pillLabel="Crawler Link Stable"
        />

        <div style={{ padding: 40, maxWidth: 1300, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
            {KPIS.map(k => (
              <div key={k.label} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 18 }}>
                <div style={{ fontSize: 11, color: TEXT2, marginBottom: 8 }}>{k.label}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: TEXT3, fontFamily: "'Outfit','Inter',sans-serif" }}>—</div>
                <div style={{ fontSize: 11, color: TEXT3, marginTop: 4 }}>{k.hint}</div>
              </div>
            ))}
          </div>

          <div>
            <div style={{ fontFamily: "'Outfit','Inter',sans-serif", fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 16 }}>Autonomous SEO Toolset</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
              {TOOLS.map(t => {
                const Icon = t.icon
                const disabled = t.comingSoon
                return (
                  <div
                    key={t.key}
                    onClick={disabled ? undefined : () => navigate(t.route)}
                    style={{
                      background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 18,
                      cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.6 : 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: '#BE954A1A', border: '1px solid #BE954A40', display: 'flex', alignItems: 'center', justifyContent: 'center', color: GOLD, flexShrink: 0 }}>
                        <Icon size={16} />
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: GOLD }}>{t.label}</div>
                        <div style={{ fontSize: 11, color: TEXT2, marginTop: 2 }}>{t.desc}</div>
                      </div>
                    </div>
                    {disabled ? <span style={{ fontSize: 10, fontWeight: 700, color: TEXT3, flexShrink: 0 }}>Coming Soon</span> : <ChevronRight size={14} color={TEXT3} style={{ flexShrink: 0 }} />}
                  </div>
                )
              })}
            </div>
          </div>

          <div>
            <div style={{ fontFamily: "'Outfit','Inter',sans-serif", fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 16 }}>Top Performing Keywords</div>
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 32, textAlign: 'center', color: TEXT3, fontSize: 13 }}>
              No keyword-tracking integration is connected yet — Position, Volume, and Difficulty data requires a Search Console or SEO rank-tracking connection.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
