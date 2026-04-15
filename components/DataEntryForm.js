import { useState } from 'react'
import MachineSelector from './MachineSelector'
import { DENOMINATIONS, BET_AMOUNTS, LINE_OPTIONS } from '../data/machines'
import { playTap } from '../lib/sounds'
import styles from './DataEntryForm.module.css'

const INITIAL = {
  machineName: '',
  denomination: '',
  betAmount: '',
  lines: '',
  totalBalance: '',
  winAmount: '',
  bonusHit: false,
  spinsSinceBonus: '',
}

export default function DataEntryForm({ onSubmit }) {
  const [form, setForm] = useState(INITIAL)

  function set(field, value) {
    playTap()
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    onSubmit({
      ...form,
      denomination: form.denomination ? Number(form.denomination) : null,
      betAmount: form.betAmount ? Number(form.betAmount) : null,
      lines: form.lines ? Number(form.lines) : null,
      totalBalance: form.totalBalance ? Number(form.totalBalance) : null,
      winAmount: form.winAmount ? Number(form.winAmount) : null,
      spinsSinceBonus: form.spinsSinceBonus
        ? Number(form.spinsSinceBonus)
        : null,
      timestamp: Date.now(),
    })
    setForm(INITIAL)
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <MachineSelector
        value={form.machineName}
        onChange={(v) => set('machineName', v)}
      />

      {/* Denomination */}
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Denomination</legend>
        <div className={styles.chipGroup}>
          {DENOMINATIONS.map((d) => (
            <label
              key={d.value}
              className={`${styles.chip} ${
                form.denomination === String(d.value) ? styles.chipActive : ''
              }`}
            >
              <input
                type="radio"
                name="denomination"
                value={d.value}
                checked={form.denomination === String(d.value)}
                onChange={(e) => set('denomination', e.target.value)}
                className={styles.hiddenRadio}
              />
              {d.label}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Bet Amount */}
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Bet Amount</legend>
        <div className={styles.chipGroup}>
          {BET_AMOUNTS.map((amt) => (
            <label
              key={amt}
              className={`${styles.chip} ${
                form.betAmount === String(amt) ? styles.chipActive : ''
              }`}
            >
              <input
                type="radio"
                name="betAmount"
                value={amt}
                checked={form.betAmount === String(amt)}
                onChange={(e) => set('betAmount', e.target.value)}
                className={styles.hiddenRadio}
              />
              ${amt}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Lines */}
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Lines</legend>
        <div className={styles.chipGroup}>
          {LINE_OPTIONS.map((l) => (
            <label
              key={l}
              className={`${styles.chip} ${
                form.lines === String(l) ? styles.chipActive : ''
              }`}
            >
              <input
                type="radio"
                name="lines"
                value={l}
                checked={form.lines === String(l)}
                onChange={(e) => set('lines', e.target.value)}
                className={styles.hiddenRadio}
              />
              {l} {l === 1 ? 'Line' : 'Lines'}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Numeric inputs */}
      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label}>Total Balance ($)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            className={styles.input}
            value={form.totalBalance}
            onChange={(e) => set('totalBalance', e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Win Amount ($)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            className={styles.input}
            value={form.winAmount}
            onChange={(e) => set('winAmount', e.target.value)}
          />
        </div>
      </div>

      {/* Bonus & Spins */}
      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.checkLabel}>
            <input
              type="checkbox"
              checked={form.bonusHit}
              onChange={(e) => set('bonusHit', e.target.checked)}
              className={styles.checkbox}
            />
            Bonus Feature Hit
          </label>
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Spins Since Last Bonus</label>
          <input
            type="number"
            min="0"
            step="1"
            className={styles.input}
            value={form.spinsSinceBonus}
            onChange={(e) => set('spinsSinceBonus', e.target.value)}
          />
        </div>
      </div>

      <button type="submit" className={styles.submit}>
        Log Spin
      </button>
    </form>
  )
}
