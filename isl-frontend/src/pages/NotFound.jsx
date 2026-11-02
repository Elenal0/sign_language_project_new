import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import HandLandmarks from '../components/ui/HandLandmarks'

const ease = [0.16, 1, 0.3, 1]

export default function NotFound() {
  return (
    <div style={{ flex: 1, minHeight: '78vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(2rem, 6vw, 5rem)', flexWrap: 'wrap', justifyContent: 'center' }}>
        <motion.div initial={{ opacity: 0, rotate: -8 }} animate={{ opacity: 1, rotate: 0 }} transition={{ duration: 1, ease }}>
          <HandLandmarks size={200} />
        </motion.div>
        <div style={{ maxWidth: 420 }}>
          <motion.span className="eyebrow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            Error 404
          </motion.span>
          <motion.h1 className="display" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1, ease }}
            style={{ fontSize: 'clamp(3rem, 7vw, 5rem)', marginTop: 18 }}>
            Lost in <em>translation.</em>
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            style={{ color: 'var(--text-muted)', marginTop: 18, lineHeight: 1.7 }}>
            We couldn’t find this page. It may have moved, or the link might be mistyped.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, ease }}
            style={{ display: 'flex', gap: 10, marginTop: 28, flexWrap: 'wrap' }}>
            <Link to="/" className="btn-primary btn-lg"><ArrowLeft size={16} /> Back to overview</Link>
            <Link to="/translate" className="btn-secondary btn-lg">Open translator</Link>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
