import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  BarChart2, ArrowLeft, Loader2, TrendingUp, Users, FileText,
  Zap, Shield, DollarSign, Brain, AlertTriangle, CheckCircle2,
  Activity, Clock, Target, ChevronRight, RefreshCw,
} from 'lucide-react'
import JourneyFooter from '../components/JourneyFooter.jsx'
import Navbar from '../components/Navbar.jsx'
import { useRequireAuth } from '../hooks/useRequireAuth'
import { useAuth } from '../hooks/useAuth'

const BG      = '#0e0c09'
const CARD    = '#1c1a13'
const CARD2   = '#211e14'
const BORDER  = 'rgba(255,255,255,0.07)'
const GOLD    = '#c8973e'
const GDIM    = 'rgba(200,151,62,0.13)'
const GBORDER = 'rgba(200,151,62,0.28)'
const TEXT    = '#f0ebe0'
const TEXT2   = 'rgba(240,235,224,0.55)'
const TEXT3   = 'rgba(240,235,224,0.32)'
const GREEN   = '#10b981'
const PURPLE  = '#6366f1'
const PINK    = '#ec4899'
const BLUE    = '#3b82f6'

const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY || ''

const CAMPAIGN_DATA = {
  allTime: 47, thisMonth: 12, thisWeek: 3,
  active: 8, completed: 39,
  successRate: 78,
  topCampaign: { name: 'Summer Brand Awareness', engagement: '24.3K', reach: '180K' },
}

const CONTENT_DATA = {
  total: 214,
  breakdown: [
    { type: 'Social Posts', count: 98, color: '#e1306c' },
    { type: 'Blog Articles', count: 34, color: GREEN },
    { type: 'Newsletters', count: 22, color: BLUE },
    { type: 'Emails', count: 60, color: PURPLE },
  ],
  channels: [
    { name: 'Meta / Instagram', count: 76, color: '#e1306c' },
    { name: 'LinkedIn', count: 42, color: '#0a66c2' },
    { name: 'TikTok', count: 38, color: '#ff0050' },
    { name: 'Google / YouTube', count: 58, color: '#ff0000' },
  ],
  mostUsed: 'Social Posts',
  approved: 189, rejected: 25,
}

const AGENT_DATA = [
  { name: 'Marketing Strategy Agent', uses: 14, lastActive: '2h ago', outputs: 14, color: GOLD },
  { name: 'Campaign Planning Agent',  uses: 47, lastActive: '1h ago', outputs: 47, color: GREEN },
  { name: 'Audience Intelligence Agent', uses: 23, lastActive: '3h ago', outputs: 23, color: PURPLE },
  { name: 'Content Generation Agent', uses: 98, lastActive: '30m ago', outputs: 214, color: PINK },
  { name: 'Creative Asset Agent',     uses: 61, lastActive: '1h ago', outputs: 61, color: BLUE },
  { name: 'Video Generation Agent',   uses: 18, lastActive: '4h ago', outputs: 18, color: '#f59e0b' },
  { name: 'Analytics Agent',          uses: 32, lastActive: '20m ago', outputs: 32, color: '#10b981' },
  { name: 'Copywriting Agent',        uses: 77, lastActive: '45m ago', outputs: 77, color: '#ef4444' },
]

const AUDIENCE_DATA = {
  total: 23,
  breakdown: [
    { type: 'Demographic Segment', count: 8, color: PURPLE },
    { type: 'Behavioral Segment',  count: 6, color: PINK },
    { type: 'Lookalike Audience',  count: 5, color: GOLD },
    { type: 'High Value Customer', count: 4, color: GREEN },
  ],
  totalReach: '4.2M',
}

const BUDGET_DATA = {
  allocated: '₹2,40,000', spent: '₹1,87,500', remaining: '₹52,500',
  spendPct: 78,
  campaigns: [
    { name: 'Summer Brand Awareness', allocated: '₹80,000', spent: '₹74,200', roi: '+34%' },
    { name: 'Lead Gen Q3',            allocated: '₹60,000', spent: '₹58,900', roi: '+21%' },
    { name: 'Product Launch Reel',    allocated: '₹40,000', spent: '₹31,400', roi: '+52%' },
  ],
}

const GOVERNANCE_DATA = {
  reviewed: 214, approved: 189, flagged: 18, rejected: 7,
  pendingHumanReview: 4,
  recentAudit: [
    { id: 'BG-0047', type: 'Social Post',  status: 'approved', score: 94, time: '30m ago' },
    { id: 'BG-0046', type: 'Ad Creative',  status: 'flagged',  score: 71, time: '1h ago' },
    { id: 'BG-0045', type: 'Email',        status: 'approved', score: 89, time: '2h ago' },
    { id: 'BG-0044', type: 'Blog Article', status: 'approved', score: 96, time: '3h ago' },
    { id: 'BG-0043', type: 'Banner',       status: 'rejected', score: 42, time: '4h ago' },
  ],
}

