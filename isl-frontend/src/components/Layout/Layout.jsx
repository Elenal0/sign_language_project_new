import { Outlet, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import ScrollToTop from '../ScrollToTop'

export default function Layout() {
  const location = useLocation()

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      {/* Animated background mesh */}
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', opacity: 0.4,
          background: 'radial-gradient(ellipse at 20% 50%, var(--accent-softer) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, var(--blue-soft) 0%, transparent 50%)',
        }}
      />

      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 relative z-10">
        <Navbar />
        <main className="flex-1 overflow-y-auto">
          <ScrollToTop />
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}