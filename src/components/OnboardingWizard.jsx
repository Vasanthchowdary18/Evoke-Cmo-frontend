import React, { useState, useRef } from 'react'
import {
  ArrowRight, Check, ChevronDown, Loader2, Sparkles, X,
  BarChart3, Megaphone, Instagram, Linkedin, Video, Mail, Database,
  Cloud, ShoppingBag, Globe, FileText, Palette, Users, Upload, Download,
} from 'lucide-react'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../hooks/useAuth.js'
import { saveKnowledgeBase } from '../services/knowledgeBaseService.js'
import { getRecommendations } from './BrandSetupModal.jsx'

const BG      = '#0A0A0F'
const CARD    = '#111118'
const CARD2   = '#1A1A24'
const BORDER  = '#2A2A3A'
const GOLD    = '#BE954A'
const GDIM    = '#BE954A1A'
const GBORD   = '#BE954A40'
const TEXT    = '#FFFFFF'
const TEXT2   = '#9B9BB0'
const GREEN   = '#10b981'
const AMBER   = '#f59e0b'
const RED     = '#ef4444'
const FHEAD   = "'Outfit','Inter',sans-serif"
const FBODY   = "'Geist','Inter',sans-serif"

const STEP_META = [
  { label: 'Cognitive System Tuning',   pct: 16,  width: 720 },
  { label: 'Brand System Definition',   pct: 33,  width: 720 },
  { label: 'Connect System API',        pct: 50,  width: 800 },
  { label: 'Marketing Plan Tuning',     pct: 66,  width: 840 },
  { label: 'Neural Network Ingestion',  pct: 83,  width: 800 },
  { label: 'Cognitive Audit Report',    pct: 100, width: 900 },
]

// Maps PricingPage.jsx plan keys ('free' | 'pro' | 'enterprise') to the
// internal plan-gating system's keys used by planGate.js / useUserPlan.
const PLAN_KEY_MAP = { free: 'free', pro: 'package-c', enterprise: 'package-c' }

const INDUSTRY_OPTIONS = [
  { value: 'ecommerce',  label: 'E-commerce & Retail' },
  { value: 'fashion',    label: 'Fashion & Apparel' },
  { value: 'saas',       label: 'SaaS / Tech' },
  { value: 'services',   label: 'Professional Services' },
  { value: 'restaurant', label: 'Food & Beverage' },
  { value: 'health',     label: 'Health & Fitness' },
  { value: 'education',  label: 'Education' },
  { value: 'other',      label: 'Other' },
]
const PORTFOLIO_OPTIONS = ['1 - 10 Employees', '11 - 50 Employees', '50 - 250 Employees', '250+ Employees']
const VOICE_OPTIONS = ['Professional & Authoritative', 'Bold & Intellectual', 'Casual & Friendly', 'Luxury & Premium', 'Playful & Fun', 'Educational']
const VALUE_TAGS = ['Sustainability', 'Timelessness', 'Avant-Garde', 'Craftsmanship', 'Innovation', 'Heritage', 'Boldness', 'Elegance']

const INTEGRATIONS = [
  { key: 'googleAnalytics', label: 'Google Analytics',    icon: BarChart3,   connectedByDefault: true },
  { key: 'metaAds',         label: 'Meta / Facebook Ads', icon: Megaphone,   connectedByDefault: false },
  { key: 'instagram',       label: 'Instagram Business',  icon: Instagram,   connectedByDefault: false },
  { key: 'linkedin',        label: 'LinkedIn Marketing',  icon: Linkedin,    connectedByDefault: false },
  { key: 'tiktok',          label: 'TikTok for Business', icon: Video,       connectedByDefault: false },
  { key: 'gmail',           label: 'Gmail',               icon: Mail,        connectedByDefault: true },
  { key: 'hubspot',         label: 'HubSpot',             icon: Database,    connectedByDefault: false },
  { key: 'salesforce',      label: 'Salesforce CRM',      icon: Cloud,       connectedByDefault: false },
  { key: 'shopify',         label: 'Shopify Store',       icon: ShoppingBag, connectedByDefault: true },
  { key: 'wordpress',       label: 'WordPress CMS',       icon: Globe,       connectedByDefault: false },
]

