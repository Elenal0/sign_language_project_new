import { Link, useLocation } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Sun, Moon, Activity } from 'lucide-react'
import { useState } from 'react'

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/translate', label: 'Translate' },
  { to: '/dictionary', label: 'Dictionary' },
  { to: '/learn', label: 'Learn' },
  { to: '/history', label: 'History' },
  { to: '/dashboard', label: 'Analytics' },
]

export default function Navbar() {
  const { theme, toggleTheme } = useApp()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header
      className="sticky top-0 z-40 w-full glass"
      style={{ borderBottom: '1px solid var(--border)' }}
    >
      <div className="flex h-14 items-center justify-between px-4 md:px-6 max-w-screen-2xl mx-auto">

        {/* Logo + Brand */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5 group" aria-label="Drishya Vaani Home">
            <motion.svg
              width="28" height="28" viewBox="0 0 28 28" fill="none"
              aria-hidden="true" className="shrink-0"
              whileHover={{ rotate: [0, -8, 8, 0] }}
              transition={{ duration: 0.5 }}
            >
              <rect width="28" height="28" rx="8" fill="var(--accent-soft)" />
              <path
                d="M8 18V12a1.5 1.5 0 0 1 3 0v3m0-3V10a1.5 1.5 0 0 1 3 0v5m0-4a1.5 1.5 0 0 1 3 0v4m0-3a1.5 1.5 0 0 1 3 0v5c0 2.21-1.79 4-4 4h-2a5 5 0 0 1-5-5v-1"
                stroke="var(--accent)"
                strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
              />
            </motion.svg>
            <span style={{ fontWeight: 700, fontSize: '15px', letterSpacing: '-0.02em' }}>
              <span style={{ color: 'var(--text-primary)' }}>Drishya</span>
              <span style={{ color: 'var(--accent)' }}> Vaani</span>
            </span>
          </Link>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
          {NAV_LINKS.map(({ to, label }) => {
            const active = location.pathname === to
            return (
              <Link
                key={to}
                to={to}
                className="relative px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200"
                style={{
                  color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                  background: active ? 'var(--accent-soft)' : 'transparent',
                }}
              >
                {label}
                {active && (
                  <motion.div
                    layoutId="nav-indicator"
                    style={{
                      position: 'absolute', bottom: -1, left: '20%', right: '20%',
                      height: 2, borderRadius: 1, background: 'var(--accent)',
                    }}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Right: Theme toggle + AI indicator */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--green)' }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--green)' }} aria-hidden="true" />
            <Activity size={12} />
            <span>AI Ready</span>
          </div>

          {/* Theme toggle with animation */}
          <motion.button
            onClick={toggleTheme}
            className="p-2 rounded-lg transition-colors"
            style={{
              color: 'var(--text-muted)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
            whileHover={{ scale: 1.1, background: 'var(--accent-soft)' }}
            whileTap={{ scale: 0.9 }}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={theme}
                initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.2 }}
              >
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </motion.div>
            </AnimatePresence>
          </motion.button>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 rounded-lg transition-colors"
            style={{ color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle mobile menu"
            aria-expanded={mobileOpen}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={mobileOpen ? 'close' : 'open'}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {mobileOpen ? <X size={16} /> : <Menu size={16} />}
              </motion.div>
            </AnimatePresence>
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="md:hidden overflow-hidden"
            style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-surface)' }}
            aria-label="Mobile navigation"
          >
            <div className="px-4 pb-4 pt-2">
              {NAV_LINKS.map(({ to, label }, i) => {
                const active = location.pathname === to
                return (
                  <motion.div
                    key={to}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.2 }}
                  >
                    <Link
                      to={to}
                      onClick={() => setMobileOpen(false)}
                      className="block px-3 py-2.5 rounded-lg text-sm font-medium mb-1 transition-colors"
                      style={{
                        color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                        background: active ? 'var(--accent-soft)' : 'transparent',
                      }}
                    >
                      {label}
                    </Link>
                  </motion.div>
                )
              })}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  )
}