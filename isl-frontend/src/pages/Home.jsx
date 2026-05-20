import { Link } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import { useRef, useState, useEffect } from 'react'
import {
  Video, BookOpen, GraduationCap, BarChart3, ArrowRight,
  Cpu, Zap, Target, Shield, Globe, Accessibility, Clock
} from 'lucide-react'

const fade = (i) => ({
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
})

const FEATURES = [
  { icon: Video,         title: 'Live Translator',  desc: 'Real-time ISL gesture detection via webcam with sentence output.',   to: '/translate',  color: 'var(--accent)' },
  { icon: BookOpen,      title: 'Sign Dictionary',  desc: 'Browse all ISL signs with Hindi translations and hand guides.',      to: '/dictionary', color: 'var(--blue)' },
  { icon: GraduationCap, title: 'Learning Mode',    desc: 'Flashcards and 10-question quiz to practice ISL recognition.',      to: '/learn',      color: 'var(--yellow)' },
  { icon: BarChart3,     title: 'Analytics',        desc: 'Confidence trends, per-category accuracy, and session usage stats.', to: '/dashboard',  color: 'var(--pink)' },
]

const HIGHLIGHTS = [
  { icon: Zap,           title: 'Real-Time Inference',    desc: 'Predictions delivered in under 80ms using local ML model inference.' },
  { icon: Shield,        title: 'Privacy First',          desc: 'All processing is local. No video data ever leaves your device.' },
  { icon: Cpu,           title: 'AI-Powered Recognition', desc: 'MediaPipe hand tracking + MLP classifier trained on ISL gesture data.' },
  { icon: Globe,         title: 'Bilingual Output',       desc: 'Translated sentences available in both English and Hindi.' },
  { icon: Accessibility, title: 'Accessibility Focused',  desc: 'Built to bridge communication for the 63 million ISL users in India.' },
  { icon: Clock,         title: 'Fast & Lightweight',     desc: 'Runs entirely in-browser with no GPU required.' },
]

const STATS = [
  { label: 'ISL Users in India',  value: '63M+',  num: 63,  suffix: 'M+',  sub: 'Native signers'         },
  { label: 'Model Accuracy',      value: '99.7%', num: 99.7, suffix: '%',  sub: 'On held-out test set'    },
  { label: 'Supported Gestures',  value: '9',     num: 9,   suffix: '',    sub: 'Trained classes'         },
  { label: 'Inference Speed',     value: '<80ms', num: 80,  suffix: 'ms',  sub: 'Per frame on CPU',  prefix: '<' },
  { label: 'Training Samples',    value: '3,240', num: 3240, suffix: '',   sub: 'With augmentation'       },
  { label: 'Hand Landmarks',      value: '252',   num: 252,  suffix: '',   sub: 'Features per prediction' },
]

const HOW_IT_WORKS = [
  { step: '01', title: 'Camera Capture', desc: 'Webcam stream is mirrored and sampled at 12 frames per second.' },
  { step: '02', title: 'Hand Tracking',  desc: 'MediaPipe Hands extracts 21 landmarks from each detected hand.' },
  { step: '03', title: 'ML Prediction', desc: 'Normalised landmarks are fed into the trained MLP classifier.' },
  { step: '04', title: 'Text Output',   desc: 'Confirmed signs are appended to a live sentence in real time.' },
]

function AnimatedCounter({ value, suffix = '', prefix = '', duration = 2 }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!inView) return
    let start = 0
    const end = value
    const step = end / (duration * 60)
    const timer = setInterval(() => {
      start += step
      if (start >= end) { setDisplay(end); clearInterval(timer) }
      else setDisplay(Math.floor(start * 10) / 10)
    }, 1000 / 60)
    return () => clearInterval(timer)
  }, [inView, value, duration])

  const formatted = Number.isInteger(value)
    ? Math.round(display).toLocaleString()
    : display.toFixed(1)

  return (
    <span ref={ref} style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--accent)', fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>
      {prefix}{formatted}{suffix}
    </span>
  )
}

function SectionReveal({ children, delay = 0 }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}

