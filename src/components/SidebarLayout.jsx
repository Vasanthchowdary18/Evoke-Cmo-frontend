import React from 'react'
import AppSidebar from './AppSidebar.jsx'

// Shared app shell: persistent left navigation + content area that
// shifts with the sidebar's collapsed/expanded width (--evox-sidebar-w,
// broadcast by AppSidebar). Use this to wrap any authenticated in-app
// page so navigation stays consistent across the dashboard and hubs.
export default function SidebarLayout({ children, bg = '#0e0c09' }) {
  return (
    <div style={{ minHeight: '100vh', background: bg, fontFamily: "'Inter',sans-serif" }}>
      <AppSidebar />
      <div style={{
        marginLeft: 'var(--evox-sidebar-w, 220px)',
        minHeight: '100vh',
        transition: 'margin-left 0.22s cubic-bezier(0.4,0,0.2,1)',
      }}>
        {children}
      </div>
    </div>
  )
}
