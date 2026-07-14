import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Bot, TrendingUp, BarChart2,
  Share2, Settings, LogOut, ChevronLeft, ChevronRight,
  Zap, Crown, Target,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth.js'
import { useUserPlan } from '../hooks/useUserPlan.js'
import { signOut as ssoSignOut } from '../lib/session'

const NAV_BASE = [
  { label: 'Dashboard',       icon: LayoutDashboard, route: '/dashboard',        minPlan: 'free' },
  { label: 'AI Agents',       icon: Bot,             route: '/agents-hub',       minPlan: 'free' },
  { label: 'Strategy',        icon: TrendingUp,      route: '/strategy-hub',     minPlan: 'free' },
  { label: 'Analytics',       icon: BarChart2,       route: '/analytics',        minPlan: 'package-b' },
  { label: 'Social Accounts', icon: Share2,          route: '/connect-accounts', minPlan: 'package-b' },
  { label: 'Settings',        icon: Settings,        route: '/brand-profile',    minPlan: 'free' },
]

const PLAN_ORDER = ['free', 'package-a', 'package-b', 'package-c']
function planAllows(userPlan, minPlan) {
  return PLAN_ORDER.indexOf(userPlan || 'free') >= PLAN_ORDER.indexOf(minPlan || 'free')
}

const PLAN_LABELS = { free: 'Free Plan', 'package-a': 'Package A', 'package-b': 'Package B', 'package-c': 'Package C' }
const PLAN_COLOR  = { free: '#666', 'package-a': '#c8973e', 'package-b': '#94a3b8', 'package-c': '#f59e0b' }

