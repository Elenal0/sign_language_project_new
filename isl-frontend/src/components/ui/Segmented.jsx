import { motion } from 'framer-motion'
import { useId } from 'react'

// Pill-style segmented control with a sliding thumb.
// options: [{ value, label, icon? }]
export default function Segmented({ options, value, onChange, ariaLabel, style }) {
  const id = useId()
  return (
    <div className="segmented" role="tablist" aria-label={ariaLabel} style={style}>
      {options.map(({ value: v, label, icon: Icon }) => {
        const active = v === value
        return (
          <button
            key={v}
            role="tab"
            aria-selected={active}
            data-active={active}
            onClick={() => onChange(v)}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="segmented-thumb"
                transition={{ type: 'spring', stiffness: 500, damping: 38 }}
              />
            )}
            <span>
              {Icon && <Icon size={13} strokeWidth={2} />}
              {label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
