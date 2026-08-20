import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Target, ArrowRight, RefreshCw, Sparkles, ShieldAlert } from 'lucide-react'
import AppSidebar from '../components/AppSidebar.jsx'
import StrategyTopBar from '../components/StrategyTopBar.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { useRequireAuth } from '../hooks/useRequireAuth'
import { getOrCreateUser } from '../services/userService'
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import { db } from '../firebase'
import { parseSwot, SwotGrid, timeAgo } from '../lib/swot.jsx'

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

export default function CompetitorIntelPage() {
  const navigate = useNavigate()
  const { authReady } = useRequireAuth()
  const { user } = useAuth()

  const [userData, setUserData] = useState(null)
  const [report, setReport]     = useState(null)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    if (!user?.uid) return
    getOrCreateUser(user.uid, user.displayName, user.email).then(setUserData).catch(() => {})
  }, [user?.uid])

  useEffect(() => {
    if (!user?.uid) return
    const q = query(
      collection(db, 'content_items'),
      where('userId', '==', user.uid),
      where('campaignType', '==', 'competitive_intel'),
      orderBy('createdAt', 'desc'),
      limit(1)
    )
    getDocs(q).then(snap => {
      if (!snap.empty) {
        const d = snap.docs[0]
        let parsed = {}
        try { parsed = JSON.parse(d.data().data || '{}') } catch {}
        setReport({ id: d.id, createdAt: d.data().createdAt, ...parsed })
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [user?.uid])

  const brandName = userData?.brandName || userData?.onboardingData?.businessName || null
  const swot = report?.swotAnalysis ? parseSwot(report.swotAnalysis) : null
  const hasReport = !!report

  if (!authReady || loading) return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, border: `2px solid ${GOLD}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: "'Inter',sans-serif" }}>
      <AppSidebar />
      <div style={{ marginLeft: 'var(--evox-sidebar-w, 220px)', minHeight: '100vh', transition: 'margin-left 0.22s cubic-bezier(0.4,0,0.2,1)' }}>

        <StrategyTopBar
          title="Competitor Intelligence"
          subtitle={brandName ? `Competitive landscape for ${brandName}.` : 'AI-generated competitive landscape analysis.'}
          action={{
            label: hasReport ? 'Regenerate' : 'Run Agent',
            icon: <RefreshCw size={14} />,
            onClick: () => navigate('/campaign/competitive_intel'),
          }}
        />

        <div style={{ padding: 40, maxWidth: 1160, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* ── Nudge banner when nothing generated yet — the sections below still render so the page always looks like the full report, not a blank screen ── */}
          {!hasReport && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: GDIM, border: `1px solid ${GBORD}`, borderRadius: 12, padding: '14px 18px' }}>
              <Target size={18} color={GOLD} style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, fontSize: 13, color: TEXT2, lineHeight: 1.5 }}>
                No report generated yet — everything below is a preview of what you'll get. Run the agent to fill it in with real analysis for your brand.
              </div>
              <button onClick={() => navigate('/campaign/competitive_intel')} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: GOLD, border: 'none', borderRadius: 8, color: '#0A0A0F', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit','Inter',sans-serif", whiteSpace: 'nowrap' }}>
                Run Agent <ArrowRight size={12} />
              </button>
            </div>
          )}

          {/* ── Competitor Landscape ── */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontFamily: "'Outfit','Inter',sans-serif", fontSize: 16, fontWeight: 600, color: '#fff' }}>Competitor Landscape</div>
              {hasReport && <div style={{ fontSize: 11, color: TEXT2 }}>Generated {timeAgo(report.createdAt)}</div>}
            </div>
            <div style={{ fontSize: 14, color: hasReport ? TEXT2 : TEXT3, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
              {hasReport ? report.competitorAnalysis : 'Run the agent with a competitor URL and this section will summarize their market position, strengths and gaps relative to your brand.'}
            </div>
          </motion.div>

          {/* ── SWOT Matrix ── */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontFamily: "'Outfit','Inter',sans-serif", fontSize: 16, fontWeight: 600, color: '#fff' }}>SWOT Matrix</div>
              <button onClick={() => navigate('/swot-analysis')} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'transparent', border: 'none', color: GOLD, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'Geist','Inter',sans-serif" }}>
                Open Full SWOT Analysis <ArrowRight size={12} />
              </button>
            </div>
            <SwotGrid swot={swot || { strengths: [], weaknesses: [], opportunities: [], threats: [] }} cardBg={CARD2} border={BORDER} textColor={TEXT2} />
          </motion.div>

          {/* ── AI Competitive Insights — derived from the same real SWOT: Opportunities → advantages to pursue, Threats → risks to address ── */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ fontFamily: "'Outfit','Inter',sans-serif", fontSize: 16, fontWeight: 600, color: '#fff' }}>AI Competitive Insights</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <InsightColumn
                icon={<Sparkles size={13} />}
                label="Opportunities To Pursue"
                color={GREEN}
                items={swot?.opportunities}
              />
              <InsightColumn
                icon={<ShieldAlert size={13} />}
                label="Threats To Address"
                color={RED}
                items={swot?.threats}
              />
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  )
}

function InsightColumn({ icon, label, color, items }) {
  const list = items && items.length ? items : null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {icon} {label}
      </div>
      {list ? list.map((item, i) => (
        <div key={i} style={{ background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 8, padding: 12 }}>
          <div style={{ fontSize: 13, color: TEXT2, lineHeight: 1.55 }}>{item}</div>
        </div>
      )) : (
        <div style={{ background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 8, padding: 12 }}>
          <div style={{ fontSize: 13, color: TEXT3 }}>Generate a report to see this.</div>
        </div>
      )}
    </div>
  )
}
