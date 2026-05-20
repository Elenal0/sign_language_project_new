import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Hand, Home, Video, BookOpen,
  GraduationCap, History, BarChart3,
  ChevronLeft, ChevronRight, Cpu,
} from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useState, useEffect } from 'react'

const NAV = [
  { to: '/',           icon: Home,          label: 'Home'       },
  { to: '/translate',  icon: Video,         label: 'Translator' },
  { to: '/dictionary', icon: BookOpen,      label: 'Dictionary' },
  { to: '/learn',      icon: GraduationCap, label: 'Learn'      },
  { to: '/history',    icon: History,       label: 'History'    },
  { to: '/dashboard',  icon: BarChart3,     label: 'Dashboard'  },
]

export default function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useApp()
  const location = useLocation()
  const [apiOnline, setApiOnline] = useState(false)

  useEffect(() => {
    fetch('/health').then(r => r.ok && setApiOnline(true)).catch(() => setApiOnline(false))
    const interval = setInterval(() => {
      fetch('/health').then(r => r.ok ? setApiOnline(true) : setApiOnline(false)).catch(() => setApiOnline(false))
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <motion.aside
      animate={{ width: sidebarOpen ? 220 : 64 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className="relative hidden md:flex flex-col h-full shrink-0 overflow-hidden"
      style={{ background: 'var(--sidebar-bg)', borderRight: '1px solid var(--border)' }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-4 py-5"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <motion.div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent-border)' }}
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.95 }}
        >
          <Hand className="w-5 h-5" style={{ color: 'var(--accent)' }} />
        </motion.div>

        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <p style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                SanketSetu
              </p>
              <p style={{ color: 'var(--accent)', fontSize: '0.7rem', whiteSpace: 'nowrap' }}>
                v2.0 · SPIT AI Lab
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto no-scrollbar">
        {NAV.map(({ to, icon: Icon, label }) => {
          const active = to === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(to)
          return (
            <NavLink
              key={to}
              to={to}
              title={!sidebarOpen ? label : undefined}
              style={{ textDecoration: 'none' }}
            >
              <motion.div
                whileHover={{ x: 3 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200"
                style={{
                  background: active ? 'var(--accent-soft)' : 'transparent',
                  border: active ? '1px solid var(--accent-border)' : '1px solid transparent',
                  color: active ? 'var(--accent)' : 'var(--text-muted)',
                }}
              >
                <Icon size={17} className="shrink-0" />
                <AnimatePresence>
                  {sidebarOpen && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      style={{
                        fontSize: '0.875rem', fontWeight: 500, whiteSpace: 'nowrap',
                        color: active ? 'var(--accent)' : 'var(--text-secondary)',
                      }}
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </NavLink>
          )
        })}
      </nav>

      {/* Model Status — real /health */}
      <div className="p-2" style={{ borderTop: '1px solid var(--border)' }}>
        <div
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl"
          style={{ background: 'var(--bg-panel)' }}
          title={!sidebarOpen ? (apiOnline ? 'Model Online' : 'Model Offline') : undefined}
        >
          <div className="relative shrink-0">
            <Cpu size={15} style={{ color: apiOnline ? 'var(--green)' : 'var(--red)' }} />
            <span
              className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
              style={{
                background: apiOnline ? 'var(--green)' : 'var(--red)',
                animation: apiOnline ? 'pulse 2s infinite' : 'none',
              }}
            />
          </div>
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <p style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                  {apiOnline ? 'Model Online' : 'Model Offline'}
                </p>
                <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                  {apiOnline ? '99.7% accuracy' : 'Start backend'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Collapse Toggle */}
      <motion.button
        onClick={() => setSidebarOpen(o => !o)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full flex items-center justify-center z-10"
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', cursor: 'pointer' }}
        whileHover={{ scale: 1.2 }}
        whileTap={{ scale: 0.9 }}
      >
        {sidebarOpen
          ? <ChevronLeft  size={11} style={{ color: 'var(--text-muted)' }} />
          : <ChevronRight size={11} style={{ color: 'var(--text-muted)' }} />}
      </motion.button>
    </motion.aside>
  )
}