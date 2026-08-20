import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, ChevronDown } from 'lucide-react'
import AppSidebar from '../components/AppSidebar.jsx'
import StrategyTopBar from '../components/StrategyTopBar.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { useRequireAuth } from '../hooks/useRequireAuth'
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import { db } from '../firebase'

const BG     = '#0A0A0F'
const CARD   = '#111118'
const GOLD   = '#c8973e'
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

function groupCampaigns(items) {
  const groups = {}
  items.forEach(item => {
    const key = item.campaignId || item.id
    if (!groups[key]) {
      groups[key] = {
        campaignId: key,
        campaignName: item.campaignName || 'Untitled Campaign',
        campaignType: item.campaignType || item.type || 'other',
        createdAt: item.createdAt,
        statuses: [],
      }
    }
    groups[key].statuses.push(item.status)
    const itemMs = item.createdAt?.toMillis?.() || 0
    const curMs  = groups[key].createdAt?.toMillis?.() || 0
    if (itemMs > curMs) groups[key].createdAt = item.createdAt
  })

  return Object.values(groups).map(c => {
    const allPublished = c.statuses.length > 0 && c.statuses.every(s => s === 'published')
    const anyLive       = c.statuses.some(s => ['published', 'scheduled'].includes(s))
    const anyApproved    = c.statuses.some(s => s === 'approved')
    const status   = allPublished ? 'Completed' : anyLive ? 'Active' : 'Draft'
    const progress = allPublished ? 100 : anyLive ? 66 : anyApproved ? 33 : 10
    return { ...c, status, progress }
  }).sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0))
}

