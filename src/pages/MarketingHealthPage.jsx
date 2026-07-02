import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import Navbar from '../components/Navbar.jsx'
import {
  ArrowLeft, ArrowRight, CheckCircle2, Lock, AlertTriangle,
  User, BookOpen, Share2, Rocket, BarChart2, Zap, RefreshCw,
} from 'lucide-react'
import { getUserData } from '../services/userService.js'
import { getKnowledgeBase } from '../services/knowledgeBaseService.js'

/* ── design tokens ── */
const BG     = '#0e0c09'
const CARD   = '#1c1a13'
const GOLD   = '#c8973e'
const GREEN  = '#10b981'
const RED    = '#ef4444'
const TEXT   = '#f0ebe0'
const TEXT2  = 'rgba(240,235,224,0.55)'
const TEXT3  = 'rgba(240,235,224,0.28)'
const BORDER = 'rgba(255,255,255,0.08)'
const GBORDER= 'rgba(200,151,62,0.22)'

/* ── arc gauge ── */
function ScoreGauge({ score, animated }) {
  const r      = 58
  const cx     = 80
  const cy     = 80
  const circum = 2 * Math.PI * r
  const arc    = circum * 0.75          // 270 degrees of track
  const fill   = animated ? (score / 100) * arc : 0
  const col    = score >= 70 ? GREEN : score >= 40 ? GOLD : RED

  return (
    <svg width="160" height="160" viewBox="0 0 160 160" style={{ overflow: 'visible' }}>
      {/* track */}
      <circle
        cx={cx} cy={cy} r={r} fill="none"
        stroke="rgba(255,255,255,0.07)" strokeWidth={11}
        strokeDasharray={`${arc} ${circum}`} strokeLinecap="round"
        transform={`rotate(135 ${cx} ${cy})`}
      />
      {/* glow layer */}
      <circle
        cx={cx} cy={cy} r={r} fill="none"
        stroke={col} strokeWidth={4} opacity={0.35}
        strokeDasharray={`${fill} ${circum}`} strokeLinecap="round"
        transform={`rotate(135 ${cx} ${cy})`}
        style={{ filter: 'blur(5px)', transition: 'stroke-dasharray 1.3s cubic-bezier(.4,0,.2,1)' }}
      />
      {/* progress */}
      <circle
        cx={cx} cy={cy} r={r} fill="none"
        stroke={col} strokeWidth={11}
        strokeDasharray={`${fill} ${circum}`} strokeLinecap="round"
        transform={`rotate(135 ${cx} ${cy})`}
        style={{ transition: 'stroke-dasharray 1.3s cubic-bezier(.4,0,.2,1)' }}
      />
    </svg>
  )
}

/* ── score label ── */
function scoreLabel(s) {
  if (s >= 80) return { label: 'Fully Optimized',    color: GREEN }
  if (s >= 60) return { label: 'Performing Well',    color: GREEN }
  if (s >= 40) return { label: 'Building Momentum',  color: GOLD }
  if (s >= 20) return { label: 'Needs Attention',    color: '#f97316' }
  return              { label: 'Getting Started',    color: RED }
}

