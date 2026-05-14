import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Hand, Home, Video, BookOpen,
  GraduationCap, History, BarChart3,
  ChevronLeft, ChevronRight, Cpu,
} from 'lucide-react'
import { useApp } from '../../context/AppContext'

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

  return (
    <motion.aside
      animate={{ width: sidebarOpen ? 220 : 64 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      style={{ background: '#10101a', borderRight: '1px solid rgba(255,255,255,0.05)' }}
      className="relative flex flex-col h-full shrink-0 overflow-hidden"
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-4 py-5"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: 'rgba(0,196,204,0.15)',
            border: '1px solid rgba(0,196,204,0.3)',
          }}
        >
          <Hand className="w-5 h-5" style={{ color: '#00c4cc' }} />
        </div>

        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <p style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                SanketSetu
              </p>
              <p style={{ color: '#00c4cc', fontSize: '0.7rem', whiteSpace: 'nowrap' }}>
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
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200"
                style={{
                  background: active ? 'rgba(0,196,204,0.1)'  : 'transparent',
                  border:     active ? '1px solid rgba(0,196,204,0.2)' : '1px solid transparent',
                  color:      active ? '#00c4cc' : '#64748b',
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
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        whiteSpace: 'nowrap',
                        color: active ? '#00c4cc' : '#94a3b8',
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

      {/* Model Status */}
      <div className="p-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl"
          style={{ background: '#161622' }}
          title={!sidebarOpen ? 'Model Online · 99.7%' : undefined}
        >
          <div className="relative shrink-0">
            <Cpu size={15} style={{ color: '#4ade80' }} />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          </div>
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <p style={{ fontSize: '0.7rem', fontWeight: 600, color: '#e2e8f0', whiteSpace: 'nowrap' }}>
                  Model Online
                </p>
                <p style={{ fontSize: '0.65rem', color: '#64748b', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                  99.7% accuracy
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setSidebarOpen(o => !o)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full flex items-center justify-center hover:scale-110 transition-transform z-10"
        style={{ background: '#1c1c2e', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        {sidebarOpen
          ? <ChevronLeft  size={11} style={{ color: '#64748b' }} />
          : <ChevronRight size={11} style={{ color: '#64748b' }} />}
      </button>
    </motion.aside>
  )
}