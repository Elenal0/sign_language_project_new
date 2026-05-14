import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, Zap, ChevronLeft, ChevronRight, CheckCircle2, XCircle, GraduationCap, RotateCcw, Trophy } from 'lucide-react'

// ── ISL Signs dataset ─────────────────────────────────────────────────────────
const ISL_SIGNS = [
  { id: 1,  name: 'Hello',      hindi: 'नमस्ते',    category: 'words',    difficulty: 'easy',   description: 'Wave hand with open palm facing outward.' },
  { id: 2,  name: 'Thank You',  hindi: 'धन्यवाद',   category: 'words',    difficulty: 'easy',   description: 'Touch chin with fingertips then move hand forward.' },
  { id: 3,  name: 'How',        hindi: 'कैसे',      category: 'phrases',  difficulty: 'easy',   description: 'Both hands curve upward, palms facing up.' },
  { id: 4,  name: 'I',          hindi: 'मैं',        category: 'words',    difficulty: 'easy',   description: 'Point index finger to your chest.' },
  { id: 5,  name: 'You',        hindi: 'तुम',        category: 'words',    difficulty: 'easy',   description: 'Point index finger toward the person.' },
  { id: 6,  name: 'Meet',       hindi: 'मिलना',     category: 'words',    difficulty: 'easy',   description: 'Both index fingers come together.' },
  { id: 7,  name: 'Going',      hindi: 'जा रहा',    category: 'words',    difficulty: 'easy',   description: 'Point forward and move hand in that direction.' },
  { id: 8,  name: 'Nice',       hindi: 'अच्छा',     category: 'words',    difficulty: 'easy',   description: 'Open hand moves forward from chin.' },
  { id: 9,  name: 'School',     hindi: 'स्कूल',     category: 'words',    difficulty: 'easy',   description: 'Clap hands twice together in front of chest.' },
  { id: 10, name: 'A',          hindi: 'अ',          category: 'alphabet', difficulty: 'easy',   description: 'Closed fist with thumb to the side.' },
  { id: 11, name: 'B',          hindi: 'ब',          category: 'alphabet', difficulty: 'easy',   description: 'Four fingers up, thumb tucked in palm.' },
  { id: 12, name: 'C',          hindi: 'क',          category: 'alphabet', difficulty: 'easy',   description: 'Curved hand forming letter C shape.' },
  { id: 13, name: 'One',        hindi: 'एक',         category: 'numbers',  difficulty: 'easy',   description: 'Index finger pointing up.' },
  { id: 14, name: 'Two',        hindi: 'दो',         category: 'numbers',  difficulty: 'easy',   description: 'Index and middle fingers extended up.' },
  { id: 15, name: 'Three',      hindi: 'तीन',        category: 'numbers',  difficulty: 'easy',   description: 'Thumb, index and middle fingers extended.' },
  { id: 16, name: 'Good Morning',hindi: 'सुप्रभात',  category: 'phrases',  difficulty: 'easy',   description: 'Wave then show sun rising gesture.' },
  { id: 17, name: 'Please',     hindi: 'कृपया',     category: 'phrases',  difficulty: 'easy',   description: 'Flat hand circles clockwise on chest.' },
  { id: 18, name: 'Sorry',      hindi: 'माफ करें', category: 'phrases',  difficulty: 'easy',   description: 'Fist circles over chest.' },
]

