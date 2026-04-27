import { useState, useEffect } from 'react'
import { MACHINES } from '../data/machines'
import {
  getMergedMachines,
  getSortedBrands,
  CUSTOM_MACHINES_EVENT,
  CUSTOM_MACHINES_KEY,
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
    function handleStorage(e) {
      // Cross-tab `storage` events fire for *any* localStorage key. Only
      // refresh when the custom-machines key changed (or when the entire
      // store was cleared, in which case e.key is null).
      if (e && e.key !== null && e.key !== CUSTOM_MACHINES_KEY) return
      refresh()
    }
    refresh()
    if (typeof window === 'undefined') return undefined
    window.addEventListener(CUSTOM_MACHINES_EVENT, refresh)
    window.addEventListener('storage', handleStorage)
    return () => {
      window.removeEventListener(CUSTOM_MACHINES_EVENT, refresh)
      window.removeEventListener('storage', handleStorage)
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
    const { brand: rawBrand, variant: v } = splitInitialMachine(initialMachine)
    if (!rawBrand) return
    // Case-insensitive brand lookup so values from external sources
    // (e.g. user-edited AutoDiscovery input) still match the canonical key.
    const canonicalBrand = merged[rawBrand]
      ? rawBrand
      : Object.keys(merged).find((k) => k.toLowerCase() === rawBrand.toLowerCase())
    if (!canonicalBrand) return
    setBrand(canonicalBrand)
    const variants = merged[canonicalBrand] || []
    if (v && variants.some((x) => x.toLowerCase() === v.toLowerCase())) {
      const matched = variants.find((x) => x.toLowerCase() === v.toLowerCase())
      setVariant(matched)
      if (onChange) onChange(`${canonicalBrand}${BRAND_VARIANT_SEPARATOR}${matched}`)
    } else if (onChange) {
      onChange(canonicalBrand)
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
