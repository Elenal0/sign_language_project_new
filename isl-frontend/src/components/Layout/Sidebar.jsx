import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home, Video, BookOpen, GraduationCap, History, BarChart3,
  PanelLeftClose, PanelLeftOpen,
} from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useState, useEffect } from 'react'
import { BrandMark, Wordmark } from '../ui/Brand'

const GROUPS = [
  { label: null, items: [
    { to: '/',           icon: Home,          label: 'Overview'   },
    { to: '/translate',  icon: Video,         label: 'Translate'  },
  ]},
  { label: 'Library', items: [
    { to: '/dictionary', icon: BookOpen,      label: 'Dictionary' },
    { to: '/learn',      icon: GraduationCap, label: 'Learn'      },
  ]},
  { label: 'Insights', items: [
    { to: '/history',    icon: History,       label: 'History'    },
    { to: '/dashboard',  icon: BarChart3,     label: 'Analytics'  },
  ]},
]

const fade = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.15 } }

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
      animate={{ width: sidebarOpen ? 232 : 68 }}
      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
      className="sidebar"
      style={{ background: 'var(--sidebar-bg)', borderRight: '1px solid var(--border)', overflow: 'hidden' }}
    >
      {/* Brand */}
      <NavLink to="/" className="sidebar-brand" style={{ padding: '18px 18px 22px', height: 76 }} aria-label="Drishya Vaani home">
        <BrandMark size={32} />
        <AnimatePresence>
          {sidebarOpen && <motion.div {...fade}><Wordmark /></motion.div>}
        </AnimatePresence>
      </NavLink>

      {/* Navigation */}
      <nav className="sidebar-nav no-scrollbar" style={{ padding: '0 12px' }} aria-label="Main navigation">
        {GROUPS.map((group, gi) => (
          <div key={gi} style={{ marginBottom: 18 }}>
            <div style={{ height: 22, display: 'flex', alignItems: 'center', padding: '0 10px', marginBottom: 2 }}>
              {group.label && (sidebarOpen
                ? <motion.span {...fade} className="section-label" style={{ margin: 0 }}>{group.label}</motion.span>
                : <span className="hairline" style={{ width: 20 }} />)}
            </div>
            {group.items.map(({ to, icon: Icon, label }) => {
              const active = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)
              return (
                <NavLink key={to} to={to} title={!sidebarOpen ? label : undefined} aria-current={active ? 'page' : undefined}>
                  <div
                    className="sidebar-item" data-active={active}
                    style={{
                      height: 40, padding: '0 12px', borderRadius: 11, marginBottom: 2,
                    }}
                  >
                    {active && (
                      <motion.div
                        layoutId="sidebar-active"
                        transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                        style={{ position: 'absolute', inset: 0, borderRadius: 11, background: 'var(--bg-elevated)', border: '1px solid var(--border-hover)', boxShadow: 'var(--shadow-sm)' }}
                      >
                        <span style={{ position: 'absolute', left: -12, top: 11, bottom: 11, width: 3, borderRadius: '0 3px 3px 0', background: 'var(--accent)' }} />
                      </motion.div>
                    )}
                    <Icon size={18} strokeWidth={1.75} className="sidebar-icon" style={{ position: 'relative', flexShrink: 0, color: active ? 'var(--accent)' : undefined }} />
                    <AnimatePresence>
                      {sidebarOpen && (
                        <motion.span {...fade} style={{ position: 'relative', fontSize: '0.86rem', fontWeight: active ? 550 : 450, whiteSpace: 'nowrap' }}>
                          {label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                </NavLink>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Footer: model status + collapse */}
      <div style={{ padding: 12, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div
          className="sidebar-row"
          style={{ height: 40, padding: '0 14px', borderRadius: 11, color: apiOnline ? 'var(--green)' : 'var(--red)' }}
          title={!sidebarOpen ? (apiOnline ? 'Model online' : 'Model offline') : undefined}
        >
          <span className="status-dot" data-live={apiOnline} />
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div {...fade} style={{ whiteSpace: 'nowrap', lineHeight: 1.25 }}>
                <p style={{ fontSize: '0.76rem', fontWeight: 550, color: 'var(--text-primary)' }}>
                  {apiOnline ? 'Model online' : 'Model offline'}
                </p>
                <p className="mono" style={{ fontSize: '0.64rem', color: 'var(--text-faint)' }}>
                  {apiOnline ? 'classifier ready' : 'start the backend'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <button
          onClick={() => setSidebarOpen(o => !o)}
          className="icon-btn"
          style={{ width: '100%', height: 36, justifyContent: sidebarOpen ? 'flex-start' : 'center', padding: sidebarOpen ? '0 12px' : 0, gap: 10 }}
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {sidebarOpen ? <PanelLeftClose size={17} strokeWidth={1.75} /> : <PanelLeftOpen size={17} strokeWidth={1.75} />}
          {sidebarOpen && <span style={{ fontSize: '0.78rem' }}>Collapse</span>}
        </button>
      </div>
      <style>{`
        .sidebar-item { color: var(--text-muted); transition: color var(--dur-sm) ease; }
        .sidebar-item[data-active="true"], .sidebar-item:hover { color: var(--text-primary); }
        .sidebar-icon { transition: transform var(--dur-md) var(--ease-spring); }
        .sidebar-item:hover .sidebar-icon { transform: scale(1.12) rotate(-4deg); }
        .sidebar-item:active .sidebar-icon { transform: scale(0.92); }
      `}</style>
    </motion.aside>
  )
}
