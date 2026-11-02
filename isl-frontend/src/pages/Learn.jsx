import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, RotateCcw, Trophy, CheckCircle2, XCircle, Flame } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import Segmented from '../components/ui/Segmented'
import HandLandmarks from '../components/ui/HandLandmarks'

// Only words that our ML model supports
const ISL_SIGNS = [
  { id: 1, word: 'Hello', hindi: 'नमस्ते', category: 'Greetings' },
  { id: 2, word: 'Thank you', hindi: 'धन्यवाद', category: 'Greetings' },
  { id: 3, word: 'How', hindi: 'कैसे', category: 'Questions' },
  { id: 4, word: 'You', hindi: 'तुम/आप', category: 'Common' },
  { id: 5, word: 'I', hindi: 'मैं', category: 'Common' },
  { id: 6, word: 'Nice', hindi: 'अच्छा', category: 'Common' },
  { id: 7, word: 'Meet', hindi: 'मिलना', category: 'Common' },
  { id: 8, word: 'Going', hindi: 'जा रहा हूँ', category: 'Common' },
  { id: 9, word: 'School', hindi: 'विद्यालय', category: 'Common' },
]

const Confetti = () => {
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 50, overflow: 'hidden' }}>
      {[...Array(40)].map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: Math.random() * 8 + 4,
            height: Math.random() * 8 + 4,
            background: ['var(--accent)', 'var(--text-primary)', 'var(--yellow)', 'var(--green)', 'var(--accent-hover)'][Math.floor(Math.random() * 5)],
            left: `${Math.random() * 100}%`,
            top: -20,
            borderRadius: Math.random() > 0.5 ? '50%' : 2,
            animation: `confetti-fall ${Math.random() * 2 + 2}s linear forwards`,
            animationDelay: `${Math.random() * 0.5}s`,
          }}
        />
      ))}
    </div>
  )
}

