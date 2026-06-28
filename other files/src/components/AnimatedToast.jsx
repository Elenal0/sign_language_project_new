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
  success: { icon: 'var(--green)', bg: 'var(--green-soft)', border: 'var(--green-border)', bar: 'var(--green)' },
  error:   { icon: 'var(--red)',   bg: 'var(--red-soft)',   border: 'var(--red-border)',   bar: 'var(--red)' },
  info:    { icon: 'var(--blue)',  bg: 'var(--blue-soft)',  border: 'var(--blue-border)',  bar: 'var(--blue)' },
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
  const colors = COLORS[type] || COLORS.info

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.id}
          initial={{ opacity: 0, x: 80, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 80, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="fixed bottom-6 right-6 z-[60] glass-card overflow-hidden"
          style={{
            minWidth: 280, maxWidth: 380,
            border: `1px solid ${colors.border}`,
            boxShadow: 'var(--shadow-lg)',
          }}
          role="alert"
          aria-live="polite"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px' }}>
            <div
              style={{
                width: 32, height: 32, borderRadius: 8,
                background: colors.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}
            >
              <Icon size={16} style={{ color: colors.icon }} />
            </div>
            <p style={{ flex: 1, fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-primary)' }}>
              {toast.message}
            </p>
            <button
              onClick={dismissToast}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-muted)', padding: 4, borderRadius: 4,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <X size={14} />
            </button>
          </div>
          {/* Progress bar */}
          <div style={{ height: 2, background: 'var(--border)' }}>
            <motion.div
              style={{
                height: '100%', background: colors.bar,
                width: `${progress}%`,
                borderRadius: '0 1px 1px 0',
              }}
              transition={{ duration: 0.03 }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
