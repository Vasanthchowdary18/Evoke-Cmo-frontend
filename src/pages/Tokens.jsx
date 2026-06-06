import React, { useRef, useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { redirectToLogin } from '../lib/authUtils'

const SEGMENTS = [
  { label: '50 EGT',   value: 50,   color: '#f0d898', textColor: '#7a5000' },
  { label: '1000 EGT', value: 1000, color: '#c8960c', textColor: '#fff'    },
  { label: '100 EGT',  value: 100,  color: '#f5c542', textColor: '#7a5000' },
  { label: '500 EGT',  value: 500,  color: '#e6a817', textColor: '#fff'    },
  { label: '250 EGT',  value: 250,  color: '#f0d080', textColor: '#7a5000' },
  { label: '2500 EGT', value: 2500, color: '#b8860b', textColor: '#fff'    },
  { label: '50 EGT',   value: 50,   color: '#f5c542', textColor: '#7a5000' },
  { label: '500 EGT',  value: 500,  color: '#d4a017', textColor: '#fff'    },
]

function SpinWheel({ onResult }) {
  const canvasRef = useRef(null)
  const rotationRef = useRef(0)
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState(null)

  const SIZE = 280
  const CX = SIZE / 2
  const CY = SIZE / 2
  const RADIUS = CX - 8
  const ARC = (2 * Math.PI) / SEGMENTS.length

  const drawWheel = useCallback((rotation) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, SIZE, SIZE)

    // outer shadow ring
    ctx.save()
    ctx.shadowBlur = 24
    ctx.shadowColor = 'rgba(180,120,0,0.25)'
    ctx.beginPath()
    ctx.arc(CX, CY, RADIUS + 6, 0, 2 * Math.PI)
    ctx.fillStyle = '#fff8ee'
    ctx.fill()
    ctx.restore()

    // segments
    SEGMENTS.forEach((seg, i) => {
      const start = rotation + i * ARC - Math.PI / 2
      const end = start + ARC

      ctx.beginPath()
      ctx.moveTo(CX, CY)
      ctx.arc(CX, CY, RADIUS, start, end)
      ctx.closePath()
      ctx.fillStyle = seg.color
      ctx.fill()
      ctx.strokeStyle = '#fff8ee'
      ctx.lineWidth = 2
      ctx.stroke()

      // label
      ctx.save()
      ctx.translate(CX, CY)
      ctx.rotate(start + ARC / 2)
      ctx.textAlign = 'right'
      ctx.fillStyle = seg.textColor
      ctx.font = `bold ${seg.value >= 1000 ? 10 : 12}px sans-serif`
      ctx.fillText(seg.label, RADIUS - 12, 4)
      ctx.restore()
    })

    // center circle
    const grad = ctx.createRadialGradient(CX, CY, 2, CX, CY, 22)
    grad.addColorStop(0, '#ffe066')
    grad.addColorStop(1, '#c8960c')
    ctx.beginPath()
    ctx.arc(CX, CY, 22, 0, 2 * Math.PI)
    ctx.fillStyle = grad
    ctx.fill()
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 3
    ctx.stroke()

    // pointer (triangle at top)
    ctx.beginPath()
    ctx.moveTo(CX, 4)
    ctx.lineTo(CX - 10, 22)
    ctx.lineTo(CX + 10, 22)
    ctx.closePath()
    ctx.fillStyle = '#b8860b'
    ctx.fill()
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2
    ctx.stroke()
  }, [])

  useEffect(() => { drawWheel(0) }, [drawWheel])

  function spin() {
    if (spinning) return
    setSpinning(true)
    setResult(null)

    const segIdx = Math.floor(Math.random() * SEGMENTS.length)
    const segAngle = (2 * Math.PI) / SEGMENTS.length
    const extraSpins = (5 + Math.floor(Math.random() * 4)) * 2 * Math.PI
    const targetOffset = 2 * Math.PI - segIdx * segAngle - segAngle / 2
    const totalRotation = rotationRef.current + extraSpins + targetOffset - (rotationRef.current % (2 * Math.PI))

    const duration = 4500
    const startTime = performance.now()
    const startRotation = rotationRef.current

    function animate(now) {
      const elapsed = now - startTime
      const t = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - t, 4)
      const current = startRotation + (totalRotation - startRotation) * eased
      rotationRef.current = current
      drawWheel(current)

      if (t < 1) {
        requestAnimationFrame(animate)
      } else {
        rotationRef.current = totalRotation % (2 * Math.PI)
        setSpinning(false)
        setResult(SEGMENTS[segIdx])
        onResult?.(SEGMENTS[segIdx])
      }
    }
    requestAnimationFrame(animate)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <div style={{ position: 'relative' }}>
        <canvas
          ref={canvasRef}
          width={SIZE}
          height={SIZE}
          style={{ display: 'block', cursor: spinning ? 'default' : 'pointer', borderRadius: '50%' }}
          onClick={spin}
        />
      </div>
      <button
        onClick={spin}
        disabled={spinning}
        style={{
          background: spinning ? '#ccc' : 'linear-gradient(135deg, #f5c542, #c8960c)',
          color: spinning ? '#888' : '#111',
          fontWeight: 800,
          fontSize: 13,
          letterSpacing: '0.1em',
          padding: '10px 28px',
          borderRadius: 999,
          border: 'none',
          cursor: spinning ? 'not-allowed' : 'pointer',
          boxShadow: spinning ? 'none' : '0 6px 20px rgba(200,150,12,0.4)',
          transition: 'all 0.2s',
        }}
      >
        {spinning ? 'SPINNING...' : 'SPIN TO WIN'}
      </button>

      {result && (
        <div style={{
          marginTop: 4,
          padding: '10px 20px',
          background: 'linear-gradient(135deg, #fffbe6, #fff8d0)',
          border: '1px solid rgba(200,150,12,0.3)',
          borderRadius: 12,
          textAlign: 'center',
          animation: 'fadeInUp 0.4s ease',
        }}>
          <div style={{ color: '#b8860b', fontWeight: 800, fontSize: 18 }}>{result.label}</div>
          <div style={{ color: '#999', fontSize: 12, marginTop: 2 }}>Sign in to claim your reward!</div>
        </div>
      )}
    </div>
  )
}

