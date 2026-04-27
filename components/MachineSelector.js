import { useState, useEffect } from 'react'
import { MACHINES } from '../data/machines'
import {
  getMergedMachines,
  getSortedBrands,
  CUSTOM_MACHINES_EVENT,
  BRAND_VARIANT_SEPARATOR,
} from '../lib/aiLearning'
import styles from './MachineSelector.module.css'

/**
 * Parse an `initialMachine` value into { brand, variant }.
 * Accepts:
 *   - "Brand – Variant" (en-dash, the format MachineSelector emits)
 *   - "Brand - Variant" (hyphen, defensive)
 *   - "Brand"           (no variant)
 */
function splitInitialMachine(value) {
  if (!value || typeof value !== 'string') return { brand: '', variant: '' }
  const m = value.match(/^(.*?)\s+[–-]\s+(.+)$/)
  if (m) return { brand: m[1].trim(), variant: m[2].trim() }
  return { brand: value.trim(), variant: '' }
}

export default function MachineSelector({ value, onChange, initialMachine }) {
  const [brand, setBrand] = useState('')
  const [variant, setVariant] = useState('')
  const [mergedMachines, setMergedMachines] = useState(MACHINES)

  // Load merged machines (built-in + custom) on mount and whenever the
  // custom-machines store changes (cross-component or cross-tab).
  useEffect(() => {
    function refresh() {
      setMergedMachines(getMergedMachines())
    }
    refresh()
    if (typeof window === 'undefined') return undefined
    window.addEventListener(CUSTOM_MACHINES_EVENT, refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener(CUSTOM_MACHINES_EVENT, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  // Pre-select brand (and variant if the brand has matching variants) when an
  // `initialMachine` is supplied and we haven't user-selected anything yet.
  // Reads merged machines fresh once and updates state in the same effect so
  // the lookup doesn't race the mount-effect's async state update.
  useEffect(() => {
    if (!initialMachine || brand) return
    const merged = getMergedMachines()
    setMergedMachines(merged)
    const { brand: b, variant: v } = splitInitialMachine(initialMachine)
    if (!b || !merged[b]) return
    setBrand(b)
    const variants = merged[b] || []
    if (v && variants.some((x) => x.toLowerCase() === v.toLowerCase())) {
      const matched = variants.find((x) => x.toLowerCase() === v.toLowerCase())
      setVariant(matched)
      if (onChange) onChange(`${b}${BRAND_VARIANT_SEPARATOR}${matched}`)
    } else if (onChange) {
      onChange(b)
    }
    // We intentionally only run this on mount / when `initialMachine` changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMachine])

  const brands   = getSortedBrands(mergedMachines)
  const variants = brand ? (mergedMachines[brand] || []) : []

  function handleBrandChange(e) {
    const b = e.target.value
    setBrand(b)
    setVariant('')
    onChange(b)
  }

  function handleVariantChange(e) {
    const v = e.target.value
    setVariant(v)
    onChange(v ? `${brand}${BRAND_VARIANT_SEPARATOR}${v}` : brand)
  }

  return (
    <div className={styles.selector}>
      <label className={styles.label}>Machine Name</label>
      <select
        className={styles.select}
        value={brand}
        onChange={handleBrandChange}
      >
        <option value="">Select a machine…</option>
        {brands.map((b) => (
          <option key={b} value={b}>
            {b}
          </option>
        ))}
      </select>

      {variants.length > 0 && (
        <>
          <label className={styles.label}>Variant</label>
          <select
            className={styles.select}
            value={variant}
            onChange={handleVariantChange}
          >
            <option value="">Select variant…</option>
            {variants.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </>
      )}
    </div>
  )
}
