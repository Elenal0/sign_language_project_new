import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Hand, ChevronRight, BookOpen, Star } from 'lucide-react'
import { ISL_SIGNS, CATEGORIES } from '../data/islData'

const DIFF_COLOR = { easy: '#4ade80', medium: '#facc15', hard: '#f87171' }
const DIFF_BG    = { easy: 'rgba(74,222,128,0.1)', medium: 'rgba(250,204,21,0.1)', hard: 'rgba(248,113,113,0.1)' }

function SignCard({ sign, onClick }) {
  return (
    <motion.div
      whileHover={{ y: -3, boxShadow: '0 8px 28px rgba(0,196,204,0.1)', borderColor: 'rgba(0,196,204,0.25)' }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(sign)}
      className="card-hover"
      style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 10 }}
    >
      {/* Icon area */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(0,196,204,0.08)', border: '1px solid rgba(0,196,204,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#00c4cc', fontFamily: 'monospace' }}>
            {sign.name.slice(0, 2).toUpperCase()}
          </span>
        </div>
        <span style={{ fontSize: '0.68rem', fontWeight: 600, padding: '2px 8px', borderRadius: 9999, background: DIFF_BG[sign.difficulty], color: DIFF_COLOR[sign.difficulty] }}>
          {sign.difficulty}
        </span>
      </div>

      <div>
        <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f1f5f9', marginBottom: 2 }}>{sign.name}</p>
        <p style={{ fontSize: '0.78rem', color: '#00c4cc', marginBottom: 6 }}>{sign.hindi}</p>
        <p style={{ fontSize: '0.75rem', color: '#475569', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{sign.description}</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <span style={{ fontSize: '0.68rem', color: '#334155' }}>{sign.hands === 'two' ? '🤲 Two hands' : '✋ One hand'}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.68rem', color: '#334155' }}>
          <Star size={10} style={{ color: '#64748b' }} /> {sign.usage.toLocaleString()} uses
        </div>
      </div>
    </motion.div>
  )
}

function Modal({ sign, onClose }) {
  if (!sign) return null
  return (
    <AnimatePresence>
      <motion.div key="overlay"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <motion.div key="panel"
          initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          onClick={e => e.stopPropagation()}
          style={{ background: '#161622', border: '1px solid rgba(0,196,204,0.2)', borderRadius: 20, padding: 28, maxWidth: 440, width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: '0.68rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {sign.category}
                </span>
                <span style={{ fontSize: '0.65rem', fontWeight: 600, padding: '1px 7px', borderRadius: 9999, background: DIFF_BG[sign.difficulty], color: DIFF_COLOR[sign.difficulty] }}>
                  {sign.difficulty}
                </span>
              </div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#f1f5f9' }}>{sign.name}</h2>
              <p style={{ fontSize: '1rem', color: '#00c4cc', marginTop: 2 }}>{sign.hindi}</p>
            </div>
            <button onClick={onClose}
              style={{ width: 32, height: 32, borderRadius: 8, background: '#22223a', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
              <X size={14} />
            </button>
          </div>

          {/* Sign demo area */}
          <div style={{ background: '#0d0d18', borderRadius: 14, padding: 24, textAlign: 'center', marginBottom: 20, border: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ width: 80, height: 80, borderRadius: 20, background: 'rgba(0,196,204,0.08)', border: '1px solid rgba(0,196,204,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <Hand size={36} style={{ color: '#00c4cc' }} />
            </div>
            <p style={{ fontSize: '0.8rem', color: '#64748b' }}>3D sign animation coming soon</p>
          </div>

          {/* Description */}
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: '0.7rem', color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>How to sign</p>
            <p style={{ fontSize: '0.875rem', color: '#94a3b8', lineHeight: 1.65 }}>{sign.description}</p>
          </div>

          {/* Meta pills */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { label: sign.hands === 'two' ? '🤲 Two hands' : '✋ One hand' },
              { label: `⭐ ${sign.usage.toLocaleString()} uses` },
              { label: `🆔 ID: ${sign.id}` },
            ].map(({ label }) => (
              <span key={label} style={{ fontSize: '0.72rem', padding: '4px 10px', borderRadius: 9999, background: '#22223a', border: '1px solid rgba(255,255,255,0.06)', color: '#64748b' }}>{label}</span>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default function Dictionary() {
  const [query, setQuery]         = useState('')
  const [category, setCategory]   = useState('all')
  const [selected, setSelected]   = useState(null)
  const [sortBy, setSortBy]       = useState('name')

  const filtered = useMemo(() => {
    let signs = ISL_SIGNS
    if (category !== 'all') signs = signs.filter(s => s.category === category)
    if (query.trim()) {
      const q = query.toLowerCase()
      signs = signs.filter(s => s.name.toLowerCase().includes(q) || s.hindi.includes(q) || s.description.toLowerCase().includes(q))
    }
    if (sortBy === 'usage')      signs = [...signs].sort((a, b) => b.usage - a.usage)
    else if (sortBy === 'diff')  signs = [...signs].sort((a, b) => ['easy','medium','hard'].indexOf(a.difficulty) - ['easy','medium','hard'].indexOf(b.difficulty))
    else                         signs = [...signs].sort((a, b) => a.name.localeCompare(b.name))
    return signs
  }, [query, category, sortBy])

  return (
    <div style={{ padding: '1.25rem', minHeight: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <BookOpen size={18} style={{ color: '#60a5fa' }} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f1f5f9' }}>Sign Dictionary</h1>
          <p style={{ fontSize: '0.75rem', color: '#475569' }}>{ISL_SIGNS.length} signs · Click any card to see details</p>
        </div>
      </div>

      {/* Search + Sort */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
          <input
            value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search signs, Hindi words…"
            className="input-field"
            style={{ paddingLeft: 36 }}
          />
          {query && (
            <button onClick={() => setQuery('')}
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#475569' }}>
              <X size={13} />
            </button>
          )}
        </div>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
          className="input-field" style={{ width: 'auto', paddingInline: '0.75rem', cursor: 'pointer' }}>
          <option value="name">Sort: A–Z</option>
          <option value="usage">Sort: Popular</option>
          <option value="diff">Sort: Easiest first</option>
        </select>
      </div>

      {/* Category tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {CATEGORIES.map(cat => (
          <motion.button key={cat.id} whileTap={{ scale: 0.96 }}
            onClick={() => setCategory(cat.id)}
            style={{ padding: '6px 14px', borderRadius: 9999, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'all 0.18s',
              background: category === cat.id ? '#00c4cc' : '#161622',
              color: category === cat.id ? '#0a0a12' : '#64748b',
              boxShadow: category === cat.id ? '0 0 12px rgba(0,196,204,0.3)' : 'none' }}>
            {cat.label} <span style={{ opacity: 0.7, fontSize: '0.68rem' }}>({cat.count})</span>
          </motion.button>
        ))}
      </div>

      {/* Results count */}
      <p style={{ fontSize: '0.75rem', color: '#334155', marginBottom: 16 }}>
        {filtered.length} sign{filtered.length !== 1 ? 's' : ''} found
        {query && <> for "<span style={{ color: '#94a3b8' }}>{query}</span>"</>}
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#334155' }}>
          <Search size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <p style={{ fontSize: '0.9rem' }}>No signs match your search</p>
          <button onClick={() => { setQuery(''); setCategory('all') }}
            style={{ marginTop: 12, fontSize: '0.8rem', color: '#00c4cc', background: 'none', border: 'none', cursor: 'pointer' }}>
            Clear filters
          </button>
        </div>
      ) : (
        <motion.div
          layout
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
          {filtered.map((sign, i) => (
            <motion.div key={sign.id} layout
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.025, duration: 0.3 }}>
              <SignCard sign={sign} onClick={setSelected} />
            </motion.div>
          ))}
        </motion.div>
      )}

      <Modal sign={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
