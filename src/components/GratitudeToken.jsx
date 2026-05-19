import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function GratitudeToken() {
  const [tokens, setTokens] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    const savedTokens = localStorage.getItem('gratitudeTokens')

    if (savedTokens) {
      setTokens(Number(savedTokens))
    }
  }, [])

  const addTokens = (e) => {
    e.stopPropagation()

    const updated = tokens + 100

    setTokens(updated)

    localStorage.setItem('gratitudeTokens', updated)
  }

  return (
    <div
      onClick={() => navigate('/tokens')}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        background: 'rgba(255, 215, 0, 0.08)',
        border: '1px solid rgba(255, 215, 0, 0.7)',
        padding: '6px 10px',
        borderRadius: '999px',
        cursor: 'pointer',
      }}
    >
      <img
        src="/gratitude-token.png"
        alt="Gratitude Token"
        style={{
          width: '34px',
          height: '34px',
          borderRadius: '50%',
          objectFit: 'cover',
        }}
      />

      <span
        style={{
          color: '#f5c542',
          fontWeight: 800,
          fontSize: '15px',
          minWidth: '30px',
          textAlign: 'center',
        }}
      >
        {tokens === 0 ? '00' : tokens}
      </span>

      <button
        onClick={addTokens}
        style={{
          width: '26px',
          height: '26px',
          borderRadius: '50%',
          border: 'none',
          background: '#f5c542',
          color: '#111',
          fontWeight: 'bold',
          fontSize: '16px',
          cursor: 'pointer',
        }}
      >
        +
      </button>
    </div>
  )
}