const GOAL_OPTIONS = [
  { value: 'sales',           label: 'Increase Revenue',   desc: 'Focus AI activities on improving ROAS and scaling transactional revenue pipelines.' },
  { value: 'brand_awareness', label: 'Brand Awareness',    desc: 'Build reach through aggressive social publishing and technical industry reviews.' },
  { value: 'leads',           label: 'Lead Generation',    desc: 'Configure agents to capture executive and professional emails on high-value gated pages.' },
]

const AGENT_OPTIONS = [
  { key: 'strategy',   label: 'Strategy Agent',   desc: 'Audits competitors & constructs tactical quarters',              defaultOn: true },
  { key: 'content',    label: 'Content Agent',    desc: 'Publishes longform copy, blogs, and newsletter programs',        defaultOn: true },
  { key: 'creative',   label: 'Creative Agent',   desc: 'Directs visual asset direction & constructs luxury style scopes', defaultOn: true },
  { key: 'seo',        label: 'SEO Agent',        desc: 'Audits semantic errors, markers & backlink indexes',              defaultOn: false },
  { key: 'ads',        label: 'Ads Agent',        desc: 'Monitors paid channel budget parameters',                         defaultOn: false },
  { key: 'analytics',  label: 'Analytics Agent',  desc: 'Extracts cross-system marketing multi-touch metrics',            defaultOn: true },
  { key: 'automation', label: 'Automation Agent', desc: 'Sequences operational task-chains cleanly',                      defaultOn: true },
]

const TRAINING_SOURCES = [
  { key: 'website',   label: 'Website Crawl',           sub: (a) => a.domain || 'https://yourbrand.com', icon: Globe,       pct: 82,  status: '82% Synced' },
  { key: 'documents', label: 'Upload Documents',        sub: () => 'Company Profile, Press Releases',    icon: FileText,    pct: 100, status: '100% Ready' },
  { key: 'style',     label: 'Brand Style Guidelines',  sub: () => 'Primary Palette, Type Specs',        icon: Palette,     pct: 45,  status: '45% Parsing' },
  { key: 'catalog',   label: 'Product Catalog',         sub: () => 'Store Inventory',                    icon: ShoppingBag, pct: 90,  status: '90% Indexed' },
  { key: 'personas',  label: 'Customer Personas',       sub: () => '3 Buyer Archetypes',                 icon: Users,       pct: 100, status: '100% Ingested' },
  { key: 'crm',       label: 'Import CRM Data',         sub: () => 'Historical Records',                 icon: Database,    pct: 60,  status: '60% Loading' },
]

const SCORECARD = [
  { label: 'Website Performance',    score: 82, tag: 'Healthy' },
  { label: 'SEO Coverage',           score: 68, tag: '12 Critical Errors' },
  { label: 'Social Media Health',    score: 71, tag: 'Good Reach' },
  { label: 'Content Quality',        score: 65, tag: 'Thin Copy Found' },
  { label: 'Market Opportunities',   score: 92, tag: '8 Opportunities Found' },
]

const FINDINGS = [
  { text: 'Broken canonical meta tags detected',                    category: 'SEO Coverage',        severity: 'High' },
  { text: 'Average site loading speed > 3.4 seconds on mobile',     category: 'Website Performance',  severity: 'Medium' },
  { text: 'No structured brand story or product schemas present',  category: 'Content Quality',      severity: 'High' },
  { text: 'Unused local keywords detected for premium items',       category: 'Market Opportunities', severity: 'Low' },
]
const SEVERITY_COLOR = { High: RED, Medium: AMBER, Low: GREEN }

function SectionLabel({ children }) {
  return <div style={{ fontFamily: FBODY, fontSize: 11, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: GOLD }}>{children}</div>
}

function fieldWrap(label, children) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minWidth: 0 }}>
      <div style={{ fontFamily: FBODY, fontSize: 11, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: TEXT }}>{label}</div>
      {children}
    </div>
  )
}

const inputStyle = {
  width: '100%', boxSizing: 'border-box', padding: 12, background: BG,
  border: `1px solid ${BORDER}`, borderRadius: 8, color: TEXT, fontSize: 14,
  fontFamily: FBODY, outline: 'none',
}

function TextField({ label, value, onChange, placeholder }) {
  return fieldWrap(label, (
    <input value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={inputStyle} />
  ))
}