const PERKS = [
  ['Free Starter', '1,000 EGT', 'Access basic campaign tools.'],
  ['Thunderbird', '5,000 EGT', 'Unlock premium prompt packs.'],
  ['Fortune Mindset', '10,000 EGT', 'Generate advanced ad copies.'],
  ['Quantum Riser', '25,000 EGT', 'Unlock full campaign strategy.'],
  ['Lexicon Leader', '50,000 EGT', 'Access AI content systems.'],
  ['High Roller', '100,000 EGT', 'Unlock VIP marketing assets.'],
  ['Dream Keeper', '250,000 EGT', 'Get premium campaign plans.'],
  ['Master Mentor', '500,000 EGT', 'Access elite CMO workflows.'],
]

const BONUSES = [
  ['Early Access', 'Get early access to new AI agents and features before anyone else.'],
  ['VIP Campaigns', 'Unlock exclusive campaign templates reserved for top token holders.'],
  ['Priority Support', 'Jump the queue — token holders get dedicated priority support.'],
  ['Community Badge', 'Earn a verified EGT holder badge in the Evoke community.'],
  ['Referral Multiplier', 'Earn 2x tokens when you refer a new member who signs up.'],
  ['Monthly Airdrops', 'Active members receive monthly EGT bonus drops automatically.'],
]

