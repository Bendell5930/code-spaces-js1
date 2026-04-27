import { useState, useEffect } from 'react'
import { MACHINES } from '../data/machines'
import { getMergedMachines, getSortedBrands } from '../lib/aiLearning'
import styles from './MachineSelector.module.css'

export default function MachineSelector({ value, onChange }) {
  const [brand, setBrand] = useState('')
  const [variant, setVariant] = useState('')
  const [mergedMachines, setMergedMachines] = useState(MACHINES)

  // Load merged machines (built-in + custom) on mount
  useEffect(() => {
    setMergedMachines(getMergedMachines())
  }, [])

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
    onChange(v ? `${brand} – ${v}` : brand)
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
