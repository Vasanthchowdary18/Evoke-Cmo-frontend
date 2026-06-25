import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRequireAuth } from '../hooks/useRequireAuth'
import {
  ArrowLeft, Users, UserPlus, Shield, Crown, Eye, Edit3,
  Trash2, Mail, Check, X, Search, ChevronDown, MoreVertical,
  Copy, RefreshCw, Lock, Unlock, Bell, Settings
} from 'lucide-react'

const ROLES = [
  {
    id: 'owner',
    label: 'Owner',
    icon: <Crown size={14} />,
    color: '#c8973e',
    bg: 'rgba(200,151,62,0.15)',
    permissions: ['All permissions', 'Billing access', 'Delete workspace', 'Manage team'],
  },
  {
    id: 'admin',
    label: 'Admin',
    icon: <Shield size={14} />,
    color: '#6366f1',
    bg: 'rgba(99,102,241,0.15)',
    permissions: ['Manage campaigns', 'Manage team', 'View analytics', 'Post content', 'Connect accounts'],
  },
  {
    id: 'editor',
    label: 'Editor',
    icon: <Edit3 size={14} />,
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.15)',
    permissions: ['Create & edit campaigns', 'View analytics', 'Post content'],
  },
  {
    id: 'viewer',
    label: 'Viewer',
    icon: <Eye size={14} />,
    color: '#94a3b8',
    bg: 'rgba(148,163,184,0.15)',
    permissions: ['View campaigns', 'View analytics'],
  },
]

const INITIAL_MEMBERS = [
  {
    id: 1,
    name: 'Vasanth C',
    email: 'vasanth@evokemedia.io',
    role: 'owner',
    avatar: 'VC',
    status: 'active',
    lastActive: 'Now',
    joinedAt: 'Jan 2024',
  },
  {
    id: 2,
    name: 'Priya Sharma',
    email: 'priya@evokemedia.io',
    role: 'admin',
    avatar: 'PS',
    status: 'active',
    lastActive: '2h ago',
    joinedAt: 'Mar 2024',
  },
  {
    id: 3,
    name: 'Rahul Mehta',
    email: 'rahul@evokemedia.io',
    role: 'editor',
    avatar: 'RM',
    status: 'active',
    lastActive: '1d ago',
    joinedAt: 'May 2024',
  },
  {
    id: 4,
    name: 'Anita Singh',
    email: 'anita@evokemedia.io',
    role: 'viewer',
    avatar: 'AS',
    status: 'inactive',
    lastActive: '5d ago',
    joinedAt: 'Jun 2024',
  },
]

const PENDING_INVITES = [
  { id: 1, email: 'dev@agency.io', role: 'editor', sentAt: '2d ago' },
  { id: 2, email: 'partner@brandco.com', role: 'viewer', sentAt: '5d ago' },
]

