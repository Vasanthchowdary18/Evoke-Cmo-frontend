import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Link2, TrendingUp, TrendingDown } from 'lucide-react'
import AppSidebar from '../components/AppSidebar.jsx'
import StrategyTopBar from '../components/StrategyTopBar.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { useRequireAuth } from '../hooks/useRequireAuth'
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import { db } from '../firebase'
import { getGoogleAdsAccount, getGoogleAdsMetrics } from '../services/googleAdsService'
import { getMetaAdsAccount } from '../services/metaAdsService'

const BG     = '#0A0A0F'
const CARD   = '#111118'
const CARD2  = '#1A1A24'
const GOLD   = '#c8973e'
const GDIM   = 'rgba(200,151,62,0.1)'
const GBORD  = 'rgba(200,151,62,0.22)'
const TEXT2  = '#9b9bb0'
const TEXT3  = 'rgba(240,235,224,0.26)'
const BORDER = '#2A2A3A'
const GREEN  = '#10b981'

const TYPE_LABELS = {
  event: 'Event', product: 'Product', brand: 'Brand', growth_strategy: 'Growth',
  content_calendar: 'Content', email_drip: 'Email', influencer: 'Influence',
  seo_blog: 'SEO', analytics_report: 'Analytics', sales_enablement: 'Sales',
  marketplace: 'Marketplace', funnel_cro: 'CRO', competitive_intel: 'Intel',
}

const STATUS_META = {
  Active:    { color: GREEN,  bg: 'rgba(16,185,129,0.1)' },
  Draft:     { color: '#9b9bb0', bg: '#2A2A3A' },
  Completed: { color: GOLD,   bg: 'rgba(190,149,74,0.1)' },
}

