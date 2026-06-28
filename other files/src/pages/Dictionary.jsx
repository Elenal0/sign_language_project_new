import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Play, Volume2, Hand, Info, Hash } from 'lucide-react'
import { ISL_SIGNS, CATEGORIES } from '../data/islData'

const DIFF_COLOR = { easy: 'var(--green)', medium: 'var(--yellow)', hard: 'var(--red)' }
const DIFF_BG    = { easy: 'var(--green-soft)', medium: 'var(--yellow-soft)', hard: 'var(--red-soft)' }

const itemVariant = {
  hidden: { opacity: 0, y: 14, scale: 0.97 },
  show:   { opacity: 1, y: 0,  scale: 1, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
}

export default function Dictionary() {
  const [search,       setSearch]       = useState('')
  const [activeCat,    setActiveCat]    = useState('all')
  const [selectedSign, setSelectedSign] = useState(null)

  const filtered = useMemo(() => {
    return ISL_SIGNS
      .filter(s => activeCat === 'all' || s.category === activeCat)
      .filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.hindi && s.hindi.includes(search))
      )
  }, [search, activeCat])

  const speak = (text) => {
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'en-IN'
    speechSynthesis.cancel()
    speechSynthesis.speak(u)
  }

  return (
    <div style={{ padding: '1.5rem', minHeight: '100%', position: 'relative' }}>

      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>Sign Dictionary</h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Browse {ISL_SIGNS.length} Indian Sign Language gestures.</p>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', flex: 1, maxWidth: 340, minWidth: 200 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            type="text"
            className="input-field"
            placeholder="Search signs…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 36, paddingRight: search ? 32 : 12 }}
          />
          {search && (
            <button onClick={() => setSearch('')}
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Category pills */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 10, marginBottom: 18 }}>
        {CATEGORIES.map(cat => (
          <motion.button
            key={cat.id}
            onClick={() => setActiveCat(cat.id)}
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            style={{
              padding: '5px 14px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600,
              whiteSpace: 'nowrap', cursor: 'pointer', transition: 'all 0.2s ease',
              border: activeCat === cat.id ? '1px solid var(--accent)' : '1px solid var(--border)',
              background: activeCat === cat.id ? 'var(--accent)' : 'var(--bg-panel)',
              color: activeCat === cat.id ? '#fff' : 'var(--text-secondary)',
            }}
          >
            {cat.label}
            <span style={{
              marginLeft: 5, fontSize: '0.65rem', opacity: 0.75,
              background: activeCat === cat.id ? 'rgba(255,255,255,0.2)' : 'var(--bg-inset)',
              padding: '1px 5px', borderRadius: 9999,
            }}>
              {cat.count}
            </span>
          </motion.button>
        ))}
      </div>

      {/* Grid */}
      <motion.div
        variants={{ show: { transition: { staggerChildren: 0.04 } } }}
        initial="hidden"
        animate="show"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}
      >
        {filtered.length > 0 ? filtered.map(sign => (
          <motion.div
            key={sign.id}
            variants={itemVariant}
            className="card-hover"
            onClick={() => setSelectedSign(sign)}
            style={{ display: 'flex', flexDirection: 'column', cursor: 'pointer', minHeight: 160 }}
            whileHover={{ y: -4, boxShadow: '0 8px 24px var(--accent-glow)' }}
          >
            {/* Top row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <span style={{
                fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em',
                padding: '2px 7px', borderRadius: 9999,
                background: DIFF_BG[sign.difficulty] || 'var(--bg-inset)',
                color: DIFF_COLOR[sign.difficulty] || 'var(--text-muted)',
              }}>
                {sign.difficulty}
              </span>
              <button
                onClick={e => { e.stopPropagation(); speak(sign.name) }}
                style={{ background: 'var(--bg-inset)', border: 'none', width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <Volume2 size={11} />
              </button>
            </div>

            {/* Hand icon */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 0' }}>
              <motion.div
                whileHover={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.4 }}
              >
                <Hand size={36} style={{ color: 'var(--accent-soft)', filter: 'drop-shadow(0 0 6px var(--accent-glow))' }} />
              </motion.div>
            </div>

            {/* Label */}
            <div style={{ textAlign: 'center', marginTop: 'auto' }}>
              <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{sign.name}</p>
              {sign.hindi && (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 3 }}>{sign.hindi}</p>
              )}
              <span style={{ fontSize: '0.62rem', color: 'var(--text-ghost)', marginTop: 4, display: 'block' }}>{sign.category}</span>
            </div>
          </motion.div>
        )) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
            <Search size={32} style={{ margin: '0 auto 12px', opacity: 0.2 }} />
            <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>No signs found</p>
            <p style={{ fontSize: '0.85rem', marginTop: 4 }}>Try a different search term.</p>
          </motion.div>
        )}
      </motion.div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedSign && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedSign(null)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 16 }}
              transition={{ type: 'spring', stiffness: 280, damping: 24 }}
              className="glass-card"
              style={{ position: 'relative', width: '100%', maxWidth: 460, zIndex: 101, overflow: 'hidden' }}
            >
              {/* Modal header */}
              <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>{selectedSign.name}</h2>
                  {selectedSign.hindi && <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginTop: 2 }}>{selectedSign.hindi}</p>}
                </div>
                <button onClick={() => setSelectedSign(null)}
                  style={{ background: 'var(--bg-inset)', border: 'none', width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 18, lineHeight: 1 }}>
                  ×
                </button>
              </div>

              {/* Video placeholder */}
              <div style={{ background: 'var(--bg-inset)', aspectRatio: '16/9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'var(--text-muted)' }}>
                <motion.div
                  animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 2, repeat: Infinity }}
                >
                  <Hand size={56} style={{ color: 'var(--accent-soft)', filter: 'drop-shadow(0 0 16px var(--accent-glow))' }} />
                </motion.div>
                <p style={{ fontSize: '0.8rem' }}>Video demonstration</p>
                <button
                  onClick={() => speak(selectedSign.name)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px',
                    background: 'var(--accent-soft)', border: '1px solid var(--accent-border)',
                    borderRadius: 8, cursor: 'pointer', color: 'var(--accent)', fontSize: '0.78rem', fontWeight: 600,
                  }}
                >
                  <Volume2 size={13} /> Pronounce
                </button>
              </div>

              {/* Details */}
              <div style={{ padding: '1rem 1.25rem' }}>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                  <span style={{
                    fontSize: '0.7rem', fontWeight: 700, textTransform: 'capitalize', padding: '3px 9px',
                    borderRadius: 9999, background: DIFF_BG[selectedSign.difficulty], color: DIFF_COLOR[selectedSign.difficulty],
                  }}>{selectedSign.difficulty}</span>
                  <span style={{
                    fontSize: '0.7rem', fontWeight: 600, padding: '3px 9px',
                    borderRadius: 9999, background: 'var(--bg-inset)', border: '1px solid var(--border)', color: 'var(--text-secondary)',
                  }}>{selectedSign.category}</span>
                  {selectedSign.hands && (
                    <span style={{
                      fontSize: '0.7rem', fontWeight: 600, padding: '3px 9px', display: 'flex', alignItems: 'center', gap: 4,
                      borderRadius: 9999, background: 'var(--bg-inset)', border: '1px solid var(--border)', color: 'var(--text-secondary)',
                    }}>
                      <Hash size={10} /> {selectedSign.hands} hand{selectedSign.hands !== 'one' ? 's' : ''}
                    </span>
                  )}
                </div>

                {selectedSign.description && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <Info size={13} style={{ color: 'var(--accent)' }} />
                      <h3 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>How to sign</h3>
                    </div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                      {selectedSign.description}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
