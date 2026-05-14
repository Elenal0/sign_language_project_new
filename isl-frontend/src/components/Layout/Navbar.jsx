import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Menu, Sun, Moon, Activity } from 'lucide-react'
import { useApp } from '../../context/AppContext'

const NAV_LINKS = [
  { to: '/',           label: 'Home' },
  { to: '/translate',  label: 'Translate' },
  { to: '/dictionary', label: 'Dictionary' },
  { to: '/learn',      label: 'Learn' },
  { to: '/history',    label: 'History' },
  { to: '/dashboard',  label: 'Dashboard' },
]

export default function Navbar() {
  const { pathname } = useLocation()
  const { setSidebarOpen, theme, toggleTheme } = useApp()

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 50,
      borderBottom: '1px solid rgba(255,255,255,0.07)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      background: theme === 'dark'
        ? 'rgba(10,10,18,0.85)'
        : 'rgba(248,249,252,0.92)',
    }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 1rem', height: 56, display: 'flex', alignItems: 'center', gap: 12 }}>

        {/* Hamburger — mobile */}
        <button
          onClick={() => setSidebarOpen(s => !s)}
          aria-label="Open menu"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', cursor: 'pointer', color: 'inherit' }}
          className="lg:hidden"
        >
          <Menu size={18} />
        </button>

        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Activity size={16} color="#fff" strokeWidth={2.5} />
          </div>
          <span style={{
            fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.02em',
            color: theme === 'dark' ? '#f1f5f9' : '#0f172a'
          }}>
            SanketSetu
          </span>
        </Link>

        {/* Nav links — desktop */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 2, marginLeft: 16, flex: 1 }} className="hidden lg:flex">
          {NAV_LINKS.map(({ to, label }) => {
            const active = pathname === to
            return (
              <Link key={to} to={to} style={{ textDecoration: 'none' }}>
                <motion.span
                  whileHover={{ backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }}
                  style={{
                    display: 'block', padding: '5px 12px', borderRadius: 8,
                    fontSize: '0.82rem', fontWeight: active ? 600 : 400,
                    color: active
                      ? (theme === 'dark' ? '#e2e8f0' : '#0f172a')
                      : (theme === 'dark' ? '#64748b' : '#64748b'),
                    background: active
                      ? (theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)')
                      : 'transparent',
                    transition: 'all 0.15s',
                  }}
                >
                  {label}
                </motion.span>
              </Link>
            )
          })}
        </nav>

        {/* Right side — theme toggle */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.93 }}
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            style={{
              width: 36, height: 36, borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: theme === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
              border: theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
              cursor: 'pointer',
              color: theme === 'dark' ? '#94a3b8' : '#475569',
              transition: 'all 0.18s',
            }}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </motion.button>
        </div>
      </div>
    </header>
  )
}