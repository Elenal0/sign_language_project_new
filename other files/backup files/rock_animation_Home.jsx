import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { Video, BookOpen, GraduationCap, BarChart3, ArrowRight } from 'lucide-react'

import CinematicScene from '../components/scene/CinematicScene'

gsap.registerPlugin(ScrollTrigger)

const FEATURES = [
  { icon: Video,         title: 'Live Translator',  desc: 'Real-time ISL gesture recognition via webcam.',              to: '/translate',  color: '#cda4fa' },
  { icon: BookOpen,      title: 'Sign Dictionary',  desc: 'Browse all ISL signs with Hindi translations.',              to: '/dictionary', color: '#60a5fa' },
  { icon: GraduationCap, title: 'Learning Mode',    desc: 'Flashcards and quiz to sharpen your ISL recognition.',       to: '/learn',      color: '#facc15' },
  { icon: BarChart3,     title: 'Analytics',        desc: 'Confidence trends, per-category accuracy & session stats.', to: '/dashboard',  color: '#f472b6' },
]

export default function Home() {
  const containerRef = useRef(null)
  const lenisRef = useRef(null)

  useEffect(() => {
    // The real scroll container in this app is <main id="main-scroll">
    const scrollEl = document.getElementById('main-scroll')
    if (!scrollEl) return

    // Initialize Lenis on the actual scroll container
    const lenis = new Lenis({
      wrapper: scrollEl,
      content: scrollEl.firstElementChild,
      duration: 1.4,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      smoothTouch: false,
      infinite: false,
    })
    lenisRef.current = lenis

    // Tick Lenis via RAF
    let rafId
    function raf(time) {
      lenis.raf(time)
      rafId = requestAnimationFrame(raf)
    }
    rafId = requestAnimationFrame(raf)

    // Keep GSAP ScrollTrigger in sync with Lenis events
    lenis.on('scroll', () => ScrollTrigger.update())

    // Point GSAP ScrollTrigger at our real scroll container
    ScrollTrigger.defaults({ scroller: scrollEl })

    // Fade out hero text as we scroll
    gsap.to('.home-hero-content', {
      opacity: 0,
      y: -40,
      scrollTrigger: {
        trigger: '.home-hero-section',
        start: 'top top',
        end: '80% top',
        scrub: 1.5,
      },
    })

    // Reveal text blocks on scroll
    const blocks = gsap.utils.toArray('.home-reveal')
    blocks.forEach((block) => {
      gsap.fromTo(block,
        { opacity: 0, y: 60 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: block,
            start: 'top 85%',
            end: 'top 50%',
            scrub: 1,
          },
        }
      )
    })

    return () => {
      cancelAnimationFrame(rafId)
      lenis.destroy()
      ScrollTrigger.getAll().forEach(t => t.kill())
      ScrollTrigger.defaults({ scroller: undefined })
    }
  }, [])

  return (
    <div
      ref={containerRef}
      style={{ background: '#0f0c16', color: '#fff', fontFamily: "'Inter', sans-serif", position: 'relative' }}
    >
      {/* 3D WebGL Background — position:fixed, sits behind everything */}
      <CinematicScene />

      {/* ── Scrollable content layer ───────────────────────────── */}
      <div style={{ position: 'relative', zIndex: 10 }}>

        {/* HERO */}
        <section
          className="home-hero-section"
          style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '0 5vw 10vh' }}
        >
          <div className="home-hero-content">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.4 }}
              style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#cda4fa', marginBottom: '1.2rem' }}
            >
              Drishya Vaani · Indian Sign Language AI
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              style={{
                fontSize: 'clamp(2.8rem, 9vw, 8rem)',
                fontWeight: 300,
                lineHeight: 1.0,
                fontFamily: "'Playfair Display', Georgia, serif",
                letterSpacing: '-0.02em',
                marginBottom: '2rem',
              }}
            >
              Limitless<br />begins here.
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.9, delay: 0.9 }}
              style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}
            >
              <Link to="/translate" style={{ textDecoration: 'none' }}>
                <motion.button
                  whileHover={{ scale: 1.04, backgroundColor: '#b98ef4' }}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
                    padding: '0.85rem 2rem', fontSize: '0.95rem', fontWeight: 500,
                    borderRadius: '100px', background: '#cda4fa', color: '#0f0c16',
                    border: 'none', cursor: 'pointer', letterSpacing: '0.01em',
                  }}
                >
                  <Video size={16} /> Start Translating <ArrowRight size={14} />
                </motion.button>
              </Link>

              <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.35)' }}>
                No cloud. No upload. 100% private.
              </span>
            </motion.div>
          </div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.8, duration: 1 }}
            style={{ position: 'absolute', bottom: '5vh', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
          >
            <span style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.3)' }}>
              Scroll to explore
            </span>
            <motion.div
              animate={{ y: [0, 10, 0], opacity: [0.2, 0.8, 0.2] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              style={{ width: 1, height: 48, background: 'linear-gradient(to bottom, rgba(205,164,250,0.8), transparent)' }}
            />
          </motion.div>
        </section>

        {/* SPACER — camera travels through scene */}
        <section style={{ height: '80vh' }} />

        {/* MISSION STATEMENT */}
        <section style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', padding: '0 8vw' }}>
          <h2
            className="home-reveal"
            style={{
              fontSize: 'clamp(1.8rem, 4.5vw, 4rem)',
              fontWeight: 300,
              fontFamily: "'Playfair Display', Georgia, serif",
              lineHeight: 1.35,
              maxWidth: '780px',
              color: 'rgba(255,255,255,0.9)',
            }}
          >
            Bridging the gap for{' '}
            <em style={{ color: '#cda4fa' }}>63 million</em> users through pure edge-computed artificial intelligence.
          </h2>
        </section>

        {/* SPACER */}
        <section style={{ height: '60vh' }} />

        {/* PERFORMANCE STATEMENT */}
        <section style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 8vw' }}>
          <div className="home-reveal" style={{ maxWidth: '480px' }}>
            <p style={{ fontSize: '0.75rem', color: '#cda4fa', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '1rem' }}>
              Zero Latency
            </p>
            <h2 style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.8rem)', fontWeight: 400, fontFamily: "'Playfair Display', Georgia, serif", marginBottom: '1.4rem', lineHeight: 1.2 }}>
              Predictions in under 80ms.
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.55)', lineHeight: 1.9, fontSize: '1rem', fontWeight: 300 }}>
              Operating entirely within your browser — MediaPipe hand tracking combined with a trained MLP classifier. Your privacy is structurally guaranteed while delivering buttery smooth translations.
            </p>
          </div>
        </section>

        {/* SPACER */}
        <section style={{ height: '60vh' }} />

        {/* PORTAL / FEATURES */}
        <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '8vh 5vw' }}>
          <h2
            className="home-reveal"
            style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)', fontWeight: 300, fontFamily: "'Playfair Display', Georgia, serif", marginBottom: '4rem' }}
          >
            Enter the portal.
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
            {FEATURES.map((feature, idx) => (
              <Link key={idx} to={feature.to} style={{ textDecoration: 'none' }}>
                <motion.div
                  className="home-reveal"
                  whileHover={{ y: -8, borderColor: feature.color }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  style={{
                    padding: '2.5rem 2rem',
                    borderRadius: '20px',
                    border: '1px solid rgba(255,255,255,0.07)',
                    background: 'rgba(20, 14, 30, 0.5)',
                    backdropFilter: 'blur(16px)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '240px',
                    cursor: 'pointer',
                    transition: 'border-color 0.3s',
                  }}
                >
                  <feature.icon size={28} color={feature.color} style={{ opacity: 0.85 }} />
                  <div>
                    <h3 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 400, marginBottom: '0.6rem' }}>{feature.title}</h3>
                    <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.82rem', lineHeight: 1.6, marginBottom: '1.2rem' }}>{feature.desc}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: feature.color, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Launch <ArrowRight size={13} />
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </section>

        {/* STATS */}
        <section style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 5vw' }}>
          <div className="home-reveal" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
            {[
              { label: 'ISL Users',  value: '63M+',    sub: 'Native signers' },
              { label: 'Accuracy',   value: '99.7%',   sub: 'On test set' },
              { label: 'Latency',    value: '<80ms',   sub: 'Per frame' },
              { label: 'Landmarks', value: '252',      sub: 'Features/pred' },
            ].map(({ label, value, sub }) => (
              <div key={label} style={{ padding: '2rem 1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(20,14,30,0.4)', backdropFilter: 'blur(12px)' }}>
                <div style={{ fontSize: '2.2rem', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: '#cda4fa', marginBottom: '0.4rem' }}>{value}</div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff', marginBottom: '0.2rem' }}>{label}</div>
                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)' }}>{sub}</div>
              </div>
            ))}
          </div>
        </section>

        {/* FOOTER */}
        <footer style={{ padding: '4rem 5vw 3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div>
            <p style={{ fontSize: '1rem', fontWeight: 600, color: '#cda4fa', marginBottom: '0.3rem' }}>Drishya Vaani</p>
            <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)' }}>दृश्य वाणी — Visible Voice</p>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <kbd style={{ padding: '3px 8px', borderRadius: '6px', background: 'rgba(255,255,255,0.07)', fontFamily: 'monospace' }}>Ctrl+K</kbd> Quick Nav
          </div>
        </footer>

      </div>
    </div>
  )
}