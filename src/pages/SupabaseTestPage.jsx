/**
 * SupabaseTestPage.jsx
 * Localhost-only page to verify the Supabase connection actually persists
 * data (insert a row, read it back). Not part of the app's real data layer —
 * Firestore remains the app's database (see src/firebase.js).
 */
import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

const BG = '#0e0c09'
const CARD = '#1c1a13'
const GOLD = '#c8973e'
const TEXT = '#f0ebe0'
const TEXT2 = 'rgba(240,235,224,0.55)'
const BORDER = 'rgba(255,255,255,0.07)'

export default function SupabaseTestPage() {
  const [message, setMessage] = useState('')
  const [rows, setRows] = useState([])
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  async function loadRows() {
    const { data, error } = await supabase
      .from('connection_test')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) { setStatus(`Read failed: ${error.message}`); return }
    setRows(data || [])
  }

  useEffect(() => { loadRows() }, [])

  async function handleInsert() {
    if (!message.trim()) return
    setLoading(true)
    setStatus('')
    const { error } = await supabase.from('connection_test').insert({ message })
    setLoading(false)
    if (error) { setStatus(`Insert failed: ${error.message}`); return }
    setStatus('Saved! Check your Supabase dashboard\'s Table Editor to confirm.')
    setMessage('')
    loadRows()
  }

  return (
    <div style={{ minHeight: '100vh', background: BG, color: TEXT, fontFamily: "'Inter',sans-serif", padding: 40 }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Supabase Connection Test</h1>
        <p style={{ fontSize: 13, color: TEXT2, marginBottom: 24 }}>
          Localhost-only test page. Type something, save it, then check your Supabase
          dashboard's Table Editor → <code>connection_test</code> to see it really stored.
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Type a test message..."
            style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: `1px solid ${BORDER}`, background: CARD, color: TEXT, fontSize: 14 }}
          />
          <button onClick={handleInsert} disabled={loading} style={{
            padding: '10px 18px', borderRadius: 8, border: 'none',
            background: `linear-gradient(135deg,${GOLD},#b8803a)`, color: '#0e0c09',
            fontWeight: 700, cursor: loading ? 'default' : 'pointer', fontFamily: 'inherit',
          }}>
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>

        {status && <div style={{ fontSize: 13, color: status.includes('failed') ? '#ef4444' : '#10b981', marginBottom: 20 }}>{status}</div>}

        <div style={{ fontSize: 12, fontWeight: 700, color: TEXT2, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
          Rows in Supabase ({rows.length})
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rows.map(r => (
            <div key={r.id} style={{ padding: '10px 14px', background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 13 }}>
              {r.message}
              <span style={{ color: TEXT2, fontSize: 11, marginLeft: 8 }}>
                {new Date(r.created_at).toLocaleString()}
              </span>
            </div>
          ))}
          {rows.length === 0 && <div style={{ fontSize: 13, color: TEXT2 }}>No rows yet.</div>}
        </div>
      </div>
    </div>
  )
}
