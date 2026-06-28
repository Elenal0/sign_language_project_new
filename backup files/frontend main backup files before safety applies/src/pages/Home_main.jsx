import { useEffect, useRef, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, useMotionValue, useTransform, useSpring, AnimatePresence, useScroll, useVelocity, useAnimationFrame } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { Video, BookOpen, GraduationCap, BarChart3, ArrowRight, Zap, Shield, Cpu, Globe, Hand, Sparkles } from 'lucide-react'
import CinematicScene from '../components/scene/CinematicScene'

gsap.registerPlugin(ScrollTrigger)

/* ─── Google Fonts injection ─────────────────────────────────────────────── */
const fontLink = document.createElement('link')
fontLink.rel  = 'stylesheet'
fontLink.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,300;0,400;0,700;0,900;1,300;1,400&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;700;900&display=swap'
if (!document.head.querySelector('link[href*="Playfair"]')) document.head.appendChild(fontLink)

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

/** Per-character animated reveal with 3-D flip */
function SplitChars({ text, style, charStyle, stagger = 0.04, delay = 0, once = true }) {
  const ref    = useRef(null)
  const inView = useRef(false)

  useEffect(() => {
    const chars = ref.current?.querySelectorAll('.sc')
    if (!chars?.length) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && (!inView.current || !once)) {
        inView.current = true
        gsap.fromTo(chars,
          { opacity: 0, y: 70, rotateX: -90, filter: 'blur(10px)' },
          { opacity: 1, y: 0, rotateX: 0, filter: 'blur(0px)',
            duration: 0.75, stagger, delay, ease: 'back.out(1.6)' }
        )
      }
    }, { threshold: 0.1 })
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [stagger, delay, once])

  return (
    <span ref={ref} style={{ display: 'inline-block', perspective: '800px', ...style }}>
      {text.split('').map((ch, i) => (
        <span key={i} className="sc"
          style={{ display: 'inline-block', opacity: 0, whiteSpace: 'pre', ...charStyle }}>
          {ch}
        </span>
      ))}
    </span>
  )
}

/** Spring-physics magnetic button */
function MagButton({ children, to, style }) {
  const ref = useRef(null)
  const x   = useMotionValue(0)
  const y   = useMotionValue(0)
  const sx  = useSpring(x, { stiffness: 250, damping: 16 })
  const sy  = useSpring(y, { stiffness: 250, damping: 16 })

  const onMove  = e => {
    const r = ref.current?.getBoundingClientRect()
    if (!r) return
    x.set((e.clientX - r.left - r.width  / 2) * 0.45)
    y.set((e.clientY - r.top  - r.height / 2) * 0.45)
  }
  const onLeave = () => { x.set(0); y.set(0) }

  return (
    <Link to={to} style={{ textDecoration: 'none' }}>
      <motion.button ref={ref}
        onMouseMove={onMove} onMouseLeave={onLeave}
        style={{ x: sx, y: sy, ...style }}
        whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
      >
        {children}
      </motion.button>
    </Link>
  )
}

/** Counting number that animates up on scroll into view */
function Counter({ value, suffix = '', prefix = '' }) {
  const [display, setDisplay] = useState(0)
  const ref     = useRef(null)
  const started = useRef(false)

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true
        gsap.to({ val: 0 }, {
          val: value, duration: 2.2, ease: 'power3.out',
          onUpdate: function () { setDisplay(Math.round(this.targets()[0].val)) },
        })
      }
    }, { threshold: 0.3 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [value])

  return (
    <span ref={ref} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
      {prefix}{display}{suffix}
    </span>
  )
}

/** Infinite ticker tape marquee */
function Marquee({ items, speed = 28 }) {
  return (
    <div style={{
      overflow: 'hidden', whiteSpace: 'nowrap', padding: '1.1rem 0',
      borderTop: '1px solid rgba(255,255,255,0.06)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(8px)',
    }}>
      <motion.div
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: speed, repeat: Infinity, ease: 'linear' }}
        style={{ display: 'inline-flex', gap: '3.5rem', alignItems: 'center' }}
      >
        {[...items, ...items].map((item, i) => (
          <span key={i} style={{
            display: 'inline-flex', alignItems: 'center', gap: '1rem',
            fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.14em',
            color: 'rgba(255,255,255,0.22)',
          }}>
            <motion.span
              animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.3, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.15 }}
              style={{ color: '#c084fc', fontSize: '0.55rem' }}>◆</motion.span>
            {item}
          </span>
        ))}
      </motion.div>
    </div>
  )
}

/** Tilt-on-hover 3-D card */
function TiltCard({ children, style, intensity = 12 }) {
  const ref = useRef(null)
  const rx  = useMotionValue(0)
  const ry  = useMotionValue(0)
  const srx = useSpring(rx, { stiffness: 300, damping: 25 })
  const sry = useSpring(ry, { stiffness: 300, damping: 25 })

  const onMove = e => {
    const r = ref.current?.getBoundingClientRect()
    if (!r) return
    const px = (e.clientX - r.left) / r.width  - 0.5
    const py = (e.clientY - r.top)  / r.height - 0.5
    ry.set( px * intensity)
    rx.set(-py * intensity)
  }
  const onLeave = () => { rx.set(0); ry.set(0) }

  return (
    <motion.div ref={ref}
      onMouseMove={onMove} onMouseLeave={onLeave}
      style={{ rotateX: srx, rotateY: sry, transformStyle: 'preserve-3d',
        perspective: 1000, ...style }}
    >
      {children}
    </motion.div>
  )
}

