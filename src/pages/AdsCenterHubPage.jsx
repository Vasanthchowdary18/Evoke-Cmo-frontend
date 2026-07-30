import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, SlidersHorizontal, FlaskConical, Plus } from 'lucide-react'
import AppSidebar from '../components/AppSidebar.jsx'
import StrategyTopBar from '../components/StrategyTopBar.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { getGoogleAdsAccount, getGoogleAdsMetrics } from '../services/googleAdsService.js'
import { getMetaAdsAccount } from '../services/metaAdsService.js'

const BG     = '#0A0A0F'
const CARD   = '#111118'
const CARD2  = '#1A1A24'
const GOLD   = '#c8973e'
const GDIM   = 'rgba(200,151,62,0.1)'
const GBORD  = 'rgba(200,151,62,0.22)'
const GREEN  = '#10b981'
const TEXT2  = '#9b9bb0'
const TEXT3  = 'rgba(240,235,224,0.26)'
const BORDER = '#2A2A3A'

const PLATFORMS = ['Meta', 'Google', 'LinkedIn']

// Bottom tool row — Audience Builder is a real existing page; Budget
// Optimizer and A/B Strategy Testing have no backend anywhere in the app
// (no cross-channel budget-shifting logic, no creative-variant test runner),
// so they're honestly marked Coming Soon rather than wired to a fake action.
const TOOLS = [
  { key: 'audience', label: 'Audience Builder',   desc: 'Build lookalikes using CRM and intent ingestion.',        icon: Users,             route: '/audience-builder' },
  { key: 'budget',    label: 'Budget Optimizer',   desc: 'Shift budgets dynamically using cross-channel agents.',   icon: SlidersHorizontal, comingSoon: true },
  { key: 'ab',        label: 'A/B Strategy Testing', desc: 'Draft and test high-relevance creative variants.',      icon: FlaskConical,      comingSoon: true },
]

function money(n) { return `$${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}` }

