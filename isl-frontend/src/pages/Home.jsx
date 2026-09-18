import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import { Video, BookOpen, GraduationCap, BarChart3, ArrowRight, Sparkles, Shield, Zap } from 'lucide-react'

const FEATURES = [
  { icon: Video,         title: 'Live Translator', desc: 'Real-time ISL gesture recognition via webcam — no upload, no cloud.',        to: '/translate',  accent: '#7c3aed', soft: 'rgba(124,58,237,0.08)',  border: 'rgba(124,58,237,0.18)'  },
  { icon: BookOpen,      title: 'Sign Dictionary', desc: 'Browse every ISL sign with Hindi translations and visual references.',         to: '/dictionary', accent: '#0891b2', soft: 'rgba(8,145,178,0.08)',   border: 'rgba(8,145,178,0.18)'   },
  { icon: GraduationCap, title: 'Learning Mode',   desc: 'Flashcards and quizzes to sharpen your ISL recognition skills.',              to: '/learn',      accent: '#d97706', soft: 'rgba(217,119,6,0.08)',   border: 'rgba(217,119,6,0.18)'   },
  { icon: BarChart3,     title: 'Analytics',       desc: 'Confidence trends, per-category accuracy and rich session stats.',            to: '/dashboard',  accent: '#db2777', soft: 'rgba(219,39,119,0.08)', border: 'rgba(219,39,119,0.18)'  },
]

const STATS = [
  { value: '63M+',  label: 'ISL Users', sub: 'Native signers in India', color: '#7c3aed' },
  { value: '99.7%', label: 'Accuracy',  sub: 'On validation set',       color: '#0891b2' },
  { value: '<80ms', label: 'Latency',   sub: 'Per frame, on-device',    color: '#d97706' },
  { value: '252',   label: 'Landmarks', sub: 'MediaPipe features/pred', color: '#db2777' },
]

function Reveal({ children, delay = 0, y = 32 }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px 0px' })
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.75, delay, ease: [0.16, 1, 0.3, 1] }}>
      {children}
    </motion.div>
  )
}

function Orb({ style }) {
  return <div aria-hidden='true' style={{ position: 'absolute', borderRadius: '50%', filter: 'blur(90px)', pointerEvents: 'none', ...style }} />
}

