import { Link } from 'react-router-dom'
import { motion, useInView, useMotionValue, useTransform, useSpring, AnimatePresence } from 'framer-motion'
import { useRef, useState, useEffect, useCallback } from 'react'
import {
  Video, BookOpen, GraduationCap, BarChart3, ArrowRight,
  Cpu, Zap, Target, Shield, Globe, Accessibility, Clock, Sparkles
} from 'lucide-react'

/* ─── Data ─────────────────────────────────────────────────────────────────── */
const FEATURES = [
  { icon: Video,         title: 'Live Translator',  desc: 'Real-time ISL gesture detection via webcam with sentence output.',   to: '/translate',  accent: 'var(--accent)' },
  { icon: BookOpen,      title: 'Sign Dictionary',  desc: 'Browse all ISL signs with Hindi translations and hand guides.',      to: '/dictionary', accent: 'var(--blue)' },
  { icon: GraduationCap, title: 'Learning Mode',    desc: 'Flashcards and quiz to practice ISL recognition with AI coaching.', to: '/learn',      accent: 'var(--yellow)' },
  { icon: BarChart3,     title: 'Analytics',        desc: 'Confidence trends, per-category accuracy, and session stats.',      to: '/dashboard',  accent: 'var(--pink)' },
]

const HIGHLIGHTS = [
  { icon: Zap,           title: 'Real-Time Inference',    desc: 'Predictions in under 80ms using local ML inference.' },
  { icon: Shield,        title: 'Privacy First',          desc: 'All processing is local. No video ever leaves your device.' },
  { icon: Cpu,           title: 'AI-Powered',             desc: 'MediaPipe hand tracking + MLP classifier on ISL data.' },
  { icon: Globe,         title: 'Bilingual Output',       desc: 'Translated sentences in both English and Hindi.' },
  { icon: Accessibility, title: 'Accessibility Focused',  desc: 'Built for the 63 million ISL users in India.' },
  { icon: Clock,         title: 'Lightweight',            desc: 'Runs entirely in-browser. No GPU required.' },
]

const STATS = [
  { label: 'ISL Users',      num: 63,   suffix: 'M+',  sub: 'Native signers',       prefix: '' },
  { label: 'Accuracy',       num: 99.7, suffix: '%',   sub: 'Test set',              prefix: '' },
  { label: 'Gestures',       num: 9,    suffix: '',    sub: 'Trained classes',        prefix: '' },
  { label: 'Speed',          num: 80,   suffix: 'ms',  sub: 'Per frame CPU',         prefix: '<' },
  { label: 'Samples',        num: 3240, suffix: '',    sub: 'With augmentation',      prefix: '' },
  { label: 'Landmarks',      num: 252,  suffix: '',    sub: 'Features/prediction',    prefix: '' },
]

const ISL_SIGNS_RAIN = ['Hello', 'Thank you', 'How', 'You', 'I', 'Nice', 'Meet', 'Going', 'School',
  'नमस्ते', 'धन्यवाद', 'कैसे', 'तुम', 'मैं', 'अच्छा', 'मिलना', '🤟', '👋', '✌️', '🙏']

const HOW_IT_WORKS = [
  { step: '01', title: 'Camera Capture', desc: 'Webcam stream sampled at 12 frames per second.' },
  { step: '02', title: 'Hand Tracking',  desc: 'MediaPipe extracts 21 landmarks per detected hand.' },
  { step: '03', title: 'ML Prediction', desc: 'Normalised landmarks fed into trained MLP classifier.' },
  { step: '04', title: 'Text Output',   desc: 'Confirmed signs appended to live sentence in real time.' },
]

/* ─── Components ────────────────────────────────────────────────────────────── */

