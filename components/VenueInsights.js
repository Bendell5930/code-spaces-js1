import { useState, useEffect, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer, Cell, Legend as RLegend,
} from 'recharts'
import {
  getVenueAnalytics, getMachineGraphData, getTrackedVenues,
  getSessionLog, seedDemoData, WIN_THRESHOLDS,
  getUserTrackedVenues, isVenueTracked, trackVenue, untrackVenue, getTrackedCount,
} from '../lib/venueAnalytics'
import { getVenueLegend, lookupCode, hasLegendData } from '../lib/machineLegend'
import {
  QLD_VENUES, getAllVenues, getAllRegions, searchVenues,
  addCustomVenue, getVenueMachines,
} from '../data/qldVenues'
import styles from './VenueInsights.module.css'

// ─── Constants ───

const VIEWS = { MY_VENUES: 'my', BROWSE: 'browse', FEED: 'feed', ADD: 'add' }
const STATUS_COLORS = { WET: '#22c55e', NEUTRAL: '#f59e0b', DRY: '#ef4444' }
const WIN_CATS = [
  { key: 'Wins $50+', color: '#38bdf8' },
  { key: 'Big Wins', color: '#a78bfa' },
  { key: 'Bonus Wins', color: '#34d399' },
  { key: 'Major JP', color: '#f59e0b' },
  { key: 'Grand JP', color: '#f43f5e' },
]

// ─── Component ───