export default function Learn() {
  const [mode, setMode] = useState('flashcard') // flashcard | quiz
  const [currentIndex, setCurrentIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  
  // Quiz state
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [quizComplete, setQuizComplete] = useState(false)
  const [options, setOptions] = useState([])
  const [selected, setSelected] = useState(null)

  // Shuffle and generate quiz options
  useEffect(() => {
    if (mode !== 'quiz' || quizComplete) return
    const currentSign = ISL_SIGNS[currentIndex]
    const others = ISL_SIGNS.filter(s => s.id !== currentSign.id)
    const shuffledOthers = others.sort(() => 0.5 - Math.random()).slice(0, 3)
    const mixed = [currentSign, ...shuffledOthers].sort(() => 0.5 - Math.random())
    setOptions(mixed)
    setSelected(null)
  }, [currentIndex, mode, quizComplete])

  const nextCard = () => {
    setFlipped(false)
    setTimeout(() => {
      setCurrentIndex(i => (i + 1) % ISL_SIGNS.length)
    }, 150)
  }

  const prevCard = () => {
    setFlipped(false)
    setTimeout(() => {
      setCurrentIndex(i => (i - 1 + ISL_SIGNS.length) % ISL_SIGNS.length)
    }, 150)
  }

  const handleQuizAnswer = (opt) => {
    if (selected) return // already answered
    setSelected(opt)
    
    const correct = opt.id === ISL_SIGNS[currentIndex].id
    if (correct) {
      setScore(s => s + 1)
      setStreak(s => s + 1)
    } else {
      setStreak(0)
    }

    setTimeout(() => {
      if (currentIndex === ISL_SIGNS.length - 1) {
        setQuizComplete(true)
      } else {
        setCurrentIndex(i => i + 1)
      }
    }, 1200)
  }

  const resetQuiz = () => {
    setCurrentIndex(0)
    setScore(0)
    setStreak(0)
    setQuizComplete(false)
    setSelected(null)
  }

  const currentSign = ISL_SIGNS[currentIndex]
  const progress = ((currentIndex + (quizComplete ? 1 : 0)) / ISL_SIGNS.length) * 100

  const modeOptions = [{ value: 'flashcard', label: 'Flashcards' }, { value: 'quiz', label: 'Quiz' }]
  const switchMode = (m) => { setMode(m); setCurrentIndex(0); setFlipped(false); setQuizComplete(false); setScore(0); setStreak(0); }
  const pad = (n) => String(n).padStart(2, '0')

  return (
    <div className="page" style={{ maxWidth: 980 }}>

      {quizComplete && score >= Math.floor(ISL_SIGNS.length * 0.7) && <Confetti />}

      <PageHeader
        eyebrow={`Practice · ${ISL_SIGNS.length} signs the model knows`}
        title={<>Learn by <em>heart</em></>}
        deva="सीखें"
        sub="Every sign here is one the translator recognises — learn them, then try them on camera."
        actions={<Segmented ariaLabel="Practice mode" value={mode} onChange={switchMode} options={modeOptions} />}
      />

      {/* Progress */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
        <span className="mono" style={{ fontSize: '0.74rem', color: 'var(--text-primary)' }}>
          {pad(Math.min(currentIndex + 1, ISL_SIGNS.length))}<span style={{ color: 'var(--text-faint)' }}> / {pad(ISL_SIGNS.length)}</span>
        </span>
        <div style={{ flex: 1, display: 'flex', gap: 4 }}>
          {ISL_SIGNS.map((s, k) => {
            const done = k < currentIndex || (quizComplete && k <= currentIndex)
            const now = k === currentIndex && !quizComplete
            return (
              <div key={s.id} style={{ flex: 1, height: 3, borderRadius: 3, background: 'var(--border-hover)', overflow: 'hidden' }}>
                <motion.div
                  initial={false}
                  animate={{ width: done ? '100%' : now ? '50%' : '0%' }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  style={{ height: '100%', background: done ? 'var(--text-primary)' : 'var(--accent)' }}
                />
              </div>
            )
          })}
        </div>
        <span className="mono" style={{ fontSize: '0.74rem', color: 'var(--accent)' }}>{Math.round(progress)}%</span>
      </div>

      {/* ── Flashcards ── */}
      {mode === 'flashcard' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28 }}>
          <div style={{ perspective: 1400, width: '100%', maxWidth: 420, aspectRatio: '4 / 5' }}>
            <motion.div
              animate={{ rotateY: flipped ? 180 : 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 24 }}
              onClick={() => setFlipped(!flipped)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setFlipped(f => !f) } }}
              role="button" tabIndex={0} aria-label={flipped ? `${currentSign.word} — click to hide` : 'Reveal the meaning'}
              style={{ width: '100%', height: '100%', position: 'relative', transformStyle: 'preserve-3d', cursor: 'pointer' }}
            >
              {/* Front */}
              <div className="stage" style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 26 }}>
                <span className="mono" style={{ position: 'absolute', top: 22, left: 24, fontSize: '0.66rem', letterSpacing: '0.16em', color: 'var(--stage-muted)' }}>
                  CARD {pad(currentIndex + 1)}
                </span>
                <span className="stage-chip" style={{ position: 'absolute', top: 16, right: 18 }}>{currentSign.category}</span>
                <HandLandmarks key={currentIndex} size={170} color="#F3EFE8" accent="#FF8A4C" />
                <p className="mono" style={{ fontSize: '0.7rem', letterSpacing: '0.18em', color: 'var(--stage-muted)' }}>TAP TO REVEAL</p>
              </div>

              {/* Back */}
              <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 'var(--r-xl)', background: 'var(--bg-panel)', border: '1px solid var(--border-hover)', boxShadow: 'var(--shadow-lg)', padding: 24, textAlign: 'center' }}>
                <span className="eyebrow eyebrow--plain">{currentSign.category}</span>
                <p className="display" style={{ fontSize: 'clamp(3.4rem, 9vw, 5rem)', marginTop: 18 }}>{currentSign.word}</p>
                <p className="deva" style={{ fontSize: '1.6rem', color: 'var(--accent)', marginTop: 10 }}>{currentSign.hindi}</p>
              </div>
            </motion.div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={prevCard} className="btn-secondary btn-lg" aria-label="Previous card"><ArrowLeft size={16} /> Previous</button>
            <button onClick={nextCard} className="btn-primary btn-lg">Next sign <ArrowRight size={16} /></button>
          </div>
        </div>
      )}

      {/* ── Quiz ── */}
      {mode === 'quiz' && (
        <AnimatePresence mode="wait">
          {!quizComplete ? (
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="learn-quiz"
            >
              <div className="stage" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 22, minHeight: 360 }}>
                <span className="mono" style={{ position: 'absolute', top: 22, left: 24, fontSize: '0.66rem', letterSpacing: '0.16em', color: 'var(--stage-muted)' }}>
                  QUESTION {pad(currentIndex + 1)}
                </span>
                <AnimatePresence>
                  {streak > 1 && (
                    <motion.span initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }}
                      className="stage-chip" style={{ position: 'absolute', top: 16, right: 18, color: '#F2C14E' }}>
                      <Flame size={13} /> {streak} in a row
                    </motion.span>
                  )}
                </AnimatePresence>
                <HandLandmarks size={150} color="#F3EFE8" accent="#FF8A4C" />
                <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.7rem', color: 'var(--stage-text)' }}>What is this sign?</p>
              </div>

              <div style={{ display: 'grid', gap: 10, alignContent: 'center' }}>
                {options.map((opt, k) => {
                  const isSelected = selected?.id === opt.id
                  const isCorrect = opt.id === currentSign.id
                  const state = !selected ? 'idle' : isCorrect ? 'correct' : isSelected ? 'wrong' : 'dim'
                  return (
                    <motion.button
                      key={opt.id}
                      onClick={() => handleQuizAnswer(opt)}
                      whileTap={!selected ? { scale: 0.98 } : {}}
                      animate={state === 'wrong' ? { x: [0, -6, 6, -4, 4, 0] } : {}}
                      transition={{ duration: 0.4 }}
                      className="learn-option"
                      data-state={state}
                    >
                      <span className="mono learn-key">{String.fromCharCode(65 + k)}</span>
                      <span style={{ flex: 1, textAlign: 'left' }}>
                        <span style={{ display: 'block', fontSize: '1.05rem', fontWeight: 500 }}>{opt.word}</span>
                        <span className="deva" style={{ fontSize: '0.86rem', opacity: 0.7 }}>{opt.hindi}</span>
                      </span>
                      {state === 'correct' && <CheckCircle2 size={18} />}
                      {state === 'wrong' && <XCircle size={18} />}
                    </motion.button>
                  )
                })}
                <p style={{ fontSize: '0.78rem', color: 'var(--text-faint)', marginTop: 6 }}>
                  Score <span className="mono" style={{ color: 'var(--text-primary)' }}>{score}</span>
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="card"
              style={{ maxWidth: 520, margin: '0 auto', textAlign: 'center', padding: '3.5rem 2.5rem', borderRadius: 'var(--r-xl)' }}
            >
              <Trophy size={28} style={{ color: 'var(--accent)', margin: '0 auto' }} strokeWidth={1.5} />
              <p className="eyebrow eyebrow--plain" style={{ marginTop: 18 }}>Quiz complete</p>
              <p className="display" style={{ fontSize: '6rem', marginTop: 14 }}>
                {score}<span style={{ color: 'var(--text-ghost)' }}>/{ISL_SIGNS.length}</span>
              </p>
              <p style={{ color: 'var(--text-secondary)', marginTop: 10 }}>
                {score === ISL_SIGNS.length ? 'Perfect — every sign, recognised.' : score >= Math.floor(ISL_SIGNS.length * 0.7) ? 'Great work. A couple more rounds and you’ve got them all.' : 'A good start. Flip through the flashcards, then try again.'}
              </p>
              <button onClick={resetQuiz} className="btn-primary btn-lg" style={{ marginTop: 28 }}>
                <RotateCcw size={16} /> Play again
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      <style>{`
        .learn-quiz { display: grid; grid-template-columns: 1.1fr 1fr; gap: 20px; }
        .learn-option {
          display: flex; align-items: center; gap: 14px; width: 100%; padding: 14px 16px; border-radius: 16px; cursor: pointer;
          background: var(--bg-panel); border: 1px solid var(--border-hover); color: var(--text-primary);
          transition: border-color .2s ease, background .2s ease, color .2s ease, opacity .2s ease;
        }
        .learn-option[data-state="idle"]:hover { border-color: var(--text-primary); transform: translateX(4px); }
        .learn-option { transition: border-color .2s ease, background .2s ease, color .2s ease, opacity .3s ease, transform var(--dur-md) var(--ease-out) !important; }
        .learn-option[data-state="correct"] { animation: pop 460ms var(--ease-spring); }
        .learn-option[data-state="idle"]:hover .learn-key { background: var(--text-primary); color: var(--bg-base); border-color: var(--text-primary); }
        .learn-key { transition: all var(--dur-sm) ease; }
        .learn-option[data-state="correct"] { border-color: var(--green); background: var(--green-soft); color: var(--green); cursor: default; }
        .learn-option[data-state="wrong"] { border-color: var(--red); background: var(--red-soft); color: var(--red); cursor: default; }
        .learn-option[data-state="dim"] { opacity: 0.4; cursor: default; }
        .learn-key {
          width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
          font-size: 0.72rem; background: var(--bg-inset); border: 1px solid var(--border); color: var(--text-muted);
        }
        @media (max-width: 760px) { .learn-quiz { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  )
}
