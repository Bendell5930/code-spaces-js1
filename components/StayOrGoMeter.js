import { useState, useMemo } from 'react'
import { calculateStayOrGo } from '../lib/viralStore'

export default function StayOrGoMeter({ sessionData }) {
  const result = useMemo(
    () => calculateStayOrGo(sessionData),
    [sessionData]
  )

  // Gauge needle angle: 0 = full GO (left), 100 = full STAY (right)
  const angle = -90 + (result.score / 100) * 180 // -90 to +90

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* Header */}
      <div style={headerStyle}>
        <h3 style={{ margin: 0, color: result.color, fontSize: '1rem' }}>
          {result.emoji} Should I Stay or Go?
        </h3>
      </div>

      {/* Gauge */}
      <div style={gaugeWrapStyle}>
        <div style={gaugeStyle}>
          {/* Background arc */}
          <svg viewBox="0 0 200 110" style={{ width: '100%', maxWidth: 260 }}>
            {/* Red zone (GO) */}
            <path
              d="M 20 100 A 80 80 0 0 1 60 33"
              fill="none" stroke="#ef4444" strokeWidth="16" strokeLinecap="round"
            />
            {/* Orange zone */}
            <path
              d="M 60 33 A 80 80 0 0 1 100 20"
              fill="none" stroke="#f97316" strokeWidth="16" strokeLinecap="round"
            />
            {/* Yellow zone (MAYBE) */}
            <path
              d="M 100 20 A 80 80 0 0 1 140 33"
              fill="none" stroke="#fbbf24" strokeWidth="16" strokeLinecap="round"
            />
            {/* Green zone (STAY) */}
            <path
              d="M 140 33 A 80 80 0 0 1 180 100"
              fill="none" stroke="#22c55e" strokeWidth="16" strokeLinecap="round"
            />
            {/* Needle */}
            <line
              x1="100" y1="100"
              x2={100 + 65 * Math.cos((angle - 90) * Math.PI / 180)}
              y2={100 + 65 * Math.sin((angle - 90) * Math.PI / 180)}
              stroke="#f1f5f9" strokeWidth="3" strokeLinecap="round"
            />
            {/* Center dot */}
            <circle cx="100" cy="100" r="6" fill="#f1f5f9" />
            {/* Labels */}
            <text x="15" y="108" fill="#ef4444" fontSize="10" fontWeight="700">GO</text>
            <text x="160" y="108" fill="#22c55e" fontSize="10" fontWeight="700">STAY</text>
          </svg>
        </div>

        {/* Verdict */}
        <div style={{ textAlign: 'center', marginTop: '-0.5rem' }}>
          <div style={{
            fontSize: '1.8rem', fontWeight: 900, color: result.color,
            textShadow: `0 0 20px ${result.color}40`,
          }}>
            {result.verdict}
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: '0.25rem 0 0' }}>
            {result.message}
          </p>
        </div>
      </div>

      {/* Session stats */}
      {sessionData && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
          <div style={miniStatStyle}>
            <div style={{ fontSize: '0.65rem', color: '#64748b' }}>⏱️ Time</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#38bdf8' }}>
              {sessionData.timeMinutes || 0}m
            </div>
          </div>
          <div style={miniStatStyle}>
            <div style={{ fontSize: '0.65rem', color: '#64748b' }}>💰 Budget</div>
            <div style={{
              fontSize: '0.9rem', fontWeight: 700,
              color: (sessionData.budgetPercent || 0) > 80 ? '#ef4444' : (sessionData.budgetPercent || 0) > 50 ? '#f59e0b' : '#22c55e',
            }}>
              {sessionData.budgetPercent || 0}%
            </div>
          </div>
          <div style={miniStatStyle}>
            <div style={{ fontSize: '0.65rem', color: '#64748b' }}>📊 Net</div>
            <div style={{
              fontSize: '0.9rem', fontWeight: 700,
              color: (sessionData.netPosition || 0) >= 0 ? '#22c55e' : '#ef4444',
            }}>
              ${(sessionData.netPosition || 0) >= 0 ? '+' : ''}{(sessionData.netPosition || 0).toFixed(0)}
            </div>
          </div>
        </div>
      )}

      {/* Score bar */}
      <div style={{ position: 'relative' }}>
        <div style={{ background: '#0f172a', borderRadius: 8, height: 10, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 8,
            width: `${result.score}%`,
            background: `linear-gradient(90deg, #ef4444, #f97316, #fbbf24, #22c55e)`,
            transition: 'width 0.5s ease',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.2rem' }}>
          <span style={{ fontSize: '0.6rem', color: '#ef4444' }}>🚶 Walk Away</span>
          <span style={{ fontSize: '0.6rem', color: '#64748b' }}>Score: {result.score}/100</span>
          <span style={{ fontSize: '0.6rem', color: '#22c55e' }}>😎 Stay</span>
        </div>
      </div>

      <p style={{ color: '#334155', fontSize: '0.6rem', textAlign: 'center', margin: 0 }}>
        For entertainment only. Always gamble responsibly. If in doubt, walk away.
      </p>
    </div>
  )
}

const headerStyle = {
  background: 'linear-gradient(135deg, #1a1a0a, #1e293b)',
  borderRadius: 12, padding: '0.75rem 0.85rem', textAlign: 'center',
}

const gaugeWrapStyle = {
  background: '#1e293b', borderRadius: 12, padding: '1rem 0.75rem 0.75rem',
  display: 'flex', flexDirection: 'column', alignItems: 'center',
}

const gaugeStyle = {
  display: 'flex', justifyContent: 'center', width: '100%',
}

const miniStatStyle = {
  background: '#0f172a', borderRadius: 10, padding: '0.5rem',
  textAlign: 'center',
}
