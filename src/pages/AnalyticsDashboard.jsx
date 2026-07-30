import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import JourneyFooter from '../components/JourneyFooter.jsx'
import {
  BarChart2, Zap, Link2, Calendar, Clock, ArrowRight,
  Loader2, RefreshCw, Package, Mail, Globe, Megaphone,
  Brain, Activity, PieChart, Briefcase, Store, Rocket,
  Target, BookOpen, ChevronRight, Instagram, MessageSquare,
  CheckCircle, MousePointer, Eye, DollarSign, Percent, Award,
  Sparkles, TrendingUp, Plus, Users, ThumbsUp, Share2, Heart,
  AlertCircle,
} from 'lucide-react'
import AppSidebar from '../components/AppSidebar.jsx'
import { useRequireAuth } from '../hooks/useRequireAuth'
import { useAuth } from '../hooks/useAuth.js'
import { getOrCreateUser } from '../services/userService'
import { getGoogleAdsAccount, getGoogleAdsMetrics } from '../services/googleAdsService'

/* ── Design tokens matching Figma ── */
const BG      = '#0d0d0d'
const CARD    = '#151515'
const CARD2   = '#1a1a1a'
const BORDER  = 'rgba(255,255,255,0.06)'
const TEXT    = '#f0ebe0'
const TEXT2   = 'rgba(240,235,224,0.5)'
const TEXT3   = 'rgba(240,235,224,0.25)'
const GOLD    = '#c8973e'

const TYPE_ICONS = {
  event:            <Calendar size={16} />,
  product:          <Package size={16} />,
  brand:            <Zap size={16} />,
  growth_strategy:  <Rocket size={16} />,
  content_calendar: <BookOpen size={16} />,
  seo_blog:         <Globe size={16} />,
  email_drip:       <Mail size={16} />,
  influencer:       <Users size={16} />,
  analytics_report: <BarChart2 size={16} />,
  sales_enablement: <Briefcase size={16} />,
  event_full:       <Megaphone size={16} />,
  marketplace:      <Store size={16} />,
}

const TYPE_COLORS = {
  event:            { color: '#f97316', label: 'Event' },
  product:          { color: '#a855f7', label: 'Product' },
  brand:            { color: '#6366f1', label: 'Brand Strategy' },
  growth_strategy:  { color: '#10b981', label: 'Growth Strategy' },
  content_calendar: { color: '#3b82f6', label: 'Content Calendar' },
  seo_blog:         { color: '#14b8a6', label: 'SEO & Blog' },
  email_drip:       { color: '#f59e0b', label: 'Email Drip' },
  influencer:       { color: '#ec4899', label: 'Influencer & PR' },
  analytics_report: { color: '#f97316', label: 'Analytics' },
  sales_enablement: { color: '#6366f1', label: 'Sales' },
  event_full:       { color: '#c8973e', label: 'ELEVATE Event' },
  marketplace:      { color: '#14b8a6', label: 'Marketplace' },
}

const PLATFORM_META = {
  facebook:  { color: '#1877f2', label: 'Facebook' },
  instagram: { color: '#e1306c', label: 'Instagram' },
  linkedin:  { color: '#0a66c2', label: 'LinkedIn' },
  whatsapp:  { color: '#25d366', label: 'WhatsApp' },
  twitter:   { color: '#e2e8f0', label: 'X / Twitter' },
  gmail:     { color: '#ea4335', label: 'Gmail' },
  'google-ads': { color: '#4285f4', label: 'Google Ads' },
  email:     { color: '#ea4335', label: 'Email' },
}

function timeAgo(iso) {
  const diff  = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 1)   return 'Just now'
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7)   return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

