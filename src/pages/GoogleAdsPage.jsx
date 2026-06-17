import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart2, Link2, Check, AlertCircle, Loader2,
  Download, Send, Plus, X, ArrowRight, Zap,
} from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { redirectToLogin } from '../lib/authUtils.js'
import { getOrCreateUser } from '../services/userService'

const BG    = '#0a0a0a'
const CARD  = '#111'
const BLUE  = '#4285f4'
const BORDER = 'rgba(255,255,255,0.08)'
const TEXT2  = 'rgba(255,255,255,0.55)'
const TEXT3  = 'rgba(255,255,255,0.28)'

const GOOGLE_ADS_N8N = import.meta.env.VITE_GOOGLE_ADS_N8N_WEBHOOK || ''

function Label({ children }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, color: TEXT3, letterSpacing: '0.08em',
      textTransform: 'uppercase', marginBottom: 6 }}>
      {children}
    </div>
  )
}

function Input({ value, onChange, placeholder, type = 'text', style = {} }) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.04)',
        border: `1px solid ${BORDER}`, borderRadius: 10, color: '#fff',
        fontSize: 14, outline: 'none', fontFamily: "'Inter',sans-serif", boxSizing: 'border-box',
        ...style,
      }}
    />
  )
}

function buildCSV(form) {
  const rows = []

  // ── Campaign row ──
  rows.push(['Type', 'Campaign', 'Ad Group', 'Keyword', 'Match Type',
    'Headline 1', 'Headline 2', 'Headline 3',
    'Description 1', 'Description 2', 'Final URL',
    'Daily Budget', 'Start Date', 'End Date', 'Status', 'Network'])

  rows.push([
    'Campaign', form.campaignName, '', '', '',
    '', '', '', '', '', '',
    form.dailyBudget, form.startDate, form.endDate, 'Enabled',
    form.network,
  ])

  // ── Ad Group row ──
  rows.push([
    'Ad Group', form.campaignName, form.adGroupName, '', '',
    '', '', '', '', '', '', '', '', '', 'Enabled', '',
  ])

  // ── Keywords ──
  form.keywords.filter(Boolean).forEach(kw => {
    rows.push([
      'Keyword', form.campaignName, form.adGroupName, kw, form.matchType,
      '', '', '', '', '', '', '', '', '', 'Enabled', '',
    ])
  })

  // ── Responsive Search Ad ──
  rows.push([
    'Responsive Search Ad', form.campaignName, form.adGroupName, '', '',
    form.headline1, form.headline2, form.headline3,
    form.desc1, form.desc2, form.finalUrl,
    '', '', '', 'Enabled', '',
  ])

  return rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
}

