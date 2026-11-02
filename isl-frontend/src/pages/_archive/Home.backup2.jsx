import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { Video, BookOpen, GraduationCap, BarChart3, ArrowRight, Zap, Shield, Cpu, Globe } from 'lucide-react'
import CinematicScene from '../components/scene/CinematicScene'

gsap.registerPlugin(ScrollTrigger)

/* ─────────────────────────────────────────────── helpers */

/** Splits text into per-character spans for letter animation */
function SplitChars({ text, style, charStyle, stagger = 0.04, delay = 0, once = true }) {
  const ref = useRef(null)
  const inView = useRef(false)

  useEffect(() => {
    const chars = ref.current?.querySelectorAll('.sc')
    if (!chars) return

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && (!inView.current || !once)) {
        inView.current = true
        gsap.fromTo(chars,
          { opacity: 0, y: 60, rotateX: -90, filter: 'blur(8px)' },
          { opacity: 1, y: 0, rotateX: 0, filter: 'blur(0px)', duration: 0.7, stagger, delay, ease: 'back.out(1.8)' }
        )
      }
    }, { threshold: 0.1 })

    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [stagger, delay, once])

  return (
    <span ref={ref} style={{ display: 'inline-block', perspective: '600px', ...style }}>
      {text.split('').map((ch, i) => (
        <span key={i} className="sc" style={{ display: 'inline-block', opacity: 0, whiteSpace: 'pre', ...charStyle }}>
          {ch}
        </span>
      ))}
    </span>
  )
}

/** Floating magnetic button */
function MagButton({ children, to, style }) {
  const ref = useRef(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 200, damping: 15 })
  const sy = useSpring(y, { stiffness: 200, damping: 15 })

  const onMove = (e) => {
    const r = ref.current?.getBoundingClientRect()
    if (!r) return
    x.set((e.clientX - r.left - r.width  / 2) * 0.4)
    y.set((e.clientY - r.top  - r.height / 2) * 0.4)
  }
  const onLeave = () => { x.set(0); y.set(0) }

  return (
    <Link to={to} style={{ textDecoration: 'none' }}>
      <motion.button
        ref={ref}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        style={{ x: sx, y: sy, ...style }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
      >
        {children}
      </motion.button>
    </Link>
  )
}

