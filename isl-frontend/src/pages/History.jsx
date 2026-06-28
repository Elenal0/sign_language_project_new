import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Trash2, Bookmark, BookmarkCheck, Download, Clock, Filter, X, History as HistIcon } from 'lucide-react'
import { useApp } from '../context/AppContext'

function relTime(ts) {
  const diff = Date.now() - new Date(ts).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

function confColor(c) {
  if (c >= 0.9) return '#4ade80'
  if (c >= 0.75) return '#facc15'
  return '#f87171'
}

export default function History() {
  const { history, toggleSaved, deleteItem, showToast } = useApp()
  const [query, setQuery]   = useState('')
  const [filter, setFilter] = useState('all')  // all | saved

  const filtered = useMemo(() => {
    let h = history
    if (filter === 'saved') h = h.filter(i => i.saved)
    if (query.trim()) {
      const q = query.toLowerCase()
      h = h.filter(i => i.sentence.toLowerCase().includes(q) || i.words.some(w => w.toLowerCase().includes(q)))
    }
    return h
  }, [history, query, filter])

  const handleExport = () => {
    const sanitizeCsv = (val) => {
      const str = String(val);
      return /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
    };
    const rows = [
      ['Sentence', 'Words', 'Language', 'Confidence', 'Time'],
      ...history.map(h => [sanitizeCsv(h.sentence), sanitizeCsv(h.words.join(' | ')), h.lang, (h.confidence * 100).toFixed(1) + '%', sanitizeCsv(new Date(h.timestamp).toLocaleString())])
    ]
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'isl_history.csv'; a.click()
    showToast('History exported as CSV', 'success')
  }

  return (
    <div style={{ padding: '1.25rem', minHeight: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(250,204,21,0.1)', border: '1px solid rgba(250,204,21,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <HistIcon size={18} style={{ color: '#facc15' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f1f5f9' }}>Translation History</h1>
            <p style={{ fontSize: '0.75rem', color: '#475569' }}>{history.length} total · {history.filter(i => i.saved).length} saved</p>
          </div>
        </div>
        <button onClick={handleExport} className="btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem' }}>
          <Download size={13} /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
          <input value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search translations…" className="input-field" style={{ paddingLeft: 36 }} />
          {query && (
            <button onClick={() => setQuery('')}
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#475569' }}>
              <X size={13} />
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: 4, background: '#161622', borderRadius: 10, padding: 3, border: '1px solid rgba(255,255,255,0.06)' }}>
          {[['all', 'All'], ['saved', '🔖 Saved']].map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)}
              style={{ padding: '5px 14px', borderRadius: 7, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'all 0.18s', background: filter === val ? '#00c4cc' : 'transparent', color: filter === val ? '#0a0a12' : '#64748b' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#334155' }}>
          <HistIcon size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <p style={{ fontSize: '0.9rem' }}>{filter === 'saved' ? 'No saved translations' : 'No translations yet'}</p>
          {query && (
            <button onClick={() => setQuery('')}
              style={{ marginTop: 10, fontSize: '0.8rem', color: '#00c4cc', background: 'none', border: 'none', cursor: 'pointer' }}>Clear search</button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <AnimatePresence initial={false}>
            {filtered.map((item, i) => (
              <motion.div key={item.id}
                layout
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                style={{ background: '#161622', border: `1px solid ${item.saved ? 'rgba(0,196,204,0.2)' : 'rgba(255,255,255,0.05)'}`, borderRadius: 14, padding: '1rem 1.25rem', boxShadow: item.saved ? '0 0 20px rgba(0,196,204,0.06)' : 'none' }}>

                {/* Top row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '0.925rem', fontWeight: 600, color: '#f1f5f9', marginBottom: 6, lineHeight: 1.4 }}>
                      "{item.sentence}"
                    </p>
                    {/* Word chips */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
                      {item.words.map((w, j) => (
                        <span key={j} style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: '#64748b' }}>{w}</span>
                      ))}
                    </div>
                    {/* Meta row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.7rem', color: '#334155' }}>
                        <Clock size={10} /> {relTime(item.timestamp)}
                      </span>
                      <span style={{ fontSize: '0.7rem', padding: '1px 7px', borderRadius: 9999, background: '#22223a', color: '#64748b' }}>
                        {item.lang === 'en' ? '🇬🇧 EN' : '🇮🇳 HI'}
                      </span>
                      <span style={{ fontSize: '0.7rem', fontFamily: 'monospace', color: confColor(item.confidence) }}>
                        {Math.round(item.confidence * 100)}% conf
                      </span>
                      {item.saved && (
                        <span style={{ fontSize: '0.68rem', color: '#00c4cc', display: 'flex', alignItems: 'center', gap: 3 }}>
                          <BookmarkCheck size={10} /> Saved
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button onClick={() => { toggleSaved(item.id); showToast(item.saved ? 'Removed from saved' : 'Translation saved', 'success') }}
                      title={item.saved ? 'Remove bookmark' : 'Bookmark'}
                      style={{ width: 32, height: 32, borderRadius: 8, background: item.saved ? 'rgba(0,196,204,0.1)' : '#1c1c2e', border: `1px solid ${item.saved ? 'rgba(0,196,204,0.25)' : 'rgba(255,255,255,0.06)'}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.saved ? '#00c4cc' : '#64748b' }}>
                      {item.saved ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
                    </button>
                    <button onClick={() => { deleteItem(item.id); showToast('Deleted', 'success') }}
                      title="Delete"
                      style={{ width: 32, height: 32, borderRadius: 8, background: '#1c1c2e', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