/* ── category data builder ── */
function buildCategories(userData, kb) {
  /* 1. Business Profile – 20 pts */
  let profileScore  = 0
  let profileStatus = 'Not started'
  let profileAction = 'Complete onboarding'
  if (userData?.onboardingComplete) {
    const d = userData.onboardingData || {}
    const filled = ['background', 'industry', 'goal'].filter(k => d[k]).length
    profileScore  = filled === 3 ? 20 : filled >= 1 ? 10 : 5
    profileStatus = filled === 3 ? 'Complete' : 'Partial'
    profileAction = filled === 3 ? null : 'Finish onboarding'
  }

  /* 2. Brand Knowledge Base – 20 pts */
  let kbScore  = 0
  let kbStatus = 'Not set up'
  let kbAction = 'Set up brand profile'
  if (kb) {
    const vals = Object.values(kb).filter(v => v && String(v).trim().length > 2)
    kbScore  = vals.length >= 6 ? 20 : vals.length >= 3 ? 12 : vals.length >= 1 ? 5 : 0
    kbStatus = vals.length >= 6 ? 'Well defined' : vals.length >= 3 ? 'In progress' : 'Minimal'
    kbAction = vals.length >= 6 ? null : 'Expand brand profile'
  }

  /* 3. Social Presence – 20 pts */
  const socials   = userData?.socialAccounts || {}
  const allPlatforms = Object.values(socials)
  const connected    = allPlatforms.filter(p => p?.connected).length
  const totalPlat    = allPlatforms.length || 6
  const socialScore  = Math.min(Math.round((connected / totalPlat) * 20), 20)
  const socialStatus = connected === 0 ? 'None connected'
    : connected >= 4 ? 'Well connected'
    : `${connected} platform${connected > 1 ? 's' : ''} connected`
  const socialAction = connected >= totalPlat ? null : 'Connect more platforms'

  /* 4. Campaign Activity – 20 pts (free = 0, push to launch) */
  const campaignScore  = 0
  const campaignStatus = 'No campaigns yet'
  const campaignAction = 'Launch first campaign'

  /* 5. Analytics & Insights – 20 pts (locked for free) */
  const analyticsScore  = 0
  const analyticsStatus = 'Upgrade to unlock'

  return [
    {
      key: 'profile',   icon: <User size={17} />,      label: 'Business Profile',
      color: GOLD,      score: profileScore,            max: 20,
      status: profileStatus, action: profileAction,     path: '/onboarding',
      locked: false,
    },
    {
      key: 'brand',     icon: <BookOpen size={17} />,   label: 'Brand Knowledge Base',
      color: '#f59e0b', score: kbScore,                 max: 20,
      status: kbStatus, action: kbAction,               path: '/brand-kb',
      locked: false,
    },
    {
      key: 'social',    icon: <Share2 size={17} />,     label: 'Social Presence',
      color: '#3b82f6', score: socialScore,             max: 20,
      status: socialStatus, action: socialAction,       path: '/connect-accounts',
      locked: false,
    },
    {
      key: 'campaigns', icon: <Rocket size={17} />,     label: 'Campaign Activity',
      color: '#10b981', score: campaignScore,           max: 20,
      status: campaignStatus, action: campaignAction,   path: '/campaign-hub',
      locked: false,
    },
    {
      key: 'analytics', icon: <BarChart2 size={17} />,  label: 'Analytics & Insights',
      color: '#8b5cf6', score: analyticsScore,          max: 20,
      status: analyticsStatus, action: null,            path: '/plans',
      locked: true,
    },
  ]
}

