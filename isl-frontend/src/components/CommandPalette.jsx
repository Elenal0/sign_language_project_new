import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Home, Video, BookOpen, GraduationCap, History, BarChart3, CornerDownLeft } from 'lucide-react'

const COMMANDS = [
  { to: '/',           icon: Home,          label: 'Home',       desc: 'Go to homepage' },
  { to: '/translate',  icon: Video,         label: 'Translator', desc: 'Open ISL translator' },
  { to: '/dictionary', icon: BookOpen,      label: 'Dictionary', desc: 'Browse sign dictionary' },
  { to: '/learn',      icon: GraduationCap, label: 'Learn',      desc: 'Practice with flashcards & quiz' },
  { to: '/history',    icon: History,       label: 'History',    desc: 'View translation history' },
  { to: '/dashboard',  icon: BarChart3,     label: 'Dashboard',  desc: 'Analytics & performance' },
]

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const navigate = useNavigate()
  const inputRef = useRef(null)

  const filtered = query.trim()
    ? COMMANDS.filter(c => c.label.toLowerCase().includes(query.toLowerCase()) || c.desc.toLowerCase().includes(query.toLowerCase()))
    : COMMANDS

  const handleSelect = useCallback((cmd) => {
    navigate(cmd.to)
    setOpen(false)
    setQuery('')
    setSelected(0)
  }, [navigate])

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(o => !o)
      }
      if (e.key === 'Escape') {
        setOpen(false)
        setQuery('')
        setSelected(0)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus()
  }, [open])

  useEffect(() => { setSelected(0) }, [query])

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, filtered.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)) }
    if (e.key === 'Enter' && filtered[selected]) handleSelect(filtered[selected])
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={() => { setOpen(false); setQuery(''); }}
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(8,7,6,0.55)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
            padding: '14vh 16px 0',
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -6 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            onClick={e => e.stopPropagation()}
            className="glass-card"
            role="dialog" aria-modal="true" aria-label="Command palette"
            style={{ width: '100%', maxWidth: 560, overflow: 'hidden', borderRadius: 20 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 18px', height: 60, borderBottom: '1px solid var(--border)' }}>
              <Search size={17} style={{ color: 'var(--text-faint)', flexShrink: 0 }} />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Where to?"
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: '1.05rem', color: 'var(--text-primary)' }}
              />
              <span className="kbd">Esc</span>
            </div>

            <div style={{ maxHeight: 360, overflowY: 'auto', padding: 8 }}>
              {filtered.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-faint)', fontSize: '0.88rem' }}>
                  No page matches “{query}”.
                </p>
              ) : (
                filtered.map((cmd, i) => {
                  const Icon = cmd.icon
                  const isSelected = i === selected
                  return (
                    <button
                      key={cmd.to}
                      onClick={() => handleSelect(cmd)}
                      onMouseEnter={() => setSelected(i)}
                      style={{
                        position: 'relative', width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                        padding: '10px 12px', borderRadius: 12, border: 'none', cursor: 'pointer', textAlign: 'left',
                        background: 'transparent',
                      }}
                    >
                      {isSelected && (
                        <motion.span layoutId="cmdk-sel" transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                          style={{ position: 'absolute', inset: 0, borderRadius: 12, background: 'var(--accent-soft)' }} />
                      )}
                      <span style={{
                        position: 'relative', width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'var(--bg-inset)', border: '1px solid var(--border)',
                        color: isSelected ? 'var(--accent)' : 'var(--text-muted)',
                      }}>
                        <Icon size={15} strokeWidth={1.75} />
                      </span>
                      <span style={{ position: 'relative', flex: 1 }}>
                        <span style={{ display: 'block', fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' }}>{cmd.label}</span>
                        <span style={{ display: 'block', fontSize: '0.76rem', color: 'var(--text-muted)' }}>{cmd.desc}</span>
                      </span>
                      {isSelected && <CornerDownLeft size={14} style={{ position: 'relative', color: 'var(--accent)' }} />}
                    </button>
                  )
                })
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '10px 18px', borderTop: '1px solid var(--border)', fontSize: '0.72rem', color: 'var(--text-faint)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span className="kbd">↑</span><span className="kbd">↓</span> navigate</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span className="kbd">↵</span> open</span>
              <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-serif)', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                Drishya <em style={{ color: 'var(--accent)' }}>Vaani</em>
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
