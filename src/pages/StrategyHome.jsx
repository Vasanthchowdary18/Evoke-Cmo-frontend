import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Target, Layers } from 'lucide-react'
import AppSidebar from '../components/AppSidebar.jsx'
import StrategyTopBar from '../components/StrategyTopBar.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { useRequireAuth } from '../hooks/useRequireAuth'
import { getOrCreateUser } from '../services/userService'
import { getKnowledgeBase } from '../services/knowledgeBaseService.js'
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import { db } from '../firebase'

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
const RED    = '#ef4444'

/* Same 7-step journey the dashboard uses to derive Marketing Health — reused
   here so Strategic Priorities reflects the user's real setup progress. */
const JOURNEY = [
  { key: 'account',    label: 'Confirm account & workspace setup',        priority: 'High',   route: '/brand-profile',    cta: 'Review Workspace' },
  { key: 'onboarding',  label: 'Finish brand profile & knowledge base',    priority: 'High',   route: '/brand-profile',    cta: 'Modify Strategy' },
  { key: 'strategy',   label: 'Build the core marketing strategy plan',   priority: 'High',   route: '/strategy',         cta: 'Modify Strategy' },
  { key: 'social',     label: 'Connect social & ad accounts',             priority: 'Medium', route: '/connect-accounts', cta: 'Modify Strategy' },
  { key: 'content',    label: 'Generate first AI content batch',          priority: 'Medium', route: '/agents-hub',       cta: 'Modify Strategy' },
  { key: 'approved',   label: 'Clear the content approval queue',         priority: 'Medium', route: '/queue',            cta: 'Modify Strategy' },
  { key: 'launched',   label: 'Launch first live campaign chain',         priority: 'Low',    route: '/campaign-hub',     cta: 'Modify Strategy' },
]

const RECOMMENDATIONS = [
  { id: 'ads',    match: '94%', text: 'Connect your Meta & Google Ads accounts so the Ads Agent can start shifting budget toward high-conversion channels automatically.', route: '/connect-accounts', cta: 'Connect Accounts' },
  { id: 'seo',    match: '91%', text: 'Run the SEO Agent to inject structured metadata and keyword coverage across your top product or content pages.', route: '/seo-agent', cta: 'Open SEO Agent' },
  { id: 'audience', match: '87%', text: 'Build a precision audience segment so campaigns target the right buyers instead of a broad list.', route: '/audience-builder', cta: 'Build Audience' },
  { id: 'retarget', match: '85%', text: 'Set up a retargeting playbook for visitors who didn’t convert on their first visit.', route: '/campaign/paid_advertising', cta: 'Set Up Retargeting' },
]

const ROADMAP = [
  { stage: 'Next',     title: 'Autonomous Ad Optimizer Setup', desc: 'Connect ad accounts so the Strategy Agent can start real-time bid adjustments.', route: '/connect-accounts' },
  { stage: 'Upcoming', title: 'SEO & Content Rollout',          desc: 'Generate keyword-mapped content and structured tagging across your catalog.',      route: '/seo-agent' },
  { stage: 'Planned',  title: 'Audience & Retargeting Build',   desc: 'Define precision segments and launch retargeting for warm visitors.',              route: '/audience-builder' },
  { stage: 'Future',   title: 'Executive Performance Review',   desc: 'Board-ready report — ROI, ROAS, channel performance and recommendations.',          route: '/executive-report' },
]