/** Particle field rendered on canvas */
function ParticleField() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId
    let particles = []
    let w, h

    const resize = () => {
      w = canvas.width  = canvas.offsetWidth
      h = canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // Create particles
    for (let i = 0; i < 90; i++) {
      particles.push({
        x: Math.random() * (w || 800),
        y: Math.random() * (h || 400),
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        r: Math.random() * 2.5 + 0.5,
        opacity: Math.random() * 0.5 + 0.1,
        hue: Math.random() > 0.7 ? '200, 200, 255' : '0, 196, 204',
      })
    }

    const draw = () => {
      ctx.clearRect(0, 0, w, h)
      // Connect nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 120) {
            ctx.beginPath()
            ctx.strokeStyle = `rgba(0, 196, 204, ${0.15 * (1 - dist / 120)})`
            ctx.lineWidth = 0.5
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.stroke()
          }
        }
      }
      // Draw particles
      particles.forEach(p => {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${p.hue}, ${p.opacity})`
        ctx.fill()
        // Glow
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${p.hue}, ${p.opacity * 0.15})`
        ctx.fill()
        // Move
        p.x += p.vx; p.y += p.vy
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0
        if (p.y < 0) p.y = h; if (p.y > h) p.y = 0
      })
      animId = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize) }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    />
  )
}

/** ISL signs falling like Matrix rain */
function MatrixRain() {
  const [drops, setDrops] = useState([])

  useEffect(() => {
    const initial = Array.from({ length: 14 }, (_, i) => ({
      id: i,
      sign: ISL_SIGNS_RAIN[Math.floor(Math.random() * ISL_SIGNS_RAIN.length)],
      x: 5 + (i / 14) * 90 + (Math.random() - 0.5) * 4,
      delay: Math.random() * 4,
      duration: 4 + Math.random() * 4,
      size: 10 + Math.random() * 14,
      opacity: 0.08 + Math.random() * 0.18,
    }))
    setDrops(initial)
    const interval = setInterval(() => {
      setDrops(prev => prev.map(d =>
        Math.random() < 0.3
          ? { ...d, sign: ISL_SIGNS_RAIN[Math.floor(Math.random() * ISL_SIGNS_RAIN.length)] }
          : d
      ))
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {drops.map(drop => (
        <motion.div
          key={drop.id}
          initial={{ y: '-10%', opacity: 0 }}
          animate={{ y: '110%', opacity: [0, drop.opacity, drop.opacity, 0] }}
          transition={{ duration: drop.duration, delay: drop.delay, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'absolute',
            left: `${drop.x}%`,
            top: 0,
            fontSize: drop.size,
            color: 'var(--accent)',
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 700,
            textShadow: '0 0 8px var(--accent)',
            whiteSpace: 'nowrap',
          }}
        >
          {drop.sign}
        </motion.div>
      ))}
    </div>
  )
}

/** Morphing glow blob */
function GlowBlob({ color, x, y, size, delay = 0 }) {
  return (
    <motion.div
      animate={{
        scale: [1, 1.4, 0.9, 1.2, 1],
        x: [0, 30, -20, 15, 0],
        y: [0, -20, 30, -10, 0],
        borderRadius: ['40% 60% 70% 30% / 40% 50% 60% 50%', '60% 40% 30% 70% / 60% 30% 70% 40%', '30% 60% 70% 40% / 50% 60% 30% 60%', '60% 40% 30% 70% / 30% 60% 70% 40%', '40% 60% 70% 30% / 40% 50% 60% 50%'],
      }}
      transition={{ duration: 10, delay, repeat: Infinity, ease: 'easeInOut' }}
      style={{
        position: 'absolute', left: x, top: y,
        width: size, height: size,
        background: color,
        filter: `blur(${size / 2}px)`,
        opacity: 0.35,
        pointerEvents: 'none',
      }}
    />
  )
}

/** Glitch text effect */
function GlitchText({ children, style }) {
  const [glitching, setGlitching] = useState(false)

  useEffect(() => {
    const trigger = () => {
      setGlitching(true)
      setTimeout(() => setGlitching(false), 300)
    }
    const interval = setInterval(trigger, 3000 + Math.random() * 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <span style={{ position: 'relative', display: 'inline-block', ...style }}>
      {children}
      {glitching && (
        <>
          <span style={{
            position: 'absolute', inset: 0, color: '#00ffff',
            clipPath: 'polygon(0 30%, 100% 30%, 100% 50%, 0 50%)',
            transform: 'translateX(-3px)', opacity: 0.8,
            animation: 'none',
          }}>{children}</span>
          <span style={{
            position: 'absolute', inset: 0, color: '#ff00ff',
            clipPath: 'polygon(0 55%, 100% 55%, 100% 70%, 0 70%)',
            transform: 'translateX(3px)', opacity: 0.8,
          }}>{children}</span>
        </>
      )}
    </span>
  )
}

/** Mouse-tracking parallax container */
function ParallaxContainer({ children }) {
  const containerRef = useRef(null)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [4, -4]), { stiffness: 80, damping: 20 })
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-4, 4]), { stiffness: 80, damping: 20 })

  const handleMouseMove = useCallback((e) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5)
    mouseY.set((e.clientY - rect.top)  / rect.height - 0.5)
  }, [mouseX, mouseY])

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0); mouseY.set(0)
  }, [mouseX, mouseY])

  return (
    <motion.div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d', perspective: 1200 }}
    >
      {children}
    </motion.div>
  )
}

