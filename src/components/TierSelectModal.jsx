import React, { useState } from 'react'
import { X, CheckCircle, AlertCircle, Zap, Lock } from 'lucide-react'
import { EGT_TIERS } from '../config'
import { deductEGT } from '../services/userService'

const MODAL_BG = '#0e0c09'
const TEXT     = '#f0ebe0'
const TEXT2    = 'rgba(240,235,224,0.55)'
const TEXT3    = 'rgba(240,235,224,0.28)'

export default function TierSelectModal({ user, egtBalance, onTierSelected, onClose }) {
  const [selected, setSelected] = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const TIER_ORDER = ['basic', 'pro', 'max']

  async function handleConfirm() {
    if (!selected) return
    const tier = EGT_TIERS[selected]
    if (egtBalance < tier.egtCost) {
      setError(`You need ${tier.egtCost} EGT for ${tier.name} — you have ${egtBalance} EGT.`)
      return
    }
    setLoading(true)
    setError('')
    try {
      await deductEGT(user.uid, tier.egtCost)
      sessionStorage.setItem('egtTier', selected)
      onTierSelected(selected, egtBalance - tier.egtCost)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const canAfford = (tierId) => egtBalance >= EGT_TIERS[tierId].egtCost

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, overflowY: 'auto',
    }}>
      <div style={{
        background: MODAL_BG,
        border: '1px solid rgba(200,151,62,0.28)',
        borderRadius: 28, padding: '40px 36px',
        width: '100%', maxWidth: 680,
        position: 'relative',
        boxShadow: '0 24px 80px rgba(0,0,0,0.85)',
        color: TEXT, fontFamily: "'Inter',sans-serif",
        margin: 'auto',
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 16, right: 16,
            background: 'none', border: 'none', cursor: 'pointer',
            color: TEXT2, display: 'flex', padding: 4, borderRadius: 8,
          }}
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '4px 14px',
            background: 'rgba(200,151,62,0.12)',
            border: '1px solid rgba(200,151,62,0.28)',
            borderRadius: 100, fontSize: 11, fontWeight: 700,
            color: '#c8973e', letterSpacing: '0.1em', textTransform: 'uppercase',
            marginBottom: 16,
          }}>
            <Zap size={11} fill="#c8973e" /> Select Your CMO Tier
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 8 }}>
            Choose how to launch
          </h2>
          <p style={{ color: TEXT2, fontSize: 14, lineHeight: 1.6 }}>
            EGT is deducted once per session. Your tier determines which CMO agents you can access.
          </p>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            marginTop: 12, padding: '8px 16px',
            background: 'rgba(200,151,62,0.08)', border: '1px solid rgba(200,151,62,0.2)',
            borderRadius: 99,
          }}>
            <img src="/gratitude-token.png" alt="" style={{ width: 20, height: 20, borderRadius: '50%' }} />
            <span style={{ color: '#c8973e', fontWeight: 800, fontSize: 15 }}>{egtBalance.toLocaleString()}</span>
            <span style={{ color: TEXT2, fontSize: 13 }}>EGT available</span>
          </div>
        </div>

        {/* Tier Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 24 }}>
          {TIER_ORDER.map((tierId) => {
            const tier      = EGT_TIERS[tierId]
            const affordable = canAfford(tierId)
            const isSelected = selected === tierId

            return (
              <div
                key={tierId}
                onClick={() => { if (affordable) { setSelected(tierId); setError('') } }}
                style={{
                  borderRadius: 18,
                  border: isSelected
                    ? `2px solid ${tier.color}`
                    : affordable
                      ? `1px solid rgba(255,255,255,0.1)`
                      : `1px solid rgba(255,255,255,0.05)`,
                  background: isSelected
                    ? `rgba(${hexToRgb(tier.color)},0.1)`
                    : affordable
                      ? 'rgba(255,255,255,0.03)'
                      : 'rgba(0,0,0,0.2)',
                  padding: '20px 16px',
                  cursor: affordable ? 'pointer' : 'not-allowed',
                  opacity: affordable ? 1 : 0.45,
                  transition: 'all 0.2s',
                  position: 'relative',
                  boxShadow: isSelected ? `0 0 24px rgba(${hexToRgb(tier.color)},0.2)` : 'none',
                }}
                onMouseEnter={e => {
                  if (affordable && !isSelected) {
                    e.currentTarget.style.borderColor = `rgba(${hexToRgb(tier.color)},0.4)`
                    e.currentTarget.style.background = `rgba(${hexToRgb(tier.color)},0.05)`
                  }
                }}
                onMouseLeave={e => {
                  if (affordable && !isSelected) {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                  }
                }}
              >
                {/* Lock badge for unaffordable */}
                {!affordable && (
                  <div style={{
                    position: 'absolute', top: 10, right: 10,
                    background: 'rgba(255,255,255,0.08)',
                    borderRadius: 6, padding: '2px 6px',
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    <Lock size={10} color={TEXT3} />
                    <span style={{ fontSize: 9, color: TEXT3, fontWeight: 700 }}>NEED MORE EGT</span>
                  </div>
                )}

                {/* Selected check */}
                {isSelected && (
                  <div style={{ position: 'absolute', top: 10, right: 10 }}>
                    <CheckCircle size={18} color={tier.color} />
                  </div>
                )}

                {/* Tier colour bar */}
                <div style={{
                  width: 36, height: 4, borderRadius: 99,
                  background: tier.gradient, marginBottom: 14,
                }} />

                <p style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
                  textTransform: 'uppercase', color: tier.color, marginBottom: 4,
                }}>
                  {tier.name}
                </p>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                  <span style={{ fontSize: 26, fontWeight: 900, color: TEXT }}>{tier.egtCost}</span>
                  <span style={{ fontSize: 12, color: TEXT2, fontWeight: 600 }}>EGT / session</span>
                </div>

                <p style={{ fontSize: 11, color: TEXT2, lineHeight: 1.5, marginBottom: 14 }}>
                  {tier.description}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {tier.agentLabels.map(label => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 14, height: 14, borderRadius: '50%', background: tier.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: 8, color: '#fff', fontWeight: 900 }}>✓</span>
                      </div>
                      <span style={{ fontSize: 11, color: TEXT2 }}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: 10, padding: '10px 14px',
            display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 16,
          }}>
            <AlertCircle size={15} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 13, color: '#ef4444', margin: 0 }}>{error}</p>
          </div>
        )}

        {/* Confirm button */}
        <button
          onClick={handleConfirm}
          disabled={!selected || loading}
          style={{
            width: '100%', padding: '15px',
            background: selected
              ? EGT_TIERS[selected].gradient
              : 'rgba(255,255,255,0.06)',
            border: 'none', borderRadius: 14,
            color: selected ? '#0e0c09' : TEXT2,
            fontSize: 16, fontWeight: 800,
            cursor: selected && !loading ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s',
            boxShadow: selected ? `0 8px 28px rgba(${hexToRgb(EGT_TIERS[selected]?.color || '#888')},0.35)` : 'none',
          }}
        >
          {loading
            ? 'Processing…'
            : selected
              ? `Launch ${EGT_TIERS[selected].name} — ${EGT_TIERS[selected].egtCost} EGT →`
              : 'Select a tier to continue'}
        </button>

        <p style={{ fontSize: 11, color: TEXT3, textAlign: 'center', marginTop: 14, lineHeight: 1.6 }}>
          EGT tokens are non-refundable once a session is started. Balance resets on next login.
        </p>
      </div>
    </div>
  )
}

// helpers
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}`
    : '200,151,62'
}
