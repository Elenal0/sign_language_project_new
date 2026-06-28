import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Hand, ArrowRight, RotateCcw, Trophy, CheckCircle2, XCircle, Flame } from 'lucide-react'

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
            background: ['var(--accent)', 'var(--blue)', 'var(--pink)', 'var(--yellow)', 'var(--green)'][Math.floor(Math.random() * 5)],
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

  return (
    <div style={{ padding: '1.5rem', minHeight: '100%', maxWidth: 800, margin: '0 auto' }}>
      
      {quizComplete && score >= Math.floor(ISL_SIGNS.length * 0.7) && <Confetti />}

      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>Learning Center</h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Master ISL signs supported by the AI model.</p>
        </div>

        <div style={{ display: 'flex', gap: 4, background: 'var(--bg-inset)', padding: 4, borderRadius: 12, border: '1px solid var(--border)' }}>
          {['flashcard', 'quiz'].map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setCurrentIndex(0); setFlipped(false); setQuizComplete(false); setScore(0); setStreak(0); }}
              style={{
                padding: '6px 16px', borderRadius: 8, fontSize: '0.8rem', fontWeight: 600,
                textTransform: 'capitalize', cursor: 'pointer', border: 'none',
                background: mode === m ? 'var(--bg-elevated)' : 'transparent',
                color: mode === m ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: mode === m ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6 }}>
          <span>Progress</span>
          <span style={{ fontWeight: 600, color: 'var(--accent)' }}>{Math.round(progress)}%</span>
        </div>
        <div style={{ height: 4, background: 'var(--bg-inset)', borderRadius: 2, overflow: 'hidden' }}>
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
            style={{ height: '100%', background: 'linear-gradient(90deg, var(--accent), var(--blue))', borderRadius: 2 }}
          />
        </div>
      </div>

      {/* ── Flashcard Mode ── */}
      {mode === 'flashcard' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
          
          <div style={{ perspective: 1000, width: '100%', maxWidth: 400, aspectRatio: '3/4' }}>
            <motion.div
              animate={{ rotateY: flipped ? 180 : 0 }}
              transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
              onClick={() => setFlipped(!flipped)}
              style={{ width: '100%', height: '100%', position: 'relative', transformStyle: 'preserve-3d', cursor: 'pointer' }}
            >
              {/* Front (Sign) */}
              <div 
                className="card-hover"
                style={{
                  position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  background: 'var(--bg-panel)'
                }}
              >
                <Hand size={80} style={{ color: 'var(--accent-soft)', filter: 'drop-shadow(0 0 16px var(--accent-glow))', marginBottom: 20 }} />
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Tap to reveal</p>
              </div>

              {/* Back (Word) */}
              <div 
                className="card-hover"
                style={{
                  position: 'absolute', inset: 0, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyItems: 'center', justifyContent: 'center',
                  background: 'linear-gradient(135deg, var(--bg-panel), var(--bg-elevated))'
                }}
              >
                <p style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent)', marginBottom: 8 }}>{currentSign.word}</p>
                <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>{currentSign.hindi}</p>
                <span className="badge" style={{ marginTop: 24, background: 'var(--bg-inset)', color: 'var(--text-muted)' }}>
                  {currentSign.category}
                </span>
              </div>
            </motion.div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={prevCard} className="btn-secondary" style={{ padding: '10px 20px' }}>Previous</button>
            <button onClick={nextCard} className="btn-primary" style={{ padding: '10px 24px' }}>Next Sign <ArrowRight size={16} /></button>
          </div>
        </div>
      )}

      {/* ── Quiz Mode ── */}
      {mode === 'quiz' && (
        <AnimatePresence mode="wait">
          {!quizComplete ? (
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}
            >
              <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Question {currentIndex + 1} of {ISL_SIGNS.length}
                </p>
                {streak > 1 && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--yellow)', fontSize: '0.8rem', fontWeight: 700 }}>
                    <Flame size={14} /> {streak} Streak!
                  </motion.div>
                )}
              </div>

              <div className="card" style={{ width: '100%', maxWidth: 400, aspectRatio: '3/2', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <Hand size={60} style={{ color: 'var(--accent-soft)', filter: 'drop-shadow(0 0 12px var(--accent-glow))', marginBottom: 16 }} />
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>What is this sign?</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, width: '100%', maxWidth: 400 }}>
                {options.map((opt, i) => {
                  const isSelected = selected?.id === opt.id
                  const isCorrect = opt.id === currentSign.id
                  
                  let bg = 'var(--bg-panel)'
                  let border = 'var(--border)'
                  let color = 'var(--text-primary)'
                  
                  if (selected) {
                    if (isCorrect) { bg = 'var(--green-soft)'; border = 'var(--green)'; color = 'var(--green)' }
                    else if (isSelected) { bg = 'var(--red-soft)'; border = 'var(--red)'; color = 'var(--red)' }
                    else { opacity: 0.5 }
                  }

                  return (
                    <motion.button
                      key={opt.id}
                      onClick={() => handleQuizAnswer(opt)}
                      whileHover={!selected ? { scale: 1.02, borderColor: 'var(--accent-border)' } : {}}
                      whileTap={!selected ? { scale: 0.98 } : {}}
                      style={{
                        padding: '16px', borderRadius: 12, border: `1px solid ${border}`,
                        background: bg, color, fontSize: '1rem', fontWeight: 600,
                        cursor: selected ? 'default' : 'pointer', transition: 'all 0.2s',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        opacity: selected && !isCorrect && !isSelected ? 0.5 : 1
                      }}
                    >
                      {opt.word}
                      {selected && isCorrect && <CheckCircle2 size={16} />}
                      {selected && isSelected && !isCorrect && <XCircle size={16} />}
                    </motion.button>
                  )
                })}
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card"
              style={{ maxWidth: 400, margin: '0 auto', textAlign: 'center', padding: '3rem 2rem' }}
            >
              <Trophy size={64} style={{ color: 'var(--yellow)', margin: '0 auto 20px', filter: 'drop-shadow(0 0 20px var(--yellow-soft))' }} />
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>Quiz Complete!</h2>
              <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: 24 }}>
                You scored <span className="gradient-text" style={{ fontSize: '1.5rem', fontWeight: 900 }}>{score}</span> out of {ISL_SIGNS.length}
              </p>
              <button onClick={resetQuiz} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
                <RotateCcw size={16} /> Play Again
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      )}

    </div>
  )
}