/** Animated counter that counts up when visible */
function Counter({ value, suffix = '', prefix = '' }) {
  const [display, setDisplay] = useState(0)
  const ref = useRef(null)
  const started = useRef(false)

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true
        gsap.to({ val: 0 }, {
          val: value,
          duration: 2,
          ease: 'power2.out',
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

/** Infinite horizontal marquee */
function Marquee({ items }) {
  return (
    <div style={{ overflow: 'hidden', whiteSpace: 'nowrap', padding: '1rem 0', borderTop: '1px solid rgba(255,255,255,0.07)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
      <motion.div
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
        style={{ display: 'inline-flex', gap: '3rem', alignItems: 'center' }}
      >
        {[...items, ...items].map((item, i) => (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '1rem', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.25)' }}>
            <span style={{ color: '#c084fc', fontSize: '0.6rem' }}>◆</span>
            {item}
          </span>
        ))}
      </motion.div>
    </div>
  )
}

const MARQUEE_ITEMS = [
  'Indian Sign Language', 'Real-Time Translation', 'MediaPipe Hand Tracking',
  'MLP Classifier', '63 Million Users', 'Privacy First', 'Edge AI',
  'WebGL Experience', 'No Cloud Required', 'Bilingual Output',
]

const FEATURES = [
  { icon: Video,         title: 'Live Translator',  desc: 'Real-time ISL gesture recognition via webcam.',    to: '/translate',  color: '#c084fc', num: '01' },
  { icon: BookOpen,      title: 'Sign Dictionary',  desc: 'Browse all ISL signs with Hindi translations.',    to: '/dictionary', color: '#38bdf8', num: '02' },
  { icon: GraduationCap, title: 'Learning Mode',    desc: 'AI-coached flashcards and ISL quiz system.',       to: '/learn',      color: '#facc15', num: '03' },
  { icon: BarChart3,     title: 'Analytics',        desc: 'Accuracy trends, session stats, and insights.',    to: '/dashboard',  color: '#f472b6', num: '04' },
]

const STATS = [
  { label: 'ISL Users',   value: 63,   suffix: 'M+',  sub: 'Native signers in India' },
  { label: 'Accuracy',    value: 99,   suffix: '.7%', sub: 'On classification test set' },
  { label: 'Latency',     value: 80,   suffix: 'ms',  sub: 'Per prediction, in-browser', prefix: '<' },
  { label: 'Landmarks',   value: 252,  suffix: '',    sub: 'Features per prediction' },
]

const PILLARS = [
  { icon: Zap,    title: 'Instant',    desc: 'Under 80ms from hand movement to text output — faster than the human eye.' },
  { icon: Shield, title: 'Private',    desc: 'No video ever leaves your device. All ML inference runs locally.' },
  { icon: Cpu,    title: 'AI-Native',  desc: 'MediaPipe landmarks feed a trained MLP classifier for maximum accuracy.' },
  { icon: Globe,  title: 'Inclusive',  desc: 'Designed for the 63 million ISL users often left out of digital tools.' },
]

/* ─────────────────────────────────────────────── main */
export default function Home() {
  const containerRef = useRef(null)
  const [scrollPct, setScrollPct] = useState(0)

  useEffect(() => {
    const scrollEl = document.getElementById('main-scroll')
    if (!scrollEl) return

    // Lenis smooth scroll
    const lenis = new Lenis({
      wrapper: scrollEl,
      content: scrollEl.firstElementChild,
      duration: 1.4,
      easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    })

    let rafId
    const raf = time => { lenis.raf(time); rafId = requestAnimationFrame(raf) }
    rafId = requestAnimationFrame(raf)
    lenis.on('scroll', ScrollTrigger.update)
    ScrollTrigger.defaults({ scroller: scrollEl })

    // Scroll progress bar
    const onScroll = () => {
      const max = scrollEl.scrollHeight - scrollEl.clientHeight
      setScrollPct(max > 0 ? (scrollEl.scrollTop / max) * 100 : 0)
    }
    scrollEl.addEventListener('scroll', onScroll, { passive: true })

    // Hero fade out
    gsap.to('.home-hero-inner', {
      opacity: 0, y: -60,
      scrollTrigger: { trigger: '.home-hero', start: 'top top', end: '70% top', scrub: 1.5 },
    })

    // Feature cards — cinematic slide-in from alternating sides
    gsap.utils.toArray('.feat-card').forEach((el, i) => {
      gsap.fromTo(el,
        { x: i % 2 === 0 ? -120 : 120, opacity: 0, rotateY: i % 2 === 0 ? -25 : 25 },
        {
          x: 0, opacity: 1, rotateY: 0,
          scrollTrigger: { trigger: el, start: 'top 85%', end: 'top 40%', scrub: 1.2 },
        }
      )
    })

    // Stat cards pop up
    gsap.utils.toArray('.stat-card').forEach((el, i) => {
      gsap.fromTo(el,
        { scale: 0.5, opacity: 0, y: 80 },
        {
          scale: 1, opacity: 1, y: 0,
          scrollTrigger: { trigger: el, start: 'top 90%', end: 'top 55%', scrub: 1 },
          delay: i * 0.05,
        }
      )
    })

    return () => {
      // Stop Lenis FIRST so it doesn't interfere with ScrollTrigger teardown
      lenis.destroy()
      cancelAnimationFrame(rafId)
      // Reset scroller BEFORE killing triggers so ScrollTrigger can remove its own listeners
      ScrollTrigger.defaults({ scroller: undefined })
      ScrollTrigger.getAll().forEach(t => t.kill())
      scrollEl.removeEventListener('scroll', onScroll)
    }
  }, [])

  return (
    <div ref={containerRef} style={{ background: '#0a0614', color: '#fff', fontFamily: "'Inter', sans-serif", position: 'relative' }}>

      {/* ── 3D Background ── */}
      <CinematicScene />

      {/* ── Scroll progress line ── */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999, height: '2px', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }}>
        <motion.div style={{ height: '100%', background: 'linear-gradient(90deg, #c084fc, #f472b6)', width: `${scrollPct}%`, transition: 'width 0.1s linear' }} />
      </div>

      {/* ── Scrollable Layer ── */}
      <div style={{ position: 'relative', zIndex: 10 }}>

        {/* ═══ HERO ═══ */}
        <section className="home-hero" style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '0 6vw 10vh', position: 'relative' }}>
          <div className="home-hero-inner">
            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.9, delay: 0.5 }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.8rem' }}
            >
              <span style={{ display: 'inline-block', width: 32, height: 1, background: '#c084fc' }} />
              <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#c084fc' }}>
                Drishya Vaani · दृश्य वाणी
              </span>
            </motion.div>

            {/* Giant split-char headline */}
            <h1 style={{ fontSize: 'clamp(3.5rem, 10vw, 9.5rem)', fontWeight: 300, lineHeight: 0.92, fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: '-0.02em', marginBottom: '1.6rem', overflow: 'hidden' }}>
              <div style={{ overflow: 'hidden' }}>
                <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}>
                  Limitless
                </motion.div>
              </div>
              <div style={{ overflow: 'hidden' }}>
                <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} transition={{ duration: 1, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}>
                  <span style={{ WebkitTextStroke: '1px rgba(192,132,252,0.6)', color: 'transparent' }}>begins</span>
                </motion.div>
              </div>
              <div style={{ overflow: 'hidden' }}>
                <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} transition={{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}>
                  here.
                </motion.div>
              </div>
            </h1>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.1 }}
              style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}
            >
              <MagButton to="/translate" style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
                padding: '0.9rem 2.2rem', fontSize: '0.9rem', fontWeight: 500,
                borderRadius: '100px', background: 'linear-gradient(135deg, #c084fc, #f472b6)',
                color: '#fff', border: 'none', cursor: 'pointer', letterSpacing: '0.01em',
                boxShadow: '0 0 40px rgba(192,132,252,0.5)',
              }}>
                <Video size={16} /> Start Translating <ArrowRight size={14} />
              </MagButton>

              <MagButton to="/learn" style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
                padding: '0.9rem 2rem', fontSize: '0.9rem', fontWeight: 400,
                borderRadius: '100px', background: 'rgba(255,255,255,0.06)',
                color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.12)',
                cursor: 'pointer', backdropFilter: 'blur(8px)',
              }}>
                <GraduationCap size={16} /> Learn ISL
              </MagButton>
            </motion.div>
          </div>

          {/* Scroll cue */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: 1 }}
            style={{ position: 'absolute', bottom: '4vh', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}
          >
            <motion.div
              animate={{ y: [0, 14, 0], opacity: [0.2, 1, 0.2] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              style={{ width: 20, height: 32, border: '1px solid rgba(192,132,252,0.4)', borderRadius: 20, position: 'relative', display: 'flex', justifyContent: 'center', paddingTop: 5 }}
            >
              <motion.div
                animate={{ y: [0, 10, 0], opacity: [1, 0, 1] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                style={{ width: 3, height: 6, borderRadius: 3, background: '#c084fc' }}
              />
            </motion.div>
          </motion.div>
        </section>

        {/* ═══ MARQUEE ═══ */}
        <Marquee items={MARQUEE_ITEMS} />

        {/* ═══ SPACER — camera flies ═══ */}
        <section style={{ height: '80vh' }} />

        {/* ═══ STATEMENT ═══ */}
        <section style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', padding: '0 8vw' }}>
          <h2 style={{ fontSize: 'clamp(2rem, 5vw, 4.5rem)', fontWeight: 300, fontFamily: "'Playfair Display', Georgia, serif", lineHeight: 1.25, maxWidth: '900px' }}>
            <SplitChars text="Bridging the gap for " style={{ display: 'block' }} stagger={0.025} delay={0} />
            <SplitChars
              text="63 million "
              style={{ display: 'block', color: '#c084fc', fontStyle: 'italic' }}
              stagger={0.04}
              delay={0.15}
            />
            <SplitChars text="users through edge AI." style={{ display: 'block' }} stagger={0.025} delay={0.3} />
          </h2>
        </section>

        {/* ═══ SPACER ═══ */}
        <section style={{ height: '60vh' }} />

        {/* ═══ PERFORMANCE ═══ */}
        <section style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 8vw' }}>
          <div style={{ maxWidth: 520 }}>
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              style={{ height: 1, background: 'linear-gradient(90deg, #c084fc, transparent)', marginBottom: '1.5rem', transformOrigin: 'left' }}
            />
            <SplitChars text="Predictions in" style={{ display: 'block', fontSize: 'clamp(0.8rem, 1.5vw, 1rem)', color: 'rgba(255,255,255,0.5)', marginBottom: '0.6rem' }} stagger={0.03} />
            <SplitChars
              text="under 80ms."
              style={{ display: 'block', fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 300, marginBottom: '1.5rem' }}
              stagger={0.05}
            />
            <p style={{ color: 'rgba(255,255,255,0.45)', lineHeight: 1.9, fontSize: '0.95rem', fontWeight: 300 }}>
              MediaPipe extracts 21 hand landmarks per frame. A trained MLP classifier converts them to text — entirely in your browser. No cloud, no upload, no latency.
            </p>
          </div>
        </section>

        {/* ═══ SPACER ═══ */}
        <section style={{ height: '40vh' }} />

        {/* ═══ FEATURES ═══ */}
        <section style={{ padding: '8vh 5vw' }}>
          <div style={{ marginBottom: '4rem' }}>
            <SplitChars text="Enter the portal." style={{ fontSize: 'clamp(2rem, 5vw, 4rem)', fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 300 }} stagger={0.04} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', perspective: '1200px' }}>
            {FEATURES.map((f, idx) => (
              <Link key={idx} to={f.to} style={{ textDecoration: 'none' }}>
                <div className="feat-card" style={{ opacity: 0 }}>
                  <motion.div
                    whileHover={{ y: -12, rotateX: 3, rotateY: idx % 2 === 0 ? -4 : 4, borderColor: f.color, boxShadow: `0 20px 60px ${f.color}30` }}
                    transition={{ duration: 0.35 }}
                    style={{
                      padding: '2.8rem 2.2rem',
                      borderRadius: '20px',
                      border: '1px solid rgba(255,255,255,0.07)',
                      background: 'rgba(15, 10, 25, 0.6)',
                      backdropFilter: 'blur(20px)',
                      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                      minHeight: '260px', cursor: 'pointer',
                      transition: 'border-color 0.3s, box-shadow 0.3s',
                      transformStyle: 'preserve-3d',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <f.icon size={28} color={f.color} />
                      <span style={{ fontSize: '4rem', fontWeight: 900, fontFamily: "'JetBrains Mono', monospace", color: 'rgba(255,255,255,0.04)', lineHeight: 1 }}>{f.num}</span>
                    </div>
                    <div>
                      <h3 style={{ color: '#fff', fontSize: '1.3rem', fontWeight: 400, marginBottom: '0.6rem', fontFamily: "'Playfair Display', serif" }}>{f.title}</h3>
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem', lineHeight: 1.7, marginBottom: '1.4rem' }}>{f.desc}</p>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: f.color, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        Launch module <ArrowRight size={12} />
                      </div>
                    </div>
                  </motion.div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ═══ STATS ═══ */}
        <section style={{ padding: '8vh 5vw' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.2rem' }}>
            {STATS.map(({ label, value, suffix, sub, prefix }) => (
              <div key={label} className="stat-card" style={{ opacity: 0 }}>
                <motion.div
                  whileHover={{ scale: 1.04, borderColor: 'rgba(192,132,252,0.5)', boxShadow: '0 0 40px rgba(192,132,252,0.15)' }}
                  style={{
                    padding: '2.5rem 1.8rem', borderRadius: '18px',
                    border: '1px solid rgba(255,255,255,0.07)',
                    background: 'rgba(15,10,25,0.5)', backdropFilter: 'blur(16px)',
                    transition: 'border-color 0.3s, box-shadow 0.3s',
                  }}
                >
                  <div style={{ fontSize: 'clamp(2.2rem, 4vw, 3.2rem)', fontWeight: 700, color: '#c084fc', lineHeight: 1, marginBottom: '0.5rem' }}>
                    <Counter value={value} suffix={suffix} prefix={prefix || ''} />
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: '0.25rem' }}>{label}</div>
                  <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)' }}>{sub}</div>
                </motion.div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ PILLARS ═══ */}
        <section style={{ padding: '6vh 5vw' }}>
          <div style={{ marginBottom: '3rem' }}>
            <SplitChars text="Why Drishya Vaani." style={{ fontSize: 'clamp(1.6rem, 3.5vw, 3rem)', fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 300 }} stagger={0.035} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            {PILLARS.map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -6 }}
                style={{
                  padding: '2rem 1.5rem', borderRadius: '16px',
                  border: '1px solid rgba(255,255,255,0.06)',
                  background: 'rgba(15,10,25,0.4)', backdropFilter: 'blur(12px)',
                }}
              >
                <div style={{ width: 40, height: 40, borderRadius: '12px', background: 'rgba(192,132,252,0.1)', border: '1px solid rgba(192,132,252,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.2rem' }}>
                  <Icon size={18} color="#c084fc" />
                </div>
                <h3 style={{ color: '#fff', fontSize: '1rem', fontWeight: 500, marginBottom: '0.5rem' }}>{title}</h3>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', lineHeight: 1.7 }}>{desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ═══ BIG CTA ═══ */}
        <section style={{ padding: '10vh 5vw', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            style={{
              padding: '5rem 4vw', borderRadius: '28px', maxWidth: 740, width: '100%',
              border: '1px solid rgba(192,132,252,0.2)',
              background: 'rgba(192,132,252,0.05)', backdropFilter: 'blur(24px)',
              position: 'relative', overflow: 'hidden',
            }}
          >
            {/* Animated glow behind CTA */}
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
              style={{ position: 'absolute', inset: -2, borderRadius: 30, zIndex: -1, background: 'conic-gradient(from 0deg, #c084fc22, #f472b622, #38bdf822, #c084fc22)', pointerEvents: 'none' }}
            />

            <SplitChars
              text="Ready to bridge worlds?"
              style={{ display: 'block', fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 300, marginBottom: '1rem' }}
              stagger={0.04}
            />
            <p style={{ color: 'rgba(255,255,255,0.45)', marginBottom: '2.5rem', fontSize: '1rem', lineHeight: 1.7 }}>
              Start translating Indian Sign Language in real time — no download, no account, no cloud.
            </p>
            <MagButton to="/translate" style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.7rem',
              padding: '1rem 2.8rem', fontSize: '1rem', fontWeight: 500, borderRadius: '100px',
              background: 'linear-gradient(135deg, #c084fc, #f472b6)',
              color: '#fff', border: 'none', cursor: 'pointer',
              boxShadow: '0 0 60px rgba(192,132,252,0.45)',
            }}>
              <Video size={18} /> Begin Translation <ArrowRight size={16} />
            </MagButton>
          </motion.div>
        </section>

        {/* ═══ TEAM SECTION ═══ */}
        <section style={{ padding: '12vh 5vw 8vh', position: 'relative', overflow: 'hidden' }}>

          {/* Giant blurred BG text */}
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none', zIndex: 0,
          }}>
            <span style={{
              fontSize: 'clamp(6rem, 20vw, 18rem)', fontWeight: 900,
              fontFamily: "'Playfair Display', Georgia, serif",
              color: 'rgba(208, 161, 255, 0.04)', letterSpacing: '-0.05em',
              userSelect: 'none', whiteSpace: 'nowrap',
            }}>
              CREATORS
            </span>
          </div>

          {/* Section label */}
          <div style={{ position: 'relative', zIndex: 1, marginBottom: '5rem', textAlign: 'center' }}>
            <motion.div
              initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              style={{ height: 1, background: 'linear-gradient(90deg, transparent, #c084fc, #f472b6, transparent)', marginBottom: '1.5rem' }}
            />
            <SplitChars
              text="Crafted with ❤️ by"
              style={{ fontSize: 'clamp(0.75rem, 1.5vw, 0.9rem)', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.35)' }}
              stagger={0.04}
            />
          </div>

          {/* Team members */}
          <div style={{
            position: 'relative', zIndex: 1,
            display: 'flex', flexDirection: 'column', gap: '2px',
          }}>
            {[
              { name: 'Khushi Kumari',  role: 'Developer',         index: 0, color: '#c084fc', accent: '#e879f9' },
              { name: 'Kiran Harak',    role: 'Developer',         index: 1, color: '#38bdf8', accent: '#818cf8' },
              { name: 'Nupur Thakur',   role: 'Developer',         index: 2, color: '#f472b6', accent: '#fb923c' },
            ].map(({ name, role, index, color, accent }) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, x: index % 2 === 0 ? -100 : 100 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, delay: index * 0.15, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ x: index % 2 === 0 ? 16 : -16 }}
                style={{
                  display: 'flex', alignItems: 'center',
                  justifyContent: index % 2 === 0 ? 'flex-start' : 'flex-end',
                  padding: '1.2rem 0',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  cursor: 'default', position: 'relative',
                }}
              >
                {/* Glow line that sweeps on hover */}
                <motion.div
                  initial={{ scaleX: 0, opacity: 0 }}
                  whileHover={{ scaleX: 1, opacity: 1 }}
                  style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0, height: 1,
                    background: `linear-gradient(90deg, transparent, ${color}, ${accent}, transparent)`,
                    transformOrigin: index % 2 === 0 ? 'left' : 'right',
                  }}
                  transition={{ duration: 0.4 }}
                />

                <div style={{
                  display: 'flex', alignItems: 'center', gap: '2rem',
                  flexDirection: index % 2 === 0 ? 'row' : 'row-reverse',
                }}>
                  {/* Pulsing orb avatar */}
                  <motion.div
                    animate={{ boxShadow: [`0 0 20px ${color}40`, `0 0 60px ${color}80`, `0 0 20px ${color}40`] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: index * 0.4 }}
                    whileHover={{ scale: 1.2 }}
                    style={{
                      width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
                      background: `radial-gradient(circle at 35% 35%, ${accent}, ${color})`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.1rem', fontWeight: 800, color: '#fff',
                      fontFamily: "'Playfair Display', serif",
                      border: `1px solid ${color}60`,
                    }}
                  >
                    {name.charAt(0)}
                  </motion.div>

                  {/* Name + role */}
                  <div style={{ textAlign: index % 2 === 0 ? 'left' : 'right' }}>
                    <motion.h3
                      whileHover={{ letterSpacing: '0.05em' }}
                      transition={{ duration: 0.4 }}
                      style={{
                        fontSize: 'clamp(1.8rem, 5vw, 4.5rem)', fontWeight: 300,
                        fontFamily: "'Playfair Display', Georgia, serif",
                        lineHeight: 1.0, marginBottom: '0.3rem',
                        background: `linear-gradient(135deg, #fff 40%, ${color})`,
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                      }}
                    >
                      {name}
                    </motion.h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', justifyContent: index % 2 === 0 ? 'flex-start' : 'flex-end' }}>
                      <motion.span
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}
                        style={{ width: 6, height: 6, borderRadius: '50%', background: color, display: 'inline-block' }}
                      />
                      <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: color }}>
                        {role}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Index number ghost */}
                <span style={{
                  position: 'absolute',
                  right: index % 2 === 0 ? '2vw' : 'auto',
                  left: index % 2 !== 0 ? '2vw' : 'auto',
                  fontSize: '6rem', fontWeight: 900,
                  fontFamily: "'JetBrains Mono', monospace",
                  color: 'rgba(255,255,255,0.025)',
                  lineHeight: 1, userSelect: 'none', pointerEvents: 'none',
                }}>
                  0{index + 1}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Bottom tagline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.6 }}
            style={{ textAlign: 'center', marginTop: '4rem', position: 'relative', zIndex: 1 }}
          >
            <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em', fontStyle: 'italic' }}>
              — Making communication accessible for 63 million ISL users —
            </span>
          </motion.div>
        </section>

        {/* ═══ FOOTER ═══ */}
        <footer style={{ padding: '2.5rem 5vw', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div>
            <p style={{ fontSize: '1rem', fontWeight: 600, background: 'linear-gradient(135deg, #c084fc, #f472b6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '0.2rem' }}>Drishya Vaani</p>
            <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.2)' }}>दृश्य वाणी — Visible Voice · 2026</p>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <kbd style={{ padding: '3px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.07)', fontFamily: 'monospace' }}>Ctrl+K</kbd> Quick Nav
          </div>
        </footer>

      </div>
    </div>
  )
}