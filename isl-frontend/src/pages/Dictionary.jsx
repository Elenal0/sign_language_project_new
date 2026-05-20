import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Play, Volume2, Hand, Info } from 'lucide-react'
import { ISL_SIGNS, CATEGORIES } from '../data/islData'

const DIFF_COLOR = {
  Easy: 'var(--green)',
  Medium: 'var(--yellow)',
  Hard: 'var(--red)',
}

const DIFF_BG = {
  Easy: 'var(--green-soft)',
  Medium: 'var(--yellow-soft)',
  Hard: 'var(--red-soft)',
}

const item = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
}

export default function Dictionary() {
  const [search, setSearch] = useState('')
  const [activeCat, setActiveCat] = useState('All')
  const [selectedSign, setSelectedSign] = useState(null)

  const filtered = useMemo(() => {
    return ISL_SIGNS
      .filter(s => activeCat === 'All' || s.category === activeCat)
      .filter(s =>
        s.word.toLowerCase().includes(search.toLowerCase()) ||
        s.hindi.includes(search)
      )
  }, [search, activeCat])

  const speak = (text) => {
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'en-IN'
    speechSynthesis.speak(u)
  }

  return (
    <div style={{ padding: '1.5rem', minHeight: '100%', position: 'relative' }}>
      
      {/* Header & Controls */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>Sign Dictionary</h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Browse {ISL_SIGNS.length} Indian Sign Language gestures.</p>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', flex: 1, maxWidth: 600 }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="input-field"
              placeholder="Search signs in English or Hindi..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 38 }}
            />
            {search && (
              <X 
                size={14} 
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', cursor: 'pointer' }}
                onClick={() => setSearch('')}
              />
            )}
          </div>
        </div>
      </div>

      {/* Categories */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12, marginBottom: 16 }} className="no-scrollbar">
        {['All', ...CATEGORIES].map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCat(cat)}
            style={{
              padding: '6px 14px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600,
              whiteSpace: 'nowrap', border: '1px solid var(--border)', cursor: 'pointer',
              background: activeCat === cat ? 'var(--accent)' : 'var(--bg-panel)',
              color: activeCat === cat ? '#fff' : 'var(--text-secondary)',
              transition: 'all 0.2s ease',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      <motion.div 
        variants={{ show: { transition: { staggerChildren: 0.05 } } }}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-40px' }}
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}
      >
        {filtered.length > 0 ? filtered.map(sign => (
          <motion.div
            key={sign.id}
            variants={item}
            className="card-hover"
            onClick={() => setSelectedSign(sign)}
            style={{ display: 'flex', flexDirection: 'column', height: 180 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <span className="badge" style={{ background: DIFF_BG[sign.difficulty], color: DIFF_COLOR[sign.difficulty] }}>
                {sign.difficulty}
              </span>
              <button 
                onClick={(e) => { e.stopPropagation(); speak(sign.word) }}
                style={{ background: 'var(--bg-inset)', border: 'none', width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <Volume2 size={12} />
              </button>
            </div>
            
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Hand size={40} style={{ color: 'var(--accent-soft)', filter: 'drop-shadow(0 0 8px var(--accent-glow))' }} />
            </div>

            <div style={{ marginTop: 'auto', textAlign: 'center' }}>
              <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{sign.word}</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 2 }}>{sign.hindi}</p>
            </div>
          </motion.div>
        )) : (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
            <Search size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <p style={{ fontSize: '1rem', fontWeight: 600 }}>No signs found</p>
            <p style={{ fontSize: '0.85rem', marginTop: 4 }}>Try searching for a different word.</p>
          </div>
        )}
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {selectedSign && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyItems: 'center', padding: '1rem' }}>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedSign(null)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="glass-card"
              style={{ position: 'relative', width: '100%', maxWidth: 500, margin: 'auto', zIndex: 101, overflow: 'hidden' }}
            >
              {/* Header */}
              <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>{selectedSign.word}</h2>
                  <p style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>{selectedSign.hindi}</p>
                </div>
                <button 
                  onClick={() => setSelectedSign(null)}
                  style={{ background: 'var(--bg-inset)', border: 'none', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Media placeholder */}
              <div style={{ background: 'var(--bg-inset)', aspectRatio: '16/9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                <Play size={40} style={{ opacity: 0.5, marginBottom: 12 }} />
                <p style={{ fontSize: '0.85rem' }}>Video demonstration (Placeholder)</p>
              </div>

              {/* Details */}
              <div style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  <span className="badge" style={{ background: DIFF_BG[selectedSign.difficulty], color: DIFF_COLOR[selectedSign.difficulty] }}>
                    {selectedSign.difficulty}
                  </span>
                  <span className="badge" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                    {selectedSign.category}
                  </span>
                </div>
                
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <Info size={14} style={{ color: 'var(--accent)' }} />
                    <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>How to sign</h3>
                  </div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {selectedSign.description}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