export default function CampaignPerformancePage() {
  const { campaignId } = useParams()
  const navigate = useNavigate()
  const { authReady } = useRequireAuth()
  const { user } = useAuth()

  const [items, setItems]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [googleConnected, setGoogleConnected] = useState(false)
  const [metaConnected, setMetaConnected]     = useState(false)
  const [metrics, setMetrics]   = useState(null)
  const [metricsLoading, setMetricsLoading] = useState(true)

  useEffect(() => {
    if (!user?.uid || !campaignId) return
    const q = query(
      collection(db, 'content_items'),
      where('userId', '==', user.uid),
      where('campaignId', '==', campaignId),
      orderBy('createdAt', 'desc'),
      limit(100)
    )
    getDocs(q).then(snap => {
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [user?.uid, campaignId])

  useEffect(() => {
    if (!user?.uid) return
    Promise.all([getGoogleAdsAccount(user.uid), getMetaAdsAccount(user.uid)])
      .then(([g, m]) => { setGoogleConnected(!!g); setMetaConnected(!!m) })
      .catch(() => {})
    getGoogleAdsMetrics(user.uid)
      .then(m => setMetrics(m))
      .catch(() => setMetrics(null))
      .finally(() => setMetricsLoading(false))
  }, [user?.uid])

  const campaign = useMemo(() => {
    if (items.length === 0) return null
    const statuses = items.map(i => i.status)
    const allPublished = statuses.every(s => s === 'published')
    const anyLive = statuses.some(s => ['published', 'scheduled'].includes(s))
    const status = allPublished ? 'Completed' : anyLive ? 'Active' : 'Draft'
    const createdAt = items.reduce((latest, i) => {
      const ms = i.createdAt?.toMillis?.() || 0
      return ms > (latest?.toMillis?.() || 0) ? i.createdAt : latest
    }, null)
    return {
      name: items[0].campaignName || 'Untitled Campaign',
      type: items[0].campaignType || items[0].type || 'other',
      status, createdAt, itemCount: items.length,
    }
  }, [items])

  const hasGoogleMetrics = googleConnected && metrics
  const insights = useMemo(() => {
    if (!hasGoogleMetrics) return []
    const list = []
    if (metrics.ctr > 0 && metrics.ctr < 1) {
      list.push({ status: 'Suggested', title: 'CTR Below 1%', desc: `Your Google Ads CTR is ${metrics.ctr.toFixed(2)}% over the last 30 days — consider refreshing ad creative or tightening keyword targeting.` })
    }
    if (metrics.conversions === 0 && metrics.clicks > 0) {
      list.push({ status: 'Suggested', title: 'No Conversions Yet', desc: `${metrics.clicks} clicks recorded with 0 conversions — check your landing page or conversion tracking setup.` })
    }
    if (metrics.roas > 0 && metrics.roas < 1) {
      list.push({ status: 'Suggested', title: 'ROAS Below Breakeven', desc: `Current ROAS is ${metrics.roas.toFixed(1)}x — spend is outpacing attributed revenue on this account.` })
    }
    return list
  }, [hasGoogleMetrics, metrics])

  if (!authReady || loading) return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, border: `2px solid ${GOLD}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
    </div>
  )

  if (!campaign) return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: "'Inter',sans-serif" }}>
      <AppSidebar />
      <div style={{ marginLeft: 'var(--evox-sidebar-w, 220px)', minHeight: '100vh' }}>
        <StrategyTopBar title="Campaign Performance" subtitle="This campaign could not be found." />
        <div style={{ padding: 40, maxWidth: 800, margin: '0 auto' }}>
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 40, textAlign: 'center' }}>
            <div style={{ color: TEXT2, fontSize: 13, marginBottom: 16 }}>No campaign data found for this ID.</div>
            <button onClick={() => navigate('/campaigns')} style={{ padding: '10px 20px', background: GOLD, border: 'none', borderRadius: 8, color: '#0A0A0F', fontWeight: 700, cursor: 'pointer' }}>Back to Campaigns</button>
          </div>
        </div>
      </div>
    </div>
  )

  const meta = STATUS_META[campaign.status]

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: "'Inter',sans-serif" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <AppSidebar />
      <div style={{ marginLeft: 'var(--evox-sidebar-w, 220px)', minHeight: '100vh', transition: 'margin-left 0.22s cubic-bezier(0.4,0,0.2,1)' }}>

        <StrategyTopBar
          title={`${campaign.name} Performance`}
          subtitle="Real-time multi-agent campaign ledger audit."
        />

        <div style={{ padding: 40, maxWidth: 1300, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* ── Status row ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ padding: '4px 12px', background: meta.bg, border: `1px solid ${meta.color}40`, borderRadius: 100 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: meta.color }}>{campaign.status}</span>
              </div>
              <span style={{ fontSize: 12, color: TEXT2 }}>
                {TYPE_LABELS[campaign.type] || campaign.type} campaign · {campaign.itemCount} generated asset{campaign.itemCount === 1 ? '' : 's'}
              </span>
            </div>
            <button onClick={() => navigate(googleConnected ? '/execution' : '/connect-accounts')} style={{ padding: '10px 20px', background: GOLD, border: 'none', borderRadius: 8, color: '#0A0A0F', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit','Inter',sans-serif" }}>
              {googleConnected || metaConnected ? 'Optimize with Evoke AI' : 'Connect Ad Accounts'}
            </button>
          </div>

          {/* ── KPI cards ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 16 }}>
            <KpiCard label="Impressions" value={hasGoogleMetrics ? formatCompact(metrics.impressions) : '—'} sub={hasGoogleMetrics ? 'Google Ads · 30d' : 'Connect Google Ads'} />
            <KpiCard label="Clicks & CTR" value={hasGoogleMetrics ? `${formatCompact(metrics.clicks)} (${metrics.ctr.toFixed(2)}%)` : '—'} sub={hasGoogleMetrics ? 'Google Ads · 30d' : 'Not tracked'} />
            <KpiCard label="Conversions" value={hasGoogleMetrics ? metrics.conversions.toLocaleString() : '—'} sub={hasGoogleMetrics ? 'Google Ads · 30d' : 'Not tracked'} />
            <KpiCard label="Ad Spend" value={hasGoogleMetrics ? `$${metrics.spend.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '—'} sub={hasGoogleMetrics ? 'Google Ads · 30d' : 'Not tracked'} />
            <KpiCard label="ROAS Outcome" value={hasGoogleMetrics && metrics.roas > 0 ? `${metrics.roas.toFixed(1)}x` : '—'} sub={hasGoogleMetrics ? 'Google Ads · 30d' : 'Not tracked'} gold />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24, alignItems: 'start' }}>

            {/* ── LEFT: channel breakdown ── */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ fontFamily: "'Outfit','Inter',sans-serif", fontSize: 16, fontWeight: 700, color: '#fff' }}>Channel Connection & Spend</div>

              {!metricsLoading && !hasGoogleMetrics && !metaConnected ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '30px 20px', textAlign: 'center' }}>
                  <Link2 size={22} color={TEXT2} />
                  <div style={{ fontSize: 13, color: TEXT2, maxWidth: 340, lineHeight: 1.6 }}>
                    No ad accounts connected yet — connect Google Ads or Meta Ads to see real spend, impressions, and ROAS here instead of placeholders.
                  </div>
                  <button onClick={() => navigate('/connect-accounts')} style={{ padding: '8px 16px', background: GDIM, border: `1px solid ${GBORD}`, borderRadius: 8, color: GOLD, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    Connect Accounts
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <ChannelBar label="Google Ads" pct={googleConnected ? 100 : 0} connected={googleConnected} value={hasGoogleMetrics ? `$${metrics.spend.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : null} />
                  <ChannelBar label="Meta Network" pct={0} connected={metaConnected} value={null} note={metaConnected ? 'Connected — spend metrics not yet available' : null} />
                  <ChannelBar label="LinkedIn Network" pct={0} connected={false} value={null} />
                  <ChannelBar label="Sovereign Email" pct={0} connected={false} value={null} />
                </div>
              )}
            </motion.div>

            {/* ── RIGHT: Evoke Optimization Logs ── */}
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 }}
              style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ fontFamily: "'Outfit','Inter',sans-serif", fontSize: 16, fontWeight: 700, color: '#fff' }}>Evoke Optimization Logs</div>
              {insights.length === 0 ? (
                <div style={{ fontSize: 12, color: TEXT3, lineHeight: 1.6 }}>
                  {hasGoogleMetrics
                    ? 'No issues detected in your connected Google Ads account right now.'
                    : 'Connect an ad account to get real optimization suggestions here, derived from your actual campaign metrics.'}
                </div>
              ) : (
                insights.map((ins, i) => (
                  <div key={i} style={{ background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: GOLD, textTransform: 'uppercase' }}>Evoke Strategy Agent</span>
                      <span style={{ fontSize: 9, fontWeight: 700, color: GOLD, background: GDIM, border: `1px solid ${GBORD}`, borderRadius: 100, padding: '2px 8px' }}>{ins.status}</span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{ins.title}</div>
                    <div style={{ fontSize: 12, color: TEXT2, lineHeight: 1.5 }}>{ins.desc}</div>
                  </div>
                ))
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}

function KpiCard({ label, value, sub, gold }) {
  return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ fontSize: 10, color: TEXT2, textTransform: 'uppercase', letterSpacing: '0.03em' }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: gold ? GOLD : '#fff', fontFamily: "'Outfit','Inter',sans-serif" }}>{value}</div>
      <div style={{ fontSize: 11, color: value === '—' ? TEXT3 : GREEN }}>{sub}</div>
    </div>
  )
}

function ChannelBar({ label, pct, connected, value, note }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
        <span style={{ color: connected ? '#fff' : TEXT2 }}>{label}{!connected && !note && <span style={{ color: TEXT3 }}> · not connected</span>}</span>
        <span style={{ color: connected ? GOLD : TEXT3, fontWeight: 700 }}>{value || (connected ? '—' : '')}</span>
      </div>
      <div style={{ background: BORDER, height: 6, borderRadius: 100, overflow: 'hidden', width: '100%' }}>
        <div style={{ background: connected ? GOLD : 'transparent', height: '100%', width: `${pct}%` }} />
      </div>
      {note && <div style={{ fontSize: 11, color: TEXT3 }}>{note}</div>}
    </div>
  )
}

function formatCompact(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}
