import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import { Video, BookOpen, GraduationCap, BarChart3, ArrowRight, Sparkles, Shield, Zap } from 'lucide-react'

/* ─── Feature cards data ─────────────────────────────────────────────────── */
const FEATURES = [
  {
    icon: Video,
    title: 'Live Translator',
    desc: 'Real-time ISL gesture recognition via webcam — no upload, no cloud.',
    to: '/translate',
    accent: '#7c3aed',
    soft: 'rgba(124,58,237,0.08)',
    border: 'rgba(124,58,237,0.18)',
  },
  {
    icon: BookOpen,
    title: 'Sign Dictionary',
    desc: 'Browse every ISL sign with Hindi translations and visual references.',
    to: '/dictionary',
    accent: '#0891b2',
    soft: 'rgba(8,145,178,0.08)',
    border: 'rgba(8,145,178,0.18)',
  },
  {
    icon: GraduationCap,
    title: 'Learning Mode',
    desc: 'Flashcards and quizzes to sharpen your ISL recognition skills.',
    to: '/learn',
    accent: '#d97706',
    soft: 'rgba(217,119,6,0.08)',
    border: 'rgba(217,119,6,0.18)',
  },
  {
    icon: BarChart3,
    title: 'Analytics',
    desc: 'Confidence trends, per-category accuracy and rich session stats.',
    to: '/dashboard',
    accent: '#db2777',
    soft: 'rgba(219,39,119,0.08)',
    border: 'rgba(219,39,119,0.18)',
  },
]

const STATS = [
  { value: '63M+',  label: 'ISL Users',  sub: 'Native signers in India', color: '#7c3aed' },
  { value: '99.7%', label: 'Accuracy',   sub: 'On validation set',       color: '#0891b2' },
  { value: '<80ms', label: 'Latency',    sub: 'Per frame, on-device',    color: '#d97706' },
  { value: '252',   label: 'Landmarks',  sub: 'MediaPipe features/pred', color: '#db2777' },
]

/* ─── Reusable reveal wrapper ───────────────────────────────────────────── */
function Reveal({ children, delay = 0, y = 32 }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px 0px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.75, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}

/* ─── Decorative floating orb ───────────────────────────────────────────── */
function Orb({ style }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        borderRadius: '50%',
        filter: 'blur(80px)',
        pointerEvents: 'none',
        ...style,
      }}
    />
  )
}