export default function VenueInsights({ activeVenue, onSetActiveVenue }) {
  const [view, setView] = useState(VIEWS.MY_VENUES)
  const [trackedVenues, setTrackedVenues] = useState([])
  const [userTracked, setUserTracked] = useState([])
  const [selectedVenueId, setSelectedVenueId] = useState(null)
  const [selectedMachine, setSelectedMachine] = useState(null)
  const [showLegend, setShowLegend] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [browseRegion, setBrowseRegion] = useState(null)
  const [sessionLog, setSessionLog] = useState([])
  const [addForm, setAddForm] = useState({ name: '', suburb: '', region: '' })
  const [refreshKey, setRefreshKey] = useState(0)

  // Seed demo data on first load
  useEffect(() => {
    seedDemoData(QLD_VENUES)
    reload()
  }, [])

  function reload() {
    setTrackedVenues(getTrackedVenues())
    setUserTracked(getUserTrackedVenues())
    setSessionLog(getSessionLog())
    setRefreshKey(k => k + 1)
  }

  // Merge session-based venues with user-tracked venues for the "My Venues" list
  const mergedVenues = useMemo(() => {
    const map = new Map()
    // Session-based venues first
    trackedVenues.forEach(v => map.set(v.venueId, { ...v, hasData: true, isUserTracked: false }))
    // Overlay user-tracked venues
    userTracked.forEach(v => {
      if (map.has(v.id)) {
        map.get(v.id).isUserTracked = true
        map.get(v.id).addedAt = v.addedAt
      } else {
        map.set(v.id, {
          venueId: v.id,
          venueName: v.name,
          suburb: v.suburb,
          region: v.region,
          machineCount: 0,
          sessionCount: 0,
          lastActivity: v.addedAt || 0,
          hasData: false,
          isUserTracked: true,
          addedAt: v.addedAt,
        })
      }
    })
    return [...map.values()].sort((a, b) => b.lastActivity - a.lastActivity)
  }, [trackedVenues, userTracked])

  // ─── Venue Analytics ───

  const venueAnalytics = useMemo(() => {
    if (!selectedVenueId) return null
    return getVenueAnalytics(selectedVenueId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVenueId, refreshKey])

  const machineGraphData = useMemo(() => {
    if (!selectedVenueId || !selectedMachine) return null
    return getMachineGraphData(selectedVenueId, selectedMachine)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVenueId, selectedMachine, refreshKey])

  const venueLegend = useMemo(() => {
    if (!selectedVenueId) return {}
    return getVenueLegend(selectedVenueId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVenueId, refreshKey])

  // ─── Browse data ───

  const regions = useMemo(() => getAllRegions(), [refreshKey])
  const searchResults = useMemo(() => {
    if (searchQuery.length < 2) return []
    return searchVenues(searchQuery).slice(0, 15)
  }, [searchQuery])

  const browseVenues = useMemo(() => {
    if (!browseRegion) return []
    return getAllVenues().filter(v => v.region === browseRegion)
  }, [browseRegion, refreshKey])

  // ─── Helpers ───

  function getMachineName(venueId, code) {
    if (!showLegend) return code
    const real = lookupCode(venueId, code)
    return real ? `${code} — ${real}` : code
  }

  function timeAgo(ts) {
    const diff = Date.now() - ts
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    return `${days}d ago`
  }

  function handleSelectVenue(venueId) {
    setSelectedVenueId(venueId)
    setSelectedMachine(null)
    setView(VIEWS.MY_VENUES)
  }

  function handleAddVenue(e) {
    e.preventDefault()
    if (!addForm.name.trim()) return
    addCustomVenue(addForm)
    setAddForm({ name: '', suburb: '', region: '' })
    reload()
    setView(VIEWS.MY_VENUES)
  }

  function handleTrackVenue(venue) {
    trackVenue(venue)
    reload()
  }

  function handleUntrackVenue(venueId) {
    untrackVenue(venueId)
    reload()
  }

  // ═══════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════

  return (
    <div className={styles.container}>

      {/* ─── Navigation ─── */}
      <div className={styles.nav}>
        <button
          className={`${styles.navBtn} ${view === VIEWS.MY_VENUES ? styles.navActive : ''}`}
          onClick={() => { setView(VIEWS.MY_VENUES); setSelectedVenueId(null); setSelectedMachine(null) }}
        >
          📊 My Venues
        </button>
        <button
          className={`${styles.navBtn} ${view === VIEWS.BROWSE ? styles.navActive : ''}`}
          onClick={() => setView(VIEWS.BROWSE)}
        >
          🔍 Browse
        </button>
        <button
          className={`${styles.navBtn} ${view === VIEWS.FEED ? styles.navActive : ''}`}
          onClick={() => { setView(VIEWS.FEED); reload() }}
        >
          📋 Activity
        </button>
        <button
          className={`${styles.navBtn} ${view === VIEWS.ADD ? styles.navActive : ''}`}
          onClick={() => setView(VIEWS.ADD)}
        >
          ➕ Add Venue
        </button>
      </div>

      {/* ─── Active Venue Banner ─── */}
      {activeVenue && (
        <div className={styles.activeBanner}>
          <span>📍 Active: <strong>{activeVenue.name}</strong></span>
          <button className={styles.clearActive} onClick={() => onSetActiveVenue?.(null)}>✕</button>
        </div>
      )}

      {/* ─── My Venues — List ─── */}
      {view === VIEWS.MY_VENUES && !selectedVenueId && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Your Tracked Venues</h3>
            <span className={styles.trackedCount}>{mergedVenues.length} / 200</span>
          </div>
          {mergedVenues.length === 0 ? (
            <div className={styles.empty}>
              <p>No venues tracked yet.</p>
              <p className={styles.emptyHint}>
                Tap <strong>Browse</strong> to find venues and add them to your list, or use the <strong>Calculator</strong> / <strong>AI Scan</strong> to log sessions.
              </p>
            </div>
          ) : (
            <div className={styles.venueList}>
              {mergedVenues.map(v => (
                <div key={v.venueId} className={styles.venueCardWrap}>
                  <button
                    className={styles.venueCard}
                    onClick={() => handleSelectVenue(v.venueId)}
                  >
                    <div className={styles.venueCardTop}>
                      <span className={styles.venueName}>{v.venueName}</span>
                      <span className={styles.venueSuburb}>{v.suburb}{v.region ? ` · ${v.region}` : ''}</span>
                    </div>
                    <div className={styles.venueCardStats}>
                      {v.hasData ? (
                        <>
                          <span>🎰 {v.machineCount} machines</span>
                          <span>📊 {v.sessionCount} sessions</span>
                          <span className={styles.timeAgo}>{timeAgo(v.lastActivity)}</span>
                        </>
                      ) : (
                        <span className={styles.noData}>No session data yet</span>
                      )}
                    </div>
                  </button>
                  {v.isUserTracked && (
                    <button
                      className={styles.untrackBtn}
                      onClick={(e) => { e.stopPropagation(); handleUntrackVenue(v.venueId) }}
                      title="Remove from tracked list"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── My Venues — Venue Detail ─── */}
      {view === VIEWS.MY_VENUES && selectedVenueId && !selectedMachine && venueAnalytics && (
        <VenueDetail
          venueId={selectedVenueId}
          analytics={venueAnalytics}
          legend={venueLegend}
          showLegend={showLegend}
          onToggleLegend={() => setShowLegend(!showLegend)}
          onSelectMachine={setSelectedMachine}
          onBack={() => { setSelectedVenueId(null); reload() }}
          getMachineName={getMachineName}
          activeVenue={activeVenue}
          onSetActive={(venueData) => onSetActiveVenue?.(venueData)}
        />
      )}

      {/* ─── My Venues — Machine Detail ─── */}
      {view === VIEWS.MY_VENUES && selectedVenueId && selectedMachine && machineGraphData && (
        <MachineDetail
          venueId={selectedVenueId}
          machineCode={selectedMachine}
          graphData={machineGraphData}
          showLegend={showLegend}
          getMachineName={getMachineName}
          onBack={() => setSelectedMachine(null)}
        />
      )}

      {/* ─── Browse Venues ─── */}
      {view === VIEWS.BROWSE && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Browse QLD Venues</h3>
            <span className={styles.trackedCount}>Tracked: {getTrackedCount()} / 200</span>
          </div>

          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search by venue, suburb, or region..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />

          {searchResults.length > 0 && (
            <div className={styles.searchResults}>
              {searchResults.map(v => {
                const tracked = isVenueTracked(v.id)
                return (
                  <div key={v.id} className={styles.browseCardWrap}>
                    <button
                      className={styles.browseVenueCard}
                      onClick={() => handleSelectVenue(v.id)}
                    >
                      <span className={styles.venueName}>{v.name}</span>
                      <span className={styles.venueSuburb}>{v.suburb} · {v.region}</span>
                    </button>
                    <button
                      className={tracked ? styles.trackBtnActive : styles.trackBtn}
                      onClick={() => tracked ? handleUntrackVenue(v.id) : handleTrackVenue(v)}
                    >
                      {tracked ? '★' : '☆'}
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {searchQuery.length < 2 && (
            <>
              <div className={styles.regionGrid}>
                {regions.map(r => (
                  <button
                    key={r}
                    className={`${styles.regionBtn} ${browseRegion === r ? styles.regionActive : ''}`}
                    onClick={() => setBrowseRegion(browseRegion === r ? null : r)}
                  >
                    {r}
                  </button>
                ))}
              </div>

              {browseRegion && browseVenues.length > 0 && (
                <div className={styles.browseList}>
                  {browseVenues.map(v => {
                    const tracked = isVenueTracked(v.id)
                    return (
                      <div key={v.id} className={styles.browseCardWrap}>
                        <button
                          className={styles.browseVenueCard}
                          onClick={() => handleSelectVenue(v.id)}
                        >
                          <span className={styles.venueName}>{v.name}</span>
                          <span className={styles.venueSuburb}>{v.suburb} · {v.type}</span>
                        </button>
                        <button
                          className={tracked ? styles.trackBtnActive : styles.trackBtn}
                          onClick={() => tracked ? handleUntrackVenue(v.id) : handleTrackVenue(v)}
                        >
                          {tracked ? '★' : '☆'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ─── Activity Feed ─── */}
      {view === VIEWS.FEED && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Recent Activity</h3>
          {sessionLog.length === 0 ? (
            <div className={styles.empty}><p>No sessions logged yet.</p></div>
          ) : (
            <div className={styles.feedList}>
              {sessionLog.map((s, i) => (
                <div key={i} className={styles.feedItem}>
                  <div className={styles.feedHeader}>
                    <span className={styles.feedVenue}>{s.venueName}</span>
                    <span className={styles.feedTime}>{timeAgo(s.ts)}</span>
                  </div>
                  <div className={styles.feedBody}>
                    <span>{s.machineCode}</span>
                    <span>{s.spins} spins</span>
                    <span className={s.net >= 0 ? styles.positive : styles.negative}>
                      {s.net >= 0 ? '+' : ''}${s.net.toFixed(2)}
                    </span>
                  </div>
                  {(s.majorJackpots > 0 || s.grandJackpots > 0) && (
                    <div className={styles.feedBadges}>
                      {s.grandJackpots > 0 && <span className={styles.badgeGrand}>🏆 GRAND</span>}
                      {s.majorJackpots > 0 && <span className={styles.badgeMajor}>💎 MAJOR</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Add Custom Venue ─── */}
      {view === VIEWS.ADD && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Add Custom Venue</h3>
          <form className={styles.addForm} onSubmit={handleAddVenue}>
            <input
              className={styles.formInput}
              placeholder="Venue name *"
              value={addForm.name}
              onChange={e => setAddForm({ ...addForm, name: e.target.value })}
              required
            />
            <input
              className={styles.formInput}
              placeholder="Suburb"
              value={addForm.suburb}
              onChange={e => setAddForm({ ...addForm, suburb: e.target.value })}
            />
            <input
              className={styles.formInput}
              placeholder="Region"
              value={addForm.region}
              onChange={e => setAddForm({ ...addForm, region: e.target.value })}
            />
            <button type="submit" className={styles.submitBtn}>
              Add Venue
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════

function VenueDetail({
  venueId, analytics, legend, showLegend,
  onToggleLegend, onSelectMachine, onBack, getMachineName,
  activeVenue, onSetActive,
}) {
  const { machines, summary, recentSessions } = analytics
  const isActive = activeVenue?.id === venueId

  // Look up venue name from analytics recent sessions or summary
  const venueName = recentSessions?.[0]?.venueName || analytics?.machines?.[0]?.venueName || venueId

  return (
    <div className={styles.section}>
      <button className={styles.backBtn} onClick={onBack}>← Back to venues</button>

      {/* Summary */}
      {summary && (
        <div className={styles.summaryGrid}>
          <div className={`${styles.summaryCard} ${styles[`status${summary.status}`]}`}>
            <span className={styles.summaryLabel}>Venue Status</span>
            <span className={styles.summaryValue}>{summary.status}</span>
            <span className={styles.summaryScore}>Score: {summary.avgScore}/100</span>
          </div>
          <div className={styles.summaryCard}>
            <span className={styles.summaryLabel}>Machines</span>
            <span className={styles.summaryValue}>{summary.totalMachines}</span>
          </div>
          <div className={styles.summaryCard}>
            <span className={styles.summaryLabel}>Sessions</span>
            <span className={styles.summaryValue}>{summary.totalSessions}</span>
          </div>
          <div className={styles.summaryCard}>
            <span className={styles.summaryLabel}>Breakdown</span>
            <div className={styles.breakdownRow}>
              <span className={styles.wet}>🟢 {summary.wetCount}</span>
              <span className={styles.neutral}>🟡 {summary.neutralCount}</span>
              <span className={styles.dry}>🔴 {summary.dryCount}</span>
            </div>
          </div>
        </div>
      )}

      {/* Legend Toggle */}
      {Object.keys(legend).length > 0 && (
        <button
          className={`${styles.legendToggle} ${showLegend ? styles.legendOn : ''}`}
          onClick={onToggleLegend}
        >
          {showLegend ? '🔓 Showing Real Names (Private)' : '🔒 Showing Codes Only'}
        </button>
      )}

      {/* Set Active Venue */}
      <button
        className={`${styles.activeBtn} ${isActive ? styles.activeBtnOn : ''}`}
        onClick={() => {
          if (isActive) {
            onSetActive(null)
          } else {
            // Find venue data from tracked venues or create minimal
            const vData = getAllVenues().find(v => v.id === venueId)
            onSetActive(vData || { id: venueId, name: venueId, suburb: '', region: '' })
          }
        }}
      >
        {isActive ? '✅ Active Venue — Sessions log here' : '📍 Set as Active Venue'}
      </button>

      {/* Machine List */}
      <h4 className={styles.subTitle}>Machine Performance</h4>
      <div className={styles.machineList}>
        {machines.map(m => (
          <button
            key={m.machineCode}
            className={styles.machineCard}
            onClick={() => onSelectMachine(m.machineCode)}
          >
            <div className={styles.machineCardTop}>
              <span className={styles.machineCode}>
                {getMachineName(venueId, m.machineCode)}
              </span>
              <span className={styles.machineStatus} style={{ color: STATUS_COLORS[m.status] }}>
                {m.status === 'WET' ? '🔥' : m.status === 'DRY' ? '❄️' : '➡️'} {m.status}
              </span>
            </div>

            {/* Wet/Dry Score Bar */}
            <div className={styles.scoreBar}>
              <div
                className={styles.scoreFill}
                style={{
                  width: `${m.score}%`,
                  backgroundColor: STATUS_COLORS[m.status],
                }}
              />
              <span className={styles.scoreLabel}>{m.score}/100</span>
            </div>

            <div className={styles.machineCardStats}>
              <span>{m.sessionCount} sessions</span>
              <span>RTP {m.avgRtp}%</span>
              <span>{m.totalSpins} spins</span>
              {m.trend !== 'FLAT' && (
                <span className={m.trend === 'UP' ? styles.trendUp : styles.trendDown}>
                  {m.trend === 'UP' ? '📈' : '📉'} {m.trend}
                </span>
              )}
            </div>

            {/* Win category pills */}
            <div className={styles.winPills}>
              {m.wins50plus.count > 0 && (
                <span className={styles.pill} style={{ borderColor: '#38bdf8' }}>
                  💰 {m.wins50plus.count} · ${m.wins50plus.total.toFixed(0)}
                </span>
              )}
              {m.bigWins.count > 0 && (
                <span className={styles.pill} style={{ borderColor: '#a78bfa' }}>
                  ⚡ {m.bigWins.count} big
                </span>
              )}
              {m.bonusWins.count > 0 && (
                <span className={styles.pill} style={{ borderColor: '#34d399' }}>
                  🎁 {m.bonusWins.count} bonus
                </span>
              )}
              {m.majorJackpots.count > 0 && (
                <span className={styles.pill} style={{ borderColor: '#f59e0b' }}>
                  💎 {m.majorJackpots.count} major
                </span>
              )}
              {m.grandJackpots.count > 0 && (
                <span className={styles.pill} style={{ borderColor: '#f43f5e' }}>
                  🏆 {m.grandJackpots.count} grand
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Recent Sessions */}
      {recentSessions.length > 0 && (
        <>
          <h4 className={styles.subTitle}>Recent Sessions</h4>
          <div className={styles.recentList}>
            {recentSessions.slice(0, 8).map((s, i) => (
              <div key={i} className={styles.recentItem}>
                <span className={styles.recentCode}>{getMachineName(venueId, s.machineCode)}</span>
                <span>{s.profileName}</span>
                <span>{s.spins} spins</span>
                <span className={s.won - s.wagered >= 0 ? styles.positive : styles.negative}>
                  {s.won - s.wagered >= 0 ? '+' : ''}${(s.won - s.wagered).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function MachineDetail({ venueId, machineCode, graphData, showLegend, getMachineName, onBack }) {
  const { wetDryTrend, winBreakdown, sessionHistory } = graphData
  const displayName = getMachineName(venueId, machineCode)

  return (
    <div className={styles.section}>
      <button className={styles.backBtn} onClick={onBack}>← Back to machines</button>
      <h3 className={styles.sectionTitle}>{displayName}</h3>

      {wetDryTrend.length === 0 ? (
        <div className={styles.empty}><p>No session data for this machine yet.</p></div>
      ) : (
        <>
          {/* Wet/Dry Trend */}
          <div className={styles.chartBox}>
            <h4 className={styles.chartTitle}>Wet / Dry Score Trend</h4>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={wetDryTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                  labelStyle={{ color: '#f8fafc' }}
                  formatter={(val, name) => [`${val}`, 'Score']}
                />
                <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                  {wetDryTrend.map((d, i) => (
                    <Cell key={i} fill={d.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Win Breakdown Stacked */}
          <div className={styles.chartBox}>
            <h4 className={styles.chartTitle}>Win Breakdown by Session</h4>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={winBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={v => `$${v}`} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                  labelStyle={{ color: '#f8fafc' }}
                  formatter={(val) => [`$${val.toFixed(2)}`]}
                />
                <RLegend wrapperStyle={{ fontSize: 10, color: '#94a3b8' }} />
                {WIN_CATS.map(c => (
                  <Bar key={c.key} dataKey={c.key} stackId="wins" fill={c.color} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Session History Table */}
          <div className={styles.chartBox}>
            <h4 className={styles.chartTitle}>Session History</h4>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Player</th>
                    <th>Spins</th>
                    <th>In</th>
                    <th>Out</th>
                    <th>Net</th>
                    <th>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {sessionHistory.map((s, i) => (
                    <tr key={i}>
                      <td>{s.date}</td>
                      <td>{s.profile}</td>
                      <td>{s.spins}</td>
                      <td>${s.wagered.toFixed(2)}</td>
                      <td>${s.won.toFixed(2)}</td>
                      <td className={s.net >= 0 ? styles.positive : styles.negative}>
                        {s.net >= 0 ? '+' : ''}${s.net.toFixed(2)}
                      </td>
                      <td>
                        <span
                          className={styles.scoreDot}
                          style={{ backgroundColor: s.score >= 65 ? '#22c55e' : s.score >= 40 ? '#f59e0b' : '#ef4444' }}
                        />
                        {s.score}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Win Category Summary */}
          <div className={styles.chartBox}>
            <h4 className={styles.chartTitle}>Win Categories (All Sessions)</h4>
            <div className={styles.winCatGrid}>
              {sessionHistory.length > 0 && (() => {
                const totals = sessionHistory.reduce(
                  (acc, s) => {
                    acc.w50 += s.wins50plus
                    acc.big += s.bigWins
                    acc.bonus += s.bonusWins
                    acc.major += s.majorJackpots
                    acc.grand += s.grandJackpots
                    return acc
                  },
                  { w50: 0, big: 0, bonus: 0, major: 0, grand: 0 }
                )
                return (
                  <>
                    <div className={styles.winCatItem} style={{ borderColor: '#38bdf8' }}>
                      <span className={styles.winCatEmoji}>💰</span>
                      <span className={styles.winCatCount}>{totals.w50}</span>
                      <span className={styles.winCatLabel}>Wins $50+</span>
                    </div>
                    <div className={styles.winCatItem} style={{ borderColor: '#a78bfa' }}>
                      <span className={styles.winCatEmoji}>⚡</span>
                      <span className={styles.winCatCount}>{totals.big}</span>
                      <span className={styles.winCatLabel}>Big Wins</span>
                    </div>
                    <div className={styles.winCatItem} style={{ borderColor: '#34d399' }}>
                      <span className={styles.winCatEmoji}>🎁</span>
                      <span className={styles.winCatCount}>{totals.bonus}</span>
                      <span className={styles.winCatLabel}>Bonus Wins</span>
                    </div>
                    <div className={styles.winCatItem} style={{ borderColor: '#f59e0b' }}>
                      <span className={styles.winCatEmoji}>💎</span>
                      <span className={styles.winCatCount}>{totals.major}</span>
                      <span className={styles.winCatLabel}>Major JP</span>
                    </div>
                    <div className={styles.winCatItem} style={{ borderColor: '#f43f5e' }}>
                      <span className={styles.winCatEmoji}>🏆</span>
                      <span className={styles.winCatCount}>{totals.grand}</span>
                      <span className={styles.winCatLabel}>Grand JP</span>
                    </div>
                  </>
                )
              })()}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