export default function TeamManagement() {
  useRequireAuth()
  const navigate = useNavigate()

  const [members, setMembers] = useState(INITIAL_MEMBERS)
  const [pendingInvites, setPendingInvites] = useState(PENDING_INVITES)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('members')
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('editor')
  const [inviteSent, setInviteSent] = useState(false)
  const [openMenu, setOpenMenu] = useState(null)
  const [selectedRole, setSelectedRole] = useState(null)

  const filtered = members.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase())
  )

  function getRoleObj(roleId) {
    return ROLES.find(r => r.id === roleId) || ROLES[3]
  }

  function handleInvite(e) {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    const newInvite = {
      id: Date.now(),
      email: inviteEmail.trim(),
      role: inviteRole,
      sentAt: 'Just now',
    }
    setPendingInvites(prev => [newInvite, ...prev])
    setInviteSent(true)
    setInviteEmail('')
    setTimeout(() => {
      setInviteSent(false)
      setShowInviteForm(false)
    }, 2000)
  }

  function handleRemoveMember(id) {
    setMembers(prev => prev.filter(m => m.id !== id))
    setOpenMenu(null)
  }

  function handleChangeRole(id, roleId) {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, role: roleId } : m))
    setOpenMenu(null)
  }

  function handleCancelInvite(id) {
    setPendingInvites(prev => prev.filter(i => i.id !== id))
  }

  const RoleBadge = ({ roleId }) => {
    const r = getRoleObj(roleId)
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '2px 8px', borderRadius: 20,
        background: r.bg, color: r.color,
        fontSize: 11, fontWeight: 600,
      }}>
        {r.icon} {r.label}
      </span>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0e0c09', color: '#f0ebe0', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid #2a2510', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#12100a' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#c8973e', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <ArrowLeft size={16} /> Back
          </button>
          <span style={{ color: '#3a3020' }}>|</span>
          <Users size={18} color="#c8973e" />
          <span style={{ fontSize: 11, letterSpacing: 2, color: '#c8973e', fontWeight: 700 }}>TEAM MANAGEMENT</span>
        </div>
        <button
          onClick={() => setShowInviteForm(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#c8973e', color: '#0e0c09', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
        >
          <UserPlus size={15} /> Invite Member
        </button>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 32 }}>
          {[
            { label: 'Total Members', value: members.length, color: '#c8973e' },
            { label: 'Active Now', value: members.filter(m => m.status === 'active').length, color: '#22c55e' },
            { label: 'Pending Invites', value: pendingInvites.length, color: '#f59e0b' },
            { label: 'Roles Available', value: ROLES.length, color: '#6366f1' },
          ].map(stat => (
            <div key={stat.label} style={{ background: '#1c1a13', border: '1px solid #2a2510', borderRadius: 10, padding: '16px 20px' }}>
              <div style={{ fontSize: 26, fontWeight: 700, color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: 12, color: '#8a7a55', marginTop: 2 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Invite form modal */}
        {showInviteForm && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: '#1c1a13', border: '1px solid #2a2510', borderRadius: 14, padding: 32, width: 420, maxWidth: '90vw' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <h3 style={{ margin: 0, fontSize: 18, color: '#f0ebe0' }}>Invite Team Member</h3>
                <button onClick={() => setShowInviteForm(false)} style={{ background: 'none', border: 'none', color: '#8a7a55', cursor: 'pointer' }}><X size={18} /></button>
              </div>
              {inviteSent ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ width: 56, height: 56, background: 'rgba(34,197,94,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                    <Check size={24} color="#22c55e" />
                  </div>
                  <p style={{ color: '#22c55e', fontWeight: 600 }}>Invite sent successfully!</p>
                </div>
              ) : (
                <form onSubmit={handleInvite}>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: 12, color: '#8a7a55', marginBottom: 6 }}>Email Address</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#0e0c09', border: '1px solid #2a2510', borderRadius: 8, padding: '10px 14px' }}>
                      <Mail size={15} color="#8a7a55" />
                      <input
                        type="email"
                        value={inviteEmail}
                        onChange={e => setInviteEmail(e.target.value)}
                        placeholder="colleague@company.com"
                        style={{ background: 'none', border: 'none', color: '#f0ebe0', outline: 'none', flex: 1, fontSize: 14 }}
                        required
                        autoFocus
                      />
                    </div>
                  </div>
                  <div style={{ marginBottom: 24 }}>
                    <label style={{ display: 'block', fontSize: 12, color: '#8a7a55', marginBottom: 6 }}>Role</label>
                    <select
                      value={inviteRole}
                      onChange={e => setInviteRole(e.target.value)}
                      style={{ width: '100%', background: '#0e0c09', border: '1px solid #2a2510', color: '#f0ebe0', borderRadius: 8, padding: '10px 14px', fontSize: 14 }}
                    >
                      {ROLES.filter(r => r.id !== 'owner').map(r => (
                        <option key={r.id} value={r.id}>{r.label}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button type="button" onClick={() => setShowInviteForm(false)} style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid #2a2510', color: '#8a7a55', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>Cancel</button>
                    <button type="submit" style={{ flex: 2, padding: '10px', background: '#c8973e', color: '#0e0c09', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>Send Invite</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#1c1a13', border: '1px solid #2a2510', borderRadius: 10, padding: 4, width: 'fit-content' }}>
          {[
            { id: 'members', label: `Members (${members.length})` },
            { id: 'invites', label: `Pending (${pendingInvites.length})` },
            { id: 'roles', label: 'Roles & Permissions' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '8px 16px', borderRadius: 7, border: 'none', fontSize: 13, cursor: 'pointer', fontWeight: 600,
                background: activeTab === tab.id ? '#c8973e' : 'transparent',
                color: activeTab === tab.id ? '#0e0c09' : '#8a7a55',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Members tab */}
        {activeTab === 'members' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#1c1a13', border: '1px solid #2a2510', borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
              <Search size={15} color="#8a7a55" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search members…"
                style={{ background: 'none', border: 'none', color: '#f0ebe0', outline: 'none', flex: 1, fontSize: 14 }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filtered.map(member => {
                const role = getRoleObj(member.role)
                return (
                  <div key={member.id} style={{ background: '#1c1a13', border: '1px solid #2a2510', borderRadius: 10, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, position: 'relative' }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: role.bg, border: `2px solid ${role.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: role.color, fontSize: 14, flexShrink: 0 }}>
                      {member.avatar}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 600, color: '#f0ebe0', fontSize: 15 }}>{member.name}</span>
                        {member.status === 'active' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />}
                        {member.role === 'owner' && <Crown size={12} color="#c8973e" />}
                      </div>
                      <div style={{ color: '#8a7a55', fontSize: 13 }}>{member.email}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <RoleBadge roleId={member.role} />
                      <div style={{ fontSize: 12, color: '#8a7a55', textAlign: 'right', minWidth: 60 }}>
                        <div>{member.lastActive}</div>
                        <div style={{ color: '#3a3020', fontSize: 11 }}>Joined {member.joinedAt}</div>
                      </div>
                      {member.role !== 'owner' && (
                        <div style={{ position: 'relative' }}>
                          <button
                            onClick={() => setOpenMenu(openMenu === member.id ? null : member.id)}
                            style={{ background: 'none', border: 'none', color: '#8a7a55', cursor: 'pointer', padding: 4 }}
                          >
                            <MoreVertical size={16} />
                          </button>
                          {openMenu === member.id && (
                            <div style={{ position: 'absolute', right: 0, top: '100%', background: '#12100a', border: '1px solid #2a2510', borderRadius: 8, minWidth: 180, zIndex: 100, overflow: 'hidden' }}>
                              <div style={{ padding: '6px 0', borderBottom: '1px solid #2a2510' }}>
                                <div style={{ padding: '4px 12px', fontSize: 10, color: '#8a7a55', letterSpacing: 1 }}>CHANGE ROLE</div>
                                {ROLES.filter(r => r.id !== 'owner' && r.id !== member.role).map(r => (
                                  <button key={r.id} onClick={() => handleChangeRole(member.id, r.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', background: 'none', border: 'none', color: '#f0ebe0', cursor: 'pointer', fontSize: 13, textAlign: 'left' }}>
                                    <span style={{ color: r.color }}>{r.icon}</span> Make {r.label}
                                  </button>
                                ))}
                              </div>
                              <button onClick={() => handleRemoveMember(member.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 13 }}>
                                <Trash2 size={13} /> Remove Member
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Pending invites tab */}
        {activeTab === 'invites' && (
          <div>
            {pendingInvites.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#8a7a55' }}>
                <Mail size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
                <div>No pending invites</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {pendingInvites.map(invite => {
                  const role = getRoleObj(invite.role)
                  return (
                    <div key={invite.id} style={{ background: '#1c1a13', border: '1px solid #2a2510', borderRadius: 10, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#2a2510', border: '2px dashed #3a3020', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Mail size={18} color="#8a7a55" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: '#f0ebe0', fontSize: 14 }}>{invite.email}</div>
                        <div style={{ color: '#8a7a55', fontSize: 12 }}>Invited {invite.sentAt} · Awaiting acceptance</div>
                      </div>
                      <RoleBadge roleId={invite.role} />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => {}}
                          title="Resend invite"
                          style={{ background: 'rgba(200,151,62,0.1)', border: '1px solid rgba(200,151,62,0.3)', color: '#c8973e', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}
                        >
                          <RefreshCw size={12} /> Resend
                        </button>
                        <button
                          onClick={() => handleCancelInvite(invite.id)}
                          title="Cancel invite"
                          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}
                        >
                          <X size={12} /> Cancel
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Roles & Permissions tab */}
        {activeTab === 'roles' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            {ROLES.map(role => (
              <div key={role.id} style={{ background: '#1c1a13', border: `1px solid ${selectedRole === role.id ? role.color : '#2a2510'}`, borderRadius: 12, padding: 24, cursor: 'pointer', transition: 'border-color 0.2s' }} onClick={() => setSelectedRole(selectedRole === role.id ? null : role.id)}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: role.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: role.color }}>
                      {React.cloneElement(role.icon, { size: 16 })}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: '#f0ebe0' }}>{role.label}</div>
                      <div style={{ fontSize: 11, color: '#8a7a55' }}>{members.filter(m => m.role === role.id).length} member{members.filter(m => m.role === role.id).length !== 1 ? 's' : ''}</div>
                    </div>
                  </div>
                  {role.id === 'owner' ? <Lock size={14} color="#8a7a55" /> : <Unlock size={14} color="#8a7a55" />}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {role.permissions.map(perm => (
                    <div key={perm} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#c8973e' }}>
                      <Check size={11} /> <span style={{ color: '#d4c9a8' }}>{perm}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
