import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, ArrowRight } from 'lucide-react'

export default function NotFound() {
  return (
    <div style={{
      minHeight: '80vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '2rem',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Floating decorative shapes */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          animate={{
            y: [0, -30, 0],
            rotate: [0, 180, 360],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 5 + i * 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.5,
          }}
          style={{
            position: 'absolute',
            width: 20 + i * 15,
            height: 20 + i * 15,
            borderRadius: i % 2 === 0 ? '50%' : '30%',
            background: `var(--accent-softer)`,
            border: '1px solid var(--accent-border)',
            top: `${15 + i * 15}%`,
            left: `${10 + i * 18}%`,
            pointerEvents: 'none',
          }}
        />
      ))}

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}
      >
        <motion.h1
          className="gradient-text animate-float"
          style={{ fontSize: 'clamp(5rem, 15vw, 10rem)', fontWeight: 900, lineHeight: 1, marginBottom: 8 }}
        >
          404
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}
        >
          Page not found
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: 32, maxWidth: 400 }}
        >
          The page you're looking for doesn't exist or has been moved.
          Let's get you back on track.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          <Link to="/" style={{ textDecoration: 'none' }}>
            <motion.button
              className="btn-primary"
              style={{ fontSize: '0.9rem', padding: '0.7rem 1.5rem', display: 'inline-flex', alignItems: 'center', gap: 8 }}
              whileHover={{ scale: 1.05, boxShadow: '0 0 30px var(--accent-glow)' }}
              whileTap={{ scale: 0.95 }}
            >
              <Home size={16} /> Go Home <ArrowRight size={14} />
            </motion.button>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  )
}
