import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Video, VideoOff, RotateCcw, Copy, Save, Volume2, VolumeX,
  CheckCircle2, AlertCircle, Info, Wifi, WifiOff, Zap
} from 'lucide-react'
import { useWebcam } from '../hooks/useWebcam'
import { useApp } from '../context/AppContext'

const MIN_CONFIDENCE = 0.60  // threshold below which we don't append to sentence

export default function Translator() {
  const { videoRef, canvasRef, isActive, error, fps, prediction, backendReady, start, stop, stopDetection } = useWebcam()
  const { addToHistory, showToast } = useApp()

  const [sentence,   setSentence]   = useState([])   // [{ word, confidence }]
  const [language,   setLanguage]   = useState('en')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [lastWord,   setLastWord]   = useState('')
  const [holdCount,  setHoldCount]  = useState(0)

  const HOLD_FRAMES = 8  // sign must appear for ~0.8s at 10fps before appending

  // Append sign to sentence after it's held for HOLD_FRAMES
  useEffect(() => {
    if (!prediction || !prediction.hand_detected) {
      setHoldCount(0)
      return
    }
    const { sign, confidence } = prediction
    if (confidence < MIN_CONFIDENCE || sign === lastWord) {
      setHoldCount(0)
      return
    }
    setHoldCount(prev => {
      const next = prev + 1
      if (next >= HOLD_FRAMES) {
        setSentence(s => [...s, { word: sign, confidence }])
        setLastWord(sign)
        return 0
      }
      return next
    })
  }, [prediction, lastWord])

  const getText = () => sentence.map(s => s.word).join(' ')

  const handleStart = useCallback(async () => {
    setLastWord('')
    setHoldCount(0)
    await start()
  }, [start])

  const handleStop  = useCallback(() => stop(), [stop])
  const handleReset = useCallback(() => { setSentence([]); setLastWord(''); setHoldCount(0) }, [])
  const handleCopy  = () => navigator.clipboard.writeText(getText()).then(() => showToast('Copied!', 'success'))

  const handleSave = () => {
    if (!sentence.length) return showToast('Nothing to save yet', 'error')
    const avgConf = sentence.reduce((a, s) => a + s.confidence, 0) / sentence.length
    addToHistory({
      sentence: getText(),
      words: sentence.map(s => s.word),
      lang: language,
      confidence: avgConf,
    })
    showToast('Saved to history', 'success')
  }

  const handleSpeak = () => {
    if (!getText() || isSpeaking) return
    const u = new SpeechSynthesisUtterance(getText())
    u.lang    = language === 'en' ? 'en-IN' : 'hi-IN'
    u.onstart = () => setIsSpeaking(true)
    u.onend   = () => setIsSpeaking(false)
    speechSynthesis.speak(u)
  }

  useEffect(() => () => { stop(); stopDetection() }, [stop, stopDetection])

  const pct       = prediction ? Math.round(prediction.confidence * 100) : 0
  const confColor = pct >= 90 ? '#4ade80' : pct >= 75 ? '#facc15' : '#f87171'
  const radius    = 28
  const circ      = 2 * Math.PI * radius

  return (
    <div style={{ padding: '1.25rem', minHeight: '100%' }}>

      {/* Backend status banner */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 14px', borderRadius: 10, marginBottom: 16, fontSize: '0.75rem',
        background: backendReady ? 'rgba(74,222,128,0.06)' : 'rgba(248,113,113,0.06)',
        border: `1px solid ${backendReady ? 'rgba(74,222,128,0.2)' : 'rgba(248,113,113,0.2)'}`,
        color: '#64748b',
      }}>
        {backendReady
          ? <Wifi size={13} style={{ color: '#4ade80', flexShrink: 0 }} />
          : <WifiOff size={13} style={{ color: '#f87171', flexShrink: 0 }} />
        }
        {backendReady
          ? <span>SanketSetu backend connected — real-time ML inference active.</span>
          : <span>Backend offline. Start the server: <code style={{ color: '#f87171', background: 'rgba(248,113,113,0.1)', padding: '1px 6px', borderRadius: 4 }}>uvicorn api.server:app --reload --port 8000</code></span>
        }
      </div>

      <div style={{ display: 'grid', gap: 16 }} className="lg:!grid-cols-[3fr_2fr]">

        {/* ── LEFT : Camera ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Camera feed */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ position: 'relative', aspectRatio: '16/9', background: '#06060b' }}>
              <video ref={videoRef} autoPlay playsInline muted
                style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
              <canvas ref={canvasRef}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', transform: 'scaleX(-1)', pointerEvents: 'none' }} />

              {/* Idle overlay */}
              {!isActive && !error && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#06060b', gap: 12 }}>
                  <div style={{ width: 64, height: 64, borderRadius: 16, background: '#161622', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Video size={26} style={{ color: '#475569' }} />
                  </div>
                  <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Camera off — click <strong style={{ color: '#94a3b8' }}>Start Camera</strong> below</p>
                </div>
              )}

              {/* LIVE badge */}
              {isActive && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{ position: 'absolute', top: 12, left: 12, display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', padding: '5px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)' }}>
                  <span style={{ position: 'relative', width: 8, height: 8 }}>
                    <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#ef4444', opacity: 0.75, animation: 'ping 1.5s ease-out infinite' }} />
                    <span style={{ position: 'relative', display: 'block', width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
                  </span>
                  <span style={{ fontSize: '0.7rem', color: '#f87171', fontWeight: 600 }}>LIVE</span>
                  <span style={{ fontSize: '0.7rem', color: '#475569', fontFamily: 'monospace' }}>{fps} fps</span>
                  {prediction?.inference_ms && (
                    <span style={{ fontSize: '0.7rem', color: '#475569', fontFamily: 'monospace' }}>{prediction.inference_ms}ms</span>
                  )}
                </motion.div>
              )}

              {/* Error overlay */}
              {error && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(6,6,11,0.9)' }}>
                  <div style={{ textAlign: 'center' }}>
                    <AlertCircle size={32} style={{ color: '#f87171', margin: '0 auto 8px' }} />
                    <p style={{ color: '#f87171', fontSize: '0.875rem', fontWeight: 500 }}>Camera Error</p>
                    <p style={{ color: '#64748b', fontSize: '0.75rem', marginTop: 4 }}>{error}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Controls bar */}
          <div className="card" style={{ padding: '0.875rem 1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              {!isActive ? (
                <motion.button whileHover={{ scale: 1.03, boxShadow: '0 0 18px rgba(0,196,204,0.4)' }} whileTap={{ scale: 0.97 }}
                  onClick={handleStart} className="btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 0 10px rgba(0,196,204,0.25)' }}
                  disabled={!backendReady}>
                  <Video size={15} /> {backendReady ? 'Start Camera' : 'Backend Offline'}
                </motion.button>
              ) : (
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleStop}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', padding: '0.55rem 1.1rem', borderRadius: 10, fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' }}>
                  <VideoOff size={15} /> Stop
                </motion.button>
              )}

              <button onClick={handleReset} className="btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <RotateCcw size={13} /> Reset
              </button>

              {/* Language toggle */}
              <div style={{ display: 'flex', gap: 4, background: '#161622', borderRadius: 10, padding: 3, border: '1px solid rgba(255,255,255,0.06)', marginLeft: 'auto' }}>
                {['en', 'hi'].map(l => (
                  <button key={l} onClick={() => setLanguage(l)}
                    style={{ padding: '5px 12px', borderRadius: 7, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'all 0.18s', background: language === l ? '#00c4cc' : 'transparent', color: language === l ? '#0a0a12' : '#64748b' }}>
                    {l === 'en' ? '🇬🇧 EN' : '🇮🇳 HI'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT : Results ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Current sign + confidence ring */}
          <div className="card">
            <p style={{ fontSize: '0.7rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Current Detection</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              {/* SVG ring */}
              <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
                <svg width="72" height="72" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="36" cy="36" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
                  <circle cx="36" cy="36" r={radius} fill="none"
                    stroke={prediction?.hand_detected ? confColor : '#334155'}
                    strokeWidth="5" strokeLinecap="round"
                    strokeDasharray={circ}
                    strokeDashoffset={circ - (circ * pct) / 100}
                    style={{ transition: 'stroke-dashoffset 0.3s ease, stroke 0.3s ease' }} />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: prediction?.hand_detected ? confColor : '#334155' }}>{pct}%</span>
                </div>
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <AnimatePresence mode="wait">
                  <motion.p key={prediction?.sign || 'idle'}
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18 }}
                    style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f1f5f9', lineHeight: 1.1 }}>
                    {prediction?.hand_detected ? prediction.sign : '—'}
                  </motion.p>
                </AnimatePresence>
                <p style={{ fontSize: '0.7rem', color: '#475569', marginTop: 4 }}>
                  {prediction?.hand_detected ? `Detected · ${prediction.inference_ms ?? '—'}ms` : 'No hand in frame'}
                </p>
              </div>
            </div>

            {/* Hold progress bar */}
            {prediction?.hand_detected && holdCount > 0 && (
              <div style={{ marginTop: 12 }}>
                <p style={{ fontSize: '0.65rem', color: '#475569', marginBottom: 4 }}>Holding…</p>
                <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                  <motion.div animate={{ width: `${(holdCount / HOLD_FRAMES) * 100}%` }}
                    style={{ height: '100%', background: '#00c4cc', borderRadius: 2 }} />
                </div>
              </div>
            )}
          </div>

          {/* Sentence builder */}
          <div className="card" style={{ flex: 1 }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Sentence Builder</p>
            <div style={{ minHeight: 80, padding: '0.75rem', background: '#06060b', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)', marginBottom: 12 }}>
              {sentence.length === 0
                ? <p style={{ color: '#334155', fontSize: '0.875rem' }}>Translated words appear here…</p>
                : <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    <AnimatePresence>
                      {sentence.map((s, i) => (
                        <motion.span key={i}
                          initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                          style={{ padding: '3px 10px', borderRadius: 6, fontSize: '0.85rem', fontWeight: 600, background: 'rgba(0,196,204,0.1)', border: '1px solid rgba(0,196,204,0.2)', color: '#00c4cc' }}>
                          {s.word}
                        </motion.span>
                      ))}
                    </AnimatePresence>
                  </div>
              }
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={handleCopy} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem' }} disabled={!sentence.length}>
                <Copy size={13} /> Copy
              </button>
              <button onClick={handleSave} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem' }} disabled={!sentence.length}>
                <Save size={13} /> Save
              </button>
              <button onClick={handleSpeak}
                style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', background: isSpeaking ? 'rgba(0,196,204,0.15)' : 'rgba(255,255,255,0.04)', color: isSpeaking ? '#00c4cc' : '#64748b', border: `1px solid ${isSpeaking ? 'rgba(0,196,204,0.3)' : 'rgba(255,255,255,0.08)'}`, padding: '0.45rem 0.8rem', borderRadius: 8, cursor: 'pointer' }}
                disabled={!sentence.length}>
                {isSpeaking ? <VolumeX size={13} /> : <Volume2 size={13} />} Speak
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}