function SelectField({ label, value, onChange, options }) {
  return fieldWrap(label, (
    <div style={{ position: 'relative' }}>
      <select value={value || ''} onChange={e => onChange(e.target.value)}
        style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}>
        <option value="" disabled>Select…</option>
        {options.map(o => typeof o === 'string'
          ? <option key={o} value={o}>{o}</option>
          : <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown size={16} color={TEXT2} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
    </div>
  ))
}

function Divider() {
  return <div style={{ height: 1, background: BORDER, width: '100%', flexShrink: 0 }} />
}

function StepHeader({ index, title, subtitle }) {
  const meta = STEP_META[index]
  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: FBODY, fontSize: 11, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: GOLD }}>
            Step {index + 1} of 6: {meta.label}
          </span>
          <span style={{ fontFamily: FBODY, fontSize: 12, color: TEXT2 }}>{meta.pct}% Completed</span>
        </div>
        <div style={{ height: 6, background: BORDER, borderRadius: 99, overflow: 'hidden', width: '100%' }}>
          <div style={{ height: '100%', width: `${meta.pct}%`, background: GOLD, borderRadius: 99, transition: 'width 0.3s' }} />
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
        <div style={{ fontFamily: FHEAD, fontSize: 32, fontWeight: 700, color: TEXT }}>{title}</div>
        <div style={{ fontFamily: FBODY, fontSize: 15, color: TEXT2, lineHeight: 1.5 }}>{subtitle}</div>
      </div>
      <Divider />
    </>
  )
}

function StepFooter({ onBack, backLabel, onNext, nextLabel, nextDisabled, saving, leftSlot }) {
  return (
    <>
      <Divider />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        {leftSlot || (onBack
          ? <button onClick={onBack} style={{ background: 'none', border: 'none', color: TEXT2, fontFamily: FBODY, fontSize: 14, fontWeight: 600, textDecoration: 'underline', cursor: 'pointer', padding: 0 }}>{backLabel}</button>
          : <div style={{ display: 'flex', gap: 6 }}>
              {STEP_META.map((_, i) => (
                <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: i === 0 ? GOLD : BORDER }} />
              ))}
            </div>)}
        <button onClick={onNext} disabled={nextDisabled || saving} style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '14px 28px',
          background: nextDisabled ? BORDER : GOLD, border: 'none', borderRadius: 100,
          color: nextDisabled ? TEXT2 : BG, fontFamily: FHEAD, fontSize: 15, fontWeight: 600,
          letterSpacing: '0.5px', textTransform: 'uppercase',
          cursor: nextDisabled ? 'not-allowed' : 'pointer',
        }}>
          {saving ? <Loader2 size={16} style={{ animation: 'spin 0.7s linear infinite' }}/> : null}
          {saving ? 'Saving…' : nextLabel} {!saving && <ArrowRight size={16}/>}
        </button>
      </div>
    </>
  )
}

