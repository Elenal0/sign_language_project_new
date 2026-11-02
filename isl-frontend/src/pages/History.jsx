import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Search, Download, Bookmark, Trash2, ArrowRight, History as HistoryIcon } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import Segmented from '../components/ui/Segmented'
import { useApp } from '../context/AppContext'

function relTime(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'Just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function confColor(c) {
  if (c >= 0.90) return 'var(--green)'
  if (c >= 0.75) return 'var(--yellow)'
  return 'var(--red)'
}

export default function History() {
  const { history, toggleSaved, deleteItem, clearHistory, showToast } = useApp()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all') // all, saved
  const [confirmClear, setConfirmClear] = useState(false)

  const filtered = useMemo(() => {
    return history
      .filter(h => filter === 'all' || (filter === 'saved' && h.saved))
      .filter(h => h.sentence.toLowerCase().includes(search.toLowerCase()))
  }, [history, search, filter])

  // Group by date
  const grouped = useMemo(() => {
    const today = new Date().toLocaleDateString()
    const yesterday = new Date(Date.now() - 86400000).toLocaleDateString()
    
    const groups = { Today: [], Yesterday: [], Earlier: [] }
    
    filtered.forEach(item => {
      const date = new Date(item.timestamp).toLocaleDateString()
      if (date === today) groups.Today.push(item)
      else if (date === yesterday) groups.Yesterday.push(item)
      else groups.Earlier.push(item)
    })
    return groups
  }, [filtered])

  const exportCSV = () => {
    if (!history.length) return showToast('Nothing to export', 'error')
    const csv = [
      ['Timestamp', 'Sentence', 'Words', 'Language', 'Confidence', 'Saved'],
      ...history.map(h => [
        new Date(h.timestamp).toLocaleString(),
        `"${h.sentence}"`,
        `"${h.words.join(', ')}"`,
        h.lang,
        Math.round(h.confidence * 100) + '%',
        h.saved ? 'Yes' : 'No'
      ])
    ].map(r => r.join(',')).join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `MudraVani_history_${new Date().toISOString().slice(0,10)}.csv`
    a.click()
    showToast('History exported as CSV', 'success')
  }

  const handleClear = () => {
    if (confirmClear) {
      clearHistory()
      setConfirmClear(false)
      showToast('History cleared', 'success')
    } else {
      setConfirmClear(true)
      setTimeout(() => setConfirmClear(false), 3000)
    }
  }

  const savedCount = history.filter(h => h.saved).length

  return (
    <div className="page">

      <PageHeader
        eyebrow={`Archive · ${history.length} ${history.length === 1 ? 'translation' : 'translations'}`}
        title={<>Every <em>conversation</em></>}
        deva="इतिहास"
        sub="Sentences you saved from the translator, newest first. Bookmark the ones worth keeping."
        actions={
          <>
            <button
              onClick={handleClear}
              disabled={!history.length}
              className={confirmClear ? 'btn-primary' : 'btn-ghost'}
              style={confirmClear ? { background: 'var(--red)', color: '#fff', boxShadow: 'none' } : { color: history.length ? 'var(--red)' : 'var(--text-ghost)' }}
            >
              <Trash2 size={15} /> {confirmClear ? 'Click to confirm' : 'Clear all'}
            </button>
            <button onClick={exportCSV} disabled={!history.length} className="btn-secondary">
              <Download size={15} /> Export CSV
            </button>
          </>
        }
      />

      {/* Filters */}
      {history.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginBottom: 28 }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 220, maxWidth: 420 }}>
            <Search size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)', pointerEvents: 'none' }} />
            <input
              type="text"
              className="input-field"
              placeholder="Search your sentences"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 38 }}
            />
          </div>
          <Segmented
            ariaLabel="Filter"
            value={filter}
            onChange={setFilter}
            options={[{ value: 'all', label: `All  ${history.length}` }, { value: 'saved', label: `Saved  ${savedCount}` }]}
          />
        </div>
      )}

      {history.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem 1rem' }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-panel)', border: '1px solid var(--border)' }}>
            <HistoryIcon size={22} strokeWidth={1.5} style={{ color: 'var(--text-faint)' }} />
          </div>
          <p className="display" style={{ fontSize: '2.4rem', marginTop: 22 }}>Nothing here <em>yet.</em></p>
          <p style={{ color: 'var(--text-muted)', marginTop: 10 }}>Sign a sentence in the translator and press Save — it will appear here.</p>
          <Link to="/translate" className="btn-primary" style={{ marginTop: 24 }}>Open translator <ArrowRight size={15} /></Link>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <p className="display" style={{ fontSize: '2rem' }}>No matches.</p>
          <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>
            {filter === 'saved' && !search ? 'You haven’t bookmarked anything yet.' : 'Try a different word.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
          {['Today', 'Yesterday', 'Earlier'].map(group => {
            const items = grouped[group]
            if (!items.length) return null
            return (
              <section key={group} className="hist-group reveal">
                <div className="hist-label">
                  <span className="eyebrow eyebrow--plain">{group}</span>
                  <span className="mono" style={{ fontSize: '0.66rem', color: 'var(--text-ghost)' }}>{String(items.length).padStart(2, '0')}</span>
                </div>
                <div>
                  <AnimatePresence initial={false}>
                    {items.map(item => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0, transition: { duration: 0.25 } }}
                        transition={{ duration: 0.3 }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div className="hist-row">
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <p className={/[ऀ-ॿ]/.test(item.sentence) ? 'deva' : ''}
                              style={{ fontFamily: /[ऀ-ॿ]/.test(item.sentence) ? undefined : 'var(--font-serif)', fontSize: '1.55rem', lineHeight: 1.2, color: 'var(--text-primary)' }}>
                              {item.sentence}
                            </p>
                            <div className="mono" style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginTop: 10, fontSize: '0.68rem', color: 'var(--text-faint)' }}>
                              <span>{item.lang.toUpperCase()}</span>
                              <span>{item.words.length} {item.words.length === 1 ? 'word' : 'words'}</span>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: confColor(item.confidence) }} />
                                {Math.round(item.confidence * 100)}% confidence
                              </span>
                              <span>{relTime(item.timestamp)}</span>
                            </div>
                          </div>

                          <div className="hist-actions" data-saved={item.saved}>
                            <button
                              onClick={() => toggleSaved(item.id)}
                              className="icon-btn"
                              aria-label={item.saved ? 'Remove bookmark' : 'Bookmark'}
                              aria-pressed={item.saved}
                              style={item.saved ? { color: 'var(--accent)' } : undefined}
                            >
                              <Bookmark size={16} fill={item.saved ? 'currentColor' : 'none'} />
                            </button>
                            <button onClick={() => deleteItem(item.id)} className="icon-btn hist-delete" aria-label="Delete">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </section>
            )
          })}
        </div>
      )}

      <style>{`
        .hist-group { display: grid; grid-template-columns: 140px 1fr; gap: 24px; }
        .hist-label { display: flex; flex-direction: column; gap: 6px; padding-top: 22px; position: sticky; top: 16px; align-self: start; }
        .hist-row { transition: background-color var(--dur-sm) ease, padding var(--dur-md) var(--ease-out);
          display: flex; align-items: center; gap: 16px; padding: 20px 4px;
          border-top: 1px solid var(--border);
        }
        .hist-actions { display: flex; gap: 2px; opacity: 0; translate: 6px 0; transition: opacity var(--dur-sm) ease, translate var(--dur-md) var(--ease-out); }
        .hist-row:hover { background: linear-gradient(90deg, var(--accent-softer), transparent 70%); }
        .hist-row:hover .hist-actions, .hist-actions:focus-within, .hist-actions[data-saved="true"] { translate: 0 0; }
        .hist-row:hover .hist-actions, .hist-actions:focus-within, .hist-actions[data-saved="true"] { opacity: 1; }
        .hist-delete:hover { color: var(--red) !important; background: var(--red-soft) !important; }
        @media (hover: none) { .hist-actions { opacity: 1; } }
        @media (max-width: 720px) {
          .hist-group { grid-template-columns: 1fr; gap: 4px; }
          .hist-label { position: static; flex-direction: row; justify-content: space-between; padding-top: 0; }
        }
      `}</style>
    </div>
  )
}
