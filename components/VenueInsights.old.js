import { useState, useEffect, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, ReferenceLine, Legend,
} from 'recharts'
import {
  QLD_VENUES, QLD_REGIONS, ALL_QLD_MACHINES,
  getVenueMachines, getVenuesByRegion, searchVenues,
} from '../data/qldVenues'
import {
  getVenueAnalytics, getMachineGraphData, seedDemoDataIfEmpty,
} from '../lib/venueAnalytics'
import styles from './VenueInsights.module.css'

// ─── Wet/Dry status helpers ───

function statusLabel(score) {
  if (score >= 65) return 'WET'
  if (score >= 40) return 'NEUTRAL'
  return 'DRY'
}

function statusColor(score) {
  if (score >= 65) return '#22c55e'
  if (score >= 40) return '#f59e0b'
  return '#ef4444'
}

function statusEmoji(score) {
  if (score >= 80) return '💦'
  if (score >= 65) return '💧'
  if (score >= 40) return '➖'
  if (score >= 20) return '🏜️'
  return '🔥'
}

function typeIcon(type) {
  switch (type) {
    case 'rsl': return '🎖️'
    case 'pub': return '🍺'
    case 'club': return '🏛️'
    case 'tavern': return '🍻'
    case 'hotel': return '🏨'
    default: return '📍'
  }
}

function timeAgo(ts) {
  if (!ts) return 'No data'
  const diff = Date.now() - ts
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return `${Math.floor(diff / 86400000)}d ago`
}

// ─── Custom Tooltip ───

function WetDryTooltip({ active, payload, label, graphType }) {
  if (!active || !payload || !payload.length) return null
  const d = payload[0]?.payload
  if (!d) return null

  return (
    <div className={styles.tooltip}>
      <div className={styles.tooltipHeader}>
        <span>{d.date || label}</span>
        <span style={{ color: statusColor(d.score) }}>
          {statusEmoji(d.score)} {statusLabel(d.score)}
        </span>
      </div>
      <div className={styles.tooltipScore}>
        Score: <strong style={{ color: statusColor(d.score) }}>{d.score}</strong>/100
      </div>
      {graphType === 'cluster' && (
        <>
          <div className={styles.tooltipRow}>Wins: {d.winCount}</div>
          <div className={styles.tooltipRow}>Spins: {d.spins}</div>
          <div className={styles.tooltipRow}>Win Rate: {d.density}%</div>
        </>
      )}
      {graphType === 'bigwin' && (
        <>
          <div className={styles.tooltipRow}>Big Wins: {d.bigWins}</div>
          <div className={styles.tooltipRow}>Big Win $: ${d.bigWinTotal?.toFixed(2)}</div>
          <div className={styles.tooltipRow}>Wagered: ${d.wagered?.toFixed(2)}</div>
        </>
      )}
      {graphType === 'bonus' && (
        <>
          <div className={styles.tooltipRow}>Bonuses: {d.bonusCount}</div>
          <div className={styles.tooltipRow}>Bonus $: ${d.bonusTotal?.toFixed(2)}</div>
          <div className={styles.tooltipRow}>Spins: {d.spins}</div>
        </>
      )}
    </div>
  )
}

// ─── Wet/Dry Bar Chart Component ───

function WetDryChart({ data, title, icon, graphType, description }) {
  if (!data || data.length === 0) {
    return (
      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <span className={styles.chartIcon}>{icon}</span>
          <span className={styles.chartTitle}>{title}</span>
        </div>
        <div className={styles.chartEmpty}>No session data yet — start scanning!</div>
      </div>
    )
  }

  return (
    <div className={styles.chartCard}>
      <div className={styles.chartHeader}>
        <span className={styles.chartIcon}>{icon}</span>
        <span className={styles.chartTitle}>{title}</span>
      </div>
      <p className={styles.chartDesc}>{description}</p>

      {/* Legend */}
      <div className={styles.chartLegend}>
        <span className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: '#22c55e' }} />
          WET (65+)
        </span>
        <span className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: '#f59e0b' }} />
          NEUTRAL (40-64)
        </span>
        <span className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: '#ef4444' }} />
          DRY (0-39)
        </span>
      </div>

      <div className={styles.chartWrap}>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#64748b', fontSize: 9 }}
              axisLine={{ stroke: '#334155' }}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: '#64748b', fontSize: 9 }}
              axisLine={{ stroke: '#334155' }}
              tickLine={false}
            />
            <Tooltip content={<WetDryTooltip graphType={graphType} />} />
            <ReferenceLine y={65} stroke="#22c55e" strokeDasharray="4 4" strokeOpacity={0.4} />
            <ReferenceLine y={40} stroke="#f59e0b" strokeDasharray="4 4" strokeOpacity={0.4} />
            <Bar dataKey="score" radius={[4, 4, 0, 0]} maxBarSize={40}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.fill} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary stats row */}
      <div className={styles.chartStats}>
        <div className={styles.chartStat}>
          <span className={styles.chartStatLabel}>Avg Score</span>
          <span className={styles.chartStatValue} style={{ color: statusColor(
            Math.round(data.reduce((s, d) => s + d.score, 0) / data.length)
          )}}>
            {Math.round(data.reduce((s, d) => s + d.score, 0) / data.length)}
          </span>
        </div>
        <div className={styles.chartStat}>
          <span className={styles.chartStatLabel}>Sessions</span>
          <span className={styles.chartStatValue}>{data.length}</span>
        </div>
        <div className={styles.chartStat}>
          <span className={styles.chartStatLabel}>Trend</span>
          <span className={styles.chartStatValue}>
            {data.length >= 2 && data[data.length - 1].score > data[data.length - 2].score
              ? '📈 Up' : data.length >= 2 && data[data.length - 1].score < data[data.length - 2].score
              ? '📉 Down' : '➡️ Flat'}
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Main VenueInsights Component ───