/** Magnetic button */
function MagneticButton({ children, className, style, onClick, href }) {
  const ref = useRef(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 300, damping: 15 })
  const springY = useSpring(y, { stiffness: 300, damping: 15 })

  const handleMove = (e) => {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    x.set((e.clientX - cx) * 0.35)
    y.set((e.clientY - cy) * 0.35)
  }
  const handleLeave = () => { x.set(0); y.set(0) }

  const Tag = href ? motion.a : motion.button

  return (
    <Tag
      ref={ref}
      href={href}
      onClick={onClick}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ x: springX, y: springY, ...style }}
      className={className}
      whileTap={{ scale: 0.93 }}
    >
      {children}
    </Tag>
  )
}

/** Animated counter */
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
      else setDisplay(start)
    }, 1000 / 60)
    return () => clearInterval(timer)
  }, [inView, value, duration])

  const formatted = Number.isInteger(value)
    ? Math.round(display).toLocaleString()
    : display.toFixed(1)

  return (
    <span ref={ref} style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 900 }}>
      {prefix}{formatted}{suffix}
    </span>
  )
}

/** Section reveal */
function Reveal({ children, delay = 0, direction = 'up' }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const variants = {
    hidden: {
      opacity: 0,
      y: direction === 'up' ? 32 : direction === 'down' ? -32 : 0,
      x: direction === 'left' ? 32 : direction === 'right' ? -32 : 0,
      scale: 0.95,
    },
    show: { opacity: 1, y: 0, x: 0, scale: 1, transition: { delay, duration: 0.65, ease: [0.16, 1, 0.3, 1] } },
  }
  return (
    <motion.div ref={ref} variants={variants} initial="hidden" animate={inView ? 'show' : 'hidden'}>
      {children}
    </motion.div>
  )
}

