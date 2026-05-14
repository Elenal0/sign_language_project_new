import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Video, BookOpen, GraduationCap, BarChart3, ArrowRight, Cpu, Zap, Target, Shield, Globe, Accessibility, Clock } from 'lucide-react'

const fade = (i) => ({
  hidden:  { opacity: 0, y: 20 },
  show:    { opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
})

const FEATURES = [
  { icon: Video,         title: 'Live Translator',    desc: 'Real-time ISL gesture detection via webcam with sentence output.',          to: '/translate',  color: '#00c4cc' },
  { icon: BookOpen,      title: 'Sign Dictionary',    desc: 'Browse all ISL signs with Hindi translations and hand guides.',             to: '/dictionary', color: '#60a5fa' },
  { icon: GraduationCap, title: 'Learning Mode',      desc: 'Flashcards and 10-question quiz to practice ISL recognition.',             to: '/learn',      color: '#facc15' },
  { icon: BarChart3,     title: 'Analytics',          desc: 'Confidence trends, per-category accuracy, and session usage stats.',        to: '/dashboard',  color: '#f472b6' },
]

const HIGHLIGHTS = [
  { icon: Zap,           title: 'Real-Time Inference',     desc: 'Predictions delivered in under 80ms using local ML model inference.' },
  { icon: Shield,        title: 'Privacy First',           desc: 'All processing is local. No video data ever leaves your device.' },
  { icon: Cpu,           title: 'AI-Powered Recognition',  desc: 'MediaPipe hand tracking + MLP classifier trained on ISL gesture data.' },
  { icon: Globe,         title: 'Bilingual Output',        desc: 'Translated sentences available in both English and Hindi.' },
  { icon: Accessibility, title: 'Accessibility Focused',   desc: 'Built to bridge communication for the 63 million ISL users in India.' },
  { icon: Clock,         title: 'Fast & Lightweight',      desc: 'Runs entirely in-browser with no GPU required.' },
]

const STATS = [
  { label: 'ISL Users in India',   value: '63M+',  sub: 'Native signers'          },
  { label: 'Model Accuracy',       value: '99.7%', sub: 'On held-out test set'     },
  { label: 'Supported Gestures',   value: '9',     sub: 'Trained classes'          },
  { label: 'Inference Speed',      value: '<80ms', sub: 'Per frame on CPU'         },
  { label: 'Training Samples',     value: '3,240', sub: 'With augmentation'        },
  { label: 'Hand Landmarks',       value: '252',   sub: 'Features per prediction'  },
]

const HOW_IT_WORKS = [
  { step: '01', title: 'Camera Capture',  desc: 'Webcam stream is mirrored and sampled at 12 frames per second.' },
  { step: '02', title: 'Hand Tracking',   desc: 'MediaPipe Hands extracts 21 landmarks from each detected hand.' },
  { step: '03', title: 'ML Prediction',   desc: 'Normalised landmarks are fed into the trained MLP classifier.' },
  { step: '04', title: 'Text Output',     desc: 'Confirmed signs are appended to a live sentence in real time.' },
]

export default function Home() {
  return (
    <div style={{ padding: '1.5rem', minHeight: '100%' }}>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <motion.div
        initial="hidden"
        animate="show"
        style={{
          background: 'linear-gradient(135deg, rgba(0,196,204,0.08) 0%, rgba(96,165,250,0.05) 100%)',
          border: '1px solid rgba(0,196,204,0.15)',
          borderRadius: 20,
          padding: '2rem',
          marginBottom: 24,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle glow */}
        <div style={{
          position: 'absolute', top: -40, right: -40, width: 200, height: 200,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,196,204,0.10) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <motion.div variants={fade(0)}>
          <span style={{
            fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.1em', color: '#00c4cc',
            background: 'rgba(0,196,204,0.1)', padding: '3px 10px',
            borderRadius: 9999, border: '1px solid rgba(0,196,204,0.2)',
          }}>
            SPIT CSE · Final Year Project 2025–26
          </span>
        </motion.div>

        <motion.h1
          variants={fade(1)}
          style={{
            fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 900,
            color: '#f1f5f9', marginTop: 12, lineHeight: 1.2,
          }}
        >
          Indian Sign Language<br />
          <span style={{ color: '#00c4cc' }}>Translation System</span>
        </motion.h1>

        <motion.p
          variants={fade(2)}
          style={{
            fontSize: '0.875rem', color: '#64748b',
            marginTop: 10, maxWidth: 500, lineHeight: 1.65,
          }}
        >
          Real-time gesture recognition using a{' '}
          <strong style={{ color: '#94a3b8' }}>MediaPipe + MLP pipeline</strong>{' '}
          trained on Indian Sign Language data.
          Converts hand gestures into grammatically correct English or Hindi sentences — entirely in your browser.
        </motion.p>

        {/* Stats row */}
        <motion.div
          variants={fade(3)}
          style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' }}
        >
          {[
            { icon: Cpu,    label: 'Model',    value: 'MLP Classifier'  },
            { icon: Zap,    label: 'Accuracy', value: '99.7%'           },
            { icon: Target, label: 'Signs',    value: '9 classes'       },
          ].map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '7px 14px', borderRadius: 10,
                background: '#161622', border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <Icon size={13} style={{ color: '#00c4cc' }} />
              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{label}</span>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#e2e8f0', fontFamily: 'monospace' }}>{value}</span>
            </div>
          ))}
        </motion.div>

        {/* CTA buttons */}
        <motion.div variants={fade(4)} style={{ marginTop: 20, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link to="/translate" style={{ textDecoration: 'none' }}>
            <motion.button
              whileHover={{ scale: 1.03, boxShadow: '0 0 24px rgba(0,196,204,0.4)' }}
              whileTap={{ scale: 0.97 }}
              className="btn-primary"
              style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Video size={15} />
              Start Translating
              <ArrowRight size={14} />
            </motion.button>
          </Link>
          <Link to="/learn" style={{ textDecoration: 'none' }}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="btn-secondary"
              style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <GraduationCap size={15} />
              Learn ISL
            </motion.button>
          </Link>
        </motion.div>
      </motion.div>

      {/* ── Quick access feature cards ────────────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#475569', marginBottom: 12 }}>
          Quick Access
        </p>
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
                  whileHover={{ y: -3, borderColor: `${color}40` }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    background: '#161622', border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 16, padding: '1.25rem', cursor: 'pointer',
                    height: '100%', transition: 'border-color 0.2s',
                  }}
                >
                  <div style={{
                    width: 40, height: 40, borderRadius: 12,
                    background: `${color}14`, border: `1px solid ${color}25`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
                  }}>
                    <Icon size={18} style={{ color }} />
                  </div>
                  <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#f1f5f9', marginBottom: 6 }}>{title}</p>
                  <p style={{ fontSize: '0.75rem', color: '#475569', lineHeight: 1.55 }}>{desc}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 14, fontSize: '0.72rem', color }}>
                    Open <ArrowRight size={11} />
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Statistics ───────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#475569', marginBottom: 12 }}>
          Project Statistics
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
          {STATS.map(({ label, value, sub }) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              style={{
                background: '#161622', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 14, padding: '1rem',
              }}
            >
              <p style={{ fontSize: '1.4rem', fontWeight: 900, color: '#00c4cc', fontFamily: 'monospace', lineHeight: 1 }}>{value}</p>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#e2e8f0', marginTop: 6 }}>{label}</p>
              <p style={{ fontSize: '0.68rem', color: '#475569', marginTop: 2 }}>{sub}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── How It Works ─────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#475569', marginBottom: 12 }}>
          How It Works
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
          {HOW_IT_WORKS.map(({ step, title, desc }) => (
            <div
              key={step}
              style={{
                background: '#161622', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 14, padding: '1rem',
              }}
            >
              <span style={{
                fontSize: '0.65rem', fontWeight: 800, color: '#00c4cc',
                fontFamily: 'monospace', letterSpacing: '0.06em',
              }}>
                STEP {step}
              </span>
              <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#f1f5f9', marginTop: 6, marginBottom: 6 }}>{title}</p>
              <p style={{ fontSize: '0.75rem', color: '#475569', lineHeight: 1.55 }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Features / Highlights ────────────────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#475569', marginBottom: 12 }}>
          Why SanketSetu
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
          {HIGHLIGHTS.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              style={{
                display: 'flex', gap: 12, alignItems: 'flex-start',
                background: '#161622', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 14, padding: '1rem',
              }}
            >
              <div style={{
                width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                background: 'rgba(0,196,204,0.08)', border: '1px solid rgba(0,196,204,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={15} style={{ color: '#00c4cc' }} />
              </div>
              <div>
                <p style={{ fontSize: '0.825rem', fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}>{title}</p>
                <p style={{ fontSize: '0.72rem', color: '#475569', lineHeight: 1.55 }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── About / Mission ──────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(0,196,204,0.05) 0%, rgba(96,165,250,0.03) 100%)',
        border: '1px solid rgba(0,196,204,0.12)',
        borderRadius: 16, padding: '1.5rem',
      }}>
        <p style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#00c4cc', marginBottom: 8 }}>
          About SanketSetu
        </p>
        <p style={{ fontSize: '0.875rem', color: '#94a3b8', lineHeight: 1.7, maxWidth: 640 }}>
          <strong style={{ color: '#e2e8f0' }}>SanketSetu</strong> (संकेत-सेतु) means <em>"bridge of signs"</em> in Hindi.
          This project is a final-year AI/ML initiative at SPIT, Mumbai, aimed at making communication accessible
          for the 63 million Indian Sign Language users across India.
          The system uses a MediaPipe-based hand landmark pipeline combined with a trained MLP classifier to deliver
          real-time, privacy-preserving ISL translation entirely in the browser — no cloud dependency, no data upload.
        </p>
      </div>

    </div>
  )
}