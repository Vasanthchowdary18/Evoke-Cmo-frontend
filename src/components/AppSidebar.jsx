import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, MessageSquare, Target, Layers, FileText, Image, Video,
  Search, TrendingUp, Share2, Users, UserCheck, Cpu, BarChart2,
  PieChart, Folder, Link, UsersRound, CreditCard, Settings, LogOut,
  ChevronLeft, ChevronRight, Zap, Crown, CalendarClock, Send, Sparkles,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth.js'
import { useUserPlan } from '../hooks/useUserPlan.js'
import { signOut as ssoSignOut } from '../lib/session'

// Primary nav follows the product journey diagram's literal stage order:
// Dashboard -> Connect Channels -> AI Agents Hub -> Campaign Builder ->
// Campaign Execution -> (supporting creation tools) -> Analytics -> Optimization.
// "Growth Stack" holds the remaining channel/tool pages that don't map to a
// single diagram stage. Team + Utility (Reports/Asset Library/Billing/Settings)
// stay a flat group at the bottom, unchanged from the prior Figma layout.
const PRIMARY_ITEMS = [
  { label: 'Dashboard',       icon: LayoutDashboard, route: '/dashboard',     minPlan: 'free' },
  { label: 'Connect Channels', icon: Link,           route: '/connect-accounts', minPlan: 'free', tourId: 'nav-connect-channels' },
  { label: 'AI Agents Hub',   icon: MessageSquare,    route: '/agents-hub',   minPlan: 'free', badge: 'Live', tourId: 'nav-agents-hub' },
  { label: 'Campaigns',       icon: Layers,           route: '/campaigns',    minPlan: 'package-b', tourId: 'nav-campaigns', subItems: [
      { label: 'All Campaigns', route: '/campaigns' },
      { label: 'New Campaign',  route: '/new-campaign' },
    ] },
  { label: 'Campaign Execution', icon: Send,         route: '/queue',        minPlan: 'package-b', tourId: 'nav-campaign-execution', subItems: [
      { label: 'Approval Queue', route: '/queue' },
      { label: 'Post & Publish', route: '/post-content' },
    ] },
  { label: 'Strategy',        icon: Target,           route: '/strategy-home', minPlan: 'free' },
  { label: 'Content Studio',  icon: FileText,         route: '/content-studio', minPlan: 'free', subItems: [
      { label: 'Blog Generator', route: '/blog-generator' },
      { label: 'Email',          route: '/email-composer' },
      { label: 'Newsletter',     route: '/content-gen' },
      { label: 'Social Posts',   route: '/caption-suite' },
    ] },
  { label: 'Creative Studio', icon: Image,            route: '/hub/creative', minPlan: 'free', subItems: [
      { label: 'Image Generator', route: '/image-generator' },
      { label: 'Reels & Shorts',  route: '/hub/video-studio' },
      { label: 'Display Ads',     route: '/hub/creative' },
    ] },
  { label: 'Video Studio',    icon: Video,            route: '/video-gen',    minPlan: 'package-a' },
  { label: 'Analytics',       icon: BarChart2,        route: '/analytics',    minPlan: 'package-b' },
  { label: 'Optimization',    icon: Sparkles,         route: '/trends',       minPlan: 'package-b', subItems: [
      { label: 'Trend Analysis',      route: '/trends' },
      { label: 'KPI Recommendations', route: '/kpi-recommendations' },
    ] },
]

const GROWTH_STACK_ITEMS = [
  { label: 'SEO Center',      icon: Search,     route: '/hub/seo',          minPlan: 'package-b' },
  { label: 'Ads Center',      icon: TrendingUp, route: '/hub/ads',          minPlan: 'package-c' },
  { label: 'Social Media',    icon: Share2,     route: '/hub/social',       minPlan: 'package-b' },
  { label: 'Social Calendar', icon: CalendarClock, route: '/social-calendar', minPlan: 'package-b' },
  { label: 'CRM',          icon: Users,      route: '/crm',              minPlan: 'package-b' },
  { label: 'Audience',     icon: UserCheck,  route: '/audience-builder', minPlan: 'package-b' },
  { label: 'Automation',   icon: Cpu,        route: '/execution',        minPlan: 'package-c' },
]

// Flat, unchanged from the prior Figma layout: Reports, Asset Library, Team, Billing, Settings.
const UTILITY_ITEMS = [
  { label: 'Reports',       icon: PieChart,   route: '/executive-report',           minPlan: 'package-b' },
  { label: 'Asset Library', icon: Folder,     route: '/products',                   minPlan: 'free' },
  { label: 'Team',          icon: UsersRound, route: '/team',                       minPlan: 'package-c' },
  { label: 'Billing',       icon: CreditCard, route: '/purchase',                   minPlan: 'free' },
  { label: 'Settings',      icon: Settings,   route: '/brand-profile?tab=settings', minPlan: 'free' },
]