/* ─── Main Page ─────────────────────────────────────────────────────────────── */
export default function Home() {
  const [heroVisible, setHeroVisible] = useState(false)
  const [typeText, setTypeText] = useState('')
  const fullText = 'Indian Sign Language Bridge'
  const [scanLine, setScanLine] = useState(0)

  // Entrance
  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 100)
    return () => clearTimeout(t)
  }, [])

  // Typewriter
  useEffect(() => {
    if (!heroVisible) return
    let i = 0
    const timer = setInterval(() => {
      setTypeText(fullText.slice(0, i))
      i++
      if (i > fullText.length) clearInterval(timer)
    }, 55)
    return () => clearInterval(timer)
  }, [heroVisible])

  // Scan line
  useEffect(() => {
    const interval = setInterval(() => {
      setScanLine(v => (v + 1) % 100)
    }, 20)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{ padding: '1.5rem', minHeight: '100%', overflowX: 'hidden' }}>

      {/* ══════════════════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════════════════ */}
      <ParallaxContainer>
        <div
          style={{
            position: 'relative', borderRadius: 24, overflow: 'hidden',
            marginBottom: 32, minHeight: 440,
            border: '1px solid var(--accent-border)',
            background: 'var(--bg-panel)',
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Particle field */}
          <ParticleField />

          {/* Matrix rain */}
          <MatrixRain />

          {/* Morphing blobs */}
          <GlowBlob color="var(--accent)"   x="-5%"  y="-20%" size={320} delay={0} />
          <GlowBlob color="var(--blue)"     x="60%"  y="-10%" size={280} delay={2} />
          <GlowBlob color="var(--pink)"     x="80%"  y="50%"  size={200} delay={4} />
          <GlowBlob color="var(--yellow)"   x="10%"  y="70%"  size={180} delay={1} />

          {/* Scan line effect */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
            background: `linear-gradient(to bottom, transparent ${scanLine - 2}%, rgba(0,196,204,0.04) ${scanLine}%, rgba(0,196,204,0.08) ${scanLine + 0.3}%, rgba(0,196,204,0.04) ${scanLine + 0.6}%, transparent ${scanLine + 2}%)`,
          }} />

          {/* Grid overlay */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
            backgroundImage: `linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
            maskImage: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.6) 100%)',
          }} />

          {/* Content */}
          <div style={{ position: 'relative', zIndex: 2, padding: 'clamp(2rem, 5vw, 3.5rem)' }}>



            {/* Main title */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={heroVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              style={{ marginBottom: 14 }}
            >
              <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 900, lineHeight: 1.1 }}>
                <span style={{ color: 'var(--text-primary)' }}>Drishya</span>
                <span style={{ color: 'var(--accent)', fontWeight: 900 }}> Vaani —</span>
              </h1>
              <h2 style={{ fontSize: 'clamp(1.2rem, 3vw, 1.8rem)', fontWeight: 700, color: 'var(--text-primary)', marginTop: 4, minHeight: '2em' }}>
                <span style={{ color: 'var(--accent)' }}>{typeText}</span>
                <motion.span
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  style={{ borderRight: '3px solid var(--accent)', marginLeft: 2 }}
                />
              </h2>
            </motion.div>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={heroVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
              style={{ fontSize: '0.9rem', color: 'var(--text-muted)', maxWidth: 520, lineHeight: 1.8, marginBottom: 24 }}
            >
              Real-time gesture recognition using a{' '}
              <strong style={{ color: 'var(--text-primary)' }}>MediaPipe + MLP pipeline</strong>{' '}
              trained on ISL data — converts hand gestures into sentences entirely in your browser.
              No cloud. No upload. Pure AI.
            </motion.p>

            {/* Stat pills */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={heroVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
              style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}
            >
              {[
                { icon: Cpu,    label: 'Model',    value: 'MLP Classifier' },
                { icon: Zap,    label: 'Accuracy', value: '99.7%' },
                { icon: Target, label: 'Signs',    value: '9 classes' },
              ].map(({ icon: Icon, label, value }, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={heroVisible ? { opacity: 1, scale: 1 } : {}}
                  transition={{ duration: 0.4, delay: 0.5 + i * 0.1, type: 'spring', stiffness: 250 }}
                  whileHover={{ scale: 1.06, borderColor: 'var(--accent)', boxShadow: '0 0 16px var(--accent-glow)' }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '7px 14px', borderRadius: 10,
                    background: 'var(--glass-bg)', border: '1px solid var(--border)',
                    backdropFilter: 'blur(8px)', cursor: 'default',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                >
                  <Icon size={13} style={{ color: 'var(--accent)' }} />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{label}</span>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace" }}>{value}</span>
                </motion.div>
              ))}
            </motion.div>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={heroVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.65 }}
              style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}
            >
              <Link to="/translate" style={{ textDecoration: 'none' }}>
                <MagneticButton
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '0.7rem 1.6rem', fontSize: '0.9rem', fontWeight: 700,
                    borderRadius: 12, background: 'var(--accent)', color: '#fff',
                    border: 'none', cursor: 'pointer', position: 'relative', overflow: 'hidden',
                  }}
                >
                  <motion.div
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear', repeatDelay: 1 }}
                    style={{
                      position: 'absolute', inset: 0,
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)',
                      pointerEvents: 'none',
                    }}
                  />
                  <Video size={16} /> Start Translating <ArrowRight size={14} />
                </MagneticButton>
              </Link>

              <Link to="/learn" style={{ textDecoration: 'none' }}>
                <MagneticButton
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '0.7rem 1.4rem', fontSize: '0.9rem', fontWeight: 600,
                    borderRadius: 12, background: 'var(--glass-bg)', color: 'var(--text-primary)',
                    border: '1px solid var(--border)', cursor: 'pointer', backdropFilter: 'blur(8px)',
                  }}
                >
                  <GraduationCap size={16} /> Learn ISL
                </MagneticButton>
              </Link>

              {/* Ctrl+K hint */}
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
                style={{ fontSize: '0.72rem', color: 'var(--text-ghost)', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <kbd style={{ padding: '2px 6px', borderRadius: 4, background: 'var(--bg-elevated)', border: '1px solid var(--border)', fontFamily: 'monospace', fontSize: '0.65rem' }}>Ctrl+K</kbd>
                <span>quick nav</span>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </ParallaxContainer>

      {/* ══════════════════════════════════════════════════════════════════
          FEATURES
      ══════════════════════════════════════════════════════════════════ */}
      <Reveal>
        <p className="section-label">Quick Access</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12, marginBottom: 32 }}>
          {FEATURES.map(({ icon: Icon, title, desc, to, accent }, i) => (
            <motion.div
              key={to}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -6, rotateY: 2, rotateX: -2, transformStyle: 'preserve-3d' }}
            >
              <Link to={to} style={{ textDecoration: 'none' }}>
                <motion.div
                  className="card"
                  style={{ height: '100%', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
                  whileHover={{ borderColor: accent, boxShadow: `0 8px 32px ${accent}33` }}
                  transition={{ duration: 0.25 }}
                >
                  {/* Shimmer sweep on hover */}
                  <motion.div
                    initial={{ x: '-100%' }} whileHover={{ x: '200%' }}
                    transition={{ duration: 0.6 }}
                    style={{
                      position: 'absolute', inset: 0, zIndex: 0,
                      background: `linear-gradient(90deg, transparent, ${accent}15, transparent)`,
                      pointerEvents: 'none',
                    }}
                  />

                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <motion.div
                      whileHover={{ scale: 1.15, rotate: 8 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                      style={{
                        width: 42, height: 42, borderRadius: 12, marginBottom: 12,
                        background: 'var(--accent-soft)', border: '1px solid var(--accent-border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <Icon size={18} style={{ color: accent }} />
                    </motion.div>
                    <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>{title}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-faint)', lineHeight: 1.55 }}>{desc}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 14, fontSize: '0.72rem', color: accent }}>
                      Open <ArrowRight size={11} />
                    </div>
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </div>
      </Reveal>

      {/* ══════════════════════════════════════════════════════════════════
          STATS — Animated counters with exploding entrance
      ══════════════════════════════════════════════════════════════════ */}
      <Reveal delay={0.05}>
        <p className="section-label">Project Statistics</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: 10, marginBottom: 32 }}>
          {STATS.map(({ label, num, suffix, sub, prefix }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
              whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5, type: 'spring', stiffness: 200 }}
              whileHover={{ scale: 1.05, boxShadow: '0 0 24px var(--accent-glow)', borderColor: 'var(--accent-border)' }}
              className="card"
              style={{ cursor: 'default', transition: 'border-color 0.3s' }}
            >
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--accent)', lineHeight: 1 }}>
                <AnimatedCounter value={num} suffix={suffix} prefix={prefix} />
              </div>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: 6 }}>{label}</p>
              <p style={{ fontSize: '0.68rem', color: 'var(--text-faint)', marginTop: 2 }}>{sub}</p>
            </motion.div>
          ))}
        </div>
      </Reveal>

      {/* ══════════════════════════════════════════════════════════════════
          HOW IT WORKS — staggered with connector line
      ══════════════════════════════════════════════════════════════════ */}
      <Reveal delay={0.1}>
        <p className="section-label">How It Works</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10, marginBottom: 32 }}>
          {HOW_IT_WORKS.map(({ step, title, desc }, i) => (
            <motion.div
              key={step}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.5 }}
              className="card"
              style={{ position: 'relative', overflow: 'hidden' }}
              whileHover={{ y: -3 }}
            >
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 0.06 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 + 0.3, duration: 0.4 }}
                style={{
                  position: 'absolute', right: -10, bottom: -10,
                  fontSize: '5rem', fontWeight: 900, color: 'var(--accent)',
                  fontFamily: "'JetBrains Mono', monospace", lineHeight: 1, pointerEvents: 'none',
                }}
              >
                {step}
              </motion.div>
              <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--accent)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.06em' }}>
                STEP {step}
              </span>
              <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: 6, marginBottom: 6 }}>{title}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-faint)', lineHeight: 1.55 }}>{desc}</p>
            </motion.div>
          ))}
        </div>
      </Reveal>

      {/* ══════════════════════════════════════════════════════════════════
          WHY — cascade stagger
      ══════════════════════════════════════════════════════════════════ */}
      <Reveal delay={0.15}>
        <p className="section-label">Why Drishya Vaani</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10, marginBottom: 32 }}>
          {HIGHLIGHTS.map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.45 }}
              whileHover={{ y: -3, borderColor: 'var(--accent-border)', boxShadow: 'var(--shadow-glow)' }}
              className="card"
              style={{ display: 'flex', gap: 12, alignItems: 'flex-start', cursor: 'default', transition: 'border-color 0.2s, box-shadow 0.2s' }}
            >
              <motion.div
                whileHover={{ rotate: 360, scale: 1.2 }}
                transition={{ duration: 0.5 }}
                style={{
                  width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                  background: 'var(--accent-soft)', border: '1px solid var(--accent-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Icon size={15} style={{ color: 'var(--accent)' }} />
              </motion.div>
              <div>
                <p style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{title}</p>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-faint)', lineHeight: 1.55 }}>{desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </Reveal>

      {/* ══════════════════════════════════════════════════════════════════
          ABOUT — final CTA band
      ══════════════════════════════════════════════════════════════════ */}
      <Reveal delay={0.2}>
        <motion.div
          style={{
            position: 'relative', borderRadius: 20, padding: '2rem', overflow: 'hidden',
            background: 'var(--bg-panel)', border: '1px solid var(--accent-border)',
          }}
          whileHover={{ boxShadow: '0 0 48px var(--accent-glow)' }}
          transition={{ duration: 0.4 }}
        >
          {/* Animated gradient border sweep */}
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            style={{
              position: 'absolute', inset: -2, borderRadius: 22, zIndex: -1,
              background: 'conic-gradient(from 0deg, var(--accent), var(--blue), var(--pink), var(--yellow), var(--accent))',
              opacity: 0.3,
            }}
          />

          <Sparkles size={20} style={{ color: 'var(--accent)', marginBottom: 10 }} />
          <p className="section-label" style={{ color: 'var(--accent)' }}>About Drishya Vaani</p>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.8, maxWidth: 640 }}>
            <strong style={{ color: 'var(--text-primary)' }}>Drishya Vaani</strong> (दृश्य वाणी) means{' '}
            <em>"visible voice"</em> — a real-time AI/ML system that makes communication
            accessible for the <strong style={{ color: 'var(--accent)' }}>63 million</strong> Indian Sign Language users.
            The system uses a MediaPipe-based pipeline combined with a trained MLP classifier for real-time,
            privacy-preserving ISL translation — entirely in the browser, no cloud, no upload.
          </p>
        </motion.div>
      </Reveal>

      {/* Bottom hint */}
      <div style={{ textAlign: 'center', padding: '2rem 0 0.5rem', color: 'var(--text-ghost)', fontSize: '0.72rem' }}>
        Press <kbd style={{ padding: '2px 6px', borderRadius: 4, background: 'var(--bg-elevated)', border: '1px solid var(--border)', fontFamily: 'monospace', fontSize: '0.65rem' }}>Ctrl+K</kbd> to quick navigate anywhere
      </div>
    </div>
  )
}