export default function Tokens() {
  const openSignIn = (e) => { e.preventDefault(); redirectToLogin() }

  return (
    <div style={{ background: '#fff', color: '#111', fontFamily: 'inherit' }}>

      {/* ── HERO ── */}
      <section
        style={{
          background: 'linear-gradient(135deg, #031f1d 0%, #062b22 50%, #041a14 100%)',
          padding: '100px 8% 80px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '60px',
          alignItems: 'center',
          minHeight: '520px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* background glow */}
        <div style={{
          position: 'absolute', top: '20%', right: '30%',
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245,197,66,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(245,197,66,0.12)', border: '1px solid rgba(245,197,66,0.3)',
            borderRadius: 999, padding: '6px 16px', marginBottom: 24,
          }}>
            <img src="/gratitude-token.png" alt="" style={{ width: 20, height: 20, borderRadius: '50%' }} />
            <span style={{ color: '#f5c542', fontSize: 13, fontWeight: 600 }}>Digital Reward System</span>
          </div>

          <h1 style={{ fontSize: 'clamp(32px, 4vw, 54px)', fontWeight: 900, lineHeight: 1.1, color: '#fff', marginBottom: 20 }}>
            Evoke <span style={{ color: '#f5c542' }}>Gratitude Token</span>{' '}
            <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.6em' }}>(EGT)</span>
          </h1>

          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 17, lineHeight: 1.75, marginBottom: 32, maxWidth: 480 }}>
            A digital reward system for your CMO Agent. Earn tokens, unlock campaign perks,
            and reward positive actions inside your AI-powered marketing workflow.
          </p>

          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <button onClick={openSignIn} style={{
              background: 'linear-gradient(135deg, #f5c542, #e6a817)',
              color: '#111', fontWeight: 700, fontSize: 15,
              padding: '12px 28px', borderRadius: 12, textDecoration: 'none',
              boxShadow: '0 8px 24px rgba(245,197,66,0.35)',
            }}>
              Sign In
            </button>
            <button onClick={openSignIn} style={{
              background: 'transparent', border: '1px solid rgba(245,197,66,0.4)',
              color: '#f5c542', fontWeight: 600, fontSize: 15,
              padding: '12px 28px', borderRadius: 12, textDecoration: 'none',
            }}>
              Create Account
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ position: 'relative' }}>
            <div style={{
              position: 'absolute', inset: -30,
              background: 'radial-gradient(circle, rgba(245,197,66,0.2) 0%, transparent 70%)',
              borderRadius: '50%',
            }} />
            <img
              src="/gratitude-token.png"
              alt="Gratitude Token"
              style={{
                width: 'clamp(200px, 30vw, 360px)',
                filter: 'drop-shadow(0 0 60px rgba(245,197,66,0.6))',
                animation: 'floatCoin 4s ease-in-out infinite',
                position: 'relative',
              }}
            />
          </div>
        </div>
      </section>

      {/* ── SIGN UP STRIP ── */}
      <section style={{
        background: '#0a0a0a', padding: '18px 8%',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
      }}>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, margin: 0 }}>
          Already a member? Sign in to track your EGT balance and unlock rewards.
        </p>
        <button onClick={openSignIn} style={{
          background: '#f5c542', color: '#111', fontWeight: 700,
          fontSize: 13, padding: '8px 20px', borderRadius: 8, textDecoration: 'none',
        }}>
          Sign Up Free →
        </button>
      </section>

      {/* ── SPIN TO WIN ── */}
      <section style={{
        padding: '80px 8%',
        background: 'linear-gradient(135deg, #fdf5e4, #fef9ee)',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 64,
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <SpinWheel />
        </div>

        <div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(196,139,48,0.12)', border: '1px solid rgba(196,139,48,0.25)',
            borderRadius: 999, padding: '5px 14px', marginBottom: 18,
          }}>
            <span style={{ color: '#b9822b', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>EGT Rewards</span>
          </div>

          <h2 style={{ fontSize: 'clamp(28px, 3.5vw, 44px)', fontWeight: 900, color: '#2a1a00', marginBottom: 16, lineHeight: 1.15 }}>
            Sign in to <span style={{ color: '#c8960c' }}>spin</span>
          </h2>

          <p style={{ color: '#886633', fontSize: 16, lineHeight: 1.75, marginBottom: 28, maxWidth: 400 }}>
            Log in to your account to spin the wheel and earn real EGT rewards instantly. Each spin could win you up to <strong>2,500 EGT</strong>.
          </p>

          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {['One free spin every 24 hours', 'Earn bonus spins by creating campaigns', 'Win up to 2,500 EGT per spin', 'Rewards credited instantly'].map(item => (
              <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#664400', fontSize: 14 }}>
                <span style={{
                  width: 20, height: 20, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #f5c542, #c8960c)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <span style={{ color: '#fff', fontSize: 10, fontWeight: 900 }}>✓</span>
                </span>
                {item}
              </li>
            ))}
          </ul>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button onClick={openSignIn} style={{
              background: 'linear-gradient(135deg, #c8960c, #a87800)',
              color: '#fff', fontWeight: 700, fontSize: 15,
              padding: '12px 28px', borderRadius: 12, textDecoration: 'none',
              boxShadow: '0 6px 20px rgba(200,150,12,0.35)',
            }}>
              Sign in
            </button>
            <button onClick={openSignIn} style={{
              background: '#fff', border: '1.5px solid rgba(200,150,12,0.4)',
              color: '#7a5500', fontWeight: 600, fontSize: 15,
              padding: '12px 28px', borderRadius: 12, textDecoration: 'none',
            }}>
              Create account
            </button>
          </div>
        </div>
      </section>

      {/* ── GRATITUDE TOKEN PERKS ── */}
      <section style={{ padding: '80px 8%', background: '#fff' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(196,139,48,0.1)', border: '1px solid rgba(196,139,48,0.2)',
            borderRadius: 999, padding: '5px 14px', marginBottom: 14,
          }}>
            <span style={{ color: '#b9822b', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Token Tiers</span>
          </div>
          <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 40px)', fontWeight: 800, color: '#111', marginBottom: 12 }}>
            GRATITUDE TOKEN PERKS
          </h2>
          <p style={{ color: '#666', fontSize: 16, maxWidth: 500, margin: '0 auto' }}>
            Collect EGT and climb the tiers — each level unlocks more powerful marketing tools.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 18,
        }}>
          {PERKS.map(([name, amount, desc], i) => (
            <div key={name} style={{
              border: '1px solid rgba(196,139,48,0.2)',
              borderRadius: 16,
              padding: '24px 20px',
              background: i % 2 === 0 ? '#fffaf2' : '#fff',
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              cursor: 'default',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(196,139,48,0.15)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.05)' }}
            >
              <img src="/gratitude-token.png" alt="" style={{ width: 36, height: 36, marginBottom: 12 }} />
              <p style={{ color: '#b9822b', fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 6px' }}>{name}</p>
              <h3 style={{ margin: '0 0 8px', color: '#111', fontSize: 18, fontWeight: 800 }}>{amount}</h3>
              <p style={{ color: '#666', fontSize: 13, lineHeight: 1.5, margin: 0 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── STATS STRIP ── */}
      <section style={{
        background: 'linear-gradient(135deg, #031f1d, #041a14)',
        padding: '40px 8%',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: 32,
        textAlign: 'center',
      }}>
        {[
          ['500+', 'Active Members'],
          ['10,000+', 'Campaigns Generated'],
          ['8', 'Token Tiers'],
          ['₹0', 'Cost to Start'],
        ].map(([num, label]) => (
          <div key={label}>
            <div style={{ color: '#f5c542', fontSize: 32, fontWeight: 900, lineHeight: 1 }}>{num}</div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 6 }}>{label}</div>
          </div>
        ))}
      </section>

      {/* ── WHAT IS EGT ── */}
      <section style={{ padding: '90px 8%', background: '#fafafa', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
        {/* image placeholder styled as community photo */}
        <div style={{
          borderRadius: 20,
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #062b22, #0a3d2e)',
          aspectRatio: '4/3',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        }}>
          <img src="/gratitude-token.png" alt="" style={{ width: 100, filter: 'drop-shadow(0 0 30px rgba(245,197,66,0.5))' }} />
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Evoke Community</p>
        </div>

        <div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(196,139,48,0.1)', border: '1px solid rgba(196,139,48,0.2)',
            borderRadius: 999, padding: '5px 14px', marginBottom: 18,
          }}>
            <span style={{ color: '#b9822b', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>About EGT</span>
          </div>
          <h2 style={{ fontSize: 'clamp(24px, 3vw, 38px)', fontWeight: 800, marginBottom: 18, lineHeight: 1.2 }}>
            What is <span style={{ color: '#b9822b' }}>EGT</span>?
          </h2>
          <p style={{ color: '#555', fontSize: 16, lineHeight: 1.8, marginBottom: 16 }}>
            The <strong>Evoke Gratitude Token (EGT)</strong> is a digital reward currency built into the Evoke CMO platform.
            It recognises and rewards your marketing activity — the more you create, the more you earn.
          </p>
          <p style={{ color: '#555', fontSize: 16, lineHeight: 1.8, marginBottom: 24 }}>
            EGT is not a cryptocurrency — it's a loyalty and engagement system designed to give power users
            access to exclusive tools, templates, and campaign assets inside the Evoke ecosystem.
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {['Earn EGT by generating campaigns', 'Spend EGT to unlock premium tools', 'Climb tiers for greater rewards', 'No purchase required to start'].map(item => (
              <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#333', fontSize: 15 }}>
                <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(196,139,48,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ color: '#b9822b', fontSize: 12, fontWeight: 800 }}>✓</span>
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: '90px 8%', background: '#fff' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(196,139,48,0.1)', border: '1px solid rgba(196,139,48,0.2)',
            borderRadius: 999, padding: '5px 14px', marginBottom: 14,
          }}>
            <span style={{ color: '#b9822b', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Process</span>
          </div>
          <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 40px)', fontWeight: 800, color: '#111' }}>
            How It Works
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 28 }}>
          {[
            ['01', 'Earning Tokens', 'Create campaigns, complete marketing actions, and use the CMO Agent to automatically earn EGT rewards.', '#f5c542'],
            ['02', 'Spending Tokens', 'Use your EGT balance to unlock advanced marketing tools, premium prompt packs, and campaign assets.', '#e6a817'],
            ['03', 'Grow!', 'Reward consistent action, climb the tier ladder, and build stronger marketing momentum with every campaign.', '#d4920a'],
          ].map(([num, title, desc, color]) => (
            <div key={num} style={{
              padding: '36px 28px',
              background: '#fff',
              borderRadius: 20,
              boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
              border: '1px solid rgba(196,139,48,0.1)',
              position: 'relative',
              overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', top: 20, right: 20,
                fontSize: 64, fontWeight: 900, color: 'rgba(245,197,66,0.08)', lineHeight: 1,
              }}>{num}</div>
              <img src="/gratitude-token.png" alt="" style={{ width: 40, marginBottom: 20 }} />
              <h3 style={{ fontSize: 20, fontWeight: 800, color: '#111', marginBottom: 12 }}>{title}</h3>
              <p style={{ color: '#666', fontSize: 15, lineHeight: 1.7, margin: 0 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── EGT FEATURE SECTION ── */}
      <section style={{
        padding: '90px 8%', background: '#fffaf2',
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center',
      }}>
        <div style={{ textAlign: 'center', position: 'relative' }}>
          <div style={{
            width: '100%', aspectRatio: '1',
            background: 'radial-gradient(circle at center, rgba(245,197,66,0.12), transparent 70%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: '50%',
          }}>
            <img
              src="/gratitude-token.png"
              alt="EGT Coin"
              style={{ width: '75%', maxWidth: 280, filter: 'drop-shadow(0 20px 50px rgba(245,197,66,0.5))' }}
            />
          </div>
        </div>

        <div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(196,139,48,0.1)', border: '1px solid rgba(196,139,48,0.2)',
            borderRadius: 999, padding: '5px 14px', marginBottom: 18,
          }}>
            <span style={{ color: '#b9822b', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Token Details</span>
          </div>
          <h2 style={{ fontSize: 'clamp(24px, 3vw, 38px)', fontWeight: 800, marginBottom: 18, lineHeight: 1.2 }}>
            Evoke <span style={{ color: '#b9822b' }}>Gratitude Token</span> (EGT)
          </h2>
          <p style={{ color: '#555', fontSize: 16, lineHeight: 1.8, marginBottom: 24 }}>
            EGT powers the entire Evoke ecosystem. Every action you take — generating campaigns,
            exploring new agents, sharing results — contributes to your token balance and unlocks greater capabilities.
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              'Fully integrated with the CMO Agent',
              'Automatically credited on campaign creation',
              '8 progressive reward tiers',
              'Redeemable for premium marketing tools',
              'No expiry — tokens accumulate over time',
            ].map(item => (
              <li key={item} style={{ display: 'flex', gap: 12, color: '#333', fontSize: 15, alignItems: 'flex-start' }}>
                <span style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #f5c542, #e6a817)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, marginTop: 1,
                }}>
                  <span style={{ color: '#111', fontSize: 11, fontWeight: 900 }}>✓</span>
                </span>
                {item}
              </li>
            ))}
          </ul>
          <button onClick={openSignIn} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'linear-gradient(135deg, #f5c542, #e6a817)',
            color: '#111', fontWeight: 700, fontSize: 15,
            padding: '13px 28px', borderRadius: 12, textDecoration: 'none',
            boxShadow: '0 8px 24px rgba(245,197,66,0.3)',
          }}>
            Start Earning EGT →
          </button>
        </div>
      </section>

      {/* ── GRATITUDE BONUSES ── */}
      <section style={{ padding: '90px 8%', background: '#fff', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
        <div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(196,139,48,0.1)', border: '1px solid rgba(196,139,48,0.2)',
            borderRadius: 999, padding: '5px 14px', marginBottom: 18,
          }}>
            <span style={{ color: '#b9822b', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Exclusive Perks</span>
          </div>
          <h2 style={{ fontSize: 'clamp(24px, 3vw, 38px)', fontWeight: 800, marginBottom: 28, lineHeight: 1.2 }}>
            The <span style={{ color: '#b9822b' }}>Gratitude</span> Bonuses
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {BONUSES.map(([title, desc]) => (
              <div key={title} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                  background: 'rgba(245,197,66,0.12)', border: '1px solid rgba(245,197,66,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <img src="/gratitude-token.png" alt="" style={{ width: 22 }} />
                </div>
                <div>
                  <h4 style={{ margin: '0 0 4px', color: '#111', fontWeight: 700, fontSize: 15 }}>{title}</h4>
                  <p style={{ margin: 0, color: '#666', fontSize: 14, lineHeight: 1.6 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* image panel */}
        <div style={{
          borderRadius: 20,
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #1a0a00, #3d1f00)',
          aspectRatio: '4/3',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
          padding: 32,
          textAlign: 'center',
        }}>
          <img src="/gratitude-token.png" alt="" style={{ width: 90, filter: 'drop-shadow(0 0 30px rgba(245,197,66,0.6))' }} />
          <p style={{ color: '#f5c542', fontWeight: 700, fontSize: 16, margin: 0 }}>Community Rewards</p>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: 0 }}>
            Earn together. Grow together.
          </p>
        </div>
      </section>

      {/* ── DISCLAIMER ── */}
      <section style={{ padding: '60px 8%', background: '#fffaf2', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 6,
          background: 'linear-gradient(90deg, #f5c542, #e6a817, #f5c542)',
        }} />
        <div style={{
          maxWidth: 800, margin: '0 auto', textAlign: 'center',
        }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(196,139,48,0.15)', border: '1px solid rgba(196,139,48,0.3)',
            borderRadius: 999, padding: '6px 18px', marginBottom: 20,
          }}>
            <span style={{ color: '#b9822b', fontSize: 13, fontWeight: 700 }}>⚠ Disclaimer</span>
          </div>
          <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 16, color: '#111' }}>
            Disclaimer — The Evoke Gratitude Token
          </h3>
          <p style={{ color: '#666', fontSize: 15, lineHeight: 1.8, margin: 0 }}>
            The Evoke Gratitude Token (EGT) is a <strong>non-financial, loyalty-based digital reward</strong> used
            exclusively within the Evoke CMO platform. EGT has no monetary value, cannot be exchanged for cash or
            cryptocurrency, and does not constitute a financial instrument or investment of any kind. EGT is designed
            solely to reward engagement and unlock platform features. Evoke CMO reserves the right to modify, suspend,
            or discontinue the EGT programme at any time.
          </p>
        </div>
      </section>

      {/* ── JOIN COMMUNITY ── */}
      <section style={{
        padding: '100px 8%',
        background: 'linear-gradient(135deg, #031f1d 0%, #041a14 100%)',
        textAlign: 'center',
      }}>
        <img src="/gratitude-token.png" alt="" style={{ width: 70, marginBottom: 24, filter: 'drop-shadow(0 0 24px rgba(245,197,66,0.5))' }} />
        <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 900, color: '#fff', marginBottom: 16 }}>
          Join the <span style={{ color: '#f5c542' }}>EVOKE CMO</span> Community
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 17, maxWidth: 520, margin: '0 auto 36px' }}>
          Start earning and spending EGT inside your AI-powered marketing system. Your first 1,000 EGT are waiting.
        </p>
        <button onClick={openSignIn} style={{
          background: 'linear-gradient(135deg, #f5c542, #e6a817)',
          color: '#111', fontWeight: 800, fontSize: 16,
          padding: '15px 36px', borderRadius: 14, textDecoration: 'none',
          boxShadow: '0 12px 36px rgba(245,197,66,0.4)',
          display: 'inline-block',
        }}>
          Join Now — It's Free
        </button>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        background: '#fff',
        borderTop: '1px solid #e8e8e8',
        padding: '56px 8% 32px',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr',
          gap: '40px',
          marginBottom: '48px',
        }}>

          {/* Brand column */}
          <div>
            {/* Logo */}
            <div style={{ marginBottom: 6 }}>
              <div style={{
                fontFamily: 'Georgia, serif',
                fontSize: 28,
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: '#111',
                lineHeight: 1,
              }}>
                EVOKE
              </div>
              <div style={{
                fontSize: 9,
                letterSpacing: '0.2em',
                color: '#888',
                fontWeight: 500,
                textTransform: 'uppercase',
                marginTop: 2,
              }}>
                AI MARKETING AGENT
              </div>
            </div>

            <p style={{ color: '#888', fontSize: 13, lineHeight: 1.65, margin: '16px 0 20px', maxWidth: 200 }}>
              Impact-driven AI Chief Marketing Officer
            </p>

            {/* Social icons */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
              {[
                {
                  label: 'Facebook',
                  svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="#555"><path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/></svg>,
                },
                {
                  label: 'Instagram',
                  svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="#555"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>,
                },
                {
                  label: 'X',
                  svg: <svg width="15" height="15" viewBox="0 0 24 24" fill="#555"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
                },
                {
                  label: 'YouTube',
                  svg: <svg width="17" height="17" viewBox="0 0 24 24" fill="#555"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>,
                },
                {
                  label: 'LinkedIn',
                  svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="#555"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>,
                },
              ].map(({ label, svg }) => (
                <button
                  key={label}
                  aria-label={label}
                  style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: '#f2f2f2', border: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#e5e5e5'}
                  onMouseLeave={e => e.currentTarget.style.background = '#f2f2f2'}
                >
                  {svg}
                </button>
              ))}
            </div>

            <a href="mailto:info@evokemedia.io" style={{ color: '#888', fontSize: 13, textDecoration: 'none' }}>
              info@evokemedia.io
            </a>
          </div>

          {/* Link columns */}
          {[
            ['PLATFORM', ['Features', 'Pricing', 'How It Works', 'Campaign Types', 'Dashboard', 'Get Started']],
            ['CAMPAIGNS', ['Events', 'Products', 'Brands', 'Results', 'Templates']],
            ['ABOUT', ['About Evoke', 'Mission Statement', 'Become a Partner', 'Press & Blog', 'Memberships']],
            ['HELP', ['Help Center', 'Careers', 'Community Building', 'Documentation']],
            ['EGT', ['Gratitude Tokens', 'Token Tiers', 'Spin to Win', 'Bonuses', 'Charity Signup']],
          ].map(([heading, links]) => (
            <div key={heading}>
              <h4 style={{
                color: '#111', fontWeight: 700, fontSize: 12,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                marginBottom: 18, margin: '0 0 18px',
              }}>
                {heading}
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 11 }}>
                {links.map(link => (
                  <li key={link}>
                    <button
                      onClick={openSignIn}
                      style={{
                        background: 'none', border: 'none', padding: 0,
                        color: '#b8860b', fontSize: 13, cursor: 'pointer',
                        textAlign: 'left', transition: 'color 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = '#7a5500'}
                      onMouseLeave={e => e.currentTarget.style.color = '#b8860b'}
                    >
                      {link}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div style={{
          borderTop: '1px solid #e8e8e8',
          paddingTop: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}>
          <p style={{ color: '#aaa', fontSize: 12, margin: 0 }}>
            © 2025 Evoke CMO. All rights reserved.
          </p>
          <p style={{ color: '#ccc', fontSize: 12, margin: 0 }}>
            The Evoke Gratitude Token (EGT) is a non-financial loyalty reward.
          </p>
        </div>
      </footer>

      <style>{`
        @keyframes floatCoin {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-18px); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 768px) {
          section[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
          section[style*="grid-template-columns: 2fr 1fr 1fr 1fr"] {
            grid-template-columns: 1fr 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}