const PLAN_ORDER = ['free', 'package-a', 'package-b', 'package-c']
function planAllows(userPlan, minPlan) {
  return PLAN_ORDER.indexOf(userPlan || 'free') >= PLAN_ORDER.indexOf(minPlan || 'free')
}

const PLAN_LABELS = { free: 'Free Trial', 'package-a': 'Starter', 'package-b': 'Professional', 'package-c': 'Enterprise' }
const PLAN_COLOR  = { free: '#666', 'package-a': '#c8973e', 'package-b': '#94a3b8', 'package-c': '#f59e0b' }

// Exact Figma "Sidebar" frame spec: width 260, height 1024, gap 16,
// padding 24/16/24/16, background #111118, border-right 1px #2A2A3A.
const EXPANDED_W = 260
const COLLAPSED_W = 64

export default function AppSidebar() {
  const navigate      = useNavigate()
  const location      = useLocation()
  const { user }      = useAuth()
  const { plan, trialDaysLeft } = useUserPlan()
  const [collapsed, setCollapsed] = useState(false)
  const [menuOpen, setMenuOpen]   = useState(false)
  const [menuPos, setMenuPos]     = useState({ top: 0, left: 0 })
  const avatarRef = useRef(null)

  const W = collapsed ? COLLAPSED_W : EXPANDED_W

  // Broadcast sidebar width as a CSS custom property so any page can adapt
  useEffect(() => {
    document.documentElement.style.setProperty('--evox-sidebar-w', W + 'px')
  }, [W])

  const handleLogout = async () => {
    try {
      localStorage.removeItem('evoke_assessment')
      localStorage.removeItem('evoke_selected_package')
    } catch {}
    await ssoSignOut()
  }

  const toggleMenu = () => {
    if (!menuOpen && avatarRef.current) {
      const r = avatarRef.current.getBoundingClientRect()
      setMenuPos({ top: r.bottom + 8, left: r.left })
    }
    setMenuOpen(o => !o)
  }

  const isActive = (route) => {
    const [path, query] = route.split('?')
    if (path === '/dashboard') return location.pathname === '/dashboard'
    if (path === '/strategy-home') return location.pathname.startsWith('/strategy-home') || location.pathname === '/strategy'
    if (path === '/campaigns') return location.pathname === '/campaigns' || location.pathname === '/campaign-hub' || location.pathname === '/new-campaign' || location.pathname.startsWith('/campaign/') || location.pathname.startsWith('/campaign-performance/')
    if (path === '/queue') return location.pathname === '/queue' || location.pathname === '/post-content'
    if (path === '/trends') return location.pathname === '/trends' || location.pathname === '/kpi-recommendations'
    if (path === '/content-studio') return ['/content-studio', '/blog-generator', '/content-gen', '/copywriting', '/email-composer', '/caption-suite'].some(p => location.pathname.startsWith(p))
    if (path === '/hub/creative') return ['/hub/creative', '/image-generator', '/hub/video-studio'].some(p => location.pathname.startsWith(p))
    if (path === '/brand-profile') return location.pathname === '/brand-profile' && location.search.replace(/^\?/, '') === (query || '')
    return location.pathname.startsWith(path)
  }

  const planColor = PLAN_COLOR[plan || 'free']
  const initials  = (user?.displayName || user?.email || 'U')[0].toUpperCase()
  const name      = user?.displayName || user?.email?.split('@')[0] || 'User'

  const visiblePrimary = PRIMARY_ITEMS.filter(item => planAllows(plan, item.minPlan))
  const visibleGrowth  = GROWTH_STACK_ITEMS.filter(item => planAllows(plan, item.minPlan))
  const visibleUtility = UTILITY_ITEMS.filter(item => planAllows(plan, item.minPlan))

  return (
    <div style={{
      position: 'fixed', left: 0, top: 0, bottom: 0, width: W,
      background: '#111118',
      borderRight: '1px solid #2A2A3A',
      display: 'flex', flexDirection: 'column', gap: 16,
      paddingTop: 24, paddingBottom: 24,
      paddingLeft: collapsed ? 12 : 16, paddingRight: collapsed ? 12 : 16,
      zIndex: 200,
      transition: 'width 0.22s cubic-bezier(0.4,0,0.2,1), padding 0.22s',
      fontFamily: "'Inter',sans-serif",
      overflowY: 'auto',
      overflowX: 'hidden',
    }}>

      {/* ── Logo + account trigger ── */}
      <div style={{
        minHeight: 33, width: collapsed ? '100%' : '100%', display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between', flexShrink: 0, gap: 8,
      }}>
        {!collapsed && (
          <div onClick={() => navigate('/')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, background: 'radial-gradient(50% 50% at 50% 50%, #E5C07B 0%, #BE954A 100%)' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: 16, letterSpacing: '1px', color: '#FFFFFF', lineHeight: 1 }}>EVOKE</span>
              <span style={{ fontFamily: "'Geist','Inter',sans-serif", fontWeight: 600, fontSize: 9, letterSpacing: '1px', color: '#BE954A', lineHeight: 1 }}>AI CMO</span>
            </div>
          </div>
        )}
        {collapsed && (
          <div onClick={() => navigate('/')} style={{ width: 28, height: 28, borderRadius: '50%', background: 'radial-gradient(50% 50% at 50% 50%, #E5C07B 0%, #BE954A 100%)', cursor: 'pointer', flexShrink: 0 }} />
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <button ref={avatarRef} onClick={toggleMenu} title={name} style={{
            width: 26, height: 26, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
            background: '#BE954A1A', border: '1px solid #BE954A', cursor: 'pointer', padding: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#BE954A',
          }}>
            {user?.photoURL
              ? <img src={user.photoURL} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              : initials}
          </button>
          <button onClick={() => setCollapsed(c => !c)} style={{ background: 'none', border: 'none', color: 'rgba(240,235,224,0.25)', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', borderRadius: 6, transition: 'color 0.15s', flexShrink: 0 }}
            onMouseEnter={e => e.currentTarget.style.color = '#c8973e'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(240,235,224,0.25)'}>
            {collapsed ? <ChevronRight size={14}/> : <ChevronLeft size={14}/>}
          </button>
        </div>
      </div>

      {/* ── Primary nav (36px rows, 2px gap — Figma nav-list) ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
        {visiblePrimary.map(item => {
          const active = isActive(item.route)
          const Icon   = item.icon
          return (
            <React.Fragment key={item.label}>
              <NavItem
                icon={<Icon size={16} color={active ? '#BE954A' : '#9B9BB0'}/>}
                label={item.label}
                badge={item.badge}
                active={active}
                collapsed={collapsed}
                tourId={item.tourId}
                onClick={() => navigate(item.route)}
              />
              {/* Contextual sub-links — only shown while this section is the active page, matching Figma's expanded Content Studio */}
              {item.subItems && active && !collapsed && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingLeft: 14 }}>
                  {item.subItems.map(sub => {
                    const subActive = location.pathname.startsWith(sub.route.split('?')[0])
                    return (
                      <div key={sub.label} onClick={() => navigate(sub.route)} style={{
                        height: 30, display: 'flex', alignItems: 'center', padding: '0 12px',
                        borderRadius: 8, cursor: 'pointer', transition: 'background 0.15s',
                        background: subActive ? '#BE954A1A' : 'transparent',
                        border: subActive ? '1px solid #BE954A40' : '1px solid transparent',
                      }}
                        onMouseEnter={e => { if (!subActive) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                        onMouseLeave={e => { if (!subActive) e.currentTarget.style.background = 'transparent' }}
                      >
                        <span style={{ fontFamily: "'Outfit','Inter',sans-serif", fontSize: 13, fontWeight: 500, color: subActive ? '#BE954A' : '#9B9BB0' }}>{sub.label}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </React.Fragment>
          )
        })}
      </div>

      {/* ── Growth Stack (32px rows, 2px gap — Figma nav-section-modules) ── */}
      {visibleGrowth.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
          {collapsed
            ? <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '6px 10px' }} />
            : <div style={{ fontFamily: "'Geist','Inter',sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: '#BE954A', padding: '0 12px 2px' }}>Growth Stack</div>
          }
          {visibleGrowth.map(item => {
            const active = isActive(item.route)
            const Icon   = item.icon
            return (
              <NavItem
                key={item.label}
                compact
                icon={<Icon size={16} color={active ? '#BE954A' : '#9B9BB0'}/>}
                label={item.label}
                badge={item.badge}
                active={active}
                collapsed={collapsed}
                onClick={() => navigate(item.route)}
              />
            )
          })}
        </div>
      )}

      {/* ── Spacer — pushes the utility group to the bottom ── */}
      <div style={{ flex: 1, minHeight: 0 }} />

      {/* ── Utility group (32px rows, 2px gap — Figma nav-section-utility) ── */}
      {visibleUtility.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
          {visibleUtility.map(item => {
            const active = isActive(item.route)
            const Icon   = item.icon
            return (
              <NavItem
                key={item.label}
                compact
                icon={<Icon size={16} color={active ? '#BE954A' : '#9B9BB0'}/>}
                label={item.label}
                badge={item.badge}
                active={active}
                collapsed={collapsed}
                onClick={() => navigate(item.route)}
              />
            )
          })}
        </div>
      )}

      {/* ── Account dropdown — portalled so it can't be clipped by the sidebar's own scroll/overflow ── */}
      {menuOpen && createPortal(
        <>
          <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 998 }} />
          <div style={{
            position: 'fixed', top: menuPos.top, left: menuPos.left, width: 232, zIndex: 999,
            background: '#111118', border: '1px solid #2A2A3A', borderRadius: 12, padding: 8,
            boxShadow: '0 16px 40px rgba(0,0,0,0.5)', fontFamily: "'Inter',sans-serif",
          }}>
            <div style={{ padding: '8px 10px 10px' }}>
              <div style={{ fontFamily: "'Outfit','Inter',sans-serif", fontSize: 14, fontWeight: 600, color: '#FFFFFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
              <div style={{ fontFamily: "'Geist','Inter',sans-serif", fontSize: 11, color: '#9B9BB0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
            </div>
            <div style={{ height: 0, borderTop: '1px solid #2A2A3A', margin: '2px 0 6px' }} />
            <div onClick={() => { setMenuOpen(false); navigate('/plans') }} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', borderRadius: 8,
              background: `${planColor}10`, border: `1px solid ${planColor}25`, cursor: 'pointer', marginBottom: 6,
            }}>
              {plan === 'package-c' ? <Crown size={11} color={planColor}/> : <Zap size={11} color={planColor}/>}
              <span style={{ fontSize: 11, fontWeight: 700, color: planColor, flex: 1 }}>{PLAN_LABELS[plan || 'free']}</span>
              {plan !== 'package-c' && <span style={{ fontSize: 10, color: 'rgba(240,235,224,0.3)', fontWeight: 500 }}>Upgrade →</span>}
            </div>
            {trialDaysLeft !== null && (
              <div style={{ padding: '6px 10px', marginBottom: 6, fontSize: 11, fontWeight: 600, color: trialDaysLeft > 0 ? '#9B9BB0' : '#ef4444' }}>
                {trialDaysLeft > 0 ? `${trialDaysLeft} day${trialDaysLeft === 1 ? '' : 's'} left in trial` : 'Trial expired'}
              </div>
            )}
            <MenuRow icon={<LogOut size={14} color="#ef4444"/>} label="Log out" danger onClick={() => { setMenuOpen(false); handleLogout() }} />
          </div>
        </>,
        document.body
      )}
    </div>
  )
}

function MenuRow({ icon, label, onClick, danger }) {
  const [hov, setHov] = useState(false)
  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
        background: hov ? (danger ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.05)') : 'transparent',
      }}>
      {icon}
      <span style={{ fontFamily: "'Outfit','Inter',sans-serif", fontSize: 13, fontWeight: 600, color: danger ? '#ef4444' : '#f0ebe0' }}>{label}</span>
    </div>
  )
}

