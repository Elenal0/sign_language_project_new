import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, Video, BookOpen, GraduationCap, BarChart3, Users, Languages, Volume2 } from 'lucide-react'
import HandLandmarks from '../components/ui/HandLandmarks'
import { BrandMark } from '../components/ui/Brand'

// The nine signs the classifier is trained on today
const SIGNS = [
  ['Hello', 'नमस्ते'], ['How', 'कैसे'], ['You', 'आप'], ['I', 'मैं'], ['Nice', 'अच्छा'],
  ['Meet', 'मिलना'], ['Going', 'जाना'], ['School', 'विद्यालय'], ['Thank you', 'धन्यवाद'],
]

// Captions cycled in the hero viewfinder to show what the product does
const DEMO = [
  { sign: 'HELLO',     conf: 97, en: 'Hello, how are you?',      hi: 'नमस्ते, आप कैसे हैं?' },
  { sign: 'NICE',      conf: 94, en: 'Nice to meet you!',        hi: 'आपसे मिलकर अच्छा लगा!' },
  { sign: 'THANK YOU', conf: 98, en: 'Thank you, I am going now.', hi: 'धन्यवाद, अब मैं जा रहा हूँ।' },
]

const STEPS = [
  { n: '01', title: 'See', body: 'MediaPipe finds your hand in every camera frame and maps it to 21 landmarks — knuckles, joints and fingertips.' },
  { n: '02', title: 'Understand', body: 'A trained classifier reads the landmark shape, and only commits a word once the sign is held steady.' },
  { n: '03', title: 'Speak', body: 'Words become a sentence, then captions and natural speech — in English, Hindi or Marathi.' },
]

const STATEMENT = 'For the 63 million people in India who are deaf or hard of hearing, a conversation shouldn’t need an interpreter.'
const STATEMENT_ACCENT = new Set(['63', 'million'])

