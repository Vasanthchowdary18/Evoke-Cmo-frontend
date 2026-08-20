import React from 'react'
import { motion } from 'framer-motion'

export default function LoadingSpinner({ message = 'Generating your campaign...' }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '24px',
      padding: '64px 24px',
    }}>
      {/* Spinner rings */}
      <div style={{ position: 'relative', width: 80, height: 80 }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: '3px solid transparent',
            borderTopColor: '#7c3aed',
            borderRightColor: '#06b6d4',
          }}
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'absolute',
            inset: 10,
            borderRadius: '50%',
            border: '2px solid transparent',
            borderTopColor: 'rgba(124, 58, 237, 0.4)',
            borderLeftColor: 'rgba(6, 182, 212, 0.4)',
          }}
        />
        <div style={{
          position: 'absolute',
          inset: 22,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.3), rgba(6, 182, 212, 0.3))',
        }} />
      </div>

      {/* Animated dots */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: i === 1 ? '#06b6d4' : '#7c3aed',
              }}
            />
          ))}
        </div>
        <p style={{
          color: 'rgba(255,255,255,0.6)',
          fontSize: '15px',
          fontWeight: 500,
          textAlign: 'center',
        }}>
          {message}
        </p>
        <p style={{
          color: 'rgba(255,255,255,0.35)',
          fontSize: '13px',
          textAlign: 'center',
        }}>
          Your AI CMO is crafting personalized content...
        </p>
      </div>
    </div>
  )
}