export default function AdsCenterHubPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [platform, setPlatform] = useState('Meta')
  const [googleAcc, setGoogleAcc] = useState(null)
  const [googleMetrics, setGoogleMetrics] = useState(null)
  const [metaAcc, setMetaAcc] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.uid) return
    Promise.all([
      getGoogleAdsAccount(user.uid).catch(() => null),
      getMetaAdsAccount(user.uid).catch(() => null),
    ]).then(([gAcc, mAcc]) => {
      setGoogleAcc(gAcc)
      setMetaAcc(mAcc)
      if (gAcc) getGoogleAdsMetrics(user.uid).then(setGoogleMetrics).catch(() => {}).finally(() => setLoading(false))
      else setLoading(false)
    })
  }, [user?.uid])

  const anyConnected = !!googleAcc || !!metaAcc

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: "'Inter',sans-serif" }}>
      <AppSidebar />
      <div style={{ marginLeft: 'var(--evox-sidebar-w, 220px)', minHeight: '100vh', transition: 'margin-left 0.22s cubic-bezier(0.4,0,0.2,1)' }}>

        <StrategyTopBar
          title="Campaign Ads Hub"
          subtitle="Workspace: Live Bidding and Ingestion Platform"
          pillLabel={anyConnected ? 'Bidding Engine Live' : 'No Ad Accounts Connected'}
          action={{ label: 'Create Ad Campaign', icon: <Plus size={13} />, onClick: () => navigate('/meta-ads-boost') }}
        />

        <div style={{ padding: 40, maxWidth: 1300, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* ── KPI row — real Google Ads data only; honest when nothing's connected ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
            <Kpi label="Ad Spend"          value={googleMetrics ? money(googleMetrics.spend) : '—'}         hint={googleMetrics ? 'Google Ads · last 30d' : 'Connect Google Ads'} />
            <Kpi label="ROAS"              value={googleMetrics ? `${googleMetrics.roas.toFixed(1)}x` : '—'} hint={googleMetrics ? 'Google Ads' : 'Not tracked'} />
            <Kpi label="Total Impressions" value={googleMetrics ? googleMetrics.impressions.toLocaleString() : '—'} hint={googleMetrics ? 'Google Ads' : 'Not tracked'} />
            <Kpi label="Conversions"       value={googleMetrics ? googleMetrics.conversions.toLocaleString() : '—'} hint={googleMetrics ? 'Google Ads' : 'Not tracked'} />
          </div>

          {/* ── Platform tabs + campaign table ── */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                {PLATFORMS.map(p => (
                  <button key={p} onClick={() => setPlatform(p)} style={{
                    padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    fontFamily: "'Geist','Inter',sans-serif",
                    background: platform === p ? GOLD : CARD2,
                    border: `1px solid ${platform === p ? GOLD : BORDER}`,
                    color: platform === p ? '#0A0A0F' : TEXT2,
                  }}>{p}</button>
                ))}
              </div>
              <div style={{ fontSize: 11, color: TEXT3 }}>{[googleAcc && 'Google', metaAcc && 'Meta'].filter(Boolean).length} of 3 platforms connected</div>
            </div>

            {platform === 'Google' && (
              googleMetrics && (googleMetrics.campaigns || []).length > 0 ? (
                <CampaignTable rows={googleMetrics.campaigns.map(c => ({
                  platform: 'Google Ads', name: c.name || c.campaignName || 'Untitled Campaign',
                  spend: money(c.spend ?? c.cost ?? 0), roas: `${Number(c.roas ?? 0).toFixed(1)}x`, status: c.status || 'active',
                }))} />
              ) : (
                <EmptyRow text={googleAcc ? 'No active Google Ads campaigns found.' : 'Google Ads is not connected — connect it in Integrations to see live campaign data.'} />
              )
            )}

            {platform === 'Meta' && (
              metaAcc ? (
                <EmptyRow text="Meta Ads is connected. Live spend/ROAS metrics aren't available yet — use Create Ad Campaign to launch and manage boosts." />
              ) : (
                <EmptyRow text="Meta Ads is not connected — connect it in Integrations, or use Create Ad Campaign to get started." />
              )
            )}

            {platform === 'LinkedIn' && (
              <EmptyRow text="LinkedIn Ads isn't integrated yet — no campaign data source is connected for this platform." />
            )}
          </div>

          {/* ── Budget Optimization & Creative Tools ── */}
          <div>
            <div style={{ fontFamily: "'Outfit','Inter',sans-serif", fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 16 }}>Budget Optimization &amp; Creative Tools</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
              {TOOLS.map(t => (
                <ToolCard key={t.key} tool={t} onClick={() => t.route && navigate(t.route)} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Kpi({ label, value, hint }) {
  return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 18 }}>
      <div style={{ fontSize: 11, color: TEXT2, marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', fontFamily: "'Outfit','Inter',sans-serif" }}>{value}</div>
      <div style={{ fontSize: 11, color: TEXT3, marginTop: 4 }}>{hint}</div>
    </div>
  )
}

function CampaignTable({ rows }) {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1fr 1fr', gap: 12, padding: '8px 12px', fontSize: 10, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        <span>Platform</span><span>Campaign Name</span><span>Budget Spend</span><span>Current ROAS</span><span>Status</span>
      </div>
      {rows.map((r, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1fr 1fr', gap: 12, padding: '12px', background: CARD2, borderRadius: 8, marginTop: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: GOLD }}>{r.platform}</span>
          <span style={{ fontSize: 13, color: '#fff' }}>{r.name}</span>
          <span style={{ fontSize: 13, color: '#fff' }}>{r.spend}</span>
          <span style={{ fontSize: 13, color: GREEN, fontWeight: 700 }}>{r.roas}</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: GOLD, background: GDIM, border: `1px solid ${GBORD}`, borderRadius: 100, padding: '3px 10px', textAlign: 'center', textTransform: 'capitalize' }}>{r.status}</span>
        </div>
      ))}
    </div>
  )
}

function EmptyRow({ text }) {
  return (
    <div style={{ padding: '28px 12px', textAlign: 'center', color: TEXT3, fontSize: 13 }}>{text}</div>
  )
}

function ToolCard({ tool, onClick }) {
  const [hov, setHov] = useState(false)
  const Icon = tool.icon
  const disabled = tool.comingSoon
  return (
    <div
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: CARD, border: `1px solid ${hov && !disabled ? '#BE954A55' : BORDER}`, borderRadius: 14,
        padding: 18, cursor: disabled ? 'default' : 'pointer', transition: 'all 0.18s',
        opacity: disabled ? 0.6 : 1, display: 'flex', flexDirection: 'column', gap: 10,
      }}
    >
      <div style={{ width: 36, height: 36, borderRadius: 8, background: '#BE954A1A', border: '1px solid #BE954A40', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#BE954A' }}>
        <Icon size={16} />
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: GOLD }}>{tool.label}</div>
      <div style={{ fontSize: 11, color: TEXT2, lineHeight: 1.5 }}>{tool.desc}</div>
      {disabled && <div style={{ fontSize: 10, fontWeight: 700, color: TEXT3 }}>Coming Soon</div>}
    </div>
  )
}
