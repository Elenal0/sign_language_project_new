import { Link, useLocation } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { Menu, X, Sun, Moon, Search } from 'lucide-react'
import { useState } from 'react'
import { BrandMark, Wordmark } from '../ui/Brand'
import { toggleThemeWithReveal } from '../../lib/motion'

const NAV_LINKS = [
  { to: '/',           label: 'Overview'   },
  { to: '/translate',  label: 'Translate'  },
  { to: '/dictionary', label: 'Dictionary' },
  { to: '/learn',      label: 'Learn'      },
  { to: '/history',    label: 'History'    },
  { to: '/dashboard',  label: 'Analytics'  },
]

// The command palette listens for Ctrl/⌘+K on window; the search button reuses that.
const openPalette = () =>
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }))

export default function Navbar({ progressKey }) {
  const { theme, toggleTheme } = useApp()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const current = NAV_LINKS.find(l => l.to === location.pathname) || { label: 'Not found' }
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

  return (
    <header className="topbar" style={{ background: 'var(--navbar-bg)', backdropFilter: 'blur(16px) saturate(140%)', WebkitBackdropFilter: 'blur(16px) saturate(140%)', borderBottom: '1px solid var(--border)' }}>
      <div className="topbar-inner">

        {/* Mobile brand */}
        <Link to="/" className="topbar-brand" aria-label="Drishya Vaani home">
          <BrandMark size={28} />
          <Wordmark compact />
        </Link>

        {/* Desktop breadcrumb */}
        <div className="topbar-crumb mono" style={{ fontSize: '0.74rem', color: 'var(--text-faint)', letterSpacing: '0.02em' }}>
          <span>drishya-vaani</span>
          <span style={{ color: 'var(--text-ghost)' }}>/</span>
          <span key={current.label} className="crumb" style={{ color: 'var(--text-primary)' }}>
            {current.label.toLowerCase()}
          </span>
        </div>

        <div className="topbar-actions">
          <button onClick={openPalette} className="topbar-search nav-search">
            <Search size={14} />
            <span style={{ flex: 1, textAlign: 'left' }}>Jump to…</span>
            <span className="kbd">{isMac ? '⌘' : 'Ctrl'}</span>
            <span className="kbd">K</span>
          </button>

          {/* HandCursor portals its toggle in here */}
          <div id="hand-cursor-slot" style={{ display: 'contents' }} />

          <button
            onClick={e => toggleThemeWithReveal(e, theme, toggleTheme)}
            className="icon-btn theme-btn"
            data-tip={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            <span className="theme-icon" data-show={theme === 'dark'}><Sun size={16} strokeWidth={1.75} /></span>
            <span className="theme-icon" data-show={theme !== 'dark'}><Moon size={16} strokeWidth={1.75} /></span>
          </button>

          <button
            className="icon-btn mobile-only"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={17} /> : <Menu size={17} />}
          </button>
        </div>
      </div>

      {/* Route progress hairline — remounts per route */}
      <span key={progressKey} className="route-progress" aria-hidden="true" />

      {/* Mobile sheet: height animates via grid rows, links stagger in */}
      <nav className="mobile-sheet nav-sheet" data-open={mobileOpen} aria-label="Mobile navigation" aria-hidden={!mobileOpen}>
        <div>
          <div className={mobileOpen ? 'stagger' : ''} style={{ padding: '10px 16px 18px', borderTop: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
            {NAV_LINKS.map(({ to, label }, i) => {
              const active = location.pathname === to
              return (
                <Link
                  key={to}
                  to={to}
                  tabIndex={mobileOpen ? 0 : -1}
                  onClick={() => setMobileOpen(false)}
                  className="mobile-link"
                  style={{ padding: '12px 4px', borderBottom: '1px solid var(--border)' }}
                >
                  <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', color: active ? 'var(--accent)' : 'var(--text-primary)', fontStyle: active ? 'italic' : 'normal' }}>
                    {label}
                  </span>
                  <span className="mono" style={{ fontSize: '0.66rem', color: 'var(--text-faint)' }}>0{i + 1}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </nav>

      <style>{`
        .nav-search {
          height: 34px; padding: 0 6px 0 12px; border-radius: 10px; min-width: 220px;
          background: var(--bg-panel); border: 1px solid var(--border-hover); color: var(--text-faint);
          font-size: 0.8rem; transition: border-color var(--dur-sm) ease, color var(--dur-sm) ease, box-shadow var(--dur-md) var(--ease-out);
        }
        .nav-search:hover { border-color: var(--border-strong); color: var(--text-muted); box-shadow: 0 0 0 4px var(--accent-softer); }
        .nav-search:active .kbd { transform: translateY(1px); border-bottom-width: 1px; }
        .theme-btn { position: relative; }
        .theme-icon {
          position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
          transition: opacity var(--dur-md) var(--ease-out), transform var(--dur-md) var(--ease-out);
        }
        .theme-icon[data-show="false"] { opacity: 0; transform: rotate(-90deg) scale(0.5); }
        .nav-sheet { display: grid; grid-template-rows: 0fr; transition: grid-template-rows var(--dur-md) var(--ease-out); }
        .nav-sheet > div { min-height: 0; overflow: hidden; }
        .nav-sheet[data-open="true"] { grid-template-rows: 1fr; }
        @media (min-width: 768px) { .nav-sheet { display: none; } }
      `}</style>
    </header>
  )
}