export default function Home() {
  const videoRef = useRef(null)

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

  const BG = 'linear-gradient(160deg, #faf8ff 0%, #eef2ff 45%, #fdf6ff 100%)'
  const TOP_BG = '#faf8ff'
  const BOT_BG = '#fdf6ff'
  const MID_BG = '#eef2ff'

  return (
    <div style={{ background: BG, minHeight: '100%', color: '#1e1b4b', fontFamily: "'Inter', system-ui, sans-serif", position: 'relative', overflow: 'hidden' }}>

      {/* Ambient orbs */}
      <Orb style={{ width: 800, height: 800, top: -250, left: -250, background: 'radial-gradient(circle, rgba(196,181,253,0.3) 0%, transparent 65%)' }} />
      <Orb style={{ width: 600, height: 600, top: 0,    right: -100, background: 'radial-gradient(circle, rgba(186,230,255,0.28) 0%, transparent 65%)' }} />
      <Orb style={{ width: 500, height: 500, top: 800,  left: '25%', background: 'radial-gradient(circle, rgba(233,213,255,0.22) 0%, transparent 65%)' }} />

      {/* HERO */}
      <section className='home-hero-section' style={{ minHeight: 'calc(100vh - 3.5rem)', display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>

        {/* LEFT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '6vh 0 6vh 5vw', maxWidth: '600px', position: 'relative', zIndex: 2 }}>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }} style={{ display: 'inline-flex', width: 'fit-content' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.4rem 1.1rem', borderRadius: '9999px', background: 'rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.18)', color: '#7c3aed', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              <Sparkles size={11} /> Drishya Vaani · Indian Sign Language AI
            </span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.0, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{ fontSize: 'clamp(3rem, 7vw, 6rem)', fontWeight: 300, lineHeight: 1.0, fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: '-0.03em', color: '#1e1b4b', margin: 0 }}
          >
            Limitless<br />
            <span style={{ background: 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 45%, #0891b2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              begins.
            </span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.45 }}
            style={{ fontSize: 'clamp(0.9rem, 1.3vw, 1.05rem)', lineHeight: 1.8, color: '#64748b', maxWidth: '440px', margin: 0 }}
          >
            {'दृश्य वाणी'} bridges the communication gap for{' '}
            <em style={{ color: '#7c3aed', fontStyle: 'normal', fontWeight: 600 }}>63 million</em>{' '}
            deaf and hard-of-hearing users through pure edge-computed AI — zero cloud, total privacy.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.65 }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', flexWrap: 'wrap' }}
          >
            <Link to='/translate' style={{ textDecoration: 'none' }}>
              <motion.button whileHover={{ scale: 1.04, boxShadow: '0 14px 44px rgba(124,58,237,0.32)' }} whileTap={{ scale: 0.97 }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.9rem 2rem', fontSize: '0.9rem', fontWeight: 600, borderRadius: '100px', background: 'linear-gradient(135deg, #7c3aed, #a855f7)', color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 6px 24px rgba(124,58,237,0.25)', letterSpacing: '0.01em' }}
              >
                <Video size={15} /> Start Translating <ArrowRight size={13} />
              </motion.button>
            </Link>
            <Link to='/learn' style={{ textDecoration: 'none' }}>
              <motion.button whileHover={{ scale: 1.04, borderColor: 'rgba(124,58,237,0.45)' }} whileTap={{ scale: 0.97 }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.9rem 1.7rem', fontSize: '0.9rem', fontWeight: 500, borderRadius: '100px', background: 'rgba(124,58,237,0.05)', color: '#6d28d9', border: '1px solid rgba(124,58,237,0.2)', cursor: 'pointer' }}
              >
                <GraduationCap size={15} /> Learn ISL
              </motion.button>
            </Link>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.9 }}
            style={{ display: 'flex', alignItems: 'center', gap: '1.4rem', flexWrap: 'wrap' }}
          >
            {[{ icon: Shield, text: '100% Private' }, { icon: Zap, text: '<80ms Latency' }, { icon: Sparkles, text: '99.7% Accuracy' }].map(({ icon: Icon, text }) => (
              <span key={text} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>
                <Icon size={12} style={{ color: '#c4b5fd' }} /> {text}
              </span>
            ))}
          </motion.div>
        </div>

        {/* RIGHT: blended video */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.4, delay: 0.25 }}
          style={{ position: 'absolute', top: 0, right: 0, width: '52%', height: '100%', overflow: 'hidden', pointerEvents: 'none' }}
        >
          {/* video — overscan width so right crop hides edge artifacts */}
          <video ref={videoRef} src='/sign-language-girl.mp4' autoPlay loop muted playsInline
            style={{ position: 'absolute', top: 0, left: '-8%', width: '118%', height: '100%', objectFit: 'cover', objectPosition: '30% center', display: 'block' }}
          />

          {/* gradient mask — blends all edges into page bg */}
          <div aria-hidden='true' style={{
            position: 'absolute', inset: 0, zIndex: 1,
            backgroundImage: [
              'linear-gradient(to right, ' + MID_BG + ' 0%, rgba(238,242,255,0.92) 12%, rgba(238,242,255,0.4) 32%, transparent 52%)',
              'linear-gradient(to bottom, ' + TOP_BG + ' 0%, rgba(250,248,255,0.6) 12%, transparent 30%)',
              'linear-gradient(to top,    ' + BOT_BG + ' 0%, rgba(253,246,255,0.6) 12%, transparent 30%)',
              'linear-gradient(to left,   ' + BOT_BG + ' 0%, ' + BOT_BG + ' 2%, rgba(253,246,255,0.96) 8%, rgba(253,246,255,0.7) 20%, rgba(253,246,255,0.3) 32%, transparent 42%)',
            ].join(', '),
          }} />

          {/* right-edge hard kill — catches any remaining visible boundary */}
          <div aria-hidden='true' style={{
            position: 'absolute', top: 0, right: 0, width: '18%', height: '100%', zIndex: 2,
            background: 'linear-gradient(to left, ' + BOT_BG + ' 0%, rgba(253,246,255,0.95) 30%, transparent 100%)',
          }} />

          {/* soft radial vignette for colour harmony */}
          <div aria-hidden='true' style={{ position: 'absolute', inset: 0, zIndex: 3, background: 'radial-gradient(ellipse 75% 90% at 60% 50%, transparent 42%, rgba(238,242,255,0.55) 70%, rgba(238,242,255,0.9) 100%)' }} />


        </motion.div>

        {/* Scroll cue */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6, duration: 1 }}
          style={{ position: 'absolute', bottom: '3vh', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, zIndex: 10 }}
        >
          <span style={{ fontSize: '0.58rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: '#c4b5fd' }}>Scroll to explore</span>
          <motion.div
            animate={{ y: [0, 10, 0], opacity: [0.3, 1, 0.3] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            style={{ width: 1.5, height: 40, background: 'linear-gradient(to bottom, #a78bfa, transparent)', borderRadius: 1 }}
          />
        </motion.div>
      </section>

      {/* STATS */}
      <section style={{ padding: '4rem 5vw', position: 'relative' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem', maxWidth: '1100px', margin: '0 auto' }}>
          {STATS.map(({ value, label, sub, color }, i) => (
            <Reveal key={label} delay={i * 0.08}>
              <div
                style={{ padding: '1.75rem 1.5rem', borderRadius: '20px', textAlign: 'center', background: 'rgba(255,255,255,0.7)', border: '1.5px solid rgba(196,181,253,0.18)', boxShadow: '0 4px 20px rgba(124,58,237,0.04)', backdropFilter: 'blur(14px)', transition: 'transform 0.25s ease, box-shadow 0.25s ease' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 14px 36px ' + color + '22' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)';   e.currentTarget.style.boxShadow = '0 4px 20px rgba(124,58,237,0.04)' }}
              >
                <div style={{ fontSize: '2.1rem', fontWeight: 800, fontFamily: "'JetBrains Mono','Fira Code',monospace", color, marginBottom: '0.4rem', lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: '0.83rem', fontWeight: 600, color: '#374151', marginBottom: '0.2rem' }}>{label}</div>
                <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>{sub}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* MISSION */}
      <section style={{ padding: '5rem 5vw', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <div aria-hidden='true' style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(237,233,254,0.5) 0%, rgba(224,242,254,0.32) 100%)' }} />
        <Reveal>
          <div style={{ maxWidth: '800px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
            <p style={{ fontSize: '0.73rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#a78bfa', marginBottom: '1.5rem' }}>Our Mission</p>
            <h2 style={{ fontSize: 'clamp(1.7rem, 4vw, 3.1rem)', fontWeight: 300, fontFamily: "'Playfair Display', Georgia, serif", lineHeight: 1.45, color: '#1e1b4b', margin: 0 }}>
              Bridging the gap for{' '}
              <span style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', fontStyle: 'italic', fontWeight: 400 }}>63 million</span>{' '}
              users through pure edge-computed artificial intelligence.
            </h2>
          </div>
        </Reveal>
      </section>

      {/* PERFORMANCE */}
      <section className='home-perf-section' style={{ padding: '5rem 5vw', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center', maxWidth: '1200px', margin: '0 auto' }}>
        <Reveal>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { label: 'MediaPipe Hands', sub: '21 keypoints per hand',   pct: 92,   color: '#7c3aed' },
              { label: 'MLP Classifier',  sub: '252 features, on-device', pct: 99.7, color: '#0891b2' },
              { label: 'TensorFlow.js',   sub: 'WASM accelerated',        pct: 88,   color: '#d97706' },
            ].map(({ label, sub, pct, color }) => (
              <div key={label} style={{ padding: '1.2rem 1.4rem', borderRadius: '16px', background: 'rgba(255,255,255,0.78)', border: '1.5px solid rgba(196,181,253,0.18)', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', backdropFilter: 'blur(12px)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '0.84rem', color: '#1e1b4b' }}>{label}</p>
                    <p style={{ margin: 0, fontSize: '0.7rem', color: '#9ca3af' }}>{sub}</p>
                  </div>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color }}>{pct}%</span>
                </div>
                <div style={{ height: 4, borderRadius: 4, background: 'rgba(196,181,253,0.18)', overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }} whileInView={{ width: pct + '%' }} viewport={{ once: true }}
                    transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    style={{ height: '100%', borderRadius: 4, background: 'linear-gradient(90deg, ' + color + ', ' + color + '80)' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Reveal>
        <Reveal delay={0.15}>
          <div>
            <p style={{ fontSize: '0.73rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#a78bfa', marginBottom: '1rem' }}>Zero Latency</p>
            <h2 style={{ fontSize: 'clamp(1.7rem, 3vw, 2.7rem)', fontWeight: 400, fontFamily: "'Playfair Display', Georgia, serif", color: '#1e1b4b', marginBottom: '1.2rem', lineHeight: 1.25 }}>
              Predictions in under 80ms.
            </h2>
            <p style={{ color: '#64748b', lineHeight: 1.85, fontSize: '0.98rem', marginBottom: '1.5rem' }}>
              Drishya Vaani operates entirely within your browser — MediaPipe hand tracking combined with a trained MLP classifier delivers buttery-smooth translations. Your privacy is structurally guaranteed because your data never leaves your device.
            </p>
            <Link to='/translate' style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.45rem', color: '#7c3aed', fontWeight: 600, fontSize: '0.85rem' }}>
              Try it now <ArrowRight size={14} />
            </Link>
          </div>
        </Reveal>
      </section>

      {/* FEATURES */}
      <section style={{ padding: '5rem 5vw 6rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <Reveal>
            <div style={{ marginBottom: '3rem' }}>
              <p style={{ fontSize: '0.73rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#a78bfa', marginBottom: '0.75rem' }}>Platform</p>
              <h2 style={{ fontSize: 'clamp(1.7rem, 3.5vw, 3rem)', fontWeight: 300, fontFamily: "'Playfair Display', Georgia, serif", color: '#1e1b4b' }}>Enter the portal.</h2>
            </div>
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
            {FEATURES.map((feature, idx) => (
              <Reveal key={idx} delay={idx * 0.1}>
                <Link to={feature.to} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
                  <motion.div
                    whileHover={{ y: -6, boxShadow: '0 20px 48px ' + feature.accent + '18, 0 4px 12px rgba(0,0,0,0.05)' }}
                    transition={{ duration: 0.28, ease: 'easeOut' }}
                    style={{ padding: '2rem 1.75rem', borderRadius: '22px', background: 'rgba(255,255,255,0.78)', border: '1.5px solid ' + feature.border, boxShadow: '0 4px 20px rgba(124,58,237,0.04)', backdropFilter: 'blur(16px)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '218px', cursor: 'pointer', height: '100%' }}
                  >
                    <div style={{ width: 46, height: 46, borderRadius: '13px', background: feature.soft, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.4rem', border: '1px solid ' + feature.border }}>
                      <feature.icon size={20} color={feature.accent} />
                    </div>
                    <div>
                      <h3 style={{ color: '#1e1b4b', fontSize: '1rem', fontWeight: 600, marginBottom: '0.45rem' }}>{feature.title}</h3>
                      <p style={{ color: '#94a3b8', fontSize: '0.8rem', lineHeight: 1.65, marginBottom: '1.25rem' }}>{feature.desc}</p>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: feature.accent, fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Launch <ArrowRight size={11} /></span>
                    </div>
                  </motion.div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: '2.5rem 5vw', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderTop: '1px solid rgba(196,181,253,0.18)', background: 'rgba(250,248,255,0.6)', backdropFilter: 'blur(12px)' }}>
        <div>
          <p style={{ fontSize: '0.92rem', fontWeight: 700, color: '#7c3aed', marginBottom: '0.2rem' }}>Drishya Vaani</p>
          <p style={{ fontSize: '0.76rem', color: '#94a3b8' }}>{'\u0926\u0943\u0936\u094d\u092f \u0935\u093e\u0923\u0940'} — Visible Voice</p>
        </div>
        <div style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <kbd style={{ padding: '3px 8px', borderRadius: '6px', background: 'rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.15)', fontFamily: 'monospace', color: '#7c3aed', fontSize: '0.7rem' }}>Ctrl+K</kbd>
          Quick Nav
        </div>
      </footer>

      <style>{`
        @media (max-width: 900px) {
          .home-hero-section { grid-template-columns: 1fr !important; }
          .home-perf-section  { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}