export default function VenueInsights() {
  const [selectedRegion, setSelectedRegion] = useState('')
  const [selectedVenue, setSelectedVenue] = useState(null)
  const [selectedMachine, setSelectedMachine] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [seeded, setSeeded] = useState(false)

  // Seed demo data on first mount
  useEffect(() => {
    seedDemoDataIfEmpty(QLD_VENUES, getVenueMachines)
    setSeeded(true)
  }, [])

  // Venue list for selected region
  const regionVenues = useMemo(() => {
    if (searchQuery.trim()) return searchVenues(searchQuery)
    if (!selectedRegion) return []
    return getVenuesByRegion(selectedRegion)
  }, [selectedRegion, searchQuery])

  // Machines at selected venue
  const venueMachines = useMemo(() => {
    if (!selectedVenue) return []
    return getVenueMachines(selectedVenue)
  }, [selectedVenue])

  // Analytics for selected venue
  const venueAnalytics = useMemo(() => {
    if (!selectedVenue || !seeded) return null
    return getVenueAnalytics(selectedVenue.id)
  }, [selectedVenue, seeded])

  // Graph data for selected machine
  const graphData = useMemo(() => {
    if (!selectedVenue || !selectedMachine) return null
    return getMachineGraphData(selectedVenue.id, selectedMachine)
  }, [selectedVenue, selectedMachine])

  // Machine analytics for selected machine
  const machineStats = useMemo(() => {
    if (!venueAnalytics || !selectedMachine) return null
    return venueAnalytics.machines.find(m => m.machine === selectedMachine) || null
  }, [venueAnalytics, selectedMachine])

  // ─── Handlers ───

  function handleRegionChange(region) {
    setSelectedRegion(region)
    setSelectedVenue(null)
    setSelectedMachine('')
    setSearchQuery('')
  }

  function handleVenueSelect(venue) {
    setSelectedVenue(venue)
    setSelectedMachine('')
  }

  function handleMachineSelect(machine) {
    setSelectedMachine(machine)
  }

  function handleBack() {
    if (selectedMachine) {
      setSelectedMachine('')
    } else if (selectedVenue) {
      setSelectedVenue(null)
    } else if (selectedRegion) {
      setSelectedRegion('')
    }
  }

  // ─── Render ───

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <span className={styles.headerIcon}>💧</span>
          <h2 className={styles.headerTitle}>WET & DRY VENUE INSIGHTS</h2>
          <span className={styles.headerIcon}>🔥</span>
        </div>
        <p className={styles.headerSub}>
          QLD Pub & RSL Machine Analysis — Real-time crowd data
        </p>
      </div>

      {/* Breadcrumb */}
      {(selectedRegion || selectedVenue || selectedMachine) && (
        <div className={styles.breadcrumb}>
          <button className={styles.breadBtn} onClick={() => { setSelectedRegion(''); setSelectedVenue(null); setSelectedMachine(''); }}>
            QLD
          </button>
          {selectedRegion && (
            <>
              <span className={styles.breadSep}>›</span>
              <button className={styles.breadBtn} onClick={() => { setSelectedVenue(null); setSelectedMachine(''); }}>
                {selectedRegion}
              </button>
            </>
          )}
          {selectedVenue && (
            <>
              <span className={styles.breadSep}>›</span>
              <button className={styles.breadBtn} onClick={() => setSelectedMachine('')}>
                {selectedVenue.name}
              </button>
            </>
          )}
          {selectedMachine && (
            <>
              <span className={styles.breadSep}>›</span>
              <span className={styles.breadCurrent}>{selectedMachine}</span>
            </>
          )}
        </div>
      )}

      {/* Back button */}
      {(selectedRegion || selectedVenue || selectedMachine) && (
        <button className={styles.backBtn} onClick={handleBack}>
          ← Back
        </button>
      )}

      {/* ─── Step 1: Region Selector ─── */}
      {!selectedRegion && !searchQuery && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>📍 SELECT QLD REGION</h3>

          {/* Search bar */}
          <div className={styles.searchWrap}>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search venues by name, suburb..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className={styles.searchClear} onClick={() => setSearchQuery('')}>✕</button>
            )}
          </div>

          <div className={styles.regionGrid}>
            {QLD_REGIONS.map(region => {
              const count = QLD_VENUES.filter(v => v.region === region).length
              return (
                <button
                  key={region}
                  className={styles.regionBtn}
                  onClick={() => handleRegionChange(region)}
                >
                  <span className={styles.regionName}>{region}</span>
                  <span className={styles.regionCount}>{count} venues</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Search results */}
      {searchQuery && !selectedVenue && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>🔍 Search Results</h3>
          <div className={styles.searchWrap}>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search venues by name, suburb..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className={styles.searchClear} onClick={() => setSearchQuery('')}>✕</button>
            )}
          </div>
          {regionVenues.length === 0 ? (
            <div className={styles.emptyState}>No venues found for &ldquo;{searchQuery}&rdquo;</div>
          ) : (
            <div className={styles.venueList}>
              {regionVenues.map(venue => (
                <button key={venue.id} className={styles.venueBtn} onClick={() => handleVenueSelect(venue)}>
                  <span className={styles.venueIcon}>{typeIcon(venue.type)}</span>
                  <div className={styles.venueInfo}>
                    <span className={styles.venueName}>{venue.name}</span>
                    <span className={styles.venueSub}>{venue.suburb} · {venue.region} · {venue.machineCount} machines</span>
                  </div>
                  <span className={styles.venueArrow}>›</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Step 2: Venue Selector ─── */}
      {selectedRegion && !selectedVenue && !searchQuery && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            🏛️ VENUES IN {selectedRegion.toUpperCase()}
          </h3>
          <div className={styles.venueList}>
            {regionVenues.map(venue => (
              <button key={venue.id} className={styles.venueBtn} onClick={() => handleVenueSelect(venue)}>
                <span className={styles.venueIcon}>{typeIcon(venue.type)}</span>
                <div className={styles.venueInfo}>
                  <span className={styles.venueName}>{venue.name}</span>
                  <span className={styles.venueSub}>{venue.suburb} · {venue.type.toUpperCase()} · {venue.machineCount} machines</span>
                </div>
                <span className={styles.venueArrow}>›</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ─── Step 3: Machine Selector + Venue Overview ─── */}
      {selectedVenue && !selectedMachine && (
        <div className={styles.section}>
          {/* Venue header card */}
          <div className={styles.venueCard}>
            <div className={styles.venueCardHeader}>
              <span className={styles.venueCardIcon}>{typeIcon(selectedVenue.type)}</span>
              <div>
                <div className={styles.venueCardName}>{selectedVenue.name}</div>
                <div className={styles.venueCardSub}>{selectedVenue.suburb}, {selectedVenue.region}</div>
              </div>
              {venueAnalytics?.summary && (
                <div className={styles.venueScoreBadge} style={{
                  borderColor: statusColor(venueAnalytics.summary.avgScore),
                  color: statusColor(venueAnalytics.summary.avgScore),
                }}>
                  {statusEmoji(venueAnalytics.summary.avgScore)} {venueAnalytics.summary.avgScore}
                </div>
              )}
            </div>

            {/* Venue stats */}
            {venueAnalytics?.summary && (
              <div className={styles.venueStats}>
                <div className={styles.venueStat}>
                  <span className={styles.venueStatLabel}>Tracked</span>
                  <span className={styles.venueStatValue}>{venueAnalytics.summary.totalMachinesTracked}</span>
                </div>
                <div className={styles.venueStat}>
                  <span className={styles.venueStatLabel}>💧 Wet</span>
                  <span className={`${styles.venueStatValue} ${styles.green}`}>{venueAnalytics.summary.wetCount}</span>
                </div>
                <div className={styles.venueStat}>
                  <span className={styles.venueStatLabel}>➖ Neutral</span>
                  <span className={`${styles.venueStatValue} ${styles.amber}`}>{venueAnalytics.summary.neutralCount}</span>
                </div>
                <div className={styles.venueStat}>
                  <span className={styles.venueStatLabel}>🔥 Dry</span>
                  <span className={`${styles.venueStatValue} ${styles.red}`}>{venueAnalytics.summary.dryCount}</span>
                </div>
              </div>
            )}
          </div>

          {/* Machine list */}
          <h3 className={styles.sectionTitle}>🎰 SELECT MACHINE</h3>
          <div className={styles.machineList}>
            {venueMachines.map(machine => {
              const mStats = venueAnalytics?.machines?.find(m => m.machine === machine)
              return (
                <button
                  key={machine}
                  className={styles.machineBtn}
                  onClick={() => handleMachineSelect(machine)}
                >
                  <div className={styles.machineInfo}>
                    <span className={styles.machineName}>{machine}</span>
                    {mStats && (
                      <span className={styles.machineMeta}>
                        {mStats.sessionCount} sessions · Updated {timeAgo(mStats.lastSession)}
                      </span>
                    )}
                  </div>
                  {mStats ? (
                    <div className={styles.machineScore} style={{
                      borderColor: statusColor(mStats.overallScore),
                      color: statusColor(mStats.overallScore),
                    }}>
                      {statusEmoji(mStats.overallScore)} {mStats.overallScore}
                    </div>
                  ) : (
                    <div className={styles.machineNoData}>No data</div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ─── Step 4: Machine Wet/Dry Graphs ─── */}
      {selectedVenue && selectedMachine && (
        <div className={styles.section}>
          {/* Machine header */}
          <div className={styles.machineHeader}>
            <div className={styles.machineHeaderLeft}>
              <div className={styles.machineHeaderName}>{selectedMachine}</div>
              <div className={styles.machineHeaderVenue}>{selectedVenue.name}</div>
            </div>
            {machineStats && (
              <div className={styles.overallBadge} style={{
                background: statusColor(machineStats.overallScore) + '18',
                borderColor: statusColor(machineStats.overallScore),
                color: statusColor(machineStats.overallScore),
              }}>
                <div className={styles.overallLabel}>Overall</div>
                <div className={styles.overallScore}>{machineStats.overallScore}</div>
                <div className={styles.overallStatus}>
                  {statusEmoji(machineStats.overallScore)} {machineStats.status}
                </div>
              </div>
            )}
          </div>

          {/* Quick stats */}
          {machineStats && (
            <div className={styles.quickStats}>
              <div className={styles.quickStat}>
                <span className={styles.quickLabel}>Sessions</span>
                <span className={styles.quickValue}>{machineStats.sessionCount}</span>
              </div>
              <div className={styles.quickStat}>
                <span className={styles.quickLabel}>Avg RTP</span>
                <span className={styles.quickValue}>{machineStats.avgRtp}%</span>
              </div>
              <div className={styles.quickStat}>
                <span className={styles.quickLabel}>Total Won</span>
                <span className={`${styles.quickValue} ${styles.green}`}>${machineStats.totalWon.toFixed(0)}</span>
              </div>
              <div className={styles.quickStat}>
                <span className={styles.quickLabel}>Wagered</span>
                <span className={styles.quickValue}>${machineStats.totalWagered.toFixed(0)}</span>
              </div>
            </div>
          )}

          {/* ─── 3 Wet/Dry Graphs ─── */}

          <WetDryChart
            data={graphData?.winClusterGraph}
            title="WIN CLUSTERS — WET / DRY"
            icon="🎯"
            graphType="cluster"
            description="Win density per session. High clusters = machine paying in bursts (WET pattern)."
          />

          <WetDryChart
            data={graphData?.bigWinGraph}
            title="BIG WINS — WET / DRY"
            icon="💰"
            graphType="bigwin"
            description="Big win (15x+) frequency. More big wins = WET. Rare big wins = DRY."
          />

          <WetDryChart
            data={graphData?.bonusGraph}
            title="BONUS FEATURE WINS — WET / DRY"
            icon="⭐"
            graphType="bonus"
            description="Bonus/Feature trigger rate and payout. Frequent bonuses = WET machine."
          />

          {/* Disclaimer */}
          <div className={styles.disclaimer}>
            ⚠️ This data is based on crowd-sourced session reports. Pokie machines use
            random number generators — past results do not predict future outcomes.
            Please gamble responsibly. 1800 858 858
          </div>
        </div>
      )}
    </div>
  )
}