async function generateInsights() {
  const prompt = `You are the Executive Reporting Agent for an AI CMO platform.

Based on these performance metrics:
- Campaigns: 47 total, 8 active, 78% success rate
- Content: 214 pieces generated, 89% brand approved
- Top agent: Content Generation (98 uses)
- Audience reach: 4.2M total
- Budget: ₹2.4L allocated, 78% spent, average ROI +34%
- Brand governance: 189 approved, 18 flagged, 7 rejected

Return ONLY valid JSON:
{
  "healthSummary": "One confident paragraph (2-3 sentences) summarising overall marketing health and performance",
  "topRecommendation": "One specific, actionable next step the CMO should take this week",
  "riskFlag": "One specific risk or underperforming area that needs attention",
  "healthScore": 82
}`

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_KEY}` },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      max_tokens: 600,
    }),
  })
  if (!res.ok) throw new Error()
  const data = await res.json()
  const raw = data.choices?.[0]?.message?.content || ''
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) throw new Error()
  return JSON.parse(match[0])
}

function StatCard({ label, value, sub, color = GOLD, icon }) {
  return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '16px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
        {icon && <span style={{ color: color, opacity: 0.7 }}>{icon}</span>}
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: color, marginBottom: 2 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: TEXT3 }}>{sub}</div>}
    </div>
  )
}

function SectionHeader({ icon, title, sub }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
      <span style={{ color: GOLD }}>{icon}</span>
      <div>
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: TEXT }}>{title}</h2>
        {sub && <p style={{ margin: 0, fontSize: 12, color: TEXT3 }}>{sub}</p>}
      </div>
    </div>
  )
}

const statusStyle = (s) => ({
  approved: { bg: 'rgba(16,185,129,0.12)', color: GREEN,   label: 'Approved' },
  flagged:  { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', label: 'Flagged' },
  rejected: { bg: 'rgba(239,68,68,0.12)',  color: '#ef4444', label: 'Rejected' },
}[s] || { bg: GDIM, color: GOLD, label: s })

export default function ExecutiveReportingPage() {
  useRequireAuth()
  const navigate  = useNavigate()
  const { user }  = useAuth()
  const [insights, setInsights] = useState(null)
  const [loading, setLoading]   = useState(false)

  useEffect(() => { fetchInsights() }, [])

  async function fetchInsights() {
    setLoading(true)
    try { setInsights(await generateInsights()) } catch {}
    setLoading(false)
  }

  const section = { background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 22, marginBottom: 20 }

  return (
    <div style={{ minHeight: '100vh', background: BG, color: TEXT, fontFamily: "'Inter', sans-serif" }}>
      <Navbar />
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '100px 20px 60px' }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: TEXT3, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 20, padding: 0 }}>
            <ArrowLeft size={14} /> Back
          </button>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: GDIM, border: `1px solid ${GBORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BarChart2 size={22} color={GOLD} />
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Executive Reporting Agent</h1>
                <p style={{ margin: 0, fontSize: 13, color: TEXT2 }}>Fig. 11 · 1195 — Full marketing performance overview</p>
              </div>
            </div>
            <button onClick={fetchInsights} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 6, background: GDIM, border: `1px solid ${GBORDER}`, borderRadius: 10, padding: '8px 16px', color: GOLD, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <RefreshCw size={13} style={loading ? { animation: 'spin 1s linear infinite' } : {}} />
              Refresh Insights
            </button>
          </div>
        </div>

        {/* Section 7 — Executive Insights (AI Summary) — shown first for exec view */}
        <div style={{ ...section, border: `1.5px solid ${GBORDER}`, background: GDIM }}>
          <SectionHeader icon={<Brain size={16} />} title="Executive AI Insights" sub="Real-time summary generated by Executive Reporting Agent" />
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: TEXT3, fontSize: 14 }}>
              <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Generating insights...
            </div>
          ) : insights ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: CARD, borderRadius: 12, padding: 16 }}>
                <div style={{ textAlign: 'center', flexShrink: 0 }}>
                  <div style={{ fontSize: 36, fontWeight: 800, color: insights.healthScore >= 80 ? GREEN : insights.healthScore >= 60 ? '#f59e0b' : '#ef4444' }}>{insights.healthScore}</div>
                  <div style={{ fontSize: 11, color: TEXT3 }}>Health Score</div>
                </div>
                <p style={{ fontSize: 14, color: TEXT, lineHeight: 1.7, margin: 0 }}>{insights.healthSummary}</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 12, padding: '12px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <Target size={13} color={GREEN} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: GREEN, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Top Recommendation</span>
                  </div>
                  <p style={{ fontSize: 13, color: TEXT, margin: 0, lineHeight: 1.6 }}>{insights.topRecommendation}</p>
                </div>
                <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 12, padding: '12px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <AlertTriangle size={13} color="#f59e0b" />
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Risk Flag</span>
                  </div>
                  <p style={{ fontSize: 13, color: TEXT, margin: 0, lineHeight: 1.6 }}>{insights.riskFlag}</p>
                </div>
              </div>
            </div>
          ) : (
            <p style={{ color: TEXT3, fontSize: 14 }}>Click "Refresh Insights" to generate an AI summary.</p>
          )}
        </div>

        {/* Section 1 — Campaign Performance */}
        <div style={section}>
          <SectionHeader icon={<TrendingUp size={16} />} title="Campaign Performance Summary" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
            <StatCard label="All Time" value={CAMPAIGN_DATA.allTime} sub="campaigns created" icon={<Activity size={15} />} />
            <StatCard label="This Month" value={CAMPAIGN_DATA.thisMonth} sub="campaigns created" color={BLUE} icon={<Activity size={15} />} />
            <StatCard label="This Week" value={CAMPAIGN_DATA.thisWeek} sub="campaigns created" color={PURPLE} icon={<Activity size={15} />} />
            <StatCard label="Success Rate" value={`${CAMPAIGN_DATA.successRate}%`} sub="hit KPI targets" color={GREEN} icon={<CheckCircle2 size={15} />} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ background: CARD2, borderRadius: 12, padding: 14, display: 'flex', gap: 16 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: GREEN }}>{CAMPAIGN_DATA.active}</div>
                <div style={{ fontSize: 11, color: TEXT3 }}>Active</div>
              </div>
              <div style={{ width: 1, background: BORDER }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: TEXT2 }}>{CAMPAIGN_DATA.completed}</div>
                <div style={{ fontSize: 11, color: TEXT3 }}>Completed</div>
              </div>
            </div>
            <div style={{ background: CARD2, borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, marginBottom: 4 }}>TOP CAMPAIGN</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: TEXT, marginBottom: 4 }}>{CAMPAIGN_DATA.topCampaign.name}</div>
              <div style={{ fontSize: 12, color: TEXT2 }}>Engagement: {CAMPAIGN_DATA.topCampaign.engagement} · Reach: {CAMPAIGN_DATA.topCampaign.reach}</div>
            </div>
          </div>
        </div>

        {/* Section 2 — Content Generated */}
        <div style={section}>
          <SectionHeader icon={<FileText size={16} />} title="Content Generated Report" sub={`${CONTENT_DATA.total} total pieces`} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: TEXT3, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>By Content Type</div>
              {CONTENT_DATA.breakdown.map(b => (
                <div key={b.type} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: b.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: TEXT, flex: 1 }}>{b.type}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: b.color }}>{b.count}</span>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: TEXT3, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>By Channel</div>
              {CONTENT_DATA.channels.map(c => (
                <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: TEXT, flex: 1 }}>{c.name}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: c.color }}>{c.count}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10, padding: '10px 14px', textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: GREEN }}>{CONTENT_DATA.approved}</div>
              <div style={{ fontSize: 11, color: TEXT3 }}>Brand Approved</div>
            </div>
            <div style={{ flex: 1, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 14px', textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#ef4444' }}>{CONTENT_DATA.rejected}</div>
              <div style={{ fontSize: 11, color: TEXT3 }}>Rejected by Governance</div>
            </div>
            <div style={{ flex: 2, background: CARD2, borderRadius: 10, padding: '10px 14px' }}>
              <div style={{ fontSize: 11, color: TEXT3, marginBottom: 2 }}>Most Used Type</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: GOLD }}>{CONTENT_DATA.mostUsed}</div>
            </div>
          </div>
        </div>

        {/* Section 3 — Agent Activity Log */}
        <div style={section}>
          <SectionHeader icon={<Zap size={16} />} title="Agent Activity Log" sub="Usage count across all agents this month" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {AGENT_DATA.sort((a, b) => b.uses - a.uses).map((ag, i) => (
              <motion.div key={ag.name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                style={{ background: CARD2, borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: ag.color, flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: TEXT, flex: 1 }}>{ag.name}</span>
                <span style={{ fontSize: 11, color: TEXT3, display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={10} />{ag.lastActive}</span>
                <span style={{ fontSize: 12, color: TEXT3, minWidth: 80, textAlign: 'right' }}>{ag.outputs} outputs</span>
                <div style={{ background: `${ag.color}18`, border: `1px solid ${ag.color}30`, borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 700, color: ag.color, minWidth: 50, textAlign: 'center' }}>
                  {ag.uses}x
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Section 4 — Audience Intelligence */}
        <div style={section}>
          <SectionHeader icon={<Users size={16} />} title="Audience Intelligence Report" sub={`${AUDIENCE_DATA.total} total segments built · ${AUDIENCE_DATA.totalReach} total reach`} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {AUDIENCE_DATA.breakdown.map(a => (
              <div key={a.type} style={{ background: CARD2, borderRadius: 12, padding: '14px', textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: a.color, marginBottom: 4 }}>{a.count}</div>
                <div style={{ fontSize: 11, color: TEXT3, lineHeight: 1.4 }}>{a.type}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, background: GDIM, border: `1px solid ${GBORDER}`, borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, color: TEXT2 }}>Combined audience reach across all segments</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: GOLD }}>{AUDIENCE_DATA.totalReach}</span>
          </div>
        </div>

        {/* Section 5 — Budget & ROI */}
        <div style={section}>
          <SectionHeader icon={<DollarSign size={16} />} title="Budget & ROI Overview" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
            <StatCard label="Total Allocated" value={BUDGET_DATA.allocated} color={GOLD} icon={<DollarSign size={15} />} />
            <StatCard label="Total Spent" value={BUDGET_DATA.spent} sub={`${BUDGET_DATA.spendPct}% of budget`} color={BLUE} icon={<TrendingUp size={15} />} />
            <StatCard label="Remaining" value={BUDGET_DATA.remaining} color={GREEN} icon={<CheckCircle2 size={15} />} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {BUDGET_DATA.campaigns.map(c => (
              <div key={c.name} style={{ background: CARD2, borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: TEXT, flex: 1 }}>{c.name}</span>
                <span style={{ fontSize: 12, color: TEXT3 }}>Allocated: {c.allocated}</span>
                <span style={{ fontSize: 12, color: TEXT3 }}>Spent: {c.spent}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: GREEN, background: 'rgba(16,185,129,0.1)', borderRadius: 8, padding: '2px 10px' }}>ROI {c.roi}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Section 6 — Brand Governance */}
        <div style={section}>
          <SectionHeader icon={<Shield size={16} />} title="Brand Governance Summary" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
            <StatCard label="Total Reviewed" value={GOVERNANCE_DATA.reviewed} icon={<Shield size={15} />} />
            <StatCard label="Approved" value={GOVERNANCE_DATA.approved} color={GREEN} icon={<CheckCircle2 size={15} />} />
            <StatCard label="Flagged" value={GOVERNANCE_DATA.flagged} color="#f59e0b" icon={<AlertTriangle size={15} />} />
            <StatCard label="Rejected" value={GOVERNANCE_DATA.rejected} color="#ef4444" icon={<AlertTriangle size={15} />} />
          </div>
          {GOVERNANCE_DATA.pendingHumanReview > 0 && (
            <div style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontSize: 13, color: '#6366f1', fontWeight: 600 }}>
                {GOVERNANCE_DATA.pendingHumanReview} items pending human review
              </span>
              <button onClick={() => navigate('/brand-governance')} style={{ background: PURPLE, color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                Review Now <ChevronRight size={12} />
              </button>
            </div>
          )}
          <div style={{ fontSize: 11, fontWeight: 700, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Last 5 Audit Actions</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {GOVERNANCE_DATA.recentAudit.map((entry, i) => {
              const st = statusStyle(entry.status)
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, background: CARD2, borderRadius: 10, padding: '9px 14px' }}>
                  <span style={{ fontSize: 11, fontFamily: 'monospace', color: TEXT3, minWidth: 56 }}>{entry.id}</span>
                  <span style={{ fontSize: 11, background: st.bg, color: st.color, borderRadius: 20, padding: '2px 10px', fontWeight: 600, minWidth: 80, textAlign: 'center' }}>{st.label}</span>
                  <span style={{ fontSize: 13, color: TEXT, flex: 1 }}>{entry.type}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: entry.score >= 80 ? GREEN : entry.score >= 60 ? '#f59e0b' : '#ef4444' }}>{entry.score}</span>
                  <span style={{ fontSize: 11, color: TEXT3, display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={10} />{entry.time}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Quick Nav */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[
            { label: 'View Analytics', path: '/analytics', color: PURPLE },
            { label: 'Brand Governance', path: '/brand-governance', color: GOLD },
            { label: 'Approval Queue', path: '/queue', color: GREEN },
            { label: 'Campaign Hub', path: '/campaign-hub', color: BLUE },
          ].map(btn => (
            <button key={btn.path} onClick={() => navigate(btn.path)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: `${btn.color}15`, border: `1px solid ${btn.color}30`, borderRadius: 10, padding: '9px 18px', color: btn.color, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              {btn.label} <ChevronRight size={13} />
            </button>
          ))}
        </div>

      </div>
      <JourneyFooter currentPath="/executive-report" />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