/* ── category card ── */
function CategoryCard({ cat, onAction }) {
  const pct      = cat.max > 0 ? cat.score / cat.max : 0
  const barColor = cat.locked ? 'rgba(255,255,255,0.1)'
    : pct >= 1  ? GREEN
    : pct > 0   ? GOLD
    : RED

  return (
    <div style={{
      background: CARD,
      border: `1px solid ${cat.locked ? 'rgba(255,255,255,0.04)' : BORDER}`,
      borderRadius: 16, padding: '20px 22px',
      opacity: cat.locked ? 0.55 : 1,
      display: 'flex', flexDirection: 'column', gap: 14,
    }}>
      {/* header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
            background: cat.locked ? 'rgba(255,255,255,0.04)' : `${cat.color}18`,
            border: `1px solid ${cat.locked ? 'rgba(255,255,255,0.06)' : cat.color + '44'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: cat.locked ? TEXT3 : cat.color,
          }}>
            {cat.locked ? <Lock size={15} /> : cat.icon}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: cat.locked ? TEXT3 : TEXT }}>
              {cat.label}
            </div>
            <div style={{ fontSize: 11, color: TEXT3, marginTop: 2 }}>{cat.status}</div>
          </div>
        </div>
        {/* score */}
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: 24, fontWeight: 900, fontFamily: "'Syne','Inter',sans-serif", color: barColor }}>
            {cat.score}
          </span>
          <span style={{ fontSize: 12, color: TEXT3, fontWeight: 600 }}>/{cat.max}</span>
        </div>
      </div>

      {/* progress bar */}
      <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct * 100}%`,
          background: barColor, borderRadius: 3,
          transition: 'width 1.3s cubic-bezier(.4,0,.2,1)',
        }} />
      </div>

      {/* action button */}
      {cat.locked ? (
        <button
          onClick={onAction}
          style={{
            padding: '9px 0', background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)', borderRadius: 9,
            color: TEXT3, fontSize: 12, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}
        >
          <Lock size={12} /> Upgrade to unlock
        </button>
      ) : cat.action ? (
        <button
          onClick={onAction}
          style={{
            padding: '9px 0', background: `${cat.color}14`,
            border: `1px solid ${cat.color}50`, borderRadius: 9,
            color: cat.color, fontSize: 12, fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            transition: 'opacity .18s',
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '.75' }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
        >
          {cat.action} <ArrowRight size={12} />
        </button>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: GREEN, fontWeight: 700 }}>
          <CheckCircle2 size={14} /> Complete
        </div>
      )}
    </div>
  )
}

/* ── main page ── */
export default function MarketingHealthPage() {
  const { user }   = useAuth()
  const navigate   = useNavigate()
  const [loading, setLoading]     = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [categories, setCats]     = useState([])
  const [total, setTotal]         = useState(0)
  const [animated, setAnimated]   = useState(false)

  const loadData = (isRefresh = false) => {
    if (!user) { navigate('/signin'); return }
    if (isRefresh) { setRefreshing(true); setAnimated(false) }
    Promise.all([getUserData(user.uid), getKnowledgeBase(user.uid)])
      .then(([uData, kb]) => {
        const cats = buildCategories(uData, kb)
        setCats(cats)
        setTotal(cats.reduce((s, c) => s + c.score, 0))
        setLoading(false)
        setRefreshing(false)
        setTimeout(() => setAnimated(true), 350)
      })
      .catch(() => { setLoading(false); setRefreshing(false) })
  }

  useEffect(() => { loadData() }, [user])

  const { label: sLabel, color: sColor } = scoreLabel(total)
  const actionItems = categories.filter(c => !c.locked && c.action && c.score < c.max)

  const summaryText =
    total < 40 ? 'Your marketing foundation needs work. Complete the steps below to build a solid base.' :
    total < 70 ? 'Good start! Fill in the gaps below to unlock more of your marketing potential.' :
                 'Your marketing setup is solid. Upgrade to launch campaigns and track performance.'

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: TEXT2, fontSize: 14 }}>Analysing your marketing setup…</div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: BG, color: TEXT, fontFamily: "'Inter', sans-serif" }}>
      <Navbar />

      <div style={{ maxWidth: 880, margin: '0 auto', padding: '90px 24px 80px' }}>

        {/* back */}
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'none', border: 'none', color: TEXT2, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 13, fontWeight: 600, padding: 0, marginBottom: 24,
          }}
        >
          <ArrowLeft size={14} /> Back
        </button>

        {/* page header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '3px 12px', background: 'rgba(200,151,62,0.12)',
                border: `1px solid ${GBORDER}`, borderRadius: 100,
                fontSize: 10, fontWeight: 800, color: GOLD,
                letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12,
              }}>
                FREE PLAN · HEALTH SCORE
              </div>
              <h1 style={{
                fontSize: 'clamp(22px,3.5vw,32px)', fontWeight: 900,
                fontFamily: "'Syne','Inter',sans-serif", letterSpacing: '-0.02em',
                margin: '0 0 8px',
              }}>
                Your Marketing Health Score
              </h1>
              <p style={{ fontSize: 14, color: TEXT2, maxWidth: 460, lineHeight: 1.6, margin: 0 }}>
                A live snapshot of how well your marketing setup is performing — and what to fix.
              </p>
            </div>
            <button
              onClick={() => loadData(true)}
              disabled={refreshing}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '9px 16px', background: CARD, border: `1px solid ${BORDER}`,
                borderRadius: 10, color: TEXT2, fontSize: 12, fontWeight: 600,
                cursor: refreshing ? 'default' : 'pointer', opacity: refreshing ? 0.6 : 1,
              }}
            >
              <RefreshCw size={13} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} /> Refresh Score
            </button>
          </div>
        </div>

        {/* score card */}
        <div style={{
          background: CARD, border: `1px solid ${BORDER}`, borderRadius: 20,
          padding: '32px 30px', marginBottom: 28,
          display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap',
        }}>
          <ScoreGauge score={total} animated={animated} />
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: sColor, fontFamily: "'Syne','Inter',sans-serif", marginBottom: 4 }}>
              {sLabel}
            </div>
            <p style={{ fontSize: 13, color: TEXT2, lineHeight: 1.6, margin: '0 0 16px', maxWidth: 440 }}>
              {summaryText}
            </p>
            <div style={{ display: 'flex', gap: 20 }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: GREEN }}>{categories.filter(c => !c.locked && c.score >= c.max).length}<span style={{ fontSize: 12, color: TEXT3 }}>/5</span></div>
                <div style={{ fontSize: 10, color: TEXT3, letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 700 }}>Complete</div>
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: GOLD }}>{categories.filter(c => !c.locked && c.score > 0 && c.score < c.max).length}<span style={{ fontSize: 12, color: TEXT3 }}>/5</span></div>
                <div style={{ fontSize: 10, color: TEXT3, letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 700 }}>In progress</div>
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: RED }}>{categories.filter(c => !c.locked && c.score === 0).length}<span style={{ fontSize: 12, color: TEXT3 }}>/5</span></div>
                <div style={{ fontSize: 10, color: TEXT3, letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 700 }}>Not started</div>
              </div>
            </div>
          </div>
        </div>

        {/* category cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 16, marginBottom: 28,
        }}>
          {categories.map(cat => (
            <CategoryCard
              key={cat.key}
              cat={cat}
              onAction={() => navigate(cat.path, cat.path === '/brand-kb' ? { state: { edit: true } } : undefined)}
            />
          ))}
        </div>

        {/* what to fix next */}
        {actionItems.length > 0 && (
          <div style={{
            background: CARD, border: `1px solid ${BORDER}`, borderRadius: 18,
            padding: '22px 24px', marginBottom: 28,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <AlertTriangle size={15} color={GOLD} />
              <span style={{ fontSize: 14, fontWeight: 800, color: TEXT }}>What to fix next</span>
              <span style={{ fontSize: 11, color: TEXT3 }}>Prioritised by impact on your score</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {actionItems.map(item => (
                <div key={item.key} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px', background: 'rgba(255,255,255,0.02)',
                  border: `1px solid ${BORDER}`, borderRadius: 12,
                }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                    background: `${item.color}18`, border: `1px solid ${item.color}44`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: item.color,
                  }}>
                    {item.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>
                      {item.action}
                    </div>
                    <div style={{ fontSize: 11, color: TEXT2, marginTop: 2 }}>
                      Gain up to +{item.max - item.score} pts &middot; {item.label}
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(item.path, item.path === '/brand-kb' ? { state: { edit: true } } : undefined)}
                    style={{
                      padding: '8px 16px', flexShrink: 0,
                      background: `${item.color}14`,
                      border: `1px solid ${item.color}50`, borderRadius: 8,
                      color: item.color, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 6,
                      transition: 'opacity .18s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.opacity = '.75' }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
                  >
                    Fix this <ArrowRight size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* upgrade CTA */}
        <div style={{
          background: 'linear-gradient(160deg,#221d10,#1c1a13)', border: `1px solid ${GBORDER}`,
          borderRadius: 20, padding: '32px 30px', textAlign: 'center',
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14, margin: '0 auto 16px',
            background: 'rgba(200,151,62,0.15)', border: `1px solid ${GBORDER}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: GOLD,
          }}>
            <Zap size={22} />
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 900, fontFamily: "'Syne','Inter',sans-serif", margin: '0 0 8px' }}>
            Unlock your full marketing potential
          </h3>
          <p style={{ fontSize: 13, color: TEXT2, maxWidth: 440, margin: '0 auto 20px', lineHeight: 1.6 }}>
            Upgrade to launch AI campaigns, generate content at scale, track analytics, and push your score to 100.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/plans')}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '12px 26px',
                background: 'linear-gradient(135deg,#d4a853,#b8803a)', border: 'none',
                borderRadius: 12, color: '#0e0c09', fontSize: 14, fontWeight: 800, cursor: 'pointer',
              }}
            >
              View Plans <ArrowRight size={15} />
            </button>
            <button
              onClick={() => navigate('/agents-hub')}
              style={{
                padding: '12px 26px', background: 'transparent', border: `1px solid ${BORDER}`,
                borderRadius: 12, color: TEXT2, fontSize: 14, fontWeight: 700, cursor: 'pointer',
              }}
            >
              Back to Hub
            </button>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