/** Animated gradient text that shifts hue on hover */
function GradientText({ children, style, from = '#c084fc', to = '#f472b6' }) {
  return (
    <motion.span
      style={{
        background: `linear-gradient(135deg, ${from}, ${to})`,
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        backgroundClip: 'text', ...style,
      }}
      whileHover={{ filter: 'brightness(1.25) saturate(1.4)' }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.span>
  )
}

/** Glowing orb that drifts in background */
function FloatingOrb({ x, y, size, color, duration, delay }) {
  return (
    <motion.div
      animate={{ x: [0, 30, -20, 0], y: [0, -40, 20, 0], scale: [1, 1.15, 0.95, 1] }}
      transition={{ duration, repeat: Infinity, ease: 'easeInOut', delay }}
      style={{
        position: 'absolute', left: x, top: y,
        width: size, height: size, borderRadius: '50%',
        background: color, filter: 'blur(80px)', opacity: 0.35,
        pointerEvents: 'none',
      }}
    />
  )
}

/* ─── Data ─────────────────────────────────────────────────────────────────── */
const MARQUEE_ITEMS = [
  'Indian Sign Language', 'Real-Time Translation', 'MediaPipe Hand Tracking',
  'MLP Classifier', '63 Million Users', 'Privacy First', 'Edge AI',
  'WebGL Experience', 'No Cloud Required', 'Bilingual Output', 'Drishya Vaani',
]

const FEATURES = [
  { icon: Video,         title: 'Live Translator',  desc: 'Real-time ISL gesture recognition via webcam with sub-80ms latency.',    to: '/translate',  color: '#c084fc', accent: '#e879f9', num: '01' },
  { icon: BookOpen,      title: 'Sign Dictionary',  desc: 'Browse all ISL signs with Hindi & English translations side by side.',   to: '/dictionary', color: '#38bdf8', accent: '#818cf8', num: '02' },
  { icon: GraduationCap, title: 'Learning Mode',    desc: 'AI-coached flashcards and interactive ISL quiz system.',                 to: '/learn',      color: '#facc15', accent: '#fb923c', num: '03' },
  { icon: BarChart3,     title: 'Analytics',        desc: 'Accuracy trends, session stats, and personal progress insights.',        to: '/dashboard',  color: '#f472b6', accent: '#fb7185', num: '04' },
]

const STATS = [
  { label: 'ISL Users',  value: 63,  suffix: 'M+', sub: 'Native signers in India',         prefix: '' },
  { label: 'Accuracy',   value: 99,  suffix: '.7%',sub: 'On classification test set',       prefix: '' },
  { label: 'Latency',    value: 80,  suffix: 'ms', sub: 'Per prediction, in-browser',       prefix: '<' },
  { label: 'Landmarks',  value: 252, suffix: '',   sub: 'Features per prediction',           prefix: '' },
]

const PILLARS = [
  { icon: Zap,      title: 'Instant',   desc: 'Under 80ms from hand movement to text — faster than the human eye blinks.',          color: '#facc15' },
  { icon: Shield,   title: 'Private',   desc: 'No video ever leaves your device. All ML inference runs 100% locally.',              color: '#34d399' },
  { icon: Cpu,      title: 'AI-Native', desc: 'MediaPipe landmarks feed a trained MLP classifier for state-of-the-art accuracy.',   color: '#38bdf8' },
  { icon: Globe,    title: 'Inclusive', desc: 'Designed for the 63M ISL users too often left out of the digital conversation.',      color: '#c084fc' },
]

const TEAM = [
  { name: 'Khushi Kumari', role: 'Developer', color: '#c084fc', accent: '#e879f9' },
  { name: 'Kiran Harak',   role: 'Developer', color: '#38bdf8', accent: '#818cf8' },
  { name: 'Nupur Thakur',  role: 'Developer', color: '#f472b6', accent: '#fb923c' },
]

/* ─── Main ─────────────────────────────────────────────────────────────────── */
export default function Home() {
  const [scrollPct,    setScrollPct]    = useState(0)
  const [mousePos,     setMousePos]     = useState({ x: 0, y: 0 })
  const [cursorHover,  setCursorHover]  = useState(false)
  const containerRef   = useRef(null)

  useEffect(() => {
    const mv = e => { setMousePos({ x: e.clientX, y: e.clientY }) }
    window.addEventListener('mousemove', mv, { passive: true })
    return () => window.removeEventListener('mousemove', mv)
  }, [])

  /* ── Lenis + GSAP ScrollTrigger ── */
  useEffect(() => {
    const scrollEl = document.getElementById('main-scroll')
    if (!scrollEl) return

    const lenis = new Lenis({
      wrapper: scrollEl,
      content: scrollEl.firstElementChild,
      duration: 1.5,
      easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    })

    let rafId
    const raf = t => { lenis.raf(t); rafId = requestAnimationFrame(raf) }
    rafId = requestAnimationFrame(raf)
    lenis.on('scroll', ScrollTrigger.update)
    ScrollTrigger.defaults({ scroller: scrollEl })

    const onScroll = () => {
      const max = scrollEl.scrollHeight - scrollEl.clientHeight
      setScrollPct(max > 0 ? (scrollEl.scrollTop / max) * 100 : 0)
    }
    scrollEl.addEventListener('scroll', onScroll, { passive: true })

    /* ── Hero parallax fade ── */
    gsap.to('.home-hero-inner', {
      opacity: 0, y: -80,
      scrollTrigger: { trigger: '.home-hero', start: 'top top', end: '70% top', scrub: 1.8 },
    })

    /* ── Feature cards — 3-D cinematic slide ── */
    gsap.utils.toArray('.feat-card').forEach((el, i) => {
      gsap.fromTo(el,
        { x: i % 2 === 0 ? -140 : 140, opacity: 0, rotateY: i % 2 === 0 ? -30 : 30, scale: 0.88 },
        { x: 0, opacity: 1, rotateY: 0, scale: 1,
          scrollTrigger: { trigger: el, start: 'top 88%', end: 'top 38%', scrub: 1.4 } }
      )
    })

    /* ── Stat cards staggered pop ── */
    gsap.utils.toArray('.stat-card').forEach((el, i) => {
      gsap.fromTo(el,
        { scale: 0.55, opacity: 0, y: 90, rotateX: 20 },
        { scale: 1, opacity: 1, y: 0, rotateX: 0,
          scrollTrigger: { trigger: el, start: 'top 92%', end: 'top 52%', scrub: 1.1 },
          delay: i * 0.06,
        }
      )
    })

    /* ── Pillar cards staggered from below ── */
    gsap.utils.toArray('.pillar-card').forEach((el, i) => {
      gsap.fromTo(el,
        { y: 80, opacity: 0 },
        { y: 0, opacity: 1,
          scrollTrigger: { trigger: el, start: 'top 90%', end: 'top 55%', scrub: 1 },
          delay: i * 0.08,
        }
      )
    })

    /* ── Section labels reveal ── */
    gsap.utils.toArray('.section-label').forEach(el => {
      gsap.fromTo(el,
        { scaleX: 0, transformOrigin: 'left' },
        { scaleX: 1, scrollTrigger: { trigger: el, start: 'top 85%', end: 'top 60%', scrub: 1 } }
      )
    })

    return () => {
      lenis.destroy()
      cancelAnimationFrame(rafId)
      ScrollTrigger.defaults({ scroller: undefined })
      ScrollTrigger.getAll().forEach(t => t.kill())
      scrollEl.removeEventListener('scroll', onScroll)
    }
  }, [])

  return (
    <div ref={containerRef}
      style={{ background: 'linear-gradient(160deg,#08040f 0%,#0a0614 40%,#060410 100%)',
        color: '#fff', fontFamily: "'Inter', sans-serif", position: 'relative',
        minHeight: '100%', overflow: 'hidden',
      }}>



      {/* ── 3-D Background ── */}
      <CinematicScene />

      {/* ── Floating ambient orbs ── */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1 }}>
        <FloatingOrb x="10%" y="20%" size={500} color="radial-gradient(circle, #7c3aed, transparent)" duration={14} delay={0} />
        <FloatingOrb x="65%" y="60%" size={400} color="radial-gradient(circle, #4f46e5, transparent)" duration={18} delay={3} />
        <FloatingOrb x="40%" y="-5%" size={350} color="radial-gradient(circle, #9333ea, transparent)" duration={12} delay={6} />
        {/* Mouse-tracking orb */}
        <motion.div
          style={{
            position: 'absolute', width: 300, height: 300,
            borderRadius: '50%', pointerEvents: 'none',
            background: 'radial-gradient(circle, rgba(192,132,252,0.12), transparent)',
            filter: 'blur(50px)',
            left: mousePos.x - 150, top: mousePos.y - 150,
            transition: 'left 0.4s ease, top 0.4s ease',
          }}
        />
      </div>

      {/* ── Scroll progress bar ── */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999, height: 2,
        background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }}>
        <motion.div style={{
          height: '100%', width: `${scrollPct}%`,
          background: 'linear-gradient(90deg, #7c3aed, #c084fc, #f472b6)',
          boxShadow: '0 0 12px rgba(192,132,252,0.8)',
          transition: 'width 0.12s linear',
        }} />
      </div>

      {/* ══════════════════════════════════════════════════ */}
      {/*   SCROLLABLE CONTENT LAYER                        */}
      {/* ══════════════════════════════════════════════════ */}
      <div style={{ position: 'relative', zIndex: 10 }}>

        {/* ═══ HERO ═══════════════════════════════════════ */}
        <section className="home-hero"
          style={{ height: '100vh', display: 'flex', flexDirection: 'column',
            justifyContent: 'flex-end', padding: '0 7vw 9vh', position: 'relative' }}>

          {/* Noise texture overlay */}
          <div style={{ position: 'absolute', inset: 0, opacity: 0.03, pointerEvents: 'none',
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
            backgroundSize: '256px' }} />

          <div className="home-hero-inner">

            {/* Eyebrow tag */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.4, ease: [0.16,1,0.3,1] }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', marginBottom: '2rem' }}
              onMouseEnter={() => setCursorHover(true)}
              onMouseLeave={() => setCursorHover(false)}
            >
              <motion.span
                animate={{ scaleX: [0, 1] }} transition={{ duration: 0.8, delay: 0.6 }}
                style={{ display: 'inline-block', width: 40, height: 1,
                  background: 'linear-gradient(90deg, #c084fc, #f472b6)',
                  transformOrigin: 'left', boxShadow: '0 0 8px #c084fc' }} />
              <motion.span
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
                style={{ fontSize: '0.72rem', textTransform: 'uppercase',
                  letterSpacing: '0.22em', color: '#c084fc',
                  textShadow: '0 0 20px rgba(192,132,252,0.6)' }}>
                Drishya Vaani · दृश्य वाणी
              </motion.span>

              {/* Live ping */}
              <motion.span
                animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1.6, repeat: Infinity }}
                style={{ width: 7, height: 7, borderRadius: '50%',
                  background: '#4ade80', boxShadow: '0 0 10px #4ade80',
                  display: 'inline-block' }} />
              <span style={{ fontSize: '0.65rem', color: 'rgba(74,222,128,0.7)',
                letterSpacing: '0.1em', textTransform: 'uppercase' }}>Live</span>
            </motion.div>

            {/* Giant headline — line by line reveal */}
            <h1 style={{ fontSize: 'clamp(3.8rem, 11vw, 10.5rem)', fontWeight: 300,
              lineHeight: 0.9, fontFamily: "'Playfair Display', Georgia, serif",
              letterSpacing: '-0.025em', marginBottom: '2rem' }}>
              {[
                { word: 'Limitless',  delay: 0.15, italic: false },
                { word: 'begins',     delay: 0.28, italic: true, outline: true },
                { word: 'here.',      delay: 0.42, italic: false },
              ].map(({ word, delay, italic, outline }) => (
                <div key={word} style={{ overflow: 'hidden' }}>
                  <motion.div
                    initial={{ y: '110%', opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 1.1, delay, ease: [0.16, 1, 0.3, 1] }}
                    style={{ display: 'inline-block' }}
                  >
                    {outline
                      ? <span style={{ WebkitTextStroke: '1px rgba(192,132,252,0.7)',
                          color: 'transparent', fontStyle: 'italic',
                          filter: 'drop-shadow(0 0 30px rgba(192,132,252,0.5))' }}>
                          {word}
                        </span>
                      : <span style={{ fontStyle: italic ? 'italic' : 'normal' }}>{word}</span>
                    }
                  </motion.div>
                </div>
              ))}
            </h1>

            {/* Sub-text */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.9 }}
              style={{ color: 'rgba(255,255,255,0.45)', fontSize: '1rem',
                fontWeight: 300, maxWidth: 420, lineHeight: 1.8, marginBottom: '2rem',
                borderLeft: '2px solid rgba(192,132,252,0.4)', paddingLeft: '1rem' }}>
              Real-time Indian Sign Language translation — entirely in your browser,
              with no cloud, no account, and zero latency.
            </motion.p>

            {/* CTA row */}
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 1.1 }}
              style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}
              onMouseEnter={() => setCursorHover(true)}
              onMouseLeave={() => setCursorHover(false)}
            >
              <MagButton to="/translate" style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
                padding: '0.95rem 2.4rem', fontSize: '0.9rem', fontWeight: 500,
                borderRadius: '100px', color: '#fff', border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, #7c3aed, #c084fc, #f472b6)',
                backgroundSize: '200% 200%',
                boxShadow: '0 0 50px rgba(192,132,252,0.55), inset 0 0 30px rgba(255,255,255,0.05)',
                letterSpacing: '0.02em',
              }}>
                <Video size={16} /> Start Translating <ArrowRight size={14} />
              </MagButton>

              <MagButton to="/learn" style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
                padding: '0.95rem 2.2rem', fontSize: '0.9rem', fontWeight: 400,
                borderRadius: '100px', cursor: 'pointer',
                background: 'rgba(255,255,255,0.05)',
                color: 'rgba(255,255,255,0.75)',
                border: '1px solid rgba(255,255,255,0.12)',
                backdropFilter: 'blur(12px)',
              }}>
                <GraduationCap size={16} /> Learn ISL
              </MagButton>
            </motion.div>
          </div>

          {/* Animated scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.2, duration: 1 }}
            style={{ position: 'absolute', bottom: '4vh', left: '50%',
              transform: 'translateX(-50%)', display: 'flex',
              flexDirection: 'column', alignItems: 'center', gap: 8 }}
          >
            <motion.span
              animate={{ opacity: [0.3, 0.8, 0.3] }} transition={{ duration: 2, repeat: Infinity }}
              style={{ fontSize: '0.6rem', textTransform: 'uppercase',
                letterSpacing: '0.2em', color: 'rgba(192,132,252,0.5)' }}>
              Scroll
            </motion.span>
            <motion.div
              animate={{ y: [0, 16, 0], opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              style={{ width: 20, height: 34, border: '1px solid rgba(192,132,252,0.35)',
                borderRadius: 20, display: 'flex', justifyContent: 'center', paddingTop: 5 }}>
              <motion.div
                animate={{ y: [0, 10, 0] }} transition={{ duration: 2.2, repeat: Infinity }}
                style={{ width: 3, height: 7, borderRadius: 3,
                  background: 'linear-gradient(to bottom, #c084fc, #f472b6)' }} />
            </motion.div>
          </motion.div>
        </section>

        {/* ═══ MARQUEE ═══════════════════════════════════ */}
        <Marquee items={MARQUEE_ITEMS} />

        {/* ═══ SPACER — 3-D camera moves ══════════════════ */}
        <section style={{ height: '80vh' }} />

        {/* ═══ STATEMENT ══════════════════════════════════ */}
        <section style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', padding: '0 8vw' }}>
          <div>
            {/* Animated horizontal rule */}
            <motion.div className="section-label"
              style={{ height: 1, width: '60px',
                background: 'linear-gradient(90deg, #c084fc, transparent)',
                marginBottom: '2rem', boxShadow: '0 0 12px #c084fc' }} />

            <h2 style={{ fontSize: 'clamp(2.2rem, 5.5vw, 5rem)', fontWeight: 300,
              fontFamily: "'Playfair Display', Georgia, serif",
              lineHeight: 1.2, maxWidth: '900px' }}>
              <SplitChars text="Bridging the gap for " style={{ display: 'block' }} stagger={0.022} delay={0} />
              <SplitChars text="63 million "
                style={{ display: 'block', color: '#c084fc', fontStyle: 'italic',
                  textShadow: '0 0 60px rgba(192,132,252,0.5)' }}
                stagger={0.04} delay={0.12} />
              <SplitChars text="users through edge AI." style={{ display: 'block' }} stagger={0.022} delay={0.28} />
            </h2>
          </div>
        </section>

        {/* ═══ SPACER ═════════════════════════════════════ */}
        <section style={{ height: '55vh' }} />

        {/* ═══ PERFORMANCE ════════════════════════════════ */}
        <section style={{ minHeight: '75vh', display: 'flex', alignItems: 'center',
          justifyContent: 'flex-end', padding: '0 8vw' }}>
          <div style={{ maxWidth: 540 }}>
            <motion.div className="section-label"
              style={{ height: 1, background: 'linear-gradient(90deg, #c084fc, transparent)',
                marginBottom: '1.5rem', boxShadow: '0 0 12px #c084fc' }} />
            <SplitChars text="Predictions in"
              style={{ display: 'block', fontSize: 'clamp(0.8rem, 1.5vw, 1rem)',
                color: 'rgba(255,255,255,0.4)', marginBottom: '0.5rem' }} stagger={0.03} />
            <SplitChars text="under 80ms."
              style={{ display: 'block', fontSize: 'clamp(2.2rem, 4.5vw, 4rem)',
                fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 300,
                marginBottom: '1.5rem', lineHeight: 1.1 }}
              stagger={0.05} />
            <p style={{ color: 'rgba(255,255,255,0.38)', lineHeight: 1.9,
              fontSize: '0.92rem', fontWeight: 300, borderLeft: '1px solid rgba(192,132,252,0.3)',
              paddingLeft: '1rem' }}>
              MediaPipe extracts 21 hand landmarks per frame. A trained MLP classifier
              converts them to text — entirely in your browser. No cloud, no upload, no latency.
            </p>

            {/* Mini tech stack pills */}
            <motion.div
              initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.8 }}
              style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: '1.5rem' }}>
              {['MediaPipe', 'MLP', 'WebGL', 'Edge AI', 'No Cloud'].map(tag => (
                <span key={tag} style={{ fontSize: '0.7rem', padding: '4px 12px',
                  borderRadius: 100, border: '1px solid rgba(192,132,252,0.25)',
                  color: 'rgba(192,132,252,0.7)', background: 'rgba(192,132,252,0.06)',
                  letterSpacing: '0.06em' }}>
                  {tag}
                </span>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ═══ SPACER ═════════════════════════════════════ */}
        <section style={{ height: '35vh' }} />

        {/* ═══ FEATURES ═══════════════════════════════════ */}
        <section style={{ padding: '8vh 5vw' }}>
          <div style={{ marginBottom: '4rem' }}>
            <SplitChars text="Enter the portal."
              style={{ fontSize: 'clamp(2.2rem, 5.5vw, 4.5rem)',
                fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 300 }}
              stagger={0.04} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
            gap: '1.5rem', perspective: '1400px' }}>
            {FEATURES.map((f, idx) => (
              <Link key={idx} to={f.to} style={{ textDecoration: 'none' }}
                onMouseEnter={() => setCursorHover(true)}
                onMouseLeave={() => setCursorHover(false)}>
                <div className="feat-card" style={{ opacity: 0 }}>
                  <TiltCard intensity={10}>
                    <motion.div
                      whileHover={{
                        y: -14,
                        borderColor: f.color + '88',
                        boxShadow: `0 30px 80px ${f.color}30, 0 0 0 1px ${f.color}20`,
                        background: `linear-gradient(135deg, rgba(15,10,25,0.85), ${f.color}0a)`,
                      }}
                      transition={{ duration: 0.3 }}
                      style={{
                        padding: '3rem 2.4rem', borderRadius: '22px',
                        border: '1px solid rgba(255,255,255,0.07)',
                        background: 'rgba(12, 8, 22, 0.7)',
                        backdropFilter: 'blur(24px)',
                        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                        minHeight: '280px', cursor: 'none', transition: 'border-color 0.3s',
                        position: 'relative', overflow: 'hidden',
                      }}
                    >
                      {/* Ambient corner light */}
                      <div style={{ position: 'absolute', top: -40, right: -40, width: 120,
                        height: 120, borderRadius: '50%', background: f.color,
                        filter: 'blur(60px)', opacity: 0.12, pointerEvents: 'none' }} />

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <motion.div
                          whileHover={{ rotate: 15, scale: 1.2 }} transition={{ duration: 0.3 }}>
                          <f.icon size={30} color={f.color} style={{ filter: `drop-shadow(0 0 12px ${f.color})` }} />
                        </motion.div>
                        <span style={{ fontSize: '4.5rem', fontWeight: 900,
                          fontFamily: "'JetBrains Mono', monospace",
                          color: 'rgba(255,255,255,0.035)', lineHeight: 1 }}>
                          {f.num}
                        </span>
                      </div>

                      <div>
                        <h3 style={{ color: '#fff', fontSize: '1.35rem', fontWeight: 400,
                          marginBottom: '0.7rem', fontFamily: "'Playfair Display', serif" }}>
                          {f.title}
                        </h3>
                        <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: '0.83rem',
                          lineHeight: 1.75, marginBottom: '1.5rem' }}>
                          {f.desc}
                        </p>
                        <motion.div
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                            color: f.color, fontSize: '0.78rem', textTransform: 'uppercase',
                            letterSpacing: '0.1em', filter: `drop-shadow(0 0 6px ${f.color})` }}
                          whileHover={{ gap: '0.8rem' }} transition={{ duration: 0.2 }}>
                          Launch module <ArrowRight size={12} />
                        </motion.div>
                      </div>
                    </motion.div>
                  </TiltCard>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ═══ STATS ══════════════════════════════════════ */}
        <section style={{ padding: '8vh 5vw' }}>
          <div style={{ display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1.2rem' }}>
            {STATS.map(({ label, value, suffix, sub, prefix }) => (
              <div key={label} className="stat-card" style={{ opacity: 0 }}>
                <motion.div
                  whileHover={{ scale: 1.05, borderColor: 'rgba(192,132,252,0.55)',
                    boxShadow: '0 0 60px rgba(192,132,252,0.18)' }}
                  style={{
                    padding: '2.8rem 2rem', borderRadius: '20px',
                    border: '1px solid rgba(255,255,255,0.07)',
                    background: 'rgba(12,8,22,0.6)', backdropFilter: 'blur(20px)',
                    position: 'relative', overflow: 'hidden',
                  }}>
                  {/* Ghost grid accent */}
                  <div style={{ position: 'absolute', inset: 0, opacity: 0.04,
                    backgroundImage: 'linear-gradient(rgba(255,255,255,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.3) 1px, transparent 1px)',
                    backgroundSize: '20px 20px', pointerEvents: 'none' }} />

                  <div style={{ fontSize: 'clamp(2.4rem, 4.5vw, 3.5rem)',
                    fontWeight: 800, lineHeight: 1, marginBottom: '0.6rem',
                    background: 'linear-gradient(135deg, #c084fc, #f472b6)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    <Counter value={value} suffix={suffix} prefix={prefix || ''} />
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600,
                    color: 'rgba(255,255,255,0.85)', marginBottom: '0.3rem' }}>{label}</div>
                  <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.28)' }}>{sub}</div>
                </motion.div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ PILLARS ════════════════════════════════════ */}
        <section style={{ padding: '6vh 5vw' }}>
          <div style={{ marginBottom: '3.5rem' }}>
            <SplitChars text="Why Drishya Vaani."
              style={{ fontSize: 'clamp(1.8rem, 4vw, 3.2rem)',
                fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 300 }}
              stagger={0.035} />
          </div>
          <div style={{ display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1.1rem' }}>
            {PILLARS.map(({ icon: Icon, title, desc, color }, i) => (
              <div key={title} className="pillar-card" style={{ opacity: 0 }}>
                <motion.div
                  whileHover={{ y: -8, borderColor: color + '55',
                    boxShadow: `0 20px 60px ${color}20` }}
                  style={{
                    padding: '2.2rem 1.8rem', borderRadius: '18px',
                    border: '1px solid rgba(255,255,255,0.06)',
                    background: 'rgba(12,8,22,0.5)', backdropFilter: 'blur(14px)',
                    position: 'relative', overflow: 'hidden',
                  }}>
                  <div style={{ position: 'absolute', top: -20, right: -20, width: 80,
                    height: 80, borderRadius: '50%', background: color,
                    filter: 'blur(40px)', opacity: 0.15, pointerEvents: 'none' }} />
                  <div style={{ width: 44, height: 44, borderRadius: '14px',
                    background: color + '15', border: `1px solid ${color}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: '1.3rem',
                    boxShadow: `0 0 20px ${color}20` }}>
                    <Icon size={20} color={color} style={{ filter: `drop-shadow(0 0 6px ${color})` }} />
                  </div>
                  <h3 style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 500,
                    marginBottom: '0.6rem' }}>{title}</h3>
                  <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: '0.8rem',
                    lineHeight: 1.75 }}>{desc}</p>
                </motion.div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ BIG CTA ════════════════════════════════════ */}
        <section style={{ padding: '10vh 5vw', display: 'flex',
          flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}
          onMouseEnter={() => setCursorHover(true)}
          onMouseLeave={() => setCursorHover(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.88 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            style={{ padding: '5rem 5vw', borderRadius: '32px', maxWidth: 760, width: '100%',
              border: '1px solid rgba(192,132,252,0.22)',
              background: 'rgba(192,132,252,0.04)',
              backdropFilter: 'blur(28px)', position: 'relative', overflow: 'hidden' }}>

            {/* Rotating conic gradient border */}
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
              style={{ position: 'absolute', inset: -1, borderRadius: 33, zIndex: -1,
                background: 'conic-gradient(from 0deg, #7c3aed44, #c084fc88, #f472b644, #38bdf844, #7c3aed44)',
                pointerEvents: 'none' }} />

            {/* Inner shine */}
            <motion.div
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', repeatDelay: 2 }}
              style={{ position: 'absolute', top: 0, bottom: 0, width: '40%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)',
                pointerEvents: 'none', zIndex: 0 }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              <SplitChars text="Ready to bridge worlds?"
                style={{ display: 'block', fontSize: 'clamp(2rem, 4.5vw, 3.4rem)',
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontWeight: 300, marginBottom: '1rem', lineHeight: 1.2 }}
                stagger={0.04} />
              <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '2.8rem',
                fontSize: '1rem', lineHeight: 1.8, maxWidth: 480, margin: '0 auto 2.8rem' }}>
                Start translating Indian Sign Language in real time —
                no download, no account, no cloud.
              </p>
              <MagButton to="/translate" style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.7rem',
                padding: '1.1rem 3rem', fontSize: '1rem', fontWeight: 500, borderRadius: '100px',
                background: 'linear-gradient(135deg, #7c3aed, #c084fc, #f472b6)',
                color: '#fff', border: 'none', cursor: 'none',
                boxShadow: '0 0 70px rgba(192,132,252,0.5), 0 20px 40px rgba(0,0,0,0.3)',
                letterSpacing: '0.02em',
              }}>
                <Video size={18} /> Begin Translation <ArrowRight size={16} />
              </MagButton>
            </div>
          </motion.div>
        </section>

        {/* ═══ TEAM ════════════════════════════════════════ */}
        <section style={{ padding: '12vh 5vw 8vh', position: 'relative', overflow: 'hidden' }}>

          {/* Ghost BG word */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 0 }}>
            <motion.span
              animate={{ opacity: [0.03, 0.06, 0.03] }}
              transition={{ duration: 4, repeat: Infinity }}
              style={{ fontSize: 'clamp(6rem, 22vw, 20rem)', fontWeight: 900,
                fontFamily: "'Playfair Display', Georgia, serif",
                color: 'rgba(208,161,255,1)', letterSpacing: '-0.05em',
                userSelect: 'none', whiteSpace: 'nowrap' }}>
              CREATORS
            </motion.span>
          </div>

          {/* Label */}
          <div style={{ position: 'relative', zIndex: 1, marginBottom: '5rem', textAlign: 'center' }}>
            <motion.div
              initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              style={{ height: 1, background: 'linear-gradient(90deg,transparent,#c084fc,#f472b6,transparent)',
                marginBottom: '1.6rem', boxShadow: '0 0 20px rgba(192,132,252,0.5)' }} />
            <SplitChars text="Crafted with ❤️ by"
              style={{ fontSize: 'clamp(0.7rem, 1.4vw, 0.85rem)', textTransform: 'uppercase',
                letterSpacing: '0.22em', color: 'rgba(255,255,255,0.3)' }}
              stagger={0.04} />
          </div>

          {/* Team rows */}
          <div style={{ position: 'relative', zIndex: 1, display: 'flex',
            flexDirection: 'column', gap: '2px' }}>
            {TEAM.map(({ name, role, color, accent }, index) => (
              <motion.div key={name}
                initial={{ opacity: 0, x: index % 2 === 0 ? -120 : 120 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: index * 0.18, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ x: index % 2 === 0 ? 20 : -20 }}
                onMouseEnter={() => setCursorHover(true)}
                onMouseLeave={() => setCursorHover(false)}
                style={{ display: 'flex', alignItems: 'center',
                  justifyContent: index % 2 === 0 ? 'flex-start' : 'flex-end',
                  padding: '1.4rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)',
                  cursor: 'default', position: 'relative' }}>

                {/* Hover sweep line */}
                <motion.div
                  initial={{ scaleX: 0, opacity: 0 }}
                  whileHover={{ scaleX: 1, opacity: 1 }}
                  style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1,
                    background: `linear-gradient(90deg,transparent,${color},${accent},transparent)`,
                    transformOrigin: index % 2 === 0 ? 'left' : 'right',
                    boxShadow: `0 0 10px ${color}` }}
                  transition={{ duration: 0.4 }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: '2.2rem',
                  flexDirection: index % 2 === 0 ? 'row' : 'row-reverse' }}>

                  {/* Avatar orb */}
                  <motion.div
                    animate={{ boxShadow: [`0 0 20px ${color}40`,`0 0 70px ${color}90`,`0 0 20px ${color}40`] }}
                    transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', delay: index * 0.5 }}
                    whileHover={{ scale: 1.25, rotate: 10 }}
                    style={{ width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
                      background: `radial-gradient(circle at 35% 35%, ${accent}, ${color})`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.2rem', fontWeight: 800, color: '#fff',
                      fontFamily: "'Playfair Display', serif",
                      border: `1px solid ${color}70` }}>
                    {name.charAt(0)}
                  </motion.div>

                  {/* Name + role */}
                  <div style={{ textAlign: index % 2 === 0 ? 'left' : 'right' }}>
                    <motion.h3
                      whileHover={{ letterSpacing: '0.04em', filter: `drop-shadow(0 0 20px ${color})` }}
                      transition={{ duration: 0.4 }}
                      style={{ fontSize: 'clamp(2rem, 5.5vw, 5rem)', fontWeight: 300,
                        fontFamily: "'Playfair Display', Georgia, serif", lineHeight: 1.0,
                        marginBottom: '0.3rem',
                        background: `linear-gradient(135deg, #fff 40%, ${color})`,
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                      {name}
                    </motion.h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem',
                      justifyContent: index % 2 === 0 ? 'flex-start' : 'flex-end' }}>
                      <motion.span
                        animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.4, 1] }}
                        transition={{ duration: 2, repeat: Infinity, delay: index * 0.35 }}
                        style={{ width: 6, height: 6, borderRadius: '50%',
                          background: color, boxShadow: `0 0 8px ${color}`,
                          display: 'inline-block' }} />
                      <span style={{ fontSize: '0.72rem', textTransform: 'uppercase',
                        letterSpacing: '0.18em', color }}>
                        {role}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Ghost index */}
                <span style={{ position: 'absolute',
                  right: index % 2 === 0 ? '2vw' : 'auto',
                  left: index % 2 !== 0 ? '2vw' : 'auto',
                  fontSize: '7rem', fontWeight: 900,
                  fontFamily: "'JetBrains Mono', monospace",
                  color: 'rgba(255,255,255,0.02)', lineHeight: 1,
                  userSelect: 'none', pointerEvents: 'none' }}>
                  0{index + 1}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Tagline */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.7 }}
            style={{ textAlign: 'center', marginTop: '4rem', position: 'relative', zIndex: 1 }}>
            <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.18)',
              letterSpacing: '0.12em', fontStyle: 'italic' }}>
              — Making communication accessible for 63 million ISL users —
            </span>
          </motion.div>
        </section>

        {/* ═══ FOOTER ═════════════════════════════════════ */}
        <footer style={{ padding: '2.5rem 5vw', display: 'flex',
          justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: '1rem',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(20px)' }}>
          <div>
            <motion.p
              animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
              transition={{ duration: 4, repeat: Infinity }}
              style={{ fontSize: '1rem', fontWeight: 700,
                background: 'linear-gradient(135deg, #c084fc, #f472b6, #38bdf8, #c084fc)',
                backgroundSize: '300% 300%',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                marginBottom: '0.25rem' }}>
              Drishya Vaani
            </motion.p>
            <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.18)' }}>
              दृश्य वाणी — Visible Voice · 2026
            </p>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <kbd style={{ padding: '3px 8px', borderRadius: 6,
              background: 'rgba(255,255,255,0.07)', fontFamily: 'monospace',
              border: '1px solid rgba(255,255,255,0.1)' }}>Ctrl+K</kbd>
            Quick Nav
          </div>
        </footer>
      </div>
    </div>
  )
}