function Viewfinder() {
  const videoRef = useRef(null)
  const [i, setI] = useState(0)

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

  useEffect(() => {
    const t = setInterval(() => setI(n => (n + 1) % DEMO.length), 3600)
    return () => clearInterval(t)
  }, [])

  const d = DEMO[i]

  return (
    <div className="stage viewfinder" style={{ aspectRatio: '4 / 5', width: '100%' }}>
      <video
        ref={videoRef} src="/sign-language-girl.mp4" autoPlay loop muted playsInline
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: '35% center', filter: 'saturate(0.9) contrast(1.05)' }}
      />
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(11,10,9,0.55) 0%, transparent 22%, transparent 48%, rgba(11,10,9,0.92) 100%)' }} />
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', left: 0, right: 0, height: '40%', background: 'linear-gradient(to bottom, transparent, rgba(255,138,76,0.10), transparent)', animation: 'scan 4.5s linear infinite' }} />
      </div>

      <div style={{ position: 'absolute', top: 18, left: 52, right: 18, display: 'flex', justifyContent: 'space-between', zIndex: 7 }}>
        <span className="stage-chip" style={{ color: '#FF9A90' }}>
          <span className="status-dot" data-live="true" /> <span style={{ color: 'var(--stage-text)' }}>Live</span>
        </span>
        <span className="stage-chip mono" style={{ fontSize: '0.66rem', letterSpacing: '0.08em' }}>ISL → EN · HI</span>
      </div>

      {/* Detection readout — remounts per sign so .swap replays */}
      <div key={d.sign} className="stage-chip mono swap"
        style={{ position: 'absolute', top: '40%', right: 18, zIndex: 7, fontSize: '0.66rem', letterSpacing: '0.08em' }}>
        <span style={{ color: '#FF8A4C' }}>■</span> {d.sign}
        <span style={{ color: 'var(--stage-muted)' }}>{d.conf}%</span>
      </div>

      <div style={{ position: 'absolute', left: 24, right: 24, bottom: 26, zIndex: 7 }}>
        <p className="mono" style={{ fontSize: '0.62rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--stage-muted)', marginBottom: 10 }}>
          Caption
        </p>
        <div key={d.en} className="swap">
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.6rem, 2.6vw, 2.2rem)', lineHeight: 1.08, color: '#F3EFE8' }}>
            {d.en}
          </p>
          <p className="deva" style={{ fontSize: '1rem', color: 'var(--stage-muted)', marginTop: 8 }}>{d.hi}</p>
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 18 }}>
          {DEMO.map((_, k) => (
            <div key={k} style={{ flex: 1, height: 2, borderRadius: 2, background: 'rgba(243,239,232,0.15)', overflow: 'hidden' }}>
              {k === i && <div key={i} className="vf-tick" />}
              {k < i && <div style={{ height: '100%', background: 'rgba(243,239,232,0.5)' }} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  let w = 0
  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="home-hero-wrap">
        <div className="aurora" aria-hidden="true"><i /><i /><i /><div className="dot-grid" /></div>

        <div className="home-hero">
          <div style={{ position: 'relative', zIndex: 2 }}>
            <span className="eyebrow enter-fade" style={{ '--d': 80 }}>Indian Sign Language · in real time</span>

            <h1 className="display home-title">
              <span className="line-mask"><span style={{ '--d': 120 }}>Every sign,</span></span>
              <span className="line-mask"><span style={{ '--d': 230 }}>finally <em>heard.</em></span></span>
            </h1>

            <p className="lede enter" style={{ '--d': 480, marginTop: 28 }}>
              Drishya Vaani reads ISL from your camera and turns it into live captions and speech —
              so deaf and hearing people can simply talk, face to face or on a call.
            </p>

            <div className="enter" style={{ '--d': 600, display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 36 }}>
              <Link to="/translate" className="btn-primary btn-lg">
                Start translating <ArrowRight size={16} className="nudge" />
              </Link>
              <Link to="/learn" className="btn-secondary btn-lg">
                Learn the signs
              </Link>
            </div>

            <dl className="home-specs stagger" style={{ '--stagger-base': '760ms', '--stagger': '70ms' }}>
              {[
                ['21', 'landmarks per hand'],
                ['9', 'signs recognised today'],
                ['3', 'output languages'],
                ['6', 'people per call'],
              ].map(([v, l]) => (
                <div key={l}>
                  <dt className="display" style={{ fontSize: '2.2rem' }}>{v}</dt>
                  <dd style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 6 }}>{l}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="home-hero-media enter-scale" style={{ '--d': 260 }}>
            <div className="parallax" style={{ '--parallax': '-28px' }}>
              <Viewfinder />
            </div>
          </div>
        </div>
      </section>

      {/* ── SIGN MARQUEE ─────────────────────────────────────────────────── */}
      <section aria-label="Supported signs" className="marquee" style={{ position: 'relative', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', overflow: 'hidden', padding: '22px 0', background: 'var(--bg-surface)' }}>
        <div style={{ display: 'flex', width: 'max-content', animation: 'marquee 38s linear infinite' }}>
          {[...SIGNS, ...SIGNS].map(([en, hi], k) => (
            <div key={k} className="marquee-item">
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.9rem', whiteSpace: 'nowrap' }}>{en}</span>
              <span className="deva" style={{ fontSize: '1.05rem', color: 'var(--text-faint)', whiteSpace: 'nowrap' }}>{hi}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section className="home-section">
        <div className="home-how">
          <div className="reveal home-how-intro">
            <span className="eyebrow">How it works</span>
            <h2 className="display" style={{ fontSize: 'clamp(2.4rem, 4.6vw, 3.8rem)', marginTop: 18 }}>
              From a hand<br />to a <em>voice</em>,<br />in three steps.
            </h2>
            <div style={{ marginTop: 40, position: 'relative', width: 'fit-content' }}>
              <div aria-hidden="true" style={{ position: 'absolute', inset: '-20%', background: 'radial-gradient(circle, var(--accent-softer), transparent 65%)' }} />
              <HandLandmarks size={220} />
            </div>
          </div>

          <div className="reveal-stagger">
            {STEPS.map(s => (
              <div key={s.n} className="home-step">
                <span className="mono home-step-n">{s.n}</span>
                <div>
                  <h3 className="display" style={{ fontSize: '2rem' }}>{s.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginTop: 10, maxWidth: '46ch' }}>{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATEMENT — words light up as you scroll ─────────────────────── */}
      <section className="home-section" style={{ paddingTop: 0 }}>
        <div className="home-statement reveal-scale">
          <div className="aurora" aria-hidden="true" style={{ opacity: 0.6 }}><i /><i /></div>
          <div style={{ position: 'relative' }}>
            <BrandMark size={40} animated />
            <p className="display scrub" style={{ fontSize: 'clamp(2rem, 4.4vw, 3.6rem)', lineHeight: 1.1, marginTop: 32, maxWidth: '20ch' }}>
              {STATEMENT.split(' ').map((word, k) => {
                const clean = word.replace(/[^\w]/g, '')
                const accent = STATEMENT_ACCENT.has(clean)
                return (
                  <span key={k}>
                    <span className="scrub-word" style={{ '--w': w++, color: accent ? 'var(--accent)' : undefined, fontStyle: accent ? 'italic' : undefined }}>{word}</span>{' '}
                  </span>
                )
              })}
            </p>
            <p className="deva" style={{ fontSize: '1.15rem', color: 'var(--text-muted)', marginTop: 28 }}>
              दृश्य वाणी — जो दिखता है, वह बोलता है।
            </p>
          </div>
        </div>
      </section>

      {/* ── PLATFORM ─────────────────────────────────────────────────────── */}
      <section className="home-section" style={{ paddingTop: 0 }}>
        <div className="reveal" style={{ marginBottom: 36 }}>
          <span className="eyebrow">The platform</span>
          <h2 className="display" style={{ fontSize: 'clamp(2.2rem, 4vw, 3.2rem)', marginTop: 18 }}>Everything around the <em>conversation.</em></h2>
        </div>

        <div className="home-bento">
          <div className="reveal" style={{ gridArea: 'a' }}>
            <Link to="/translate" className="bento-tile bento-feature spotlight lift">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="bento-icon"><Video size={18} strokeWidth={1.75} /></span>
                <ArrowUpRight className="nudge-diag" size={20} style={{ color: 'var(--text-faint)' }} />
              </div>
              <div style={{ marginTop: 'auto' }}>
                <h3 className="display" style={{ fontSize: '2.4rem' }}>Translate & call</h3>
                <p style={{ color: 'var(--text-secondary)', marginTop: 10, maxWidth: '44ch', lineHeight: 1.65 }}>
                  Sign solo for instant captions, or open a room and invite up to five others — everyone sees what’s being signed.
                </p>
                <div style={{ display: 'flex', gap: 8, marginTop: 20, flexWrap: 'wrap' }}>
                  <span className="badge"><Users size={11} /> Group video</span>
                  <span className="badge"><Languages size={11} /> EN · HI · MR</span>
                  <span className="badge"><Volume2 size={11} /> Text to speech</span>
                </div>
              </div>
            </Link>
          </div>
          {[
            { area: 'b', to: '/dictionary', icon: BookOpen, title: 'Dictionary', body: 'Alphabet, numbers, words and phrases — with Hindi and how to form each sign.' },
            { area: 'c', to: '/learn', icon: GraduationCap, title: 'Learn', body: 'Flashcards and a quick quiz on the signs the model understands.' },
            { area: 'd', to: '/dashboard', icon: BarChart3, title: 'Analytics', body: 'Your translations, confidence and saved phrases over time.' },
          ].map(({ area, to, icon: Icon, title, body }) => (
            <div key={to} className="reveal" style={{ gridArea: area }}>
              <Link to={to} className="bento-tile spotlight lift">
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="bento-icon"><Icon size={18} strokeWidth={1.75} /></span>
                  <ArrowUpRight className="nudge-diag" size={20} style={{ color: 'var(--text-faint)' }} />
                </div>
                <div style={{ marginTop: 'auto' }}>
                  <h3 className="display" style={{ fontSize: '1.8rem' }}>{title}</h3>
                  <p style={{ color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.6, fontSize: '0.88rem' }}>{body}</p>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '28px clamp(1rem, 4vw, 2.75rem)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <BrandMark size={26} />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Drishya Vaani <span className="deva" style={{ marginLeft: 6 }}>दृश्य वाणी</span> — Visible Voice
          </span>
        </div>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.76rem', color: 'var(--text-faint)' }}>
          <span className="kbd">Ctrl</span><span className="kbd">K</span> to jump anywhere
        </span>
      </footer>

      <style>{`
        .home-hero-wrap { position: relative; isolation: isolate; }
        .home-hero {
          position: relative; z-index: 1;
          display: grid;
          grid-template-columns: minmax(0, 1.08fr) minmax(0, 0.92fr);
          gap: clamp(2rem, 5vw, 5rem);
          align-items: center;
          max-width: 1320px;
          margin: 0 auto;
          padding: clamp(2.5rem, 7vh, 5.5rem) clamp(1rem, 4vw, 2.75rem) clamp(3rem, 8vh, 6rem);
          min-height: calc(100vh - 56px);
        }
        .home-title { font-size: clamp(3.6rem, 8.4vw, 7.4rem); margin-top: 26px; }
        .home-hero-media { max-width: 480px; justify-self: end; width: 100%; }
        .home-specs {
          display: grid; grid-template-columns: repeat(4, auto); gap: 36px;
          margin-top: 56px; padding-top: 24px; border-top: 1px solid var(--border); width: fit-content;
        }
        .vf-tick { height: 100%; background: #FF8A4C; transform-origin: 0 50%; animation: progress-run 3600ms linear both; }
        .marquee-item {
          display: flex; align-items: baseline; gap: 14px; padding: 0 34px; border-right: 1px solid var(--border);
          color: var(--text-primary); transition: color var(--dur-sm) ease;
        }
        .marquee-item:hover { color: var(--accent); }
        .home-section { max-width: 1240px; margin: 0 auto; padding: clamp(4rem, 10vh, 7.5rem) clamp(1rem, 4vw, 2.75rem); }
        .home-how { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(2rem, 6vw, 6rem); align-items: start; }
        .home-how-intro { position: sticky; top: 40px; }
        .home-step {
          position: relative; display: grid; grid-template-columns: 48px 1fr; gap: 12px; padding: 32px 0;
          border-top: 1px solid var(--border);
        }
        .home-step::before {
          content: ''; position: absolute; top: -1px; left: 0; height: 1px; width: 100%;
          background: var(--accent); transform: scaleX(0); transform-origin: 0 50%;
          transition: transform 700ms var(--ease-out);
        }
        .home-step:hover::before { transform: scaleX(1); }
        .home-step-n { font-size: 0.72rem; color: var(--accent); transition: transform var(--dur-md) var(--ease-out); }
        .home-step:hover .home-step-n { transform: translateX(4px); }
        .home-statement {
          position: relative; isolation: isolate; padding: clamp(2.5rem, 6vw, 5rem); border-radius: var(--r-xl);
          background: var(--bg-surface); border: 1px solid var(--border); overflow: hidden;
        }
        .home-bento {
          display: grid; gap: 14px;
          grid-template-columns: 1.4fr 1fr 1fr;
          grid-template-areas: "a b c" "a d d";
        }
        .home-bento > div { display: flex; }
        .bento-tile {
          display: flex; flex-direction: column; width: 100%; min-height: 240px; padding: 26px;
          border-radius: var(--r-xl); background: var(--bg-panel); border: 1px solid var(--border);
        }
        .bento-feature { min-height: 494px; background: linear-gradient(160deg, var(--accent-softer), var(--bg-panel) 55%); }
        .bento-tile:hover { border-color: var(--border-strong); box-shadow: var(--shadow-md); }
        .bento-icon {
          width: 42px; height: 42px; border-radius: 12px; display: flex; align-items: center; justify-content: center;
          background: var(--bg-inset); border: 1px solid var(--border); color: var(--accent);
          transition: transform var(--dur-md) var(--ease-spring), background-color var(--dur-sm) ease;
        }
        .bento-tile:hover .bento-icon { transform: rotate(-8deg) scale(1.08); background: var(--accent-soft); }

        @media (max-width: 960px) {
          .home-hero { grid-template-columns: 1fr; min-height: 0; }
          .home-hero-media { justify-self: start; max-width: 520px; }
          .home-how { grid-template-columns: 1fr; }
          .home-how-intro { position: static; }
          .home-bento { grid-template-columns: 1fr 1fr; grid-template-areas: "a a" "b c" "d d"; }
          .bento-feature { min-height: 320px; }
        }
        @media (max-width: 560px) {
          .home-specs { grid-template-columns: repeat(2, auto); gap: 24px 40px; }
          .home-bento { grid-template-columns: 1fr; grid-template-areas: "a" "b" "c" "d"; }
        }
      `}</style>
    </div>
  )
}
