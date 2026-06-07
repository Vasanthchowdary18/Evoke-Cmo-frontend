import React, { useState } from 'react'
import { X, Wallet, AlertCircle, CheckCircle, Copy, Check } from 'lucide-react'
import { saveWalletAddress, getEGTBalance } from '../services/userService'

const MODAL_BG = '#0e0c09'
const GOLD = '#c8973e'
const GDIM = 'rgba(200,151,62,0.12)'
const GBORDER = 'rgba(200,151,62,0.28)'
const TEXT = '#f0ebe0'
const TEXT2 = 'rgba(240,235,224,0.55)'

function truncate(addr) {
  if (!addr) return ''
  return addr.slice(0, 6) + '…' + addr.slice(-4)
}

export default function WalletConnectModal({ user, onConnected, onClose }) {
  const [step, setStep]         = useState('choose')   // choose | wc_manual | connected
  const [address, setAddress]   = useState('')
  const [egtBalance, setEgt]    = useState(0)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [copied, setCopied]     = useState(false)
  const [manualAddr, setManual] = useState('')

  async function afterConnect(addr) {
    const clean = addr.trim()
    await saveWalletAddress(user.uid, clean)
    const bal = await getEGTBalance(user.uid)
    setAddress(clean)
    setEgt(bal)
    setStep('connected')
  }

  async function handleMetaMask() {
    if (!window.ethereum) {
      setError('MetaMask not detected. Please install the MetaMask browser extension and try again.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      await afterConnect(accounts[0])
    } catch (err) {
      setError(err.code === 4001 ? 'Connection rejected. Please approve in MetaMask.' : err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleManualSubmit() {
    if (!manualAddr.startsWith('0x') || manualAddr.length < 10) {
      setError('Please enter a valid wallet address (starts with 0x).')
      return
    }
    setLoading(true)
    setError('')
    try {
      await afterConnect(manualAddr)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function copyAddr() {
    navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const overlay = {
    position: 'fixed', inset: 0, zIndex: 1000,
    background: 'rgba(0,0,0,0.75)',
    backdropFilter: 'blur(8px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
  }

  const card = {
    background: MODAL_BG,
    border: `1px solid ${GBORDER}`,
    borderRadius: 24, padding: 40,
    width: '100%', maxWidth: 460,
    position: 'relative',
    boxShadow: '0 24px 80px rgba(0,0,0,0.8)',
    color: TEXT,
    fontFamily: "'Inter',sans-serif",
  }

  const closeBtn = {
    position: 'absolute', top: 16, right: 16,
    background: 'none', border: 'none',
    cursor: 'pointer', color: TEXT2,
    display: 'flex', padding: 4, borderRadius: 8,
  }

  const walletBtn = (accent) => ({
    width: '100%', padding: '16px',
    background: `rgba(${accent},0.08)`,
    border: `1px solid rgba(${accent},0.3)`,
    borderRadius: 14, cursor: loading ? 'not-allowed' : 'pointer',
    display: 'flex', alignItems: 'center', gap: 14,
    transition: 'all 0.2s', color: TEXT,
    opacity: loading ? 0.6 : 1,
  })

  /* ── CONNECTED state ── */
  if (step === 'connected') {
    return (
      <div style={overlay}>
        <div style={card}>
          <button onClick={onClose} style={closeBtn}><X size={18} /></button>

          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', margin: '0 auto 16px',
              background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <CheckCircle size={30} color="#10b981" />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Wallet Connected</h2>
            <p style={{ color: TEXT2, fontSize: 14 }}>Your EVOKE Wallet is linked to your account.</p>
          </div>

          <div style={{
            background: GDIM, border: `1px solid ${GBORDER}`,
            borderRadius: 14, padding: '14px 18px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 12,
          }}>
            <div>
              <p style={{ fontSize: 11, color: TEXT2, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>Wallet Address</p>
              <p style={{ fontSize: 15, fontWeight: 700, fontFamily: 'monospace' }}>{truncate(address)}</p>
            </div>
            <button onClick={copyAddr} style={{ background: 'none', border: 'none', cursor: 'pointer', color: TEXT2 }}>
              {copied ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
            </button>
          </div>

          <div style={{
            background: GDIM, border: `1px solid ${GBORDER}`,
            borderRadius: 14, padding: '14px 18px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 28,
          }}>
            <div>
              <p style={{ fontSize: 11, color: TEXT2, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>EGT Balance</p>
              <p style={{ fontSize: 22, fontWeight: 900, color: GOLD }}>{egtBalance.toLocaleString()} <span style={{ fontSize: 13, fontWeight: 600 }}>EGT</span></p>
            </div>
            <img src="/gratitude-token.png" alt="" style={{ width: 36, height: 36, borderRadius: '50%' }} />
          </div>

          {egtBalance === 0 && (
            <div style={{
              background: 'rgba(245,197,66,0.08)', border: '1px solid rgba(245,197,66,0.2)',
              borderRadius: 10, padding: '10px 14px',
              display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 20,
            }}>
              <AlertCircle size={15} color="#f5c542" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 13, color: 'rgba(245,197,66,0.85)', lineHeight: 1.5, margin: 0 }}>
                Your EGT balance is 0. You need EGT tokens to launch CMO agents. Visit the Tokens page to earn EGT.
              </p>
            </div>
          )}

          <button
            onClick={() => onConnected(address, egtBalance)}
            style={{
              width: '100%', padding: '14px',
              background: egtBalance > 0 ? `linear-gradient(135deg,${GOLD},#b8803a)` : 'rgba(255,255,255,0.06)',
              border: 'none', borderRadius: 12,
              color: egtBalance > 0 ? '#0e0c09' : TEXT2,
              fontSize: 15, fontWeight: 800, cursor: 'pointer',
            }}
          >
            {egtBalance > 0 ? 'Continue — Select Tier →' : 'Go to Tokens Page'}
          </button>
        </div>
      </div>
    )
  }

  /* ── WalletConnect manual entry ── */
  if (step === 'wc_manual') {
    return (
      <div style={overlay}>
        <div style={card}>
          <button onClick={() => setStep('choose')} style={closeBtn}><X size={18} /></button>

          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', margin: '0 auto 16px',
              background: GDIM, border: `1px solid ${GBORDER}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <img src="/gratitude-token.png" alt="" style={{ width: 36, borderRadius: '50%' }} />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Enter Wallet Address</h2>
            <p style={{ color: TEXT2, fontSize: 14, lineHeight: 1.6 }}>
              Open your wallet app (EVOKE Wallet, Trust, Rainbow, etc.) and copy your wallet address.
            </p>
          </div>

          <input
            value={manualAddr}
            onChange={e => { setManual(e.target.value); setError('') }}
            placeholder="0x..."
            style={{
              width: '100%', padding: '14px 16px',
              background: 'rgba(255,255,255,0.05)',
              border: `1px solid ${error ? '#ef4444' : GBORDER}`,
              borderRadius: 12, color: TEXT,
              fontSize: 14, fontFamily: 'monospace',
              outline: 'none', boxSizing: 'border-box', marginBottom: 12,
            }}
          />

          {error && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14 }}>
              <AlertCircle size={14} color="#ef4444" />
              <p style={{ fontSize: 13, color: '#ef4444', margin: 0 }}>{error}</p>
            </div>
          )}

          <button
            onClick={handleManualSubmit}
            disabled={loading || !manualAddr}
            style={{
              width: '100%', padding: '14px',
              background: manualAddr ? `linear-gradient(135deg,${GOLD},#b8803a)` : 'rgba(255,255,255,0.06)',
              border: 'none', borderRadius: 12,
              color: manualAddr ? '#0e0c09' : TEXT2,
              fontSize: 15, fontWeight: 800,
              cursor: loading || !manualAddr ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Connecting…' : 'Connect Wallet'}
          </button>
        </div>
      </div>
    )
  }

  /* ── CHOOSE state ── */
  return (
    <div style={overlay}>
      <div style={card}>
        <button onClick={onClose} style={closeBtn}><X size={18} /></button>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%', margin: '0 auto 16px',
            background: GDIM, border: `1px solid ${GBORDER}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Wallet size={28} color={GOLD} />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Connect EGT Wallet</h2>
          <p style={{ color: TEXT2, fontSize: 14, lineHeight: 1.6, maxWidth: 320, margin: '0 auto' }}>
            Connect your wallet to access CMO agents. EGT tokens are required to launch campaigns.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          {/* MetaMask */}
          <button
            onClick={handleMetaMask}
            disabled={loading}
            style={walletBtn('245,158,11')}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'rgba(245,158,11,0.14)' }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.background = 'rgba(245,158,11,0.08)' }}
          >
            <div style={{
              width: 42, height: 42, borderRadius: 10, flexShrink: 0,
              background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="24" height="24" viewBox="0 0 318 318"><polygon fill="#E2761B" stroke="#E2761B" strokeLinecap="round" strokeLinejoin="round" points="274.1,35.5 174.6,109.4 193,65.8"/><polygon fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round" points="44,35.5 142.7,110.2 125.1,65.8"/><polygon fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round" points="238.3,206.8 211.8,247.4 268.5,263 284.8,207.7"/><polygon fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round" points="33.4,207.7 49.5,263 106.2,247.4 79.7,206.8"/><polygon fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round" points="103.6,138.2 87.8,162.1 144.1,164.6 142.1,104.1"/><polygon fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round" points="214.5,138.2 175.9,103.4 174.6,164.6 230.3,162.1"/><polygon fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round" points="106.2,247.4 140.7,230.9 110.9,208.1"/><polygon fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round" points="177.4,230.9 211.8,247.4 207.3,208.1"/></svg>
            </div>
            <div style={{ textAlign: 'left' }}>
              <p style={{ fontWeight: 700, fontSize: 15, margin: 0 }}>{loading ? 'Connecting…' : 'MetaMask'}</p>
              <p style={{ fontSize: 12, color: TEXT2, margin: '2px 0 0' }}>Connect via browser extension</p>
            </div>
          </button>

          {/* WalletConnect / Mobile wallet */}
          <button
            onClick={() => { setStep('wc_manual'); setError('') }}
            disabled={loading}
            style={walletBtn('97,125,255')}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'rgba(97,125,255,0.14)' }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.background = 'rgba(97,125,255,0.08)' }}
          >
            <div style={{
              width: 42, height: 42, borderRadius: 10, flexShrink: 0,
              background: 'linear-gradient(135deg,#3b48e0,#6070ff)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M6.2 8.7C9.4 5.5 14.6 5.5 17.8 8.7l.4.4c.1.1.1.3 0 .4l-1.3 1.3c-.1.1-.2.1-.3 0l-.5-.5c-2.2-2.2-5.8-2.2-8 0l-.5.5c-.1.1-.2.1-.3 0L5.9 9.5c-.1-.1-.1-.3 0-.4l.3-.4zm8.5 4.2-1.2 1.2c-.1.1-.3.1-.4 0L12 12.9l-1.1 1.1c-.1.1-.3.1-.4 0L9.3 12.8c-.1-.1-.1-.3 0-.4l1.2-1.2c.1-.1.3-.1.4 0l1.1 1.1 1.1-1.1c.1-.1.3-.1.4 0l1.2 1.2c.1.2.1.4 0 .5z" fill="#fff"/>
              </svg>
            </div>
            <div style={{ textAlign: 'left' }}>
              <p style={{ fontWeight: 700, fontSize: 15, margin: 0 }}>WalletConnect / Mobile</p>
              <p style={{ fontSize: 12, color: TEXT2, margin: '2px 0 0' }}>EVOKE Wallet, Trust, Rainbow & more</p>
            </div>
          </button>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: 10, padding: '10px 14px',
            display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 16,
          }}>
            <AlertCircle size={15} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 13, color: '#ef4444', margin: 0, lineHeight: 1.5 }}>{error}</p>
          </div>
        )}

        <p style={{ fontSize: 12, color: TEXT2, textAlign: 'center', lineHeight: 1.6 }}>
          By connecting, you agree that EGT tokens will be deducted from your balance each time you launch a CMO agent session.
        </p>
      </div>
    </div>
  )
}