/* ── KPI Card ── */
function KpiCard({ icon, label, value, sub, trend, iconColor }) {
  return (
    <div style={{
      background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14,
      padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: `${iconColor}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: iconColor,
        }}>
          {icon}
        </div>
        {trend !== undefined && (
          <span style={{
            fontSize: 11, fontWeight: 700,
            color: '#10b981',
            background: 'rgba(16,185,129,0.12)',
            border: '1px solid rgba(16,185,129,0.2)',
            padding: '2px 8px', borderRadius: 100,
          }}>
            +{trend}%
          </span>
        )}
      </div>
      <div style={{ fontSize: 30, fontWeight: 800, color: TEXT, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 6 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, color: TEXT, marginBottom: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: TEXT3 }}>{sub}</div>}
    </div>
  )
}

/* ── Campaign Type Bar Row ── */
function TypeBarRow({ icon, label, count, max, color }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ color: TEXT2, fontSize: 13 }}>→</span>
        <span style={{ color: color, display: 'flex', alignItems: 'center' }}>{icon}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>{label}</span>
        <span style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 700, color: color }}>{count}</span>
      </div>
      <div style={{ height: 5, background: 'rgba(255,255,255,0.05)', borderRadius: 100, overflow: 'hidden' }}>
        <div style={{
          width: `${pct}%`, height: '100%', borderRadius: 100,
          background: color, transition: 'width 0.8s ease',
        }} />
      </div>
    </div>
  )
}

/* ── Platform Bar Row ── */
function PlatformBarRow({ label, count, max, color }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
      <span style={{ color: TEXT2, fontSize: 13, flexShrink: 0 }}>→</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: TEXT, width: 90, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 100, overflow: 'hidden' }}>
        <div style={{
          width: `${pct}%`, height: '100%', borderRadius: 100,
          background: color, transition: 'width 0.8s ease',
        }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, color: color, width: 20, textAlign: 'right', flexShrink: 0 }}>{count}</span>
    </div>
  )
}

export default function AnalyticsDashboard() {
  const navigate = useNavigate()
  const { user, authReady } = useRequireAuth()
  const { user: authUser }  = useAuth()

  const [campaigns, setCampaigns]     = useState([])
  const [userData, setUserData]       = useState(null)
  const [loading, setLoading]         = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [gadsAccount, setGadsAccount] = useState(null)
  const [gadsMetrics, setGadsMetrics] = useState(null)
  const [gadsLoading, setGadsLoading] = useState(false)
  const [gadsError, setGadsError]     = useState('')
  const [fbInsights, setFbInsights]   = useState(null)
  const [fbPosts, setFbPosts]         = useState([])
  const [fbLoading, setFbLoading]     = useState(false)

  const loadFacebookInsights = async (pageId, pageAccessToken) => {
    if (!pageId || !pageAccessToken) return
    setFbLoading(true)
    try {
      const [insightsRes, postsRes] = await Promise.all([
        fetch(`https://graph.facebook.com/v21.0/${pageId}/insights?metric=page_impressions,page_engaged_users,page_post_engagements,page_fan_count&period=week&access_token=${pageAccessToken}`),
        fetch(`https://graph.facebook.com/v21.0/${pageId}/posts?fields=id,message,created_time,likes.summary(true),comments.summary(true),shares&limit=5&access_token=${pageAccessToken}`),
      ])
      const insightsData = await insightsRes.json()
      const postsData    = await postsRes.json()
      if (insightsData.data) {
        const metrics = {}
        insightsData.data.forEach(m => {
          const latest = m.values?.[m.values.length - 1]?.value
          metrics[m.name] = typeof latest === 'number' ? latest : 0
        })
        setFbInsights(metrics)
      }
      if (postsData.data) setFbPosts(postsData.data)
    } catch (e) { console.error('Facebook insights error', e) }
    finally { setFbLoading(false) }
  }

  const loadGoogleAds = async (uid) => {
    if (!uid) return
    setGadsLoading(true)
    setGadsError('')
    try {
      const acc = await getGoogleAdsAccount(uid)
      setGadsAccount(acc)
      if (acc) {
        const metrics = await getGoogleAdsMetrics(uid)
        if (metrics) setGadsMetrics(metrics)
      }
    } catch (e) {
      console.error('Google Ads error', e)
      setGadsError("Couldn't load Google Ads data — the connection may be down. Try refreshing, or reconnect the account.")
    }
    finally { setGadsLoading(false) }
  }

  const loadData = async () => {
    if (!user) return
    setLoading(true)
    try {
      const data = await getOrCreateUser(user.uid, user.displayName, user.email)
      setUserData(data)
    } catch (e) { console.error('Failed to load user data', e) }
    const stored = JSON.parse(localStorage.getItem(`evoke_campaigns_${user.uid}`) || '[]')
    setCampaigns(stored)
    setLastRefresh(new Date())
    setLoading(false)
  }

  useEffect(() => { if (authReady && user) loadData() }, [authReady, user])
  useEffect(() => { if (authUser) loadGoogleAds(authUser.uid) }, [authUser])
  useEffect(() => {
    const fb = userData?.socialAccounts?.facebook
    if (fb?.connected && fb.pageId && fb.pageAccessToken) {
      loadFacebookInsights(fb.pageId, fb.pageAccessToken)
    }
  }, [userData])

  if (!authReady || loading) return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 size={28} style={{ color: GOLD, animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  /* ── Derived stats ── */
  const totalCampaigns    = campaigns.length
  const tokenBalance      = userData?.tokenBalance ?? 0
  const socialAccounts    = userData?.socialAccounts || {}
  const connectedCount    = Object.values(socialAccounts).filter(a => a?.connected).length
  const oneWeekAgo        = Date.now() - 7 * 24 * 3600 * 1000
  const thisWeekCampaigns = campaigns.filter(c => new Date(c.date).getTime() > oneWeekAgo).length

  const platformUsage = {}
  campaigns.forEach(c => {
    ;(c.platforms || []).forEach(p => { platformUsage[p] = (platformUsage[p] || 0) + 1 })
  })
  const maxPlatformUse = Math.max(...Object.values(platformUsage), 1)

  const typeCount = {}
  campaigns.forEach(c => { typeCount[c.type] = (typeCount[c.type] || 0) + 1 })
  const topType    = Object.entries(typeCount).sort((a, b) => b[1] - a[1])[0]
  const maxTypeCount = Math.max(...Object.values(typeCount), 1)

  const recentCampaigns = [...campaigns]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 8)

  const trendPct = thisWeekCampaigns > 0
    ? Math.round((thisWeekCampaigns / Math.max(totalCampaigns - thisWeekCampaigns, 1)) * 100)
    : undefined

  return (
    <div style={{ minHeight: '100vh', background: BG, color: TEXT, fontFamily: "'Inter',sans-serif" }}>
      <AppSidebar />
      <div style={{ marginLeft: 'var(--evox-sidebar-w, 220px)', transition: 'margin-left 0.22s' }}>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '36px 24px 64px' }}>

        {/* ── Page header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <button onClick={() => navigate(-1)} style={{
                display: 'flex', alignItems: 'center', gap: 4,
                background: 'none', border: 'none', color: TEXT2, cursor: 'pointer',
                fontSize: 13, padding: 0, fontFamily: 'inherit',
              }}>
                ← Back
              </button>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '3px 12px', background: 'rgba(200,151,62,0.12)',
                border: '1px solid rgba(200,151,62,0.25)',
                borderRadius: 100, fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: '0.06em',
              }}>
                <BarChart2 size={10} /> ANALYTICS
              </div>
            </div>
            <p style={{ fontSize: 14, color: TEXT2, margin: 0 }}>
              All your campaign performance data in one place
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, color: TEXT3 }}>
              Last updated: {lastRefresh.toLocaleTimeString()}
            </span>
            <button onClick={loadData} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', background: CARD2,
              border: `1px solid ${BORDER}`, borderRadius: 8,
              color: TEXT, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              <RefreshCw size={13} /> Refresh
            </button>
            <button onClick={() => navigate('/campaign-hub')} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 18px',
              background: CARD2, border: `1px solid ${BORDER}`,
              borderRadius: 8, color: TEXT, fontSize: 12, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>
              <Plus size={13} /> New Campaign
            </button>
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 24 }}>
          <KpiCard icon={<BarChart2 size={16} />} iconColor="#818cf8"
            label="Total Campaigns" value={totalCampaigns} sub="All time" trend={trendPct} />
          <KpiCard icon={<Calendar size={16} />} iconColor="#10b981"
            label="This Week" value={thisWeekCampaigns} sub="Last 7 days" />
          <KpiCard icon={<Zap size={16} />} iconColor={tokenBalance > 0 ? GOLD : '#ef4444'}
            label="Tokens Left" value={tokenBalance} sub="Campaign credits" />
          <KpiCard icon={<Link2 size={16} />} iconColor="#22d3ee"
            label="Connected" value={connectedCount} sub="Social platforms" />
          <KpiCard icon={<Rocket size={16} />} iconColor="#f59e0b"
            label="Top Campaign"
            value={topType ? (TYPE_COLORS[topType[0]]?.label || '—') : '—'} />
          <KpiCard icon={<Sparkles size={16} />} iconColor="#ec4899"
            label="Platforms Used"
            value={Object.keys(platformUsage).length}
            sub="Distinct channels" />
        </div>

        {/* ── Two column ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

          {/* Campaign Types */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '20px 20px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <RefreshCw size={14} style={{ color: GOLD }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>Campaign Types</span>
              <span style={{ marginLeft: 'auto', fontSize: 12, color: TEXT3 }}>{totalCampaigns} total</span>
            </div>
            {totalCampaigns === 0 ? (
              <div style={{ textAlign: 'center', padding: '28px 0', color: TEXT3, fontSize: 13 }}>
                No campaigns yet — launch one to see data
              </div>
            ) : (
              Object.entries(typeCount)
                .sort((a, b) => b[1] - a[1])
                .map(([type, count]) => {
                  const meta = TYPE_COLORS[type] || { color: '#888', label: type }
                  return (
                    <TypeBarRow
                      key={type}
                      icon={TYPE_ICONS[type] || <Zap size={14} />}
                      label={meta.label}
                      count={count}
                      max={maxTypeCount}
                      color={meta.color}
                    />
                  )
                })
            )}
          </div>

          {/* Platform Usage */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '20px 20px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Globe size={14} style={{ color: GOLD }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>Platform Usage</span>
              <span style={{ marginLeft: 'auto', fontSize: 12, color: TEXT3 }}>by campaigns posted</span>
            </div>

            {/* Connected accounts pills */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: TEXT3, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
                Connected Accounts
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {Object.entries(socialAccounts).map(([key, val]) => {
                  const meta = PLATFORM_META[key]
                  if (!meta) return null
                  const connected = val?.connected
                  return (
                    <div key={key} style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '3px 10px', borderRadius: 100,
                      background: connected ? `${meta.color}18` : 'transparent',
                      border: `1px solid ${connected ? meta.color + '40' : BORDER}`,
                      fontSize: 11, fontWeight: 600,
                      color: connected ? meta.color : TEXT3,
                    }}>
                      {connected
                        ? <CheckCircle size={9} />
                        : <div style={{ width: 9, height: 9, borderRadius: '50%', border: `1px solid ${TEXT3}` }} />}
                      {meta.label}
                    </div>
                  )
                })}
                {connectedCount === 0 && (
                  <button onClick={() => navigate('/connect-accounts')} style={{
                    padding: '3px 12px', borderRadius: 100,
                    background: 'rgba(200,151,62,0.1)', border: '1px solid rgba(200,151,62,0.25)',
                    fontSize: 11, fontWeight: 600, color: GOLD, cursor: 'pointer', fontFamily: 'inherit',
                  }}>
                    + Connect
                  </button>
                )}
              </div>
            </div>

            {/* Platform bars */}
            {Object.keys(platformUsage).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '16px 0', color: TEXT3, fontSize: 13 }}>
                Post via campaigns to see data here
              </div>
            ) : (
              Object.entries(platformUsage)
                .sort((a, b) => b[1] - a[1])
                .map(([key, count]) => {
                  const meta = PLATFORM_META[key] || { color: '#888', label: key }
                  return (
                    <PlatformBarRow
                      key={key}
                      label={meta.label}
                      count={count}
                      max={maxPlatformUse}
                      color={meta.color}
                    />
                  )
                })
            )}
          </div>
        </div>

        {/* ── Google Ads ── */}
        {(gadsAccount || gadsLoading) && (
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '20px', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <svg width="15" height="15" viewBox="0 0 48 48">
                <path fill="#fbbc05" d="M5.6 30.3 15 14a4.5 4.5 0 0 1 7.8 4.5L13.4 34.8A4.5 4.5 0 0 1 5.6 30.3z"/>
                <path fill="#4285f4" d="M24 38.5h-9a4.5 4.5 0 0 1 0-9h18a4.5 4.5 0 0 1 0 9H24z"/>
                <path fill="#34a853" d="M33 14a4.5 4.5 0 0 0-7.8 4.5l9.4 16.3a4.5 4.5 0 1 0 7.8-4.5L33 14z"/>
              </svg>
              <span style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>Google Ads Performance</span>
              <span style={{ marginLeft: 'auto', fontSize: 12, color: TEXT3 }}>Last 30 days</span>
            </div>
            {gadsLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: TEXT3, fontSize: 13 }}>
                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Loading…
              </div>
            ) : gadsMetrics ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
                {[
                  { label: 'Impressions', value: (gadsMetrics.impressions ?? 0).toLocaleString(), icon: <Eye size={14} />, color: '#818cf8' },
                  { label: 'Clicks',      value: (gadsMetrics.clicks ?? 0).toLocaleString(),      icon: <MousePointer size={14} />, color: '#22d3ee' },
                  { label: 'CTR',         value: gadsMetrics.ctr != null ? `${Number(gadsMetrics.ctr).toFixed(2)}%` : '—', icon: <Percent size={14} />, color: '#10b981' },
                  { label: 'Spend',       value: gadsMetrics.spend != null ? `$${Number(gadsMetrics.spend).toFixed(2)}` : '—', icon: <DollarSign size={14} />, color: GOLD },
                  { label: 'Conversions', value: (gadsMetrics.conversions ?? 0).toLocaleString(), icon: <Award size={14} />, color: '#f59e0b' },
                  { label: 'ROAS',        value: gadsMetrics.roas != null ? `${Number(gadsMetrics.roas).toFixed(2)}x` : '—', icon: <TrendingUp size={14} />, color: '#34d399' },
                ].map(m => (
                  <div key={m.label} style={{
                    background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '12px 14px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: m.color }}>
                      {m.icon}
                      <span style={{ fontSize: 10, fontWeight: 700, color: TEXT3, letterSpacing: '0.05em' }}>{m.label.toUpperCase()}</span>
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: TEXT }}>{m.value}</div>
                  </div>
                ))}
              </div>
            ) : gadsError ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8 }}>
                <AlertCircle size={14} color="#ef4444" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 12.5, color: TEXT2 }}>{gadsError}</span>
              </div>
            ) : null}
          </div>
        )}

        {/* ── Facebook Page Insights ── */}
        {(userData?.socialAccounts?.facebook?.connected || fbLoading) && (
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '20px', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="#1877f2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              <span style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>Facebook Page Insights</span>
              {userData?.socialAccounts?.facebook?.pageName && (
                <span style={{ fontSize: 11, color: '#1877f2', background: 'rgba(24,119,242,0.1)', border: '1px solid rgba(24,119,242,0.2)', padding: '2px 8px', borderRadius: 100 }}>
                  {userData.socialAccounts.facebook.pageName}
                </span>
              )}
              <span style={{ marginLeft: 'auto', fontSize: 12, color: TEXT3 }}>Last 7 days</span>
            </div>

            {fbLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: TEXT3, fontSize: 13 }}>
                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Loading page insights…
              </div>
            ) : fbInsights ? (
              <>
                {/* Metrics row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10, marginBottom: 20 }}>
                  {[
                    { label: 'Page Reach',       value: (fbInsights.page_impressions ?? 0).toLocaleString(),      icon: <Eye size={14} />,      color: '#1877f2' },
                    { label: 'Engaged Users',     value: (fbInsights.page_engaged_users ?? 0).toLocaleString(),    icon: <Users size={14} />,    color: '#22d3ee' },
                    { label: 'Post Engagements',  value: (fbInsights.page_post_engagements ?? 0).toLocaleString(), icon: <ThumbsUp size={14} />, color: '#10b981' },
                    { label: 'Page Fans',         value: (fbInsights.page_fan_count ?? 0).toLocaleString(),        icon: <Heart size={14} />,    color: '#ec4899' },
                  ].map(m => (
                    <div key={m.label} style={{ background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: m.color }}>
                        {m.icon}
                        <span style={{ fontSize: 10, fontWeight: 700, color: TEXT3, letterSpacing: '0.05em' }}>{m.label.toUpperCase()}</span>
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: TEXT }}>{m.value}</div>
                    </div>
                  ))}
                </div>

                {/* Recent posts */}
                {fbPosts.length > 0 && (
                  <>
                    <div style={{ fontSize: 11, fontWeight: 700, color: TEXT3, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
                      Recent Posts
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                      {fbPosts.map((post, i) => (
                        <div key={post.id} style={{
                          display: 'flex', alignItems: 'center', gap: 14, padding: '10px 8px',
                          borderBottom: i < fbPosts.length - 1 ? `1px solid ${BORDER}` : 'none',
                        }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, color: TEXT, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {post.message ? post.message.slice(0, 80) + (post.message.length > 80 ? '…' : '') : '(No caption)'}
                            </div>
                            <div style={{ fontSize: 11, color: TEXT3, marginTop: 3 }}>
                              {timeAgo(post.created_time)}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 14, flexShrink: 0 }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#1877f2', fontWeight: 700 }}>
                              <ThumbsUp size={12} /> {post.likes?.summary?.total_count ?? 0}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: TEXT2, fontWeight: 700 }}>
                              <MessageSquare size={12} /> {post.comments?.summary?.total_count ?? 0}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#10b981', fontWeight: 700 }}>
                              <Share2 size={12} /> {post.shares?.count ?? 0}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0', color: TEXT3, fontSize: 13 }}>
                No insights data available yet — ensure your Page has recent activity.
              </div>
            )}
          </div>
        )}

        {/* ── Recent Campaign Activity ── */}
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '20px', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <RefreshCw size={14} style={{ color: GOLD }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>Recent Campaign Activity</span>
            <span style={{ marginLeft: 'auto', fontSize: 12, color: TEXT3 }}>{recentCampaigns.length} shown</span>
            {totalCampaigns > 8 && (
              <button onClick={() => navigate('/campaign-hub')} style={{
                display: 'flex', alignItems: 'center', gap: 4,
                background: 'none', border: 'none', color: GOLD,
                fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              }}>
                View all <ChevronRight size={12} />
              </button>
            )}
          </div>

          {recentCampaigns.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 0', color: TEXT3, fontSize: 13 }}>
              No campaigns yet —{' '}
              <span onClick={() => navigate('/campaign-hub')} style={{ color: GOLD, cursor: 'pointer' }}>
                launch your first campaign
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {recentCampaigns.map((c, i) => {
                const meta      = TYPE_COLORS[c.type] || { color: '#888', label: 'Campaign' }
                const platforms = Array.isArray(c.platforms) ? c.platforms : []
                return (
                  <div
                    key={c.id || i}
                    onClick={() => {
                      sessionStorage.setItem('campaignResult', JSON.stringify(c.result))
                      sessionStorage.setItem('campaignType', c.type)
                      sessionStorage.setItem('campaignMeta', JSON.stringify(c.meta))
                      navigate('/results')
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '12px 10px', borderRadius: 10, cursor: 'pointer',
                      borderBottom: i < recentCampaigns.length - 1 ? `1px solid ${BORDER}` : 'none',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      background: `${meta.color}15`, border: `1px solid ${meta.color}30`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: meta.color,
                    }}>
                      {TYPE_ICONS[c.type] || <Zap size={16} />}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: TEXT, marginBottom: 4 }}>
                        {c.name || 'Untitled Campaign'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100,
                          background: `${meta.color}15`, border: `1px solid ${meta.color}30`,
                          color: meta.color,
                        }}>
                          {meta.label}
                        </span>
                        {platforms.slice(0, 3).map(p => {
                          const pm = PLATFORM_META[p]
                          return pm ? (
                            <span key={p} style={{ fontSize: 11, color: pm.color, fontWeight: 600 }}>{pm.label}</span>
                          ) : null
                        })}
                        {platforms.length > 3 && (
                          <span style={{ fontSize: 11, color: TEXT3 }}>+{platforms.length - 3}</span>
                        )}
                      </div>
                    </div>

                    <div style={{ fontSize: 12, color: TEXT3, flexShrink: 0, textAlign: 'right' }}>
                      <div>{timeAgo(c.date)}</div>
                      {c.daysPosted && c.campaignDays && (
                        <div style={{ color: '#10b981', marginTop: 2, fontWeight: 600 }}>
                          {c.daysPosted.length}/{c.campaignDays}d
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Bottom Action Buttons ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            { label: 'Launch Campaign',  icon: <Zap size={15} />,          color: GOLD,      bg: `rgba(200,151,62,0.12)`, border: 'rgba(200,151,62,0.3)',  path: '/cmo' },
            { label: 'AI Agents Hub',   icon: <RefreshCw size={15} />,     color: '#818cf8', bg: CARD2,                   border: BORDER,                  path: '/agents-hub' },
            { label: 'Connect Accounts',icon: <Link2 size={15} />,         color: '#22d3ee', bg: CARD2,                   border: BORDER,                  path: '/connect-accounts' },
            { label: 'Approval Queue',  icon: <CheckCircle size={15} />,   color: '#10b981', bg: CARD2,                   border: BORDER,                  path: '/queue' },
          ].map(item => (
            <button key={item.label} onClick={() => navigate(item.path)} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '13px 16px', background: item.bg,
              border: `1px solid ${item.border}`, borderRadius: 12,
              color: item.color, fontSize: 13, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit', transition: 'opacity 0.15s',
              justifyContent: 'center',
            }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              {item.icon} {item.label} <ArrowRight size={13} />
            </button>
          ))}
        </div>

        {/* ── Footer ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginTop: 48, paddingTop: 20, borderTop: `1px solid ${BORDER}`,
          flexWrap: 'wrap', gap: 12,
        }}>
          <span style={{ fontSize: 11, color: TEXT3 }}>© 2024 EVOKE Platform. Obsidian Velocity v2.0</span>
          <div style={{ display: 'flex', gap: 20 }}>
            {[
              { label: 'Launch Campaign', path: '/cmo' },
              { label: 'AI Agents Hub',  path: '/agents-hub' },
              { label: 'Approval Queue', path: '/queue' },
            ].map(l => (
              <span key={l.label} onClick={() => navigate(l.path)}
                style={{ fontSize: 11, color: TEXT3, cursor: 'pointer', transition: 'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color = TEXT}
                onMouseLeave={e => e.currentTarget.style.color = TEXT3}
              >
                {l.label}
              </span>
            ))}
          </div>
        </div>

      </div>
      <JourneyFooter currentPath="/analytics" />
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