function downloadCSV(content, filename) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function GoogleAdsPage() {
  const navigate = useNavigate()
  const { user, status } = useAuth()

  const [gadsConn, setGadsConn]   = useState(null)   // null=loading, false=not connected, obj=connected
  const [pushing,  setPushing]    = useState(false)
  const [pushMsg,  setPushMsg]    = useState('')
  const [pushErr,  setPushErr]    = useState('')

  const [form, setForm] = useState({
    campaignName : 'Evoke CMO - Search Campaign',
    adGroupName  : 'Ad Group 1',
    dailyBudget  : '500',
    startDate    : new Date().toISOString().split('T')[0],
    endDate      : '',
    network      : 'Search',
    matchType    : 'Phrase Match',
    finalUrl     : 'https://agents.evokemarketplace.com/',
    headline1    : 'AI-Powered CMO Platform',
    headline2    : 'Automate Your Marketing with AI',
    headline3    : 'Try Evoke CMO Free Today',
    desc1        : 'AI agents that handle your content, campaigns & analytics. Start free today.',
    desc2        : 'Replace 10 tools with one AI CMO. No agency needed.',
    keywords     : ['AI marketing tool', 'AI CMO platform', 'marketing automation AI', ''],
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const setKw = (i, v) => setForm(f => {
    const kws = [...f.keywords]; kws[i] = v; return { ...f, keywords: kws }
  })
  const addKw  = () => setForm(f => ({ ...f, keywords: [...f.keywords, ''] }))
  const removeKw = i => setForm(f => ({ ...f, keywords: f.keywords.filter((_, idx) => idx !== i) }))

  useEffect(() => {
    if (status === 'loading') return
    if (!user) { redirectToLogin(); return }
    getOrCreateUser(user.uid, user.displayName, user.email)
      .then(data => {
        const conn = data.socialAccounts?.['google-ads']
        setGadsConn(conn?.connected ? conn : false)
      })
      .catch(() => setGadsConn(false))
  }, [user, status])

  const handleExportCSV = () => {
    const csv = buildCSV(form)
    downloadCSV(csv, `${form.campaignName.replace(/\s+/g, '_')}.csv`)
  }

  const handlePushN8N = async () => {
    if (!GOOGLE_ADS_N8N) {
      setPushErr('n8n webhook URL not configured. Add VITE_GOOGLE_ADS_N8N_WEBHOOK to your .env file.')
      return
    }
    setPushing(true); setPushMsg(''); setPushErr('')
    try {
      const res = await fetch(GOOGLE_ADS_N8N, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, uid: user?.uid, connection: gadsConn }),
      })
      if (!res.ok) throw new Error('Webhook returned ' + res.status)
      setPushMsg('Campaign sent to n8n successfully! Check your n8n workflow for next steps.')
    } catch (e) {
      setPushErr('Push failed: ' + e.message)
    } finally {
      setPushing(false)
    }
  }

  if (status === 'loading' || gadsConn === null) {
    return (
      <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={32} style={{ color: BLUE, animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: BG, color: '#fff', fontFamily: "'Inter',sans-serif" }}>
      <Navbar />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '96px 24px 80px' }}>

        {/* ── Header ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
            <div style={{ width: 46, height: 46, borderRadius: 13, background: `${BLUE}18`,
              border: `1px solid ${BLUE}35`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BarChart2 size={22} color={BLUE} />
            </div>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.02em', margin: 0 }}>
                Google Ads Manager
              </h1>
              <p style={{ color: TEXT2, fontSize: 14, margin: 0 }}>Build, export & push your Search campaigns from EVOX</p>
            </div>
          </div>
        </motion.div>

        {/* ── Connection Status ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          style={{ background: CARD, border: `1px solid ${gadsConn ? '#10b981' + '30' : BORDER}`,
            borderRadius: 16, padding: '18px 22px', marginBottom: 28,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <GoogleAdsIcon />
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Google Ads Account</div>
              {gadsConn
                ? <div style={{ fontSize: 12, color: '#10b981' }}>Connected — {gadsConn.email || gadsConn.name || 'Account linked'}</div>
                : <div style={{ fontSize: 12, color: '#f59e0b' }}>Not connected — connect to enable live push</div>}
            </div>
          </div>
          {gadsConn ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
              <span style={{ fontSize: 12, color: '#10b981', fontWeight: 700 }}>Connected</span>
            </div>
          ) : (
            <button
              onClick={() => { sessionStorage.setItem('connectReturnTo', '/google-ads-manager'); navigate('/connect-accounts') }}
              style={{ padding: '9px 18px', background: `linear-gradient(135deg,${BLUE},#1a73e8)`,
                border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 700,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Link2 size={13} /> Connect Google Ads
            </button>
          )}
        </motion.div>

        {/* ── Campaign Builder ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 28, marginBottom: 24 }}>

          <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 24, letterSpacing: '-0.01em' }}>
            Campaign Settings
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
            <div>
              <Label>Campaign Name</Label>
              <Input value={form.campaignName} onChange={v => set('campaignName', v)} placeholder="My Campaign" />
            </div>
            <div>
              <Label>Ad Group Name</Label>
              <Input value={form.adGroupName} onChange={v => set('adGroupName', v)} placeholder="Ad Group 1" />
            </div>
            <div>
              <Label>Daily Budget (₹)</Label>
              <Input value={form.dailyBudget} onChange={v => set('dailyBudget', v)} placeholder="500" type="number" />
            </div>
            <div>
              <Label>Network</Label>
              <select value={form.network} onChange={e => set('network', e.target.value)}
                style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${BORDER}`, borderRadius: 10, color: '#fff',
                  fontSize: 14, outline: 'none', fontFamily: "'Inter',sans-serif" }}>
                <option>Search</option>
                <option>Display</option>
                <option>Search and Display</option>
              </select>
            </div>
            <div>
              <Label>Start Date</Label>
              <Input value={form.startDate} onChange={v => set('startDate', v)} type="date" />
            </div>
            <div>
              <Label>End Date (optional)</Label>
              <Input value={form.endDate} onChange={v => set('endDate', v)} type="date" />
            </div>
          </div>

          <div style={{ marginBottom: 18 }}>
            <Label>Final URL</Label>
            <Input value={form.finalUrl} onChange={v => set('finalUrl', v)} placeholder="https://yoursite.com/" />
          </div>
        </motion.div>

        {/* ── Ad Copy ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 28, marginBottom: 24 }}>

          <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 6, letterSpacing: '-0.01em' }}>
            Ad Copy
          </h2>
          <p style={{ fontSize: 12, color: TEXT3, marginBottom: 22 }}>
            Paste your copy from Ads Creation or use the AI suggestions below
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 18 }}>
            {['headline1','headline2','headline3'].map((k, i) => (
              <div key={k}>
                <Label>Headline {i + 1} <span style={{ color: TEXT3, fontWeight: 400 }}>(max 30 chars)</span></Label>
                <Input
                  value={form[k]}
                  onChange={v => v.length <= 30 && set(k, v)}
                  placeholder={`Headline ${i + 1}`}
                />
                <div style={{ fontSize: 10, color: form[k].length > 25 ? '#f59e0b' : TEXT3, marginTop: 4, textAlign: 'right' }}>
                  {form[k].length}/30
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {['desc1','desc2'].map((k, i) => (
              <div key={k}>
                <Label>Description {i + 1} <span style={{ color: TEXT3, fontWeight: 400 }}>(max 90 chars)</span></Label>
                <textarea
                  value={form[k]}
                  onChange={e => e.target.value.length <= 90 && set(k, e.target.value)}
                  placeholder={`Description ${i + 1}`}
                  rows={3}
                  style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.04)',
                    border: `1px solid ${BORDER}`, borderRadius: 10, color: '#fff',
                    fontSize: 14, outline: 'none', fontFamily: "'Inter',sans-serif",
                    resize: 'vertical', boxSizing: 'border-box' }}
                />
                <div style={{ fontSize: 10, color: form[k].length > 80 ? '#f59e0b' : TEXT3, marginTop: 2, textAlign: 'right' }}>
                  {form[k].length}/90
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Keywords ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 28, marginBottom: 24 }}>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, letterSpacing: '-0.01em' }}>Keywords</h2>
              <p style={{ fontSize: 12, color: TEXT3, margin: '4px 0 0' }}>Add keywords from your Target Audience output</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <select value={form.matchType} onChange={e => set('matchType', e.target.value)}
                style={{ padding: '7px 12px', background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${BORDER}`, borderRadius: 8, color: '#fff',
                  fontSize: 12, outline: 'none', fontFamily: "'Inter',sans-serif" }}>
                <option>Exact Match</option>
                <option>Phrase Match</option>
                <option>Broad Match</option>
              </select>
              <button onClick={addKw}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px',
                  background: `${BLUE}18`, border: `1px solid ${BLUE}35`, borderRadius: 8,
                  color: BLUE, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                <Plus size={12} /> Add
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {form.keywords.map((kw, i) => (
              <div key={i} style={{ display: 'flex', gap: 8 }}>
                <input
                  value={kw}
                  onChange={e => setKw(i, e.target.value)}
                  placeholder={`Keyword ${i + 1}`}
                  style={{ flex: 1, padding: '9px 13px', background: 'rgba(255,255,255,0.04)',
                    border: `1px solid ${BORDER}`, borderRadius: 9, color: '#fff',
                    fontSize: 13, outline: 'none', fontFamily: "'Inter',sans-serif" }}
                />
                {form.keywords.length > 1 && (
                  <button onClick={() => removeKw(i)}
                    style={{ width: 34, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                      borderRadius: 8, color: '#f87171', cursor: 'pointer', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <X size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Ad Preview ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          style={{ background: '#fff', borderRadius: 16, padding: 20, marginBottom: 28 }}>
          <div style={{ fontSize: 11, color: '#5f6368', marginBottom: 4, fontFamily: 'Arial, sans-serif' }}>Ad · {form.finalUrl}</div>
          <div style={{ fontSize: 18, color: '#1a0dab', fontWeight: 400, fontFamily: 'Arial, sans-serif', marginBottom: 4 }}>
            {[form.headline1, form.headline2, form.headline3].filter(Boolean).join(' | ')}
          </div>
          <div style={{ fontSize: 14, color: '#4d5156', fontFamily: 'Arial, sans-serif', lineHeight: 1.5 }}>
            {form.desc1} {form.desc2}
          </div>
        </motion.div>

        {/* ── Push/Export messages ── */}
        <AnimatePresence>
          {pushMsg && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ display: 'flex', gap: 10, padding: '14px 18px', background: 'rgba(16,185,129,0.08)',
                border: '1px solid rgba(16,185,129,0.3)', borderRadius: 12, marginBottom: 16,
                alignItems: 'flex-start' }}>
              <Check size={15} style={{ color: '#10b981', marginTop: 1, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: '#10b981' }}>{pushMsg}</span>
            </motion.div>
          )}
          {pushErr && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ display: 'flex', gap: 10, padding: '14px 18px', background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, marginBottom: 16,
                alignItems: 'flex-start' }}>
              <AlertCircle size={15} style={{ color: '#f87171', marginTop: 1, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: '#f87171' }}>{pushErr}</span>
              <button onClick={() => setPushErr('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: TEXT3 }}>
                <X size={13} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Action Buttons ── */}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <button onClick={handleExportCSV}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '13px 24px',
              background: 'rgba(255,255,255,0.06)', border: `1px solid ${BORDER}`,
              borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            <Download size={16} /> Download Google Ads CSV
          </button>

          <button onClick={handlePushN8N} disabled={pushing}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '13px 24px',
              background: pushing ? 'rgba(66,133,244,0.3)' : `linear-gradient(135deg,${BLUE},#1a73e8)`,
              border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 700,
              cursor: pushing ? 'not-allowed' : 'pointer', opacity: pushing ? 0.7 : 1 }}>
            {pushing
              ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Pushing…</>
              : <><Send size={15} /> Push via n8n</>}
          </button>

          <button onClick={() => navigate('/package-c')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '13px 20px',
              background: 'none', border: `1px solid ${BORDER}`, borderRadius: 12,
              color: TEXT2, fontSize: 13, cursor: 'pointer' }}>
            Back to Package C
          </button>
        </div>

        <div style={{ marginTop: 16, padding: '14px 18px', background: 'rgba(66,133,244,0.06)',
          border: '1px solid rgba(66,133,244,0.15)', borderRadius: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: BLUE, marginBottom: 4 }}>How to use Google Ads CSV Export</div>
          <ol style={{ fontSize: 12, color: TEXT2, margin: 0, paddingLeft: 18, lineHeight: 1.8 }}>
            <li>Click <strong style={{ color: '#fff' }}>Download Google Ads CSV</strong></li>
            <li>Open <strong style={{ color: '#fff' }}>Google Ads Editor</strong> (free download from Google)</li>
            <li>Go to <strong style={{ color: '#fff' }}>File → Import → Import CSV</strong></li>
            <li>Select the downloaded file → Review → Post changes</li>
          </ol>
        </div>

      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

function GoogleAdsIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 48 48">
      <path fill="#4285F4" d="M44 24a20 20 0 1 1-40 0 20 20 0 0 1 40 0z" opacity=".1"/>
      <path fill="#fbbc05" d="M5.6 30.3 15 14a4.5 4.5 0 0 1 7.8 4.5L13.4 34.8A4.5 4.5 0 0 1 5.6 30.3z"/>
      <path fill="#34a853" d="M24 38.5h-9a4.5 4.5 0 0 1 0-9h18a4.5 4.5 0 0 1 0 9H24z"/>
      <path fill="#ea4335" d="M33 14a4.5 4.5 0 0 0-7.8 4.5l9.4 16.3a4.5 4.5 0 1 0 7.8-4.5L33 14z"/>
    </svg>
  )
}