// ── Flashcard component ───────────────────────────────────────────────────────
function FlashcardMode({ signs }) {
  const [idx, setIdx]       = useState(0)
  const [flipped, setFlip]  = useState(false)
  const [known, setKnown]   = useState(new Set())

  const sign     = signs[idx] || signs[0]
  const progress = ((idx + 1) / signs.length) * 100

  const next = () => { setFlip(false); setTimeout(() => setIdx(i => (i + 1) % signs.length), 150) }
  const prev = () => { setFlip(false); setTimeout(() => setIdx(i => (i - 1 + signs.length) % signs.length), 150) }

  return (
    <div>
      {/* Progress */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Card {idx + 1} of {signs.length}</span>
        <span style={{ fontSize: '0.75rem', color: '#4ade80' }}>✓ {known.size} known</span>
      </div>
      <div style={{ height: 4, background: '#1e293b', borderRadius: 9999, marginBottom: 20, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #00c4cc, #4ade80)', borderRadius: 9999, transition: 'width 0.3s ease' }} />
      </div>

      {/* Flip card */}
      <motion.div
        onClick={() => setFlip(f => !f)}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{ cursor: 'pointer', perspective: 1000, minHeight: 200, position: 'relative', transformStyle: 'preserve-3d' }}>

        {/* Front */}
        <div style={{
          position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
          background: '#0d1117', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 16, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 10, padding: '2rem'
        }}>
          <span style={{ fontSize: '0.7rem', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{sign.category}</span>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#f1f5f9', textAlign: 'center' }}>{sign.name}</h2>
          <p style={{ fontSize: '1.2rem', color: '#64748b' }}>{sign.hindi}</p>
          <span style={{ fontSize: '0.72rem', color: '#334155', marginTop: 8 }}>Tap to reveal gesture</span>
        </div>

        {/* Back */}
        <div style={{
          position: 'absolute', inset: 0, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)',
          background: 'rgba(0,196,204,0.05)', border: '1px solid rgba(0,196,204,0.2)',
          borderRadius: 16, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 10, padding: '2rem'
        }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#00c4cc', textAlign: 'center' }}>{sign.name}</h2>
          <p style={{ fontSize: '0.9rem', color: '#94a3b8', textAlign: 'center', maxWidth: 280, lineHeight: 1.6 }}>{sign.description}</p>
          <span style={{ fontSize: '0.8rem', color: '#64748b', padding: '4px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 9999 }}>{sign.difficulty}</span>
        </div>
      </motion.div>

      {/* Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 20 }}>
        <button onClick={prev}
          style={{ padding: '8px 16px', borderRadius: 10, background: '#161622', border: '1px solid rgba(255,255,255,0.06)', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.8rem' }}>
          <ChevronLeft size={14} /> Prev
        </button>

        <button
          onClick={() => {
            setKnown(k => { const n = new Set(k); n.has(sign.id) ? n.delete(sign.id) : n.add(sign.id); return n })
            next()
          }}
          style={{
            padding: '8px 20px', borderRadius: 10, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
            background: known.has(sign.id) ? 'rgba(74,222,128,0.15)' : 'rgba(0,196,204,0.12)',
            border: `1px solid ${known.has(sign.id) ? 'rgba(74,222,128,0.3)' : 'rgba(0,196,204,0.25)'}`,
            color: known.has(sign.id) ? '#4ade80' : '#00c4cc'
          }}>
          {known.has(sign.id) ? '✓ Known' : 'Mark Known'}
        </button>

        <button onClick={next}
          style={{ padding: '8px 16px', borderRadius: 10, background: '#161622', border: '1px solid rgba(255,255,255,0.06)', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.8rem' }}>
          Next <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}

// ── Quiz component ────────────────────────────────────────────────────────────
function QuizMode({ signs }) {
  const [qIdx, setQIdx]       = useState(0)
  const [score, setScore]     = useState(0)
  const [chosen, setChosen]   = useState(null)
  const [showResult, setShow] = useState(false)
  const [done, setDone]       = useState(false)
  const [questions]           = useState(() => {
    const shuffled = [...signs].sort(() => Math.random() - 0.5).slice(0, Math.min(10, signs.length))
    return shuffled.map(correct => {
      const wrong = signs.filter(s => s.id !== correct.id).sort(() => Math.random() - 0.5).slice(0, 3)
      const opts  = [...wrong, correct].sort(() => Math.random() - 0.5)
      return { correct, options: opts }
    })
  })

  const total = questions.length
  if (!total) return <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>Not enough signs to quiz.</p>

  const q = questions[qIdx]

  if (done) {
    const pct = Math.round((score / total) * 100)
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        style={{ textAlign: 'center', padding: '2rem' }}>
        <Trophy size={48} style={{ margin: '0 auto 16px', color: '#facc15' }} />
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f1f5f9', marginBottom: 6 }}>Quiz Complete!</h2>
        <p style={{ color: '#64748b', marginBottom: 20 }}>{score} / {total} correct · {pct}%</p>
        <div style={{ height: 8, background: '#1e293b', borderRadius: 9999, marginBottom: 24, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, borderRadius: 9999, transition: 'width 0.8s ease',
            background: pct >= 70 ? '#4ade80' : pct >= 40 ? '#facc15' : '#f87171' }} />
        </div>
        <button
          onClick={() => { setQIdx(0); setScore(0); setChosen(null); setShow(false); setDone(false) }}
          style={{ padding: '10px 28px', borderRadius: 10, background: '#00c4cc', color: '#0a0a12', fontWeight: 700, cursor: 'pointer', border: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <RotateCcw size={14} /> Try Again
        </button>
      </motion.div>
    )
  }

  const handleAnswer = (opt) => {
    if (chosen) return
    setChosen(opt)
    setShow(true)
    if (opt.id === q.correct.id) setScore(s => s + 1)
    setTimeout(() => {
      if (qIdx + 1 >= total) setDone(true)
      else { setQIdx(i => i + 1); setChosen(null); setShow(false) }
    }, 1200)
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Question {qIdx + 1} of {total}</span>
        <span style={{ fontSize: '0.75rem', color: '#4ade80' }}>Score: {score}</span>
      </div>
      <div style={{ height: 4, background: '#1e293b', borderRadius: 9999, marginBottom: 20, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${(qIdx / total) * 100}%`, background: '#00c4cc', borderRadius: 9999, transition: 'width 0.3s ease' }} />
      </div>

      <p style={{ fontSize: '0.8rem', color: '#475569', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>What sign is this?</p>
      <div style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '1.5rem', marginBottom: 16, textAlign: 'center' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#f1f5f9' }}>{q.correct.hindi}</h2>
        <p style={{ fontSize: '0.75rem', color: '#334155', marginTop: 6 }}>{q.correct.description}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {q.options.map(opt => {
          const isCorrect = opt.id === q.correct.id
          const isChosen  = chosen?.id === opt.id
          let bg     = '#161622'
          let border = 'rgba(255,255,255,0.06)'
          let color  = '#94a3b8'
          if (showResult && isCorrect)        { bg = 'rgba(74,222,128,0.12)';  border = 'rgba(74,222,128,0.4)';  color = '#4ade80' }
          else if (showResult && isChosen)    { bg = 'rgba(248,113,113,0.12)'; border = 'rgba(248,113,113,0.4)'; color = '#f87171' }

          return (
            <motion.button key={opt.id}
              whileHover={!chosen ? { scale: 1.02 } : {}}
              whileTap={!chosen ? { scale: 0.97 } : {}}
              onClick={() => handleAnswer(opt)}
              style={{ padding: '12px 16px', borderRadius: 12, background: bg, border: `1px solid ${border}`, cursor: chosen ? 'default' : 'pointer', textAlign: 'left', transition: 'all 0.18s' }}>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color, marginBottom: 2 }}>{opt.name}</p>
              <p style={{ fontSize: '0.72rem', color: '#475569' }}>{opt.hindi}</p>
              {showResult && isCorrect && <CheckCircle2 size={14} style={{ color: '#4ade80', marginTop: 4 }} />}
              {showResult && isChosen && !isCorrect && <XCircle size={14} style={{ color: '#f87171', marginTop: 4 }} />}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

// ── Main Learn page ───────────────────────────────────────────────────────────
const FILTERS = [
  { id: 'all',      label: 'All' },
  { id: 'alphabet', label: 'Alphabet' },
  { id: 'numbers',  label: 'Numbers' },
  { id: 'words',    label: 'Words' },
  { id: 'phrases',  label: 'Phrases' },
  { id: 'easy',     label: '🟢 Easy only', filter: s => s.difficulty === 'easy' },
]

export default function Learn() {
  const [mode, setMode]       = useState('flashcard')
  const [catFilter, setCat]   = useState('all')
  const [quizKey, setQuizKey] = useState(0)

  const signs = useMemo(() => {
    const f = FILTERS.find(f => f.id === catFilter)
    if (!f) return ISL_SIGNS
    if (f.filter) return ISL_SIGNS.filter(f.filter)
    if (catFilter === 'all') return ISL_SIGNS
    return ISL_SIGNS.filter(s => s.category === catFilter)
  }, [catFilter])

  return (
    <div style={{ padding: '1.25rem', minHeight: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(250,204,21,0.1)', border: '1px solid rgba(250,204,21,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <GraduationCap size={18} style={{ color: '#facc15' }} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f1f5f9' }}>Learning Mode</h1>
          <p style={{ fontSize: '0.75rem', color: '#475569' }}>Flashcards · Quiz · {signs.length} signs loaded</p>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {/* Mode tabs */}
        <div style={{ display: 'flex', gap: 4, background: '#161622', borderRadius: 10, padding: 3, border: '1px solid rgba(255,255,255,0.06)' }}>
          {[['flashcard', BookOpen, 'Flashcards'], ['quiz', Zap, 'Quiz']].map(([id, Icon, label]) => (
            <button key={id} onClick={() => { setMode(id); setQuizKey(k => k + 1) }}
              style={{ padding: '6px 14px', borderRadius: 7, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'all 0.18s', display: 'flex', alignItems: 'center', gap: 5, background: mode === id ? '#00c4cc' : 'transparent', color: mode === id ? '#0a0a12' : '#64748b' }}>
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>

        {/* Category filters */}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {FILTERS.map(f => (
            <button key={f.id} onClick={() => { setCat(f.id); setQuizKey(k => k + 1) }}
              style={{
                padding: '5px 12px',
                borderRadius: 9999,
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.18s',
                background: catFilter === f.id ? 'rgba(0,196,204,0.15)' : '#161622',
                color: catFilter === f.id ? '#00c4cc' : '#64748b',
                border: catFilter === f.id ? '1px solid rgba(0,196,204,0.3)' : '1px solid rgba(255,255,255,0.05)'
              }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <AnimatePresence mode="wait">
          <motion.div key={mode + catFilter + quizKey}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}>
            {mode === 'flashcard'
              ? <FlashcardMode signs={signs} />
              : <QuizMode key={quizKey} signs={signs} />
            }
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}