export default function Home() {
  return (
    <div style={{ padding: '1.5rem', minHeight: '100%' }}>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <motion.div
        initial="hidden"
        animate="show"
        style={{
          background: 'linear-gradient(135deg, var(--accent-softer) 0%, var(--blue-soft) 100%)',
          border: '1px solid var(--accent-border)',
          borderRadius: 20, padding: '2.5rem', marginBottom: 28,
          position: 'relative', overflow: 'hidden',
        }}
      >
        {/* Animated gradient mesh */}
        <div className="animate-aurora" style={{
          position: 'absolute', inset: 0, opacity: 0.3, pointerEvents: 'none',
          background: 'linear-gradient(45deg, var(--accent-softer), var(--blue-soft), var(--pink-soft), var(--accent-softer))',
          backgroundSize: '400% 400%',
        }} />

        {/* Floating particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            animate={{ y: [0, -20 - i * 5, 0], x: [0, 10 - i * 3, 0] }}
            transition={{ duration: 4 + i, repeat: Infinity, ease: 'easeInOut', delay: i * 0.5 }}
            style={{
              position: 'absolute',
              width: 4 + i * 2, height: 4 + i * 2, borderRadius: '50%',
              background: 'var(--accent)', opacity: 0.15 + i * 0.03,
              top: `${20 + i * 12}%`, right: `${5 + i * 8}%`,
              pointerEvents: 'none',
            }}
          />
        ))}

        <motion.div variants={fade(0)} style={{ position: 'relative', zIndex: 1 }}>
          <span style={{
            fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.1em', color: 'var(--accent)',
            background: 'var(--accent-soft)', padding: '3px 10px',
            borderRadius: 9999, border: '1px solid var(--accent-border)',
          }}>
            SPIT CSE · Final Year Project 2025–26
          </span>
        </motion.div>

        <motion.h1
          variants={fade(1)}
          style={{ fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', fontWeight: 900, color: 'var(--text-primary)', marginTop: 14, lineHeight: 1.2, position: 'relative', zIndex: 1 }}
        >
          SanketSetu —<br />
          <span className="gradient-text">Indian Sign Language Bridge</span>
        </motion.h1>

        <motion.p
          variants={fade(2)}
          style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: 12, maxWidth: 520, lineHeight: 1.7, position: 'relative', zIndex: 1 }}
        >
          Real-time gesture recognition using a{' '}
          <strong style={{ color: 'var(--text-secondary)' }}>MediaPipe + MLP pipeline</strong>{' '}
          trained on Indian Sign Language data.
          Converts hand gestures into grammatically correct English or Hindi sentences — entirely in your browser.
        </motion.p>

        {/* Quick stats */}
        <motion.div variants={fade(3)} style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
          {[
            { icon: Cpu,    label: 'Model',    value: 'MLP Classifier' },
            { icon: Zap,    label: 'Accuracy', value: '99.7%' },
            { icon: Target, label: 'Signs',    value: '9 classes' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '7px 14px', borderRadius: 10,
              background: 'var(--bg-panel)', border: '1px solid var(--border)',
            }}>
              <Icon size={13} style={{ color: 'var(--accent)' }} />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{label}</span>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace" }}>{value}</span>
            </div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div variants={fade(4)} style={{ marginTop: 22, display: 'flex', gap: 10, flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
          <Link to="/translate" style={{ textDecoration: 'none' }}>
            <motion.button
              whileHover={{ scale: 1.03, boxShadow: '0 0 28px var(--accent-glow)' }}
              whileTap={{ scale: 0.97 }}
              className="btn-primary"
              style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Video size={15} /> Start Translating <ArrowRight size={14} />
            </motion.button>
          </Link>
          <Link to="/learn" style={{ textDecoration: 'none' }}>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              className="btn-secondary" style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              <GraduationCap size={15} /> Learn ISL
            </motion.button>
          </Link>
        </motion.div>
      </motion.div>

      {/* ── Quick Access ───────────────────────────────────────────────── */}
      <SectionReveal>
        <div style={{ marginBottom: 28 }}>
          <p className="section-label">Quick Access</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
            {FEATURES.map(({ icon: Icon, title, desc, to, color }, i) => (
              <motion.div
                key={to}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <Link to={to} style={{ textDecoration: 'none' }}>
                  <motion.div
                    whileHover={{ y: -4, boxShadow: 'var(--shadow-glow)' }}
                    whileTap={{ scale: 0.98 }}
                    className="card-hover"
                    style={{ height: '100%', cursor: 'pointer' }}
                  >
                    <div style={{
                      width: 40, height: 40, borderRadius: 12,
                      background: 'var(--accent-soft)', border: '1px solid var(--accent-border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
                    }}>
                      <Icon size={18} style={{ color }} />
                    </div>
                    <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>{title}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-faint)', lineHeight: 1.55 }}>{desc}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 14, fontSize: '0.72rem', color: 'var(--accent)' }}>
                      Open <ArrowRight size={11} />
                    </div>
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </SectionReveal>

      {/* ── Statistics with animated counters ──────────────────────────── */}
      <SectionReveal delay={0.1}>
        <div style={{ marginBottom: 28 }}>
          <p className="section-label">Project Statistics</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
            {STATS.map(({ label, num, suffix, sub, prefix }) => (
              <motion.div
                key={label}
                className="card"
                whileHover={{ y: -2 }}
              >
                <AnimatedCounter value={num} suffix={suffix} prefix={prefix || ''} />
                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: 6 }}>{label}</p>
                <p style={{ fontSize: '0.68rem', color: 'var(--text-faint)', marginTop: 2 }}>{sub}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </SectionReveal>

      {/* ── How It Works ───────────────────────────────────────────────── */}
      <SectionReveal delay={0.15}>
        <div style={{ marginBottom: 28 }}>
          <p className="section-label">How It Works</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
            {HOW_IT_WORKS.map(({ step, title, desc }, i) => (
              <motion.div
                key={step}
                className="card"
                whileHover={{ y: -2 }}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
              >
                <span style={{
                  fontSize: '0.65rem', fontWeight: 800, color: 'var(--accent)',
                  fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.06em',
                }}>
                  STEP {step}
                </span>
                <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: 6, marginBottom: 6 }}>{title}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-faint)', lineHeight: 1.55 }}>{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </SectionReveal>

      {/* ── Why SanketSetu ─────────────────────────────────────────────── */}
      <SectionReveal delay={0.2}>
        <div style={{ marginBottom: 28 }}>
          <p className="section-label">Why SanketSetu</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
            {HIGHLIGHTS.map(({ icon: Icon, title, desc }) => (
              <motion.div
                key={title}
                className="card"
                style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}
                whileHover={{ y: -2 }}
              >
                <div style={{
                  width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                  background: 'var(--accent-soft)', border: '1px solid var(--accent-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={15} style={{ color: 'var(--accent)' }} />
                </div>
                <div>
                  <p style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{title}</p>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-faint)', lineHeight: 1.55 }}>{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </SectionReveal>

      {/* ── About ───────────────────────────────────────────────────────── */}
      <SectionReveal delay={0.25}>
        <div style={{
          background: 'linear-gradient(135deg, var(--accent-softer) 0%, var(--blue-soft) 100%)',
          border: '1px solid var(--accent-border)',
          borderRadius: 16, padding: '1.5rem',
        }}>
          <p className="section-label" style={{ color: 'var(--accent)' }}>About SanketSetu</p>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: 640 }}>
            <strong style={{ color: 'var(--text-primary)' }}>SanketSetu</strong> (संकेत-सेतु) means{' '}
            <em>"bridge of signs"</em> in Hindi. This project is a final-year AI/ML initiative at SPIT, Mumbai,
            aimed at making communication accessible for the 63 million Indian Sign Language users across India.
            The system uses a MediaPipe-based hand landmark pipeline combined with a trained MLP classifier to deliver
            real-time, privacy-preserving ISL translation entirely in the browser — no cloud dependency, no data upload.
          </p>
        </div>
      </SectionReveal>

      {/* Keyboard shortcut hint */}
      <SectionReveal delay={0.3}>
        <div style={{ textAlign: 'center', padding: '2rem 0 1rem', color: 'var(--text-ghost)', fontSize: '0.75rem' }}>
          Press <kbd style={{ padding: '2px 6px', borderRadius: 4, background: 'var(--bg-elevated)', border: '1px solid var(--border)', fontFamily: 'monospace', fontSize: '0.7rem' }}>Ctrl+K</kbd> to quick navigate
        </div>
      </SectionReveal>
    </div>
  )
}