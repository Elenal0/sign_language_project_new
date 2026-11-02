import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { Search, X, Volume2, Hand, Info, Film } from 'lucide-react'
import { ISL_SIGNS, CATEGORIES } from '../data/islData'
import PageHeader from '../components/ui/PageHeader'
import { withViewTransition, supportsViewTransitions } from '../lib/motion'

const DIFF_LEVEL = { easy: 1, medium: 2, hard: 3 }

// Letters and numerals read best as the glyph itself; words as their Hindi form.
const isGlyph = (s) => s.category === 'alphabet' || s.category === 'numbers'

function Difficulty({ level }) {
  const n = DIFF_LEVEL[level] || 1
  return (
    <span title={`Difficulty: ${level}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{ display: 'inline-flex', gap: 3 }}>
        {[1, 2, 3].map(k => (
          <span key={k} style={{ width: 5, height: 5, borderRadius: '50%', background: k <= n ? 'var(--accent)' : 'var(--border-strong)' }} />
        ))}
      </span>
      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{level}</span>
    </span>
  )
}

export default function Dictionary() {
  const [search,       setSearch]       = useState('')
  const [activeCat,    setActiveCat]    = useState('all')
  const [selectedSign, setSelectedSign] = useState(null)
  const glyphRefs = useRef({})   // sign.id → card glyph element, for the morph
  const closeBtnRef = useRef(null)

  // Move focus into the sheet without letting the scroll container jump behind it
  useEffect(() => {
    if (selectedSign) closeBtnRef.current?.focus({ preventScroll: true })
  }, [selectedSign])

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

  // Open/close morph the card's glyph into the sheet (View Transitions), or just set state.
  const openSign = useCallback((sign) => {
    const el = glyphRefs.current[sign.id]
    if (!el || !supportsViewTransitions()) return setSelectedSign(sign)
    el.style.viewTransitionName = 'sign-glyph'
    withViewTransition(() => {
      el.style.viewTransitionName = ''
      setSelectedSign(sign)
    }, 'modal')
  }, [])

  const closeSign = useCallback(() => {
    const el = selectedSign && glyphRefs.current[selectedSign.id]
    if (!el || !supportsViewTransitions()) return setSelectedSign(null)
    const t = withViewTransition(() => {
      setSelectedSign(null)
      el.style.viewTransitionName = 'sign-glyph'
    }, 'modal')
    t?.finished.finally(() => { el.style.viewTransitionName = '' })
  }, [selectedSign])

  useEffect(() => {
    if (!selectedSign) return
    const onKey = (e) => { if (e.key === 'Escape') closeSign() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedSign, closeSign])

  return (
    <div className="page">
      <PageHeader
        eyebrow={`Library · ${ISL_SIGNS.length} signs`}
        title={<>The <em>dictionary</em></>}
        deva="शब्दकोश"
        sub="Every sign with its Hindi equivalent and a plain-language description of how to form it."
        actions={
          <div style={{ position: 'relative', width: 'min(320px, 100%)' }}>
            <Search size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)', pointerEvents: 'none' }} />
            <input
              type="text"
              className="input-field"
              placeholder="Search in English or हिंदी"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 38, paddingRight: search ? 36 : 12, height: 44 }}
            />
            {search && (
              <button onClick={() => setSearch('')} className="icon-btn enter-scale" aria-label="Clear search"
                style={{ position: 'absolute', right: 5, top: 5, width: 34, height: 34 }}>
                <X size={14} />
              </button>
            )}
          </div>
        }
      />

      {/* Categories */}
      <div className="no-scrollbar stagger stagger--fade" style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 28, '--stagger': '40ms', '--stagger-base': '120ms' }}>
        {CATEGORIES.map(cat => (
          <button key={cat.id} className="chip" data-active={activeCat === cat.id} onClick={() => setActiveCat(cat.id)}>
            {cat.label}
            <span className="mono" style={{ fontSize: '0.66rem', opacity: 0.6 }}>{cat.count}</span>
          </button>
        ))}
      </div>

      {/* Grid — re-keyed on filter change so the stagger replays */}
      <div
        key={activeCat + (search ? '-q' : '')}
        className="stagger"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(176px, 1fr))', gap: 12, '--stagger': '28ms' }}
      >
        {filtered.length > 0 ? filtered.map(sign => (
          <button
            key={sign.id}
            onClick={() => openSign(sign)}
            className="dict-card spotlight lift"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <span className="mono" style={{ fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-faint)' }}>
                {sign.category}
              </span>
              <span
                role="button"
                tabIndex={0}
                onClick={e => { e.stopPropagation(); speak(sign.name) }}
                onKeyDown={e => { if (e.key === 'Enter') { e.stopPropagation(); speak(sign.name) } }}
                className="dict-speak"
                aria-label={`Pronounce ${sign.name}`}
              >
                <Volume2 size={13} />
              </span>
            </div>

            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 0', minHeight: 92 }}>
              <span ref={el => { glyphRefs.current[sign.id] = el }} className="dict-glyph">
                {isGlyph(sign) ? (
                  <span style={{ fontFamily: 'var(--font-serif)', fontSize: '4.4rem', lineHeight: 1, color: 'var(--text-primary)' }}>{sign.name}</span>
                ) : (
                  <span className="deva" style={{ fontSize: sign.hindi.length > 8 ? '1.4rem' : '2rem', lineHeight: 1.2, color: 'var(--text-primary)', textAlign: 'center', display: 'block' }}>{sign.hindi}</span>
                )}
              </span>
            </div>

            <div style={{ width: '100%', borderTop: '1px solid var(--border)', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {isGlyph(sign) ? <span className="deva" style={{ color: 'var(--text-secondary)' }}>{sign.hindi}</span> : sign.name}
              </span>
              <Difficulty level={sign.difficulty} />
            </div>
          </button>
        )) : (
          <div className="enter" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '5rem 2rem' }}>
            <p className="display" style={{ fontSize: '2.2rem' }}>Nothing matches “{search}”.</p>
            <p style={{ color: 'var(--text-muted)', marginTop: 10 }}>Try another spelling, or search in Hindi.</p>
            <button className="btn-secondary" style={{ marginTop: 20 }} onClick={() => { setSearch(''); setActiveCat('all') }}>Clear filters</button>
          </div>
        )}
      </div>

      {/* Detail sheet */}
      {selectedSign && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div
            className="backdrop"
            onClick={closeSign}
            style={{ position: 'absolute', inset: 0, background: 'rgba(8,7,6,0.6)', backdropFilter: 'blur(8px)', viewTransitionName: 'sign-backdrop' }}
          />
          <div
            role="dialog" aria-modal="true" aria-label={selectedSign.name}
            className="glass-card dict-modal sheet"
            style={{ viewTransitionName: 'sign-sheet' }}
          >
            {/* Glyph side */}
            <div className="stage" style={{ borderRadius: 0, border: 0, boxShadow: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32, minHeight: 280 }}>
              <span style={{ viewTransitionName: 'sign-glyph' }}>
                {isGlyph(selectedSign)
                  ? <span style={{ fontFamily: 'var(--font-serif)', fontSize: '9rem', lineHeight: 1, color: 'var(--stage-text)', display: 'block' }}>{selectedSign.name}</span>
                  : <span className="deva" style={{ fontSize: '2.8rem', color: 'var(--stage-text)', textAlign: 'center', display: 'block' }}>{selectedSign.hindi}</span>}
              </span>
              <span className="stage-chip enter-fade" style={{ position: 'absolute', bottom: 16, left: 16, color: 'var(--stage-muted)', '--d': 300 }}>
                <Film size={12} /> Video demo coming soon
              </span>
            </div>

            {/* Details */}
            <div className="stagger" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 20, '--stagger-base': '140ms', '--stagger': '60ms' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div>
                  <span className="eyebrow">{selectedSign.category}</span>
                  <h2 className="display" style={{ fontSize: '2.8rem', marginTop: 12 }}>{selectedSign.name}</h2>
                  {selectedSign.hindi && <p className="deva" style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginTop: 6 }}>{selectedSign.hindi}</p>}
                </div>
                <button ref={closeBtnRef} onClick={closeSign} className="icon-btn" aria-label="Close"><X size={16} /></button>
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <span className="badge"><Difficulty level={selectedSign.difficulty} /></span>
                {selectedSign.hands && (
                  <span className="badge"><Hand size={11} /> {selectedSign.hands === 'one' ? 'One hand' : 'Two hands'}</span>
                )}
              </div>

              {selectedSign.description && (
                <div>
                  <p className="section-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Info size={12} /> How to sign</p>
                  <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{selectedSign.description}</p>
                </div>
              )}

              <button onClick={() => speak(selectedSign.name)} className="btn-secondary" style={{ marginTop: 'auto', alignSelf: 'flex-start' }}>
                <Volume2 size={15} /> Pronounce
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .dict-card {
          display: flex; flex-direction: column; align-items: stretch; text-align: left; min-height: 210px;
          padding: 14px 16px 14px; border-radius: var(--r-lg);
          background: var(--bg-panel); border: 1px solid var(--border); color: inherit;
        }
        .dict-card:hover { border-color: var(--border-strong); box-shadow: var(--shadow-md); }
        .dict-glyph { display: inline-block; transition: transform 600ms var(--ease-out); }
        .dict-card:hover .dict-glyph { transform: scale(1.08) rotate(-2deg); }
        .dict-speak {
          width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center;
          color: var(--text-faint); opacity: 0; transform: scale(0.8);
          transition: opacity var(--dur-sm) ease, transform var(--dur-md) var(--ease-spring), color var(--dur-sm) ease, background var(--dur-sm) ease;
        }
        .dict-card:hover .dict-speak, .dict-speak:focus-visible { opacity: 1; transform: scale(1); }
        .dict-speak:hover { color: var(--accent); background: var(--accent-soft); }
        .dict-speak:active { transform: scale(0.88); }
        .dict-modal {
          position: relative; z-index: 101; width: 100%; max-width: 760px; overflow: hidden;
          display: grid; grid-template-columns: 1fr 1.15fr;
        }
        @media (hover: none) { .dict-speak { opacity: 1; transform: none; } }
        @media (max-width: 680px) { .dict-modal { grid-template-columns: 1fr; max-height: 90vh; overflow-y: auto; } }
      `}</style>
    </div>
  )
}