export default function AppSidebar() {
  const navigate      = useNavigate()
  const location      = useLocation()
  const { user }      = useAuth()
  const { plan }      = useUserPlan()
  const [collapsed, setCollapsed] = useState(false)

  const W = collapsed ? 64 : 220

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

  const isActive = (route) => {
    if (route === '/dashboard') return location.pathname === '/dashboard'
    if (route === '/strategy-hub') return location.pathname === '/strategy-hub' || location.pathname === '/strategy' || location.pathname.startsWith('/campaign/')
    return location.pathname.startsWith(route)
  }

  const planColor = PLAN_COLOR[plan || 'free']
  const initials  = (user?.displayName || user?.email || 'U')[0].toUpperCase()
  const name      = user?.displayName || user?.email?.split('@')[0] || 'User'

  return (
    <div style={{
      position: 'fixed', left: 0, top: 0, bottom: 0, width: W,
      background: '#0d0b08',
      borderRight: '1px solid rgba(255,255,255,0.07)',
      display: 'flex', flexDirection: 'column',
      zIndex: 200,
      transition: 'width 0.22s cubic-bezier(0.4,0,0.2,1)',
      fontFamily: "'Inter',sans-serif",
      overflow: 'hidden',
    }}>

      {/* ── Logo ── */}
      <div style={{
        height: 60, display: 'flex', alignItems: 'center',
        padding: collapsed ? '0 18px' : '0 16px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        justifyContent: 'space-between', flexShrink: 0,
      }}>
        {!collapsed && (
          <div onClick={() => navigate('/')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <img src="/evoke-logo.png" alt="EVOKE" style={{ height: 22, width: 'auto', objectFit: 'contain' }} />
          </div>
        )}
        {collapsed && (
          <div onClick={() => navigate('/')} style={{ width: 30, height: 30, background: 'linear-gradient(135deg,#c8973e,#8b5e1e)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: '#0e0c09', cursor: 'pointer' }}>E</div>
        )}
        <button onClick={() => setCollapsed(c => !c)} style={{ background: 'none', border: 'none', color: 'rgba(240,235,224,0.25)', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', borderRadius: 6, transition: 'color 0.15s', flexShrink: 0 }}
          onMouseEnter={e => e.currentTarget.style.color = '#c8973e'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(240,235,224,0.25)'}>
          {collapsed ? <ChevronRight size={14}/> : <ChevronLeft size={14}/>}
        </button>
      </div>

      {/* ── Nav items ── */}
      <div style={{ flex: 1, padding: '10px 8px', overflowY: 'auto', overflowX: 'hidden' }}>
        {NAV_BASE.filter(item => planAllows(plan, item.minPlan)).map(item => {
          const active = isActive(item.route)
          const Icon   = item.icon
          return (
            <NavItem
              key={item.route}
              icon={<Icon size={16} color={active ? '#c8973e' : 'rgba(240,235,224,0.4)'}/>}
              label={item.label}
              active={active}
              collapsed={collapsed}
              onClick={() => navigate(item.route)}
            />
          )
        })}
      </div>

      {/* ── Bottom: plan + user + logout ── */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '10px 8px', flexShrink: 0 }}>

        {/* Plan badge */}
        {!collapsed && (
          <div onClick={() => navigate('/plans')} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 10px', borderRadius: 8, marginBottom: 8,
            background: `${planColor}10`, border: `1px solid ${planColor}25`,
            cursor: 'pointer', transition: 'all 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = `${planColor}20`}
          onMouseLeave={e => e.currentTarget.style.background = `${planColor}10`}
          >
            {plan === 'package-c' ? <Crown size={11} color={planColor}/> : <Zap size={11} color={planColor}/>}
            <span style={{ fontSize: 11, fontWeight: 700, color: planColor, flex: 1 }}>{PLAN_LABELS[plan || 'free']}</span>
            {plan !== 'package-c' && <span style={{ fontSize: 10, color: 'rgba(240,235,224,0.3)', fontWeight: 500 }}>Upgrade →</span>}
          </div>
        )}

        {/* User row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 8, padding: collapsed ? '6px 4px' : '6px 8px', borderRadius: 8, justifyContent: collapsed ? 'center' : 'flex-start' }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(200,151,62,0.18)', border: '1px solid rgba(200,151,62,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#c8973e', flexShrink: 0 }}>
            {initials}
          </div>
          {!collapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#f0ebe0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
              <div style={{ fontSize: 10, color: 'rgba(240,235,224,0.3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
            </div>
          )}
        </div>

        {/* Logout */}
        <NavItem
          icon={<LogOut size={15} color="rgba(240,235,224,0.3)"/>}
          label="Log out"
          active={false}
          collapsed={collapsed}
          onClick={handleLogout}
          danger
        />
      </div>
    </div>
  )
}

function NavItem({ icon, label, active, collapsed, onClick, danger }) {
  const [hov, setHov] = useState(false)
  const bg = active
    ? 'rgba(200,151,62,0.12)'
    : hov
      ? (danger ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.05)')
      : 'transparent'
  const color = active
    ? '#f0ebe0'
    : hov
      ? (danger ? '#ef4444' : '#f0ebe0')
      : (danger ? 'rgba(240,235,224,0.3)' : 'rgba(240,235,224,0.55)')

  return (
    <div onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center',
        gap: collapsed ? 0 : 10,
        padding: '9px 10px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        cursor: 'pointer',
        background: bg,
        borderLeft: active ? '2px solid #c8973e' : '2px solid transparent',
        borderRadius: '0 8px 8px 0',
        marginLeft: -8, paddingLeft: collapsed ? 10 : 18,
        transition: 'all 0.15s ease',
      }}
    >
      <span style={{ flexShrink: 0, color: active ? '#c8973e' : hov ? (danger ? '#ef4444' : 'rgba(240,235,224,0.8)') : 'rgba(240,235,224,0.35)', transition: 'color 0.15s', display: 'flex' }}>{icon}</span>
      {!collapsed && <span style={{ fontSize: 13, fontWeight: active ? 600 : 400, color, transition: 'color 0.15s', whiteSpace: 'nowrap' }}>{label}</span>}
    </div>
  )
}
