import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Download, Bookmark, Trash2, Clock, CheckCircle2, ChevronDown, Filter } from 'lucide-react'
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
    a.download = `sanketsetu_history_${new Date().toISOString().slice(0,10)}.csv`
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

  return (
    <div style={{ padding: '1.5rem', minHeight: '100%' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>Translation History</h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Review and manage your past translations.</p>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button 
            onClick={handleClear} 
            disabled={!history.length}
            className="btn-secondary" 
            style={{ 
              color: confirmClear ? '#fff' : 'var(--red)', 
              borderColor: confirmClear ? 'var(--red)' : 'var(--red-border)', 
              background: confirmClear ? 'var(--red)' : 'var(--red-soft)' 
            }}
          >
            <Trash2 size={14} /> {confirmClear ? 'Click to Confirm' : 'Clear All'}
          </button>
          
          <button onClick={exportCSV} disabled={!history.length} className="btn-primary">
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '12px 16px', marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="input-field"
            placeholder="Search translations..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 34, paddingRight: 12, height: 36, background: 'var(--bg-inset)' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 4, background: 'var(--bg-inset)', padding: 4, borderRadius: 8, border: '1px solid var(--border)' }}>
          {['all', 'saved'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '4px 12px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600,
                textTransform: 'capitalize', cursor: 'pointer', border: 'none',
                background: filter === f ? 'var(--bg-elevated)' : 'transparent',
                color: filter === f ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: filter === f ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div>
        {history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
            <History size={48} style={{ margin: '0 auto 16px', opacity: 0.2 }} />
            <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>No history yet</p>
            <p style={{ fontSize: '0.85rem', marginTop: 4 }}>Translations will automatically save here.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 2rem', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: '0.9rem' }}>No matches found for your search.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {['Today', 'Yesterday', 'Earlier'].map(group => {
              const items = grouped[group]
              if (!items.length) return null
              return (
                <div key={group}>
                  <p className="section-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Clock size={12} /> {group}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <AnimatePresence>
                      {items.map(item => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, scale: 0.98, height: 0 }}
                          animate={{ opacity: 1, scale: 1, height: 'auto' }}
                          exit={{ opacity: 0, scale: 0.95, height: 0, marginBottom: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div
                            className="card-hover"
                            style={{ 
                              padding: '12px 16px', 
                              borderLeft: item.saved ? '3px solid var(--accent)' : '1px solid var(--border)',
                              display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between'
                            }}
                          >
                            <div>
                              <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                                {item.sentence}
                              </p>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                <span className="badge" style={{ background: 'var(--bg-inset)', color: 'var(--text-secondary)' }}>
                                  {item.lang.toUpperCase()}
                                </span>
                                <span className="badge" style={{ background: 'var(--bg-inset)', color: 'var(--text-secondary)' }}>
                                  {item.words.length} words
                                </span>
                                <span className="badge" style={{ background: 'transparent', color: confColor(item.confidence) }}>
                                  <CheckCircle2 size={10} style={{ marginRight: 2 }}/>
                                  {Math.round(item.confidence * 100)}% conf
                                </span>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-ghost)', marginLeft: 4 }}>
                                  {relTime(item.timestamp)}
                                </span>
                              </div>
                            </div>
                            
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                onClick={() => toggleSaved(item.id)}
                                style={{
                                  width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  cursor: 'pointer', border: '1px solid transparent',
                                  background: item.saved ? 'var(--accent-soft)' : 'var(--bg-inset)',
                                  color: item.saved ? 'var(--accent)' : 'var(--text-muted)',
                                  transition: 'all 0.2s'
                                }}
                              >
                                <Bookmark size={14} fill={item.saved ? 'currentColor' : 'none'} />
                              </button>
                              <button
                                onClick={() => deleteItem(item.id)}
                                style={{
                                  width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  cursor: 'pointer', border: '1px solid transparent',
                                  background: 'var(--red-soft)', color: 'var(--red)',
                                  transition: 'all 0.2s'
                                }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
