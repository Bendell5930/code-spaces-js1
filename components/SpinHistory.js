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
import styles from './SpinHistory.module.css'

const RECENT_SPINS_PAGE_SIZE = 20

export default function SpinHistory({ spins }) {
  const [recentPage, setRecentPage] = useState(1)

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
      <div className={styles.empty}>
        <p>No spins logged yet. Use the form to start recording data.</p>
      </div>
    )
  }

  return (
    <div className={styles.wrapper}>
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
