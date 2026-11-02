import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useEffect, useState } from 'react'

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
}

const COLORS = {
  success: 'var(--green)',
  error:   'var(--red)',
  info:    'var(--blue)',
}

export default function AnimatedToast() {
  const { toast, dismissToast } = useApp()
  const [progress, setProgress] = useState(100)

  useEffect(() => {
    if (!toast) { setProgress(100); return }
    setProgress(100)
    const start = Date.now()
    const duration = 3500
    const interval = setInterval(() => {
      const elapsed = Date.now() - start
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100)
      setProgress(remaining)
      if (remaining <= 0) clearInterval(interval)
    }, 30)
    return () => clearInterval(interval)
  }, [toast?.id])

  const type = toast?.type || 'info'
  const Icon = ICONS[type] || Info
  const color = COLORS[type] || COLORS.info

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.id}
          initial={{ opacity: 0, y: -16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 420, damping: 32 }}
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed', top: 68, left: '50%', x: '-50%', zIndex: 60,
            minWidth: 280, maxWidth: 'calc(100vw - 32px)', overflow: 'hidden',
            background: 'var(--text-primary)', color: 'var(--bg-base)',
            borderRadius: 14, boxShadow: 'var(--shadow-lg)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 10px 11px 14px' }}>
            <Icon size={16} style={{ color, flexShrink: 0 }} />
            <p style={{ flex: 1, fontSize: '0.84rem', fontWeight: 500 }}>{toast.message}</p>
            <button
              onClick={dismissToast}
              aria-label="Dismiss"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', opacity: 0.55, padding: 4, display: 'flex' }}
            >
              <X size={14} />
            </button>
          </div>
          <div style={{ height: 2, background: 'transparent' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: color, opacity: 0.8 }} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