// Primary nav rows are 36px tall (Figma nav-item); Growth Stack / Utility
// rows are 32px tall (Figma module-item / utility-item) — pass `compact`.
function NavItem({ icon, label, active, collapsed, onClick, danger, badge, compact, tourId }) {
  const [hov, setHov] = useState(false)
  const bg = active
    ? '#BE954A1A'
    : hov
      ? (danger ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.05)')
      : 'transparent'
  const color = active
    ? '#BE954A'
    : hov
      ? (danger ? '#ef4444' : '#f0ebe0')
      : (danger ? 'rgba(240,235,224,0.3)' : '#9B9BB0')

  return (
    <div onClick={onClick}
      data-tour={tourId}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center',
        gap: collapsed ? 0 : 10,
        height: compact ? 32 : 36, boxSizing: 'border-box',
        padding: collapsed ? '0 7px' : compact ? '8px 12px' : '10px 12px',
        justifyContent: collapsed ? 'center' : 'space-between',
        cursor: 'pointer',
        background: bg,
        borderRadius: 8,
        transition: 'all 0.15s ease',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 10, minWidth: 0 }}>
        <span style={{ flexShrink: 0, color: active ? '#BE954A' : hov ? (danger ? '#ef4444' : 'rgba(240,235,224,0.8)') : '#9B9BB0', transition: 'color 0.15s', display: 'flex' }}>{icon}</span>
        {!collapsed && <span style={{ fontFamily: "'Outfit','Inter',sans-serif", fontSize: compact ? 13 : 14, fontWeight: active ? 700 : 500, color, transition: 'color 0.15s', whiteSpace: 'nowrap' }}>{label}</span>}
      </span>
      {!collapsed && badge && (
        <span style={{ fontFamily: "'Geist','Inter',sans-serif", fontSize: 9, fontWeight: 700, color: '#0A0A0F', background: '#BE954A', borderRadius: 99, padding: '2px 8px', flexShrink: 0 }}>{badge}</span>
      )}
    </div>
  )
}
