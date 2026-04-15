import { useState, useMemo } from 'react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  ReferenceLine,
} from 'recharts'
import {
  buildMachineHeatMap,
  buildHeatTimeline,
  heatColor,
  heatLabel,
  HEAT_LEVEL,
} from '../lib/heatAnalysis'
import styles from './MachineHeatMap.module.css'

export default function MachineHeatMap({ spins }) {
  const [selectedMachine, setSelectedMachine] = useState(null)

  // ── Build heat map data for all machines ──
  const heatMap = useMemo(() => buildMachineHeatMap(spins), [spins])

  // ── Build per-spin timeline for the selected machine ──
  const timeline = useMemo(() => {
    if (!selectedMachine) return []
    const machineSpins = spins
      .filter((s) => s.machineName === selectedMachine)
      .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))
    return buildHeatTimeline(machineSpins)
  }, [spins, selectedMachine])

  // ── Bonus gap data for selected machine ──
  const bonusGaps = useMemo(() => {
    if (!selectedMachine) return []
    const machineSpins = spins
      .filter((s) => s.machineName === selectedMachine)
      .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))

    const gaps = []
    let spinsSinceLast = 0
    machineSpins.forEach((s, i) => {
      spinsSinceLast++
      if (s.bonusHit) {
        gaps.push({ bonusNum: gaps.length + 1, gap: spinsSinceLast, spinNum: i + 1 })
        spinsSinceLast = 0
      }
    })
    return gaps
  }, [spins, selectedMachine])

  if (heatMap.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No machine data yet. Log some spins to see the heat map.</p>
      </div>
    )
  }

  const selectedData = heatMap.find((m) => m.name === selectedMachine)

  return (
    <div className={styles.wrapper}>
      {/* ── Machine Heat Overview ── */}
      <div className={styles.section}>
        <h3 className={styles.heading}>Machine Heat Map</h3>
        <div className={styles.heatGrid}>
          {heatMap.map((m) => {
            const { text, emoji } = heatLabel(m.level)
            const isSelected = m.name === selectedMachine
            return (
              <button
                key={m.name}
                className={`${styles.heatCard} ${isSelected ? styles.heatCardActive : ''}`}
                style={{ borderColor: heatColor(m.score) }}
                onClick={() => setSelectedMachine(isSelected ? null : m.name)}
              >
                <span className={styles.heatEmoji}>{emoji}</span>
                <span className={styles.heatName}>
                  {m.name.length > 18 ? m.name.slice(0, 18) + '…' : m.name}
                </span>
                <span className={styles.heatScore} style={{ color: heatColor(m.score) }}>
                  {m.score}
                </span>
                <span className={styles.heatLevel} style={{ color: heatColor(m.score) }}>
                  {text}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Heat Score Bar Chart (all machines) ── */}
      <div className={styles.section}>
        <h3 className={styles.heading}>Heat Scores</h3>
        <ResponsiveContainer width="100%" height={Math.max(160, heatMap.length * 40)}>
          <BarChart data={heatMap} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis type="number" domain={[0, 100]} stroke="#94a3b8" fontSize={11} />
            <YAxis
              type="category"
              dataKey="name"
              stroke="#94a3b8"
              fontSize={11}
              width={110}
              tickFormatter={(v) => v.length > 14 ? v.slice(0, 14) + '…' : v}
            />
            <Tooltip
              contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }}
              formatter={(value) => [`${value} / 100`, 'Heat']}
            />
            <ReferenceLine x={33} stroke="#3b82f6" strokeDasharray="4 4" label={{ value: 'COLD', fill: '#3b82f6', fontSize: 9 }} />
            <ReferenceLine x={67} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'HOT', fill: '#ef4444', fontSize: 9 }} />
            <Bar dataKey="score" radius={[0, 4, 4, 0]}>
              {heatMap.map((entry, i) => (
                <Cell key={i} fill={heatColor(entry.score)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Selected Machine Detail ── */}
      {selectedMachine && selectedData && (
        <>
          {/* Factor breakdown */}
          <div className={styles.section}>
            <h3 className={styles.heading}>
              {selectedMachine} — {heatLabel(selectedData.level).emoji} {selectedData.level}
            </h3>
            <div className={styles.factorGrid}>
              <div className={styles.factorCard}>
                <span className={styles.factorLabel}>Win Rate</span>
                <span className={styles.factorValue}>{selectedData.factors.recentWinRate}%</span>
                <span className={styles.factorPts}>+{selectedData.factors.winRate} pts</span>
              </div>
              <div className={styles.factorCard}>
                <span className={styles.factorLabel}>Win Cluster</span>
                <span className={styles.factorValue}>Streak</span>
                <span className={styles.factorPts}>+{selectedData.factors.winCluster} pts</span>
              </div>
              <div className={styles.factorCard}>
                <span className={styles.factorLabel}>Bonus Freq</span>
                <span className={styles.factorValue}>Rate</span>
                <span className={styles.factorPts}>+{selectedData.factors.bonusFreq} pts</span>
              </div>
              <div className={styles.factorCard}>
                <span className={styles.factorLabel}>Since Bonus</span>
                <span className={styles.factorValue}>{selectedData.factors.spinsSinceLastBonus} spins</span>
                <span className={styles.factorPts}>+{selectedData.factors.bonusRecency} pts</span>
              </div>
            </div>
          </div>

          {/* Heat trend timeline */}
          {timeline.length > 1 && (
            <div className={styles.section}>
              <h3 className={styles.heading}>Heat Trend (per spin)</h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={timeline}>
                  <defs>
                    <linearGradient id="heatGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity={0.4} />
                      <stop offset="50%" stopColor="#f59e0b" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="spinNum" stroke="#94a3b8" fontSize={10} label={{ value: 'Spin #', position: 'insideBottom', offset: -2, fill: '#64748b', fontSize: 10 }} />
                  <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={10} />
                  <Tooltip
                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }}
                    formatter={(value, name) => {
                      if (name === 'heat') return [`${value}/100`, 'Heat Score']
                      if (name === 'winAmount') return [`$${value}`, 'Win']
                      if (name === 'bonusHit') return [value ? 'YES' : 'No', 'Bonus']
                      return [value, name]
                    }}
                  />
                  <ReferenceLine y={67} stroke="#ef4444" strokeDasharray="4 4" />
                  <ReferenceLine y={33} stroke="#3b82f6" strokeDasharray="4 4" />
                  <Area type="monotone" dataKey="heat" stroke="#f59e0b" fill="url(#heatGrad)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Win + Bonus overlay timeline */}
          {timeline.length > 1 && (
            <div className={styles.section}>
              <h3 className={styles.heading}>Win &amp; Bonus Clusters</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={timeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="spinNum" stroke="#94a3b8" fontSize={10} />
                  <YAxis stroke="#94a3b8" fontSize={10} />
                  <Tooltip
                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }}
                    formatter={(value, name) => {
                      if (name === 'winAmount') return [`$${value}`, 'Win']
                      if (name === 'bonusHit') return [value ? 'BONUS' : '—', 'Bonus']
                      return [value, name]
                    }}
                  />
                  <Bar dataKey="winAmount" fill="#4ade80" radius={[2, 2, 0, 0]} name="winAmount" />
                  <Bar dataKey="bonusHit" fill="#a78bfa" radius={[2, 2, 0, 0]} name="bonusHit" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Bonus gap chart */}
          {bonusGaps.length > 0 && (
            <div className={styles.section}>
              <h3 className={styles.heading}>Spins Between Bonuses</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={bonusGaps}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="bonusNum" stroke="#94a3b8" fontSize={10} label={{ value: 'Bonus #', position: 'insideBottom', offset: -2, fill: '#64748b', fontSize: 10 }} />
                  <YAxis stroke="#94a3b8" fontSize={10} label={{ value: 'Spins', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }}
                    formatter={(value, name) => {
                      if (name === 'gap') return [`${value} spins`, 'Gap']
                      return [value, name]
                    }}
                  />
                  <Bar dataKey="gap" fill="#f59e0b" radius={[4, 4, 0, 0]} name="gap">
                    {bonusGaps.map((entry, i) => (
                      <Cell key={i} fill={entry.gap > 50 ? '#3b82f6' : entry.gap > 20 ? '#f59e0b' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  )
}
