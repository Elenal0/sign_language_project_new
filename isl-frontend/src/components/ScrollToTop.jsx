import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUp } from 'lucide-react'

export default function ScrollToTop() {
  const { pathname } = useLocation()
  const [visible, setVisible] = useState(false)

  // Scroll to top on route change
  useEffect(() => {
    const main = document.querySelector('main')
    if (main) main.scrollTo({ top: 0, behavior: 'smooth' })
  }, [pathname])

  // Show button after scrolling 300px
  useEffect(() => {
    const main = document.querySelector('main')
    if (!main) return
    const handleScroll = () => setVisible(main.scrollTop > 300)
    main.addEventListener('scroll', handleScroll, { passive: true })
    return () => main.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    const main = document.querySelector('main')
    if (main) main.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          onClick={scrollToTop}
          className="fab"
          style={{
            bottom: 24, right: 24, width: 42, height: 42, borderRadius: 13,
            background: 'var(--bg-elevated)', color: 'var(--text-primary)',
            border: '1px solid var(--border-hover)', boxShadow: 'var(--shadow-md)', cursor: 'pointer',
          }}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.94 }}
          aria-label="Scroll to top"
        >
          <ArrowUp size={17} strokeWidth={1.75} />
        </motion.button>
      )}
    </AnimatePresence>
  )
}
