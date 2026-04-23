import { useEffect, useMemo, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import Pagination from './Pagination'
import { totalPagesFor, clampPage } from '../lib/pagination'
import { generateSpinStream, summarise, DEFAULT_MODEL } from '../lib/spinSimulator'
import styles from './SpinHistory.module.css'

const RECENT_SPINS_PAGE_SIZE = 20

export default function SpinHistory({ spins, onAddSpins }) {
  const [recentPage, setRecentPage] = useState(1)
  const [showSim, setShowSim] = useState(false)
  const [simForm, setSimForm] = useState({
    count: 200,
    seed: '',
    machineName: 'Simulated Machine',
    betAmount: 1,
    denomination: 1,
    lines: 25,
    startingBalance: 200,
    rtp: DEFAULT_MODEL.rtp,
  })
  const [simStatus, setSimStatus] = useState(null)
  const [simError, setSimError] = useState(null)

  function updateSimField(field, value) {
    setSimForm((f) => ({ ...f, [field]: value }))
  }

  function handleGenerateSpins() {
    setSimError(null)
    setSimStatus(null)
    try {
      const count = parseInt(simForm.count, 10)
      if (!Number.isInteger(count) || count <= 0) {
        throw new Error('Count must be a positive integer')
      }
      const rtp = Number(simForm.rtp)
      if (!(rtp > 0 && rtp < 1)) {
        throw new Error('RTP must be between 0 and 1 (e.g. 0.90)')
      }
      const seedRaw = String(simForm.seed).trim()
      const seed = seedRaw === '' ? undefined : Number(seedRaw)
      if (seedRaw !== '' && !Number.isFinite(seed)) {
        throw new Error('Seed must be a number (or leave blank for random)')
      }
      const generated = generateSpinStream({
        count,
        seed,
        machineName: simForm.machineName || 'Simulated Machine',
        bet: Number(simForm.betAmount) || 1,
        denomination: Number(simForm.denomination) || 1,
        lines: Number(simForm.lines) || 25,
        startingBalance: Number(simForm.startingBalance) || 200,
        model: { ...DEFAULT_MODEL, rtp },
      })
      if (typeof onAddSpins === 'function') {
        onAddSpins(generated)
      }
      const stats = summarise(generated)
      setSimStatus({
        count: generated.length,
        observedRtp: stats.observedRtp,
        hitFrequency: stats.hitFrequency,
        bonuses: Math.round(stats.bonusFrequency * generated.length),
        biggestWin: stats.biggestWin,
      })
    } catch (err) {
      setSimError(err.message || 'Failed to generate spins')
    }
  }

  // Newest-first list of all logged spins (bounded only by what's stored).
  const recentSpins = useMemo(() => [...spins].reverse(), [spins])
  const totalRecentPages = totalPagesFor(recentSpins.length, RECENT_SPINS_PAGE_SIZE)
  const currentRecentPage = clampPage(recentPage, totalRecentPages)
  const recentStart = (currentRecentPage - 1) * RECENT_SPINS_PAGE_SIZE
  const pagedRecent = recentSpins.slice(
    recentStart,
    recentStart + RECENT_SPINS_PAGE_SIZE
  )

  // Reset to page 1 when the underlying data changes size.
  useEffect(() => {
    setRecentPage(1)
  }, [recentSpins.length])

  // Build win-cluster data: group wins into buckets
  const winBuckets = {}
  const bonusGaps = []

  spins.forEach((s) => {
    if (s.winAmount > 0) {
      const bucket =
        s.winAmount < 5
          ? '$0-5'
          : s.winAmount < 20
          ? '$5-20'
          : s.winAmount < 50
          ? '$20-50'
          : s.winAmount < 100
          ? '$50-100'
          : '$100+'
      winBuckets[bucket] = (winBuckets[bucket] || 0) + 1
    }
    if (s.spinsSinceBonus != null) {
      bonusGaps.push({
        spin: spins.indexOf(s) + 1,
        gap: s.spinsSinceBonus,
      })
    }
  })

  const winData = ['$0-5', '$5-20', '$20-50', '$50-100', '$100+'].map(
    (range) => ({
      range,
      count: winBuckets[range] || 0,
    })
  )

  // Hot & Cold: group by machine, sum wins
  const machineStats = {}
  spins.forEach((s) => {
    if (!s.machineName) return
    if (!machineStats[s.machineName]) {
      machineStats[s.machineName] = { wins: 0, spins: 0 }
    }
    machineStats[s.machineName].wins += s.winAmount || 0
    machineStats[s.machineName].spins += 1
  })

  const hotColdData = Object.entries(machineStats)
    .map(([name, data]) => ({
      name: name.length > 16 ? name.slice(0, 16) + '…' : name,
      avgWin: data.spins > 0 ? +(data.wins / data.spins).toFixed(2) : 0,
    }))
    .sort((a, b) => b.avgWin - a.avgWin)

  if (spins.length === 0) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.empty}>
          <p>No spins logged yet. Use the form to start recording data.</p>
        </div>
        {onAddSpins && renderSimulatorPanel({
          showSim,
          setShowSim,
          simForm,
          updateSimField,
          handleGenerateSpins,
          simStatus,
          simError,
        })}
      </div>
    )
  }

  return (
    <div className={styles.wrapper}>
      {onAddSpins && renderSimulatorPanel({
        showSim,
        setShowSim,
        simForm,
        updateSimField,
        handleGenerateSpins,
        simStatus,
        simError,
      })}
      {/* Recent spins table */}
      <div className={styles.section}>
        <h3 className={styles.heading}>Recent Spins</h3>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>Machine</th>
                <th>Bet</th>
                <th>Win</th>
                <th>Bonus</th>
              </tr>
            </thead>
            <tbody>
              {pagedRecent.map((s, i) => {
                const absoluteIndex = recentStart + i
                return (
                  <tr key={s.timestamp || absoluteIndex}>
                    <td>{spins.length - absoluteIndex}</td>
                    <td>{s.machineName || '—'}</td>
                    <td>${s.betAmount ?? '—'}</td>
                    <td
                      className={
                        s.winAmount > 0 ? styles.win : styles.loss
                      }
                    >
                      ${s.winAmount ?? 0}
                    </td>
                    <td>{s.bonusHit ? '✓' : ''}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {totalRecentPages > 1 && (
          <div className={styles.paginationRow}>
            <Pagination
              page={currentRecentPage}
              totalPages={totalRecentPages}
              onChange={setRecentPage}
              label="Recent spins pagination"
            />
          </div>
        )}
      </div>

      {/* Win Clusters chart */}
      <div className={styles.section}>
        <h3 className={styles.heading}>Win Clusters</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={winData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="range" stroke="#94a3b8" fontSize={12} />
            <YAxis stroke="#94a3b8" fontSize={12} />
            <Tooltip
              contentStyle={{
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: 8,
                color: '#f1f5f9',
              }}
            />
            <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Hot & Cold Machines */}
      {hotColdData.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.heading}>Hot &amp; Cold Machines</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={hotColdData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis type="number" stroke="#94a3b8" fontSize={12} />
              <YAxis
                type="category"
                dataKey="name"
                stroke="#94a3b8"
                fontSize={12}
                width={120}
              />
              <Tooltip
                contentStyle={{
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: 8,
                  color: '#f1f5f9',
                }}
              />
              <Bar dataKey="avgWin" fill="#38bdf8" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Bonus Feature Clusters */}
      {bonusGaps.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.heading}>Bonus Feature Clusters</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={bonusGaps.slice(-30)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="spin" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: 8,
                  color: '#f1f5f9',
                }}
              />
              <Bar
                dataKey="gap"
                fill="#a78bfa"
                radius={[4, 4, 0, 0]}
                name="Spins Between Bonuses"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

function renderSimulatorPanel({
  showSim,
  setShowSim,
  simForm,
  updateSimField,
  handleGenerateSpins,
  simStatus,
  simError,
}) {
  return (
    <div className={styles.section}>
      <div className={styles.simHeader}>
        <h3 className={styles.heading}>Test Data Simulator</h3>
        <button
          type="button"
          className={styles.simToggle}
          onClick={() => setShowSim(!showSim)}
          aria-expanded={showSim}
        >
          {showSim ? '▲ Hide' : '▼ Open Simulator'}
        </button>
      </div>
      {showSim && (
        <div className={styles.simBody}>
          <p className={styles.simHelp}>
            Generates RTP-accurate synthetic spins (tagged{' '}
            <code>simulated: true</code>) and adds them to your history so you
            can preview charts without entering real machine data.
          </p>
          <div className={styles.simGrid}>
            <label className={styles.simField}>
              <span>Spins</span>
              <input
                type="number"
                min="1"
                value={simForm.count}
                onChange={(e) => updateSimField('count', e.target.value)}
              />
            </label>
            <label className={styles.simField}>
              <span>Seed (optional)</span>
              <input
                type="text"
                placeholder="random"
                value={simForm.seed}
                onChange={(e) => updateSimField('seed', e.target.value)}
              />
            </label>
            <label className={styles.simField}>
              <span>Machine name</span>
              <input
                type="text"
                value={simForm.machineName}
                onChange={(e) => updateSimField('machineName', e.target.value)}
              />
            </label>
            <label className={styles.simField}>
              <span>Bet ($)</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={simForm.betAmount}
                onChange={(e) => updateSimField('betAmount', e.target.value)}
              />
            </label>
            <label className={styles.simField}>
              <span>Denomination</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={simForm.denomination}
                onChange={(e) => updateSimField('denomination', e.target.value)}
              />
            </label>
            <label className={styles.simField}>
              <span>Lines</span>
              <input
                type="number"
                min="1"
                value={simForm.lines}
                onChange={(e) => updateSimField('lines', e.target.value)}
              />
            </label>
            <label className={styles.simField}>
              <span>Starting balance ($)</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={simForm.startingBalance}
                onChange={(e) =>
                  updateSimField('startingBalance', e.target.value)
                }
              />
            </label>
            <label className={styles.simField}>
              <span>RTP (0–1)</span>
              <input
                type="number"
                min="0.5"
                max="0.99"
                step="0.01"
                value={simForm.rtp}
                onChange={(e) => updateSimField('rtp', e.target.value)}
              />
            </label>
          </div>
          <div className={styles.simActions}>
            <button
              type="button"
              className={styles.simBtn}
              onClick={handleGenerateSpins}
            >
              🧪 Generate Test Spins
            </button>
          </div>
          {simError && <p className={styles.simError}>{simError}</p>}
          {simStatus && (
            <p className={styles.simStatus}>
              Added <strong>{simStatus.count}</strong> simulated spins · observed
              RTP {(simStatus.observedRtp * 100).toFixed(1)}% · hit freq{' '}
              {(simStatus.hitFrequency * 100).toFixed(1)}% · {simStatus.bonuses}{' '}
              bonus{simStatus.bonuses === 1 ? '' : 'es'} · biggest win $
              {simStatus.biggestWin.toFixed(2)}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