/* ─── Main component ────────────────────────────────────────────────────── */
export default function Home() {
  const videoRef = useRef(null)

  /* Autoplay with browser restriction handling */
  useEffect(() => {
    const vid = videoRef.current
    if (!vid) return
    vid.muted = true
    vid.playsInline = true
    const tryPlay = () => vid.play().catch(() => {})
    tryPlay()
    const onInteract = () => { tryPlay(); window.removeEventListener('pointerdown', onInteract) }
    window.addEventListener('pointerdown', onInteract, { once: true })
    return () => window.removeEventListener('pointerdown', onInteract)
  }, [])

  return (
    <div
      style={{
        background: 'linear-gradient(160deg, #faf8ff 0%, #f0f4ff 40%, #fdf6ff 100%)',
        minHeight: '100%',
        color: '#1e1b4b',
        fontFamily: "'Inter', system-ui, sans-serif",
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Global ambient orbs */}
      <Orb style={{ width: 700, height: 700, top: -200, left: -200, background: 'radial-gradient(circle, rgba(196,181,253,0.35) 0%, transparent 70%)' }} />
      <Orb style={{ width: 500, height: 500, top: 100, right: -150, background: 'radial-gradient(circle, rgba(186,230,255,0.3) 0%, transparent 70%)' }} />
      <Orb style={{ width: 400, height: 400, top: 600, left: '30%', background: 'radial-gradient(circle, rgba(233,213,255,0.25) 0%, transparent 70%)' }} />

      {/* HERO */}
      <section
        style={{
          minHeight: 'calc(100vh - 3.5rem)',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          alignItems: 'center',
          gap: '3rem',
          padding: '5vh 5vw 6vh',
          position: 'relative',
        }}
        className="home-hero-section"
      >
        {/* LEFT: Text */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '620px' }}>

          {/* Eyebrow pill */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            style={{ display: 'inline-flex', alignItems: 'center', width: 'fit-content' }}
          >
            <span
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
                padding: '0.35rem 1rem',
                borderRadius: '9999px',
                background: 'rgba(124,58,237,0.08)',
                border: '1px solid rgba(124,58,237,0.2)',
                color: '#7c3aed',
                fontSize: '0.75rem',
                fontWeight: 600,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              <Sparkles size={12} />
              Drishya Vaani · Indian Sign Language AI
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontSize: 'clamp(2.8rem, 6.5vw, 5.5rem)',
              fontWeight: 300,
              lineHeight: 1.05,
              fontFamily: "'Playfair Display', Georgia, serif",
              letterSpacing: '-0.025em',
              color: '#1e1b4b',
              margin: 0,
            }}
          >
            Limitless
            <br />
            <span
              style={{
                background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 40%, #06b6d4 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              begins.
            </span>
          </motion.h1>

          {/* Subtext */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.45 }}
            style={{
              fontSize: 'clamp(0.95rem, 1.4vw, 1.15rem)',
              lineHeight: 1.75,
              color: '#6b7280',
              maxWidth: '480px',
              margin: 0,
            }}
          >
            {String.fromCharCode(0x26A0)} {/* zero width placeholder for unicode fallback */}
            {'दृश्य वाणी'} bridges the communication gap for{' '}
            <em style={{ color: '#7c3aed', fontStyle: 'normal', fontWeight: 600 }}>63 million</em>{' '}
            deaf and hard-of-hearing users through pure edge-computed AI — zero cloud, total privacy.
          </motion.p>

          {/* CTA row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.65 }}
            style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}
          >
            <Link to="/translate" style={{ textDecoration: 'none' }}>
              <motion.button
                whileHover={{ scale: 1.04, boxShadow: '0 12px 40px rgba(124,58,237,0.3)' }}
                whileTap={{ scale: 0.97 }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.55rem',
                  padding: '0.85rem 1.9rem',
                  fontSize: '0.92rem', fontWeight: 600,
                  borderRadius: '100px',
                  background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 6px 24px rgba(124,58,237,0.22)',
                  letterSpacing: '0.01em',
                }}
              >
                <Video size={16} />
                Start Translating
                <ArrowRight size={14} />
              </motion.button>
            </Link>

            <Link to="/learn" style={{ textDecoration: 'none' }}>
              <motion.button
                whileHover={{ scale: 1.04, borderColor: 'rgba(124,58,237,0.5)', color: '#7c3aed' }}
                whileTap={{ scale: 0.97 }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.85rem 1.7rem',
                  fontSize: '0.92rem', fontWeight: 500,
                  borderRadius: '100px',
                  background: 'rgba(124,58,237,0.06)',
                  color: '#6d28d9',
                  border: '1px solid rgba(124,58,237,0.22)',
                  cursor: 'pointer',
                }}
              >
                <GraduationCap size={16} />
                Learn ISL
              </motion.button>
            </Link>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}
          >
            {[
              { icon: Shield,   text: '100% Private'   },
              { icon: Zap,      text: '<80ms Latency'  },
              { icon: Sparkles, text: '99.7% Accuracy' },
            ].map(({ icon: Icon, text }) => (
              <span
                key={text}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                  fontSize: '0.77rem', color: '#9ca3af', fontWeight: 500,
                }}
              >
                <Icon size={13} style={{ color: '#a78bfa' }} />
                {text}
              </span>
            ))}
          </motion.div>
        </div>

        {/* RIGHT: Video showcase */}
        <motion.div
          initial={{ opacity: 0, x: 40, scale: 0.97 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 1.1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}
        >
          {/* Glow behind video */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: '-10%',
              background: 'radial-gradient(ellipse at center, rgba(167,139,250,0.25) 0%, rgba(186,230,255,0.15) 50%, transparent 75%)',
              borderRadius: '50%',
              filter: 'blur(40px)',
              pointerEvents: 'none',
              animation: 'homePulseGlow 4s ease-in-out infinite',
            }}
          />

          {/* Video card */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '520px',
              borderRadius: '28px',
              overflow: 'hidden',
              background: 'linear-gradient(145deg, rgba(255,255,255,0.95), rgba(240,244,255,0.9))',
              border: '1.5px solid rgba(196,181,253,0.4)',
              boxShadow: '0 24px 80px rgba(124,58,237,0.12), 0 8px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)',
              backdropFilter: 'blur(20px)',
            }}
          >
            {/* Card header bar */}
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.9rem 1.2rem',
                background: 'rgba(250,248,255,0.9)',
                borderBottom: '1px solid rgba(196,181,253,0.25)',
              }}
            >
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                {['#fca5a5','#fcd34d','#6ee7b7'].map(c => (
                  <span key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c, display: 'block' }} />
                ))}
              </div>
              <span style={{ marginLeft: '0.5rem', fontSize: '0.72rem', fontWeight: 600, color: '#a78bfa', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Live ISL Demo
              </span>
              <span
                style={{
                  marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                  fontSize: '0.68rem', fontWeight: 600, color: '#10b981',
                }}
              >
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', animation: 'homeLivePulse 1.8s ease-in-out infinite', display: 'block' }} />
                LIVE
              </span>
            </div>

            {/* Video */}
            <div style={{ position: 'relative', aspectRatio: '16/10', background: '#f5f3ff' }}>
              <video
                ref={videoRef}
                src="/sign-language-girl.mp4"
                autoPlay
                loop
                muted
                playsInline
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
              <div
                style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%',
                  background: 'linear-gradient(to top, rgba(240,236,255,0.55), transparent)',
                  pointerEvents: 'none',
                }}
              />
            </div>

            {/* Card footer */}
            <div
              style={{
                padding: '0.9rem 1.2rem',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'rgba(250,248,255,0.9)',
                borderTop: '1px solid rgba(196,181,253,0.2)',
              }}
            >
              <div>
                <p style={{ fontSize: '0.78rem', fontWeight: 600, color: '#4c1d95', margin: 0 }}>Indian Sign Language</p>
                <p style={{ fontSize: '0.68rem', color: '#9ca3af', margin: 0 }}>Edge AI · MediaPipe · On-device</p>
              </div>
              <motion.div
                animate={{ rotate: [0, 8, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                style={{ fontSize: '1.6rem' }}
              >
                🤟
              </motion.div>
            </div>
          </div>

          {/* Floating chip — accuracy */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.0 }}
            style={{
              position: 'absolute', top: '10%', left: '-6%',
              background: 'rgba(255,255,255,0.92)',
              border: '1px solid rgba(196,181,253,0.4)',
              borderRadius: '14px',
              padding: '0.65rem 1rem',
              boxShadow: '0 8px 24px rgba(124,58,237,0.1)',
              backdropFilter: 'blur(12px)',
              display: 'flex', flexDirection: 'column', gap: '0.2rem',
            }}
          >
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#7c3aed', lineHeight: 1 }}>99.7%</span>
            <span style={{ fontSize: '0.62rem', color: '#9ca3af', fontWeight: 500 }}>Accuracy</span>
          </motion.div>

          {/* Floating chip — latency */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.15 }}
            style={{
              position: 'absolute', bottom: '8%', right: '-5%',
              background: 'rgba(255,255,255,0.92)',
              border: '1px solid rgba(186,230,255,0.5)',
              borderRadius: '14px',
              padding: '0.65rem 1rem',
              boxShadow: '0 8px 24px rgba(8,145,178,0.1)',
              backdropFilter: 'blur(12px)',
              display: 'flex', flexDirection: 'column', gap: '0.2rem',
            }}
          >
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0891b2', lineHeight: 1 }}>&lt;80ms</span>
            <span style={{ fontSize: '0.62rem', color: '#9ca3af', fontWeight: 500 }}>Latency</span>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6, duration: 1 }}
          style={{
            position: 'absolute', bottom: '3vh', left: '50%', transform: 'translateX(-50%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
          }}
        >
          <span style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#c4b5fd' }}>
            Scroll to explore
          </span>
          <motion.div
            animate={{ y: [0, 10, 0], opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            style={{ width: 1.5, height: 40, background: 'linear-gradient(to bottom, #a78bfa, transparent)', borderRadius: 1 }}
          />
        </motion.div>
      </section>

      {/* STATS BAR */}
      <section style={{ padding: '4rem 5vw', position: 'relative' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1.5rem',
            maxWidth: '1100px',
            margin: '0 auto',
          }}
        >
          {STATS.map(({ value, label, sub, color }, i) => (
            <Reveal key={label} delay={i * 0.08}>
              <div
                style={{
                  padding: '1.8rem 1.5rem',
                  borderRadius: '20px',
                  background: 'rgba(255,255,255,0.75)',
                  border: '1.5px solid rgba(196,181,253,0.2)',
                  boxShadow: '0 4px 20px rgba(124,58,237,0.05)',
                  backdropFilter: 'blur(12px)',
                  textAlign: 'center',
                  transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.boxShadow = `0 12px 32px ${color}22`
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(124,58,237,0.05)'
                }}
              >
                <div
                  style={{
                    fontSize: '2.2rem', fontWeight: 800,
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    color, marginBottom: '0.4rem', lineHeight: 1,
                  }}
                >
                  {value}
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '0.2rem' }}>
                  {label}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{sub}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* MISSION STATEMENT */}
      <section
        style={{
          padding: '5rem 5vw',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(135deg, rgba(237,233,254,0.55) 0%, rgba(224,242,254,0.35) 100%)',
          }}
        />
        <Reveal>
          <div style={{ maxWidth: '800px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#a78bfa', marginBottom: '1.5rem' }}>
              Our Mission
            </p>
            <h2
              style={{
                fontSize: 'clamp(1.8rem, 4vw, 3.2rem)',
                fontWeight: 300,
                fontFamily: "'Playfair Display', Georgia, serif",
                lineHeight: 1.4,
                color: '#1e1b4b',
                margin: 0,
              }}
            >
              Bridging the gap for{' '}
              <span
                style={{
                  background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  fontStyle: 'italic',
                  fontWeight: 400,
                }}
              >
                63 million
              </span>{' '}
              users through pure edge-computed artificial intelligence.
            </h2>
          </div>
        </Reveal>
      </section>

      {/* PERFORMANCE SPLIT */}
      <section
        style={{
          padding: '5rem 5vw',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '4rem',
          alignItems: 'center',
          maxWidth: '1200px',
          margin: '0 auto',
        }}
        className="home-perf-section"
      >
        <Reveal>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { label: 'MediaPipe Hands', sub: '21 keypoints per hand',   pct: 92,   color: '#7c3aed' },
              { label: 'MLP Classifier',  sub: '252 features, on-device', pct: 99.7, color: '#0891b2' },
              { label: 'TensorFlow.js',   sub: 'WASM accelerated',        pct: 88,   color: '#d97706' },
            ].map(({ label, sub, pct, color }) => (
              <div
                key={label}
                style={{
                  padding: '1.2rem 1.4rem',
                  borderRadius: '16px',
                  background: 'rgba(255,255,255,0.8)',
                  border: '1.5px solid rgba(196,181,253,0.2)',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '0.85rem', color: '#1e1b4b' }}>{label}</p>
                    <p style={{ margin: 0, fontSize: '0.72rem', color: '#9ca3af' }}>{sub}</p>
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color }}>{pct}%</span>
                </div>
                <div style={{ height: 4, borderRadius: 4, background: 'rgba(196,181,253,0.2)', overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${pct}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    style={{ height: '100%', borderRadius: 4, background: `linear-gradient(90deg, ${color}, ${color}88)` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.15}>
          <div>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#a78bfa', marginBottom: '1rem' }}>
              Zero Latency
            </p>
            <h2
              style={{
                fontSize: 'clamp(1.8rem, 3vw, 2.8rem)',
                fontWeight: 400,
                fontFamily: "'Playfair Display', Georgia, serif",
                color: '#1e1b4b',
                marginBottom: '1.2rem',
                lineHeight: 1.25,
              }}
            >
              Predictions in under 80ms.
            </h2>
            <p style={{ color: '#6b7280', lineHeight: 1.85, fontSize: '1rem', fontWeight: 400, marginBottom: '1.5rem' }}>
              Drishya Vaani operates entirely within your browser — MediaPipe hand tracking
              combined with a trained MLP classifier delivers buttery-smooth translations.
              Your privacy is structurally guaranteed because your data never leaves your device.
            </p>
            <Link to="/translate" style={{ textDecoration: 'none' }}>
              <span
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                  color: '#7c3aed', fontWeight: 600, fontSize: '0.875rem',
                }}
              >
                Try it now <ArrowRight size={15} />
              </span>
            </Link>
          </div>
        </Reveal>
      </section>

      {/* FEATURES GRID */}
      <section style={{ padding: '5rem 5vw 6rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <Reveal>
            <div style={{ marginBottom: '3rem' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#a78bfa', marginBottom: '0.75rem' }}>
                Platform
              </p>
              <h2
                style={{
                  fontSize: 'clamp(1.8rem, 3.5vw, 3rem)',
                  fontWeight: 300,
                  fontFamily: "'Playfair Display', Georgia, serif",
                  color: '#1e1b4b',
                }}
              >
                Enter the portal.
              </h2>
            </div>
          </Reveal>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
            {FEATURES.map((feature, idx) => (
              <Reveal key={idx} delay={idx * 0.1}>
                <Link to={feature.to} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
                  <motion.div
                    whileHover={{ y: -6, boxShadow: `0 20px 48px ${feature.accent}18, 0 4px 12px rgba(0,0,0,0.06)` }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    style={{
                      padding: '2rem 1.75rem',
                      borderRadius: '22px',
                      background: 'rgba(255,255,255,0.8)',
                      border: `1.5px solid ${feature.border}`,
                      boxShadow: '0 4px 20px rgba(124,58,237,0.05)',
                      backdropFilter: 'blur(16px)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      minHeight: '220px',
                      cursor: 'pointer',
                      height: '100%',
                    }}
                  >
                    <div
                      style={{
                        width: 48, height: 48, borderRadius: '14px',
                        background: feature.soft,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginBottom: '1.5rem',
                        border: `1px solid ${feature.border}`,
                      }}
                    >
                      <feature.icon size={22} color={feature.accent} />
                    </div>
                    <div>
                      <h3 style={{ color: '#1e1b4b', fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                        {feature.title}
                      </h3>
                      <p style={{ color: '#9ca3af', fontSize: '0.82rem', lineHeight: 1.65, marginBottom: '1.25rem' }}>
                        {feature.desc}
                      </p>
                      <span
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                          color: feature.accent, fontSize: '0.78rem',
                          fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
                        }}
                      >
                        Launch <ArrowRight size={12} />
                      </span>
                    </div>
                  </motion.div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer
        style={{
          padding: '3rem 5vw 2.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          borderTop: '1px solid rgba(196,181,253,0.2)',
          background: 'rgba(250,248,255,0.6)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div>
          <p style={{ fontSize: '0.95rem', fontWeight: 700, color: '#7c3aed', marginBottom: '0.25rem' }}>Drishya Vaani</p>
          <p style={{ fontSize: '0.78rem', color: '#9ca3af' }}>{'दृश्य वाणी'} — Visible Voice</p>
        </div>
        <div style={{ fontSize: '0.73rem', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <kbd
            style={{
              padding: '3px 8px', borderRadius: '6px',
              background: 'rgba(124,58,237,0.08)',
              border: '1px solid rgba(124,58,237,0.15)',
              fontFamily: 'monospace', color: '#7c3aed', fontSize: '0.72rem',
            }}
          >
            Ctrl+K
          </kbd>
          Quick Nav
        </div>
      </footer>

      {/* Keyframes */}
      <style>{`
        @keyframes homePulseGlow {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50%       { transform: scale(1.06); opacity: 1; }
        }
        @keyframes homeLivePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(0.85); }
        }
        @media (max-width: 900px) {
          .home-hero-section {
            grid-template-columns: 1fr !important;
            padding-bottom: 8vh !important;
          }
          .home-perf-section {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}
