import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Home, Video, BookOpen, GraduationCap, History, BarChart3, Command, ArrowRight } from 'lucide-react'

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
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
            paddingTop: '15vh',
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            onClick={e => e.stopPropagation()}
            className="glass-card"
            style={{ width: '100%', maxWidth: 480, overflow: 'hidden' }}
          >
            {/* Search input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
              <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search pages..."
                style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  fontSize: '0.9rem', color: 'var(--text-primary)', fontFamily: 'inherit',
                }}
              />
              <kbd style={{
                fontSize: '0.65rem', padding: '2px 6px', borderRadius: 4,
                background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                color: 'var(--text-muted)', fontFamily: 'monospace',
              }}>
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div style={{ maxHeight: 320, overflowY: 'auto', padding: 6 }}>
              {filtered.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-ghost)', fontSize: '0.85rem' }}>
                  No results found
                </p>
              ) : (
                filtered.map((cmd, i) => {
                  const Icon = cmd.icon
                  const isSelected = i === selected
                  return (
                    <motion.button
                      key={cmd.to}
                      onClick={() => handleSelect(cmd)}
                      onMouseEnter={() => setSelected(i)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                        padding: '10px 12px', borderRadius: 10, border: 'none',
                        cursor: 'pointer', textAlign: 'left',
                        background: isSelected ? 'var(--accent-soft)' : 'transparent',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: isSelected ? 'var(--accent-soft)' : 'var(--bg-elevated)',
                        border: `1px solid ${isSelected ? 'var(--accent-border)' : 'var(--border)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <Icon size={14} style={{ color: isSelected ? 'var(--accent)' : 'var(--text-muted)' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '0.85rem', fontWeight: 600, color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                          {cmd.label}
                        </p>
                        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{cmd.desc}</p>
                      </div>
                      {isSelected && <ArrowRight size={12} style={{ color: 'var(--accent)' }} />}
                    </motion.button>
                  )
                })
              )}
            </div>

            {/* Footer hint */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
              padding: '8px 16px', borderTop: '1px solid var(--border)',
              fontSize: '0.68rem', color: 'var(--text-ghost)',
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <kbd style={{ padding: '1px 4px', borderRadius: 3, background: 'var(--bg-elevated)', border: '1px solid var(--border)', fontFamily: 'monospace' }}>↑↓</kbd> navigate
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <kbd style={{ padding: '1px 4px', borderRadius: 3, background: 'var(--bg-elevated)', border: '1px solid var(--border)', fontFamily: 'monospace' }}>↵</kbd> select
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Command size={10} /> <kbd style={{ padding: '1px 4px', borderRadius: 3, background: 'var(--bg-elevated)', border: '1px solid var(--border)', fontFamily: 'monospace' }}>K</kbd> toggle
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