export default function OnboardingWizard({ onComplete, onDismiss }) {
  const { user } = useAuth()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef(null)

  const [f, setF] = useState({
    companyName: '', domain: '', industry: '', portfolioSize: '', workspace: '',
    brandName: '', brandVoice: '', tagline: '', brandColor: GOLD, values: [], mission: '', logoName: '',
    integrations: Object.fromEntries(INTEGRATIONS.map(i => [i.key, i.connectedByDefault])),
    goal: 'sales',
    agents: Object.fromEntries(AGENT_OPTIONS.map(a => [a.key, a.defaultOn])),
  })
  const set = (key, val) => setF(prev => ({ ...prev, [key]: val }))
  const toggleValue = (tag) => setF(prev => ({ ...prev, values: prev.values.includes(tag) ? prev.values.filter(v => v !== tag) : [...prev.values, tag] }))
  const toggleIntegration = (key) => setF(prev => ({ ...prev, integrations: { ...prev.integrations, [key]: !prev.integrations[key] } }))
  const toggleAgent = (key) => setF(prev => ({ ...prev, agents: { ...prev.agents, [key]: !prev.agents[key] } }))

  const next = () => setStep(s => Math.min(5, s + 1))
  const back = () => setStep(s => Math.max(0, s - 1))

  const step1Valid = f.companyName.trim() && f.industry
  const step2Valid = f.brandName.trim()

  const toneFromVoice = (voice) => {
    const v = (voice || '').toLowerCase()
    if (v.includes('bold'))       return 'bold'
    if (v.includes('luxury'))     return 'luxury'
    if (v.includes('casual'))     return 'casual'
    if (v.includes('education'))  return 'educational'
    if (v.includes('playful'))    return 'playful'
    return 'professional'
  }

  const handleFinish = async () => {
    setSaving(true)
    let rawPlan = 'free'
    try { rawPlan = localStorage.getItem('evoke_selected_package') || 'free' } catch {}
    const selectedPlan = PLAN_KEY_MAP[rawPlan] || rawPlan
    const final = {
      businessName: f.companyName,
      website: f.domain,
      industry: f.industry,
      portfolioSize: f.portfolioSize,
      workspaceName: f.workspace,
      brandName: f.brandName || f.companyName,
      tone: [toneFromVoice(f.brandVoice)],
      brandVoice: f.brandVoice,
      tagline: f.tagline,
      brandColor: f.brandColor,
      brandValues: f.values,
      missionStatement: f.mission,
      integrations: f.integrations,
      goal: [f.goal],
      activeAgents: Object.entries(f.agents).filter(([, v]) => v).map(([k]) => k),
      selectedPlan,
    }
    try {
      const recs = getRecommendations(final)
      if (user?.uid) {
        await saveKnowledgeBase(user.uid, { ...final, completedAt: new Date().toISOString() })
        await updateDoc(doc(db, 'users', user.uid), {
          brandSetupComplete: true,
          brandKbComplete: true,
          onboardingComplete: true,
          brandName: final.brandName,
          brandSetup: { ...final, completedAt: serverTimestamp() },
          recommendedRoutes: recs.map(r => r.route),
          selectedPlan,
          userPlan: selectedPlan,
        })
        sessionStorage.setItem('evox_setup_recs', JSON.stringify(recs))
      }
      try { localStorage.removeItem('evoke_selected_package') } catch {}
      onComplete(final, recs)
    } catch (e) {
      console.error(e)
      setSaving(false)
    }
  }

  const exportReport = () => {
    const lines = [
      'EVOKE AI BUSINESS AUDIT REPORT', '',
      `Initial Health Index: 73 / 100`, '',
      ...SCORECARD.map(s => `${s.label}: ${s.score}/100 (${s.tag})`), '',
      'Detailed Findings:',
      ...FINDINGS.map(f => `- [${f.severity}] ${f.text} (${f.category})`),
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'evoke-audit-report.txt'; a.click()
    URL.revokeObjectURL(url)
  }

  const cardWidth = STEP_META[step].width

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: BG, overflowY: 'auto', fontFamily: FBODY, display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } ::placeholder { color: ${TEXT2}; }`}</style>
      {onDismiss && (
        <button onClick={onDismiss} style={{
          position: 'fixed', top: 24, right: 24, zIndex: 10000,
          width: 36, height: 36, borderRadius: '50%', background: CARD, border: `1px solid ${BORDER}`,
          color: TEXT2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <X size={16} />
        </button>
      )}

      <div style={{
        width: '100%', maxWidth: cardWidth, margin: '80px 24px',
        background: CARD, border: `1px solid ${BORDER}`, borderRadius: 24,
        boxShadow: '0px 8px 12px rgba(0,0,0,0.5)',
        padding: 48, boxSizing: 'border-box',
        display: 'flex', flexDirection: 'column', gap: 32,
      }}>

        {step === 0 && (
          <>
            <StepHeader index={0} title="Let's Set Up Your Marketing Command Center"
              subtitle="To coordinate the neural marketing network of specialized agents, we must establish your sovereign workspace profile." />
            <div style={{ display: 'flex', gap: 24, width: '100%' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1, minWidth: 0 }}>
                <TextField label="Company Legal Name" value={f.companyName} onChange={v => set('companyName', v)} placeholder="e.g. Acme Apparel Inc." />
                <TextField label="Primary Domain URL" value={f.domain} onChange={v => set('domain', v)} placeholder="https://yourbrand.com" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1, minWidth: 0 }}>
                <SelectField label="Vertical Industry" value={f.industry} onChange={v => set('industry', v)} options={INDUSTRY_OPTIONS} />
                <SelectField label="Portfolio Size" value={f.portfolioSize} onChange={v => set('portfolioSize', v)} options={PORTFOLIO_OPTIONS} />
              </div>
            </div>
            <TextField label="Workspace Assignment" value={f.workspace} onChange={v => set('workspace', v)} placeholder="e.g. Acme HQ Command" />
            <StepFooter onNext={next} nextLabel="Continue Workspace Tuning" nextDisabled={!step1Valid} />
          </>
        )}

        {step === 1 && (
          <>
            <StepHeader index={1} title="Define Your Brand Identity"
              subtitle="Provide core guidelines so your autonomous CMO can generate aligned campaigns and content matching your aesthetic." />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%' }}>
              <div style={{ display: 'flex', gap: 24, width: '100%' }}>
                <TextField label="Brand Name" value={f.brandName} onChange={v => set('brandName', v)} placeholder="e.g. Acme Luxe" />
                <SelectField label="Brand Voice" value={f.brandVoice} onChange={v => set('brandVoice', v)} options={VOICE_OPTIONS} />
              </div>
              <TextField label="Brand Tagline" value={f.tagline} onChange={v => set('tagline', v)} placeholder="A short line describing your brand" />
              <div style={{ display: 'flex', gap: 24, width: '100%' }}>
                <div style={{ width: 240, flexShrink: 0 }}>
                  {fieldWrap('Primary Brand Color', (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: BG, border: `1px solid ${BORDER}`, borderRadius: 8, padding: 10, position: 'relative' }}>
                      <div style={{ width: 24, height: 24, borderRadius: 4, background: f.brandColor, flexShrink: 0 }} />
                      <span style={{ color: TEXT, fontSize: 14, fontFamily: FBODY }}>{f.brandColor.toUpperCase()}</span>
                      <input type="color" value={f.brandColor} onChange={e => set('brandColor', e.target.value)}
                        style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
                    </div>
                  ))}
                </div>
                {fieldWrap('Brand Values (Tags)', (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, background: BG, border: `1px solid ${BORDER}`, borderRadius: 8, padding: 8, minHeight: 42, boxSizing: 'border-box' }}>
                    {VALUE_TAGS.map(tag => {
                      const on = f.values.includes(tag)
                      return (
                        <button key={tag} onClick={() => toggleValue(tag)} style={{
                          padding: '4px 10px', borderRadius: 4, fontSize: 12, fontFamily: FBODY, cursor: 'pointer',
                          background: on ? CARD2 : 'transparent', border: `1px solid ${on ? BORDER : 'transparent'}`,
                          color: on ? GOLD : TEXT2,
                        }}>{tag}</button>
                      )
                    })}
                  </div>
                ))}
              </div>
              {fieldWrap('Mission Statement', (
                <textarea value={f.mission} onChange={e => set('mission', e.target.value)} placeholder="What does your brand stand for?"
                  style={{ ...inputStyle, height: 80, resize: 'none', fontFamily: FBODY }} />
              ))}
              {fieldWrap('Upload Brand Mark / Logo', (
                <div onClick={() => fileInputRef.current?.click()}
                  style={{ border: `1px dashed ${BORDER}`, borderRadius: 8, padding: 24, textAlign: 'center', cursor: 'pointer', background: BG, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <Upload size={24} color={GOLD} />
                  <div style={{ fontSize: 14, color: TEXT }}>{f.logoName || <>Drag &amp; drop your primary logo here, or <span style={{ color: GOLD }}>browse</span></>}</div>
                  <div style={{ fontSize: 12, color: TEXT2 }}>SVG, PNG or WebP (max 10MB)</div>
                  <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }}
                    onChange={e => set('logoName', e.target.files?.[0]?.name || '')} />
                </div>
              ))}
            </div>
            <StepFooter onBack={back} backLabel="Back to Step 1" onNext={next} nextLabel="Continue Identity Setup" nextDisabled={!step2Valid} />
          </>
        )}

        {step === 2 && (
          <>
            <StepHeader index={2} title="Connect Your Marketing Stack"
              subtitle="Link your platforms so Evoke AI can ingest historical metrics and publish campaigns without friction." />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
              {INTEGRATIONS.map((it) => {
                const Icon = it.icon
                const connected = f.integrations[it.key]
                return (
                  <div key={it.key} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 20,
                    background: BG, borderRadius: 12, border: `1px solid ${connected ? GBORD : BORDER}`, width: '100%', boxSizing: 'border-box',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 8, background: CARD2, border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={20} color={connected ? GOLD : TEXT2} />
                      </div>
                      <span style={{ fontFamily: FHEAD, color: TEXT, fontSize: 16, fontWeight: 600 }}>{it.label}</span>
                    </div>
                    <button onClick={() => toggleIntegration(it.key)} style={{
                      padding: '8px 16px', borderRadius: 6, fontSize: 13, fontFamily: FBODY, fontWeight: 600, cursor: 'pointer',
                      background: connected ? GDIM : CARD2, border: `1px solid ${connected ? GBORD : BORDER}`,
                      color: connected ? GOLD : TEXT,
                    }}>{connected ? 'Connected' : 'Connect'}</button>
                  </div>
                )
              })}
            </div>
            <StepFooter onBack={back} backLabel="Back to Step 2" onNext={next} nextLabel="Continue to Goals" />
          </>
        )}

        {step === 3 && (
          <>
            <StepHeader index={3} title="Set Goals & Assign Agents"
              subtitle="Define absolute business goals. The cognitive center will automatically coordinate specialized neural systems to execute them." />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
              <SectionLabel>Primary Goal Selection</SectionLabel>
              <div style={{ display: 'flex', gap: 16, width: '100%' }}>
                {GOAL_OPTIONS.map(g => {
                  const selected = f.goal === g.value
                  return (
                    <div key={g.value} onClick={() => set('goal', g.value)} style={{
                      flex: 1, minWidth: 0, padding: 20, borderRadius: 12, cursor: 'pointer',
                      background: selected ? GDIM : BG, border: `1px solid ${selected ? GOLD : BORDER}`,
                      display: 'flex', flexDirection: 'column', gap: 12,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <span style={{ fontFamily: FHEAD, fontSize: 18, fontWeight: 700, color: TEXT }}>{g.label}</span>
                        {selected && <Check size={16} color={GOLD} />}
                      </div>
                      <div style={{ fontSize: 13, color: TEXT2, lineHeight: 1.5 }}>{g.desc}</div>
                    </div>
                  )
                })}
              </div>
            </div>
            <Divider />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
              <SectionLabel>Activate Specialized Marketing Agents</SectionLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
                {AGENT_OPTIONS.map((a) => {
                  const on = f.agents[a.key]
                  return (
                    <div key={a.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', background: BG, border: `1px solid ${BORDER}`, borderRadius: 10, width: '100%', boxSizing: 'border-box' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: on ? GOLD : TEXT2, flexShrink: 0 }} />
                        <div>
                          <div style={{ color: TEXT, fontSize: 15, fontWeight: 600, fontFamily: FHEAD }}>{a.label}</div>
                          <div style={{ color: TEXT2, fontSize: 12 }}>{a.desc}</div>
                        </div>
                      </div>
                      <button onClick={() => toggleAgent(a.key)} style={{
                        width: 44, height: 24, borderRadius: 99, position: 'relative', cursor: 'pointer', border: 'none', flexShrink: 0,
                        background: on ? GOLD : CARD2, transition: 'background 0.15s',
                      }}>
                        <div style={{ position: 'absolute', top: 2, left: on ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: on ? BG : TEXT2, transition: 'left 0.15s' }} />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
            <StepFooter onBack={back} backLabel="Back to Step 3" onNext={next} nextLabel="Continue to Training" />
          </>
        )}

        {step === 4 && (
          <>
            <StepHeader index={4} title="Train Your AI Marketing Brain"
              subtitle="Feeding sovereign datasets, media models, and operational assets into Evoke's contextual knowledge vault." />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
              {TRAINING_SOURCES.map((s) => {
                const Icon = s.icon
                const color = s.pct >= 100 ? GREEN : GOLD
                return (
                  <div key={s.key} style={{ padding: 20, background: BG, border: `1px solid ${BORDER}`, borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 16, width: '100%', boxSizing: 'border-box' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: CARD2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Icon size={18} color={GOLD} />
                        </div>
                        <div>
                          <div style={{ color: TEXT, fontSize: 15, fontWeight: 700, fontFamily: FHEAD }}>{s.label}</div>
                          <div style={{ color: TEXT2, fontSize: 12 }}>{s.sub(f)}</div>
                        </div>
                      </div>
                      <span style={{ color, fontSize: 13, fontWeight: 600 }}>{s.status}</span>
                    </div>
                    <div style={{ height: 4, background: CARD2, borderRadius: 99, overflow: 'hidden', width: '100%' }}>
                      <div style={{ height: '100%', width: `${s.pct}%`, background: color, borderRadius: 99 }} />
                    </div>
                  </div>
                )
              })}
            </div>
            <div style={{ padding: 16, background: GDIM, border: `1px solid ${GBORD}`, borderRadius: 8, width: '100%', boxSizing: 'border-box', fontSize: 13, color: GOLD, lineHeight: 1.6 }}>
              🧠 Neural models are synthesizing context. Upon beginning actual operations, agents will reference this pipeline to avoid generic text generation.
            </div>
            <StepFooter onBack={back} backLabel="Back to Step 4" onNext={next} nextLabel="Start Neural Training" />
          </>
        )}

        {step === 5 && (
          <>
            <StepHeader index={5} title="AI Business Audit Complete"
              subtitle="Evoke audited your digital presence. Start operations with the active dashboard to fix core bottlenecks." />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 24 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: FHEAD, fontSize: 32, fontWeight: 700, color: TEXT }}>AI Business Audit Complete</div>
                <div style={{ fontFamily: FBODY, fontSize: 15, color: TEXT2, lineHeight: 1.5 }}>Evoke audited your digital presence. Start operations with the active dashboard to fix core bottlenecks.</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, background: CARD2, border: `1px solid ${GBORD}`, borderRadius: 16, flexShrink: 0 }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: GDIM, border: `2px solid ${GOLD}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Sparkles size={26} color={GOLD} />
                </div>
                <div>
                  <div style={{ fontFamily: FHEAD, fontSize: 18, fontWeight: 700, color: TEXT }}>73 / 100</div>
                  <div style={{ fontSize: 12, color: TEXT2 }}>Initial Health Index</div>
                </div>
              </div>
            </div>
            <Divider />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
              <SectionLabel>Audit Score Card</SectionLabel>
              <div style={{ display: 'flex', gap: 12, width: '100%' }}>
                {SCORECARD.map(s => (
                  <div key={s.label} style={{ flex: 1, minWidth: 0, padding: 16, background: BG, border: `1px solid ${BORDER}`, borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ fontFamily: FHEAD, fontSize: 13, fontWeight: 700, color: TEXT }}>{s.label}</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                      <span style={{ fontFamily: FHEAD, fontSize: 24, fontWeight: 800, color: GOLD }}>{s.score}</span>
                      <span style={{ fontSize: 12, color: TEXT2 }}>/100</span>
                    </div>
                    <span style={{ fontSize: 11, color: TEXT2, background: CARD2, borderRadius: 4, padding: '4px 8px', alignSelf: 'flex-start' }}>{s.tag}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
              <SectionLabel>Detailed Critical Audit Findings</SectionLabel>
              <div style={{ border: `1px solid ${BORDER}`, borderRadius: 12, overflow: 'hidden', width: '100%' }}>
                {FINDINGS.map((fi, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottom: i < FINDINGS.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: 500, maxWidth: '50%' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: SEVERITY_COLOR[fi.severity], flexShrink: 0 }} />
                      <span style={{ color: TEXT, fontSize: 14, flex: 1, minWidth: 0 }}>{fi.text}</span>
                    </div>
                    <span style={{ color: TEXT2, fontSize: 13, width: 150, flexShrink: 0 }}>{fi.category}</span>
                    <span style={{
                      fontSize: 11, fontWeight: 700, borderRadius: 4, padding: '4px 10px', flexShrink: 0,
                      color: SEVERITY_COLOR[fi.severity], background: `${SEVERITY_COLOR[fi.severity]}1A`,
                    }}>{fi.severity}</span>
                  </div>
                ))}
              </div>
            </div>
            <StepFooter
              leftSlot={<button onClick={exportReport} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: TEXT2, fontFamily: FBODY, fontSize: 14, fontWeight: 600, textDecoration: 'underline', cursor: 'pointer', padding: 0 }}><Download size={14}/> Export Report PDF</button>}
              onNext={handleFinish} nextLabel="Enter Marketing Control Center" saving={saving} />
          </>
        )}
      </div>
    </div>
  )
}