export default function CampaignsPage() {
  const navigate = useNavigate()
  const { authReady } = useRequireAuth()
  const { user } = useAuth()

  const [items, setItems]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [statusFilter, setStatusFilter] = useState('All')
  const [typeFilter, setTypeFilter]     = useState('All')

  useEffect(() => {
    if (!user?.uid) return
    const q = query(
      collection(db, 'content_items'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(300)
    )
    getDocs(q).then(snap => {
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [user?.uid])

  const campaigns = useMemo(() => groupCampaigns(items), [items])

  const availableTypes = useMemo(
    () => Array.from(new Set(campaigns.map(c => c.campaignType))),
    [campaigns]
  )

  const filtered = campaigns.filter(c =>
    (statusFilter === 'All' || c.status === statusFilter) &&
    (typeFilter === 'All' || c.campaignType === typeFilter)
  )

  const activeCount    = campaigns.filter(c => c.status === 'Active').length
  const draftCount     = campaigns.filter(c => c.status === 'Draft').length
  const completedCount = campaigns.filter(c => c.status === 'Completed').length

  if (!authReady || loading) return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, border: `2px solid ${GOLD}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: "'Inter',sans-serif" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <AppSidebar />
      <div style={{ marginLeft: 'var(--evox-sidebar-w, 220px)', minHeight: '100vh', transition: 'margin-left 0.22s cubic-bezier(0.4,0,0.2,1)' }}>

        <StrategyTopBar
          title="Campaign Command Center"
          subtitle="Directing unified marketing assets and real-time execution flows."
        />

        <div style={{ padding: 40, maxWidth: 1300, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* ── KPI mini-cards + New Campaign ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <MiniKpi label="Active Campaigns" value={`${activeCount} Active`} />
              <MiniKpi label="Draft Sprints" value={`${draftCount} Draft${draftCount === 1 ? '' : 's'}`} />
              <MiniKpi label="Completed" value={`${completedCount} Total`} />
              <MiniKpi label="Tracked Campaigns" value={`${campaigns.length} Total`} gold />
            </div>
            <button onClick={() => navigate('/new-campaign')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 24px', background: GOLD, border: 'none', borderRadius: 8, color: '#0A0A0F', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit','Inter',sans-serif", whiteSpace: 'nowrap' }}>
              <Plus size={14} /> New Campaign
            </button>
          </div>

          {/* ── Filter bar (real, functional) ── */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16, flexWrap: 'wrap' }}>
            <FilterSelect
              value={statusFilter} onChange={setStatusFilter}
              options={['All', 'Active', 'Draft', 'Completed']}
              prefix="Status"
            />
            <FilterSelect
              value={typeFilter} onChange={setTypeFilter}
              options={['All', ...availableTypes]}
              labels={TYPE_LABELS}
              prefix="Type"
            />
          </div>

          {/* ── Campaign list ── */}
          {filtered.length === 0 ? (
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '60px 40px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <div style={{ fontFamily: "'Outfit','Inter',sans-serif", fontSize: 18, fontWeight: 700, color: '#fff' }}>
                {campaigns.length === 0 ? 'No campaigns yet' : 'No campaigns match these filters'}
              </div>
              <div style={{ fontSize: 13, color: TEXT2, maxWidth: 420, lineHeight: 1.6 }}>
                {campaigns.length === 0
                  ? 'Launch your first campaign — Events, Products, Brand, and more — and it will show up here.'
                  : 'Try a different status or type filter.'}
              </div>
              {campaigns.length === 0 && (
                <button onClick={() => navigate('/campaign-hub')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: GOLD, border: 'none', borderRadius: 8, color: '#0A0A0F', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit','Inter',sans-serif" }}>
                  <Plus size={14} /> New Campaign
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filtered.map((c, i) => (
                <CampaignRow key={c.campaignId} campaign={c} i={i} onReview={() => navigate(`/campaign-performance/${c.campaignId}`)} />
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

function MiniKpi({ label, value, gold }) {
  return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column', gap: 4, minWidth: 140 }}>
      <div style={{ fontSize: 10, color: TEXT2, fontFamily: "'Geist','Inter',sans-serif" }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: gold ? GOLD : '#fff', fontFamily: "'Outfit','Inter',sans-serif" }}>{value}</div>
    </div>
  )
}

function FilterSelect({ value, onChange, options, prefix, labels }) {
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8, border: `1px solid ${BORDER}`, borderRadius: 6, padding: '6px 12px' }}>
      <span style={{ fontSize: 12, color: TEXT2, fontFamily: "'Geist','Inter',sans-serif", whiteSpace: 'nowrap' }}>{prefix}:</span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: 12, fontFamily: "'Geist','Inter',sans-serif", cursor: 'pointer', appearance: 'none', paddingRight: 16 }}
      >
        {options.map(o => (
          <option key={o} value={o} style={{ background: CARD, color: '#fff' }}>{labels?.[o] || o}</option>
        ))}
      </select>
      <ChevronDown size={12} color={TEXT2} style={{ position: 'absolute', right: 10, pointerEvents: 'none' }} />
    </div>
  )
}

function CampaignRow({ campaign, i, onReview }) {
  const meta = STATUS_META[campaign.status]
  const typeLabel = TYPE_LABELS[campaign.campaignType] || campaign.campaignType.replace(/_/g, ' ')
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
      style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 220, flex: '1 1 220px' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <Tag color={GOLD} label={typeLabel} />
          <Tag color={meta.color} bg={meta.bg} label={campaign.status} />
        </div>
        <div style={{ fontFamily: "'Outfit','Inter',sans-serif", fontSize: 16, fontWeight: 700, color: '#fff' }}>{campaign.campaignName}</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: 180, flexShrink: 0 }}>
        <div style={{ fontSize: 11, color: TEXT2 }}>Campaign Lifecycle Progress</div>
        <div style={{ background: BORDER, height: 6, borderRadius: 100, overflow: 'hidden', width: '100%' }}>
          <div style={{ background: GOLD, height: '100%', width: `${campaign.progress}%` }} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 32, alignItems: 'center', flexShrink: 0 }}>
        <StatCol label="Allocated Budget" value="—" />
        <StatCol label="Impressions" value="—" />
        <StatCol label="Performance Ingest" value="Not tracked" color={TEXT3} />
        <button onClick={onReview} style={{ padding: '8px 16px', background: '#1a1a24', border: `1px solid ${BORDER}`, borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'Geist','Inter',sans-serif", whiteSpace: 'nowrap' }}>
          Analyze
        </button>
      </div>
    </motion.div>
  )
}

function StatCol({ label, value, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, whiteSpace: 'nowrap' }}>
      <div style={{ fontSize: 11, color: TEXT2 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: color || '#fff', fontFamily: "'Outfit','Inter',sans-serif" }}>{value}</div>
    </div>
  )
}

function Tag({ color, bg, label }) {
  return (
    <div style={{ padding: '2px 8px', background: bg || `${color}1A`, borderRadius: 4 }}>
      <span style={{ fontSize: 10, fontWeight: 700, color, fontFamily: "'Geist','Inter',sans-serif" }}>{label}</span>
    </div>
  )
}