export default function StrategyHome() {
  const navigate = useNavigate()
  const { authReady } = useRequireAuth()
  const { user } = useAuth()

  const [userData,      setUserData]      = useState(null)
  const [brandKb,       setBrandKb]       = useState(null)
  const [contentCount,  setContentCount]  = useState(0)
  const [recentContent, setRecentContent] = useState([])
  const [dismissed,     setDismissed]     = useState([])

  useEffect(() => {
    if (!user?.uid) return
    getOrCreateUser(user.uid, user.displayName, user.email).then(setUserData).catch(() => {})
  }, [user?.uid])

  useEffect(() => {
    if (!user?.uid) return
    getKnowledgeBase(user.uid)
      .then(data => { if (data && Object.keys(data).length > 1) setBrandKb(data) })
      .catch(() => {})
  }, [user?.uid])

  useEffect(() => {
    if (!user?.uid) return
    const q = query(collection(db, 'content_items'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'), limit(20))
    getDocs(q).then(snap => {
      setContentCount(snap.size)
      setRecentContent(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    }).catch(() => {})
  }, [user?.uid])

  const connectedAccounts = Object.values(userData?.socialAccounts || {}).filter(a => a?.connected).length
  const firstName = user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || 'there'
  const brandName = userData?.brandName || userData?.onboardingData?.businessName || userData?.onboardingData?.brandName || null
  const hasBrandKb = !!brandKb

  const hasApproved = recentContent.some(c => ['approved', 'scheduled', 'published'].includes(c.status))
  const hasLaunched = recentContent.some(c => ['published', 'scheduled'].includes(c.status))
  const hasStrategy = recentContent.some(c => c.type && ['strategy', 'marketing_strategy', 'kpi', 'kpi-recommendations'].some(t => c.type.includes(t)))
    || !!(userData?.onboardingData?.goal && userData?.onboardingData?.industry)

  const completed = {
    account:    true,
    onboarding: !!(userData?.brandSetupComplete || userData?.onboardingComplete) || hasBrandKb,
    strategy:   hasStrategy,
    social:     connectedAccounts > 0,
    content:    contentCount > 0,
    approved:   hasApproved,
    launched:   hasLaunched,
  }
  const doneCount = Object.values(completed).filter(Boolean).length
  const marketPosition = Math.round((doneCount / JOURNEY.length) * 100)
  const audienceCount = Array.isArray(brandKb?.audience) ? brandKb.audience.length : (brandKb?.audience ? 1 : 0)

  const priorities = JOURNEY.map(step => ({ ...step, done: completed[step.key] }))
  const visibleRecs = RECOMMENDATIONS.filter(r => !dismissed.includes(r.id))

  if (!authReady) return (
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
          title="Strategy Command Center"
          subtitle={`Autonomous CMO engine directing ${brandName || `${firstName}'s`} portfolio outcomes.`}
        />

        {/* ── PAGE BODY ── */}
        <div style={{ padding: 40, maxWidth: 1400, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* ══ KPI ROW ══ */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20 }}>
            <KpiCard label="Market Position Score" value={`${marketPosition} / 100`} delta={`${doneCount}/${JOURNEY.length} steps done`} deltaColor={GREEN} onClick={() => navigate('/health-score')} />
            <KpiCard label="Strategy Growth Rate" value="—" delta="Connect Analytics to track" deltaColor={TEXT3} onClick={() => navigate('/analytics')} />
            <KpiCard label="Active Target Markets" value={audienceCount > 0 ? `${audienceCount} Active` : 'Not set'} delta={audienceCount > 0 ? 'Stable' : 'Define audience'} deltaColor={audienceCount > 0 ? GREEN : GOLD} onClick={() => navigate('/audience-builder')} />
            <KpiCard label="Tracked Goals" value={`${contentCount} Tracked`} delta={contentCount > 0 ? 'On Track' : 'Get started'} deltaColor={contentCount > 0 ? GREEN : GOLD} onClick={() => navigate('/agents-hub')} />
          </div>

          {/* ══ INTELLIGENCE TOOLS — Competitor Intel + SWOT Analysis ══ */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <IntelCard
              icon={<Target size={20} />}
              title="Competitor Intelligence"
              desc="Analyze a rival's market position, traffic and ad spend, with an AI-generated SWOT matrix."
              onClick={() => navigate('/competitor-intel')}
            />
            <IntelCard
              icon={<Layers size={20} />}
              title="SWOT Analysis"
              desc="Strengths, Weaknesses, Opportunities and Threats — generated from your latest competitive report."
              onClick={() => navigate('/swot-analysis')}
            />
          </div>

          {/* ══ PRIORITIES + RECOMMENDATIONS ══ */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 24, alignItems: 'start' }}>

            {/* ── Strategic Priorities ── */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ fontFamily: "'Outfit','Inter',sans-serif", fontSize: 16, fontWeight: 600, color: '#fff' }}>Strategic Priorities</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
                {priorities.map(step => (
                  <div key={step.key} style={{ background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, width: '100%', boxSizing: 'border-box' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Tag color={step.priority === 'High' ? RED : GOLD} label={`${step.priority} Priority`} />
                        <Tag color={step.done ? GREEN : GOLD} label={step.done ? 'Executed' : 'Pending Review'} />
                      </div>
                      <div style={{ fontFamily: "'Outfit','Inter',sans-serif", fontSize: 14, fontWeight: 600, color: '#fff' }}>{step.label}</div>
                    </div>
                    <button onClick={() => navigate(step.route)} style={{ flexShrink: 0, padding: '8px 16px', background: GDIM, border: `1px solid ${GBORD}`, borderRadius: 6, color: GOLD, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'Geist','Inter',sans-serif", whiteSpace: 'nowrap' }}>
                      {step.cta}
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* ── AI Strategy Recommendations ── */}
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
              style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ fontFamily: "'Outfit','Inter',sans-serif", fontSize: 16, fontWeight: 600, color: '#fff' }}>AI Strategy Recommendations</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
                {visibleRecs.length === 0 ? (
                  <div style={{ padding: '18px 0', fontSize: 12, color: TEXT2, textAlign: 'center' }}>All caught up — no pending recommendations.</div>
                ) : visibleRecs.map(rec => (
                  <div key={rec.id} style={{ background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 10, width: '100%', boxSizing: 'border-box' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: GOLD }} />
                        <span style={{ fontSize: 11, fontWeight: 600, color: GOLD, fontFamily: "'Geist','Inter',sans-serif" }}>Evoke Recommendation</span>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: GREEN, fontFamily: "'Geist','Inter',sans-serif" }}>{rec.match} Match</span>
                    </div>
                    <div style={{ fontSize: 13, color: TEXT2, lineHeight: 1.5, fontFamily: "'Geist','Inter',sans-serif" }}>{rec.text}</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => navigate(rec.route)} style={{ padding: '6px 12px', background: GOLD, border: 'none', borderRadius: 6, color: '#0A0A0F', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: "'Geist','Inter',sans-serif" }}>
                        {rec.cta}
                      </button>
                      <button onClick={() => setDismissed(d => [...d, rec.id])} style={{ padding: '6px 12px', background: 'transparent', border: `1px solid ${BORDER}`, borderRadius: 6, color: TEXT2, fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: "'Geist','Inter',sans-serif" }}>
                        Dismiss
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* ══ ROADMAP ══ */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ fontFamily: "'Outfit','Inter',sans-serif", fontSize: 16, fontWeight: 600, color: '#fff' }}>Strategy Roadmap Milestones</div>
            <div style={{ display: 'flex', gap: 16, width: '100%', flexWrap: 'wrap' }}>
              {ROADMAP.map((m, i) => (
                <div key={m.title} onClick={() => navigate(m.route)} style={{ flex: '1 1 220px', display: 'flex', flexDirection: 'column', gap: 12, cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ padding: '4px 10px', background: GDIM, border: `1px solid ${GOLD}`, borderRadius: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: GOLD, fontFamily: "'Geist','Inter',sans-serif" }}>{m.stage}</span>
                    </div>
                    {i < ROADMAP.length - 1 && <div style={{ flex: 1, height: 1, background: BORDER }} />}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ fontFamily: "'Outfit','Inter',sans-serif", fontSize: 14, fontWeight: 700, color: '#fff' }}>{m.title}</div>
                    <div style={{ fontSize: 12, color: TEXT2, fontFamily: "'Geist','Inter',sans-serif", lineHeight: 1.5 }}>{m.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  )
}

function KpiCard({ label, value, delta, deltaColor, onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: CARD, border: `1px solid ${hov ? GBORD : BORDER}`, borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 8, cursor: onClick ? 'pointer' : 'default', transition: 'all 0.18s' }}>
      <div style={{ fontFamily: "'Geist','Inter',sans-serif", fontSize: 12, color: TEXT2, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', width: '100%' }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', fontFamily: "'Outfit','Inter',sans-serif" }}>{value}</div>
        <div style={{ fontFamily: "'Geist','Inter',sans-serif", fontSize: 13, fontWeight: 700, color: deltaColor }}>{delta}</div>
      </div>
    </div>
  )
}

function IntelCard({ icon, title, desc, onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: CARD, border: `1px solid ${hov ? GBORD : BORDER}`, borderRadius: 16, padding: 20, display: 'flex', alignItems: 'flex-start', gap: 14, cursor: 'pointer', transition: 'all 0.18s' }}>
      <div style={{ width: 40, height: 40, borderRadius: 11, background: GDIM, border: `1px solid ${GBORD}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: GOLD, flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ fontFamily: "'Outfit','Inter',sans-serif", fontSize: 15, fontWeight: 700, color: '#fff' }}>{title}</div>
          <ArrowRight size={14} color={hov ? GOLD : TEXT2} style={{ flexShrink: 0, transition: 'color 0.15s' }} />
        </div>
        <div style={{ fontSize: 12, color: TEXT2, lineHeight: 1.55, marginTop: 4 }}>{desc}</div>
      </div>
    </div>
  )
}

function Tag({ color, label }) {
  return (
    <div style={{ padding: '2px 8px', background: `${color}1A`, borderRadius: 4 }}>
      <span style={{ fontSize: 10, fontWeight: 700, color, fontFamily: "'Geist','Inter',sans-serif" }}>{label}</span>
    </div>
  )
}
