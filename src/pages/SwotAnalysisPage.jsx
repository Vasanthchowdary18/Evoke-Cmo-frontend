import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Download, TrendingUp, ShieldAlert } from 'lucide-react'
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
const TEXT2  = '#9b9bb0'
const TEXT3  = 'rgba(240,235,224,0.26)'
const BORDER = '#2A2A3A'
const GREEN  = '#10b981'
const RED    = '#ef4444'

const EMPTY_SWOT = { strengths: [], weaknesses: [], opportunities: [], threats: [] }

export default function SwotAnalysisPage() {
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

  const brandName = userData?.brandName || userData?.onboardingData?.businessName || 'Your Brand'
  const swot = report?.swotAnalysis ? parseSwot(report.swotAnalysis) : null
  const hasSwot = !!swot

  const handleExport = () => {
    if (!swot) return
    const text = ['STRENGTHS', 'WEAKNESSES', 'OPPORTUNITIES', 'THREATS'].map((label, i) => {
      const key = ['strengths', 'weaknesses', 'opportunities', 'threats'][i]
      return `${label}\n${(swot[key] || []).map(item => `- ${item}`).join('\n')}`
    }).join('\n\n')
    const blob = new Blob([`${brandName} — SWOT Analysis\n\n${text}`], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `${brandName.replace(/\s+/g, '_')}_SWOT_Analysis.txt`
    a.click(); URL.revokeObjectURL(url)
  }

  // Derived, not fabricated: pairs the first real strength/opportunity and
  // weakness/threat into two actionable recommendations.
  const leverageRec = hasSwot && swot.strengths[0] && swot.opportunities[0]
    ? `Combine "${swot.strengths[0]}" with the opportunity to "${swot.opportunities[0]}".`
    : null
  const mitigateRec = hasSwot && swot.weaknesses[0] && swot.threats[0]
    ? `Address "${swot.weaknesses[0]}" before it's compounded by "${swot.threats[0]}".`
    : null

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
          title="SWOT Analysis"
          subtitle="Generated from your latest Competitive Intelligence report."
        />

        <div style={{ padding: 40, maxWidth: 1160, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* ── Figma "action-header" — status text + Export Executive SWOT PDF ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 13, color: TEXT2, lineHeight: 1.5 }}>
              {hasSwot
                ? 'Calculated based on Active Campaign Chains and Competitive Intel inputs.'
                : 'No SWOT generated yet — the matrix below is a preview until you run the agent.'}
            </div>
            <button
              onClick={hasSwot ? handleExport : () => navigate('/campaign/competitive_intel')}
              style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: GOLD, border: 'none', borderRadius: 8, color: '#0A0A0F', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit','Inter',sans-serif", whiteSpace: 'nowrap' }}
            >
              {hasSwot ? <><Download size={14} /> Export Executive SWOT PDF</> : <>Run Competitive Intel Agent <ArrowRight size={14} /></>}
            </button>
          </div>

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontFamily: "'Outfit','Inter',sans-serif", fontSize: 16, fontWeight: 600, color: '#fff' }}>{brandName} SWOT Matrix</div>
              {hasSwot && <div style={{ fontSize: 11, color: TEXT2 }}>Generated {timeAgo(report.createdAt)}</div>}
            </div>
            <SwotGrid swot={swot || EMPTY_SWOT} cardBg={CARD2} border={BORDER} textColor={TEXT2} />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontFamily: "'Outfit','Inter',sans-serif", fontSize: 16, fontWeight: 600, color: '#fff' }}>SWOT Action Recommendations</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <RecCard icon={<TrendingUp size={12} />} color={GREEN} label="Leverage Strength & Opportunity" text={leverageRec} />
              <RecCard icon={<ShieldAlert size={12} />} color={RED} label="Mitigate Weakness & Defend Threat" text={mitigateRec} />
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  )
}

function RecCard({ icon, color, label, text }) {
  return (
    <div style={{ background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {icon} {label}
      </div>
      <div style={{ fontSize: 13, color: text ? TEXT2 : TEXT3, lineHeight: 1.55 }}>
        {text || 'Generate a report to see this.'}
      </div>
    </div>
  )
}
