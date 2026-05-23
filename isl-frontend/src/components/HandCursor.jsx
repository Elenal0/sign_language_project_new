/**
 * HandCursor.jsx  — v2 Clean
 *
 * Features kept:
 *  - Smooth GPU-accelerated cursor dot (CSS transform)
 *  - Dwell-click progress ring
 *  - Ripple burst on pinch/click
 *  - Scroll zone HUD bars (top/bottom)
 *  - Scroll arrow indicator near cursor
 *  - Simple toggle button
 */

import { useRef, useEffect, useState } from 'react'
import useHandCursor from '../hooks/useHandCursor'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const RADIUS = 22
const STROKE = 3
const CIRCUM = 2 * Math.PI * RADIUS

// ---------------------------------------------------------------------------
// DwellRing (SVG arc)
// ---------------------------------------------------------------------------
function DwellRing({ progress }) {
  const offset = CIRCUM * (1 - progress)
  const cx = RADIUS + STROKE
  return (
    <svg
      width={cx * 2} height={cx * 2}
      style={{ position: 'absolute', top: -cx, left: -cx, pointerEvents: 'none' }}
      aria-hidden="true"
    >
      <circle cx={cx} cy={cx} r={RADIUS} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={STROKE} />
      <circle
        cx={cx} cy={cx} r={RADIUS} fill="none"
        stroke="rgba(99,210,255,0.9)" strokeWidth={STROKE}
        strokeDasharray={CIRCUM} strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cx})`}
        style={{ transition: 'stroke-dashoffset 55ms linear' }}
      />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Ripple burst on pinch/dwell click
// ---------------------------------------------------------------------------
function RippleBurst({ x, y, active }) {
  if (!active) return null
  return (
    <div
      style={{
        position: 'fixed',
        left: x, top: y,
        width: 0, height: 0,
        pointerEvents: 'none',
        zIndex: 99998,
      }}
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: 60, height: 60,
            borderRadius: '50%',
            border: '2px solid rgba(99,210,255,0.7)',
            transform: 'translate(-50%,-50%) scale(0)',
            animation: `hc-ripple 0.6s ${i * 0.1}s ease-out forwards`,
          }}
        />
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Scroll Zone Overlay (top/bottom heat bars)
// ---------------------------------------------------------------------------
function ScrollZoneBar({ zone }) {
  if (!zone) return null
  const isUp = zone === 'up'
  return (
    <div
      style={{
        position: 'fixed',
        left: 0, right: 0,
        [isUp ? 'top' : 'bottom']: 0,
        height: '14vh',
        background: isUp
          ? 'linear-gradient(to bottom, rgba(99,210,255,0.18) 0%, transparent 100%)'
          : 'linear-gradient(to top, rgba(99,210,255,0.18) 0%, transparent 100%)',
        pointerEvents: 'none',
        zIndex: 99990,
        display: 'flex',
        alignItems: isUp ? 'flex-start' : 'flex-end',
        justifyContent: 'center',
        padding: '10px 0',
        animation: 'hc-fade-in 0.2s ease',
      }}
    >
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'rgba(10,10,25,0.65)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(99,210,255,0.35)',
        borderRadius: 24, padding: '5px 14px',
        color: 'rgba(99,210,255,0.95)',
        fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em',
      }}>
        <span style={{ fontSize: '1rem' }}>{isUp ? '\u2191' : '\u2193'}</span>
        {isUp ? 'SCROLL UP' : 'SCROLL DOWN'}
        <span style={{ fontSize: '1rem' }}>{isUp ? '\u2191' : '\u2193'}</span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function HandCursor() {
  const { enabled, toggle, cursorPos, isPinching, dwellProgress, scrollZone } = useHandCursor()
  const btnRef = useRef(null)
  const [ripple, setRipple] = useState(false)

  // Ripple on pinch
  useEffect(() => {
    if (isPinching) {
      setRipple(true)
      const t = setTimeout(() => setRipple(false), 600)
      return () => clearTimeout(t)
    }
  }, [isPinching])

  const dotSize = isPinching ? 24 : 14

  return (
    <>
      {/* Keyframes */}
      <style>{`
        @keyframes hc-ripple {
          0%   { transform: translate(-50%,-50%) scale(0); opacity: 0.8; }
          100% { transform: translate(-50%,-50%) scale(3); opacity: 0; }
        }
        @keyframes hc-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes hc-btn-pulse {
          0%, 100% { box-shadow: 0 0 16px rgba(99,210,255,0.3), 0 2px 12px rgba(0,0,0,0.5); }
          50%       { box-shadow: 0 0 28px rgba(99,210,255,0.55), 0 2px 12px rgba(0,0,0,0.5); }
        }
      `}</style>

      {/* Scroll Zone Bars */}
      <ScrollZoneBar zone={scrollZone} />

      {/* Cursor Overlay */}
      <div
        id="hand-cursor-root"
        aria-hidden="true"
        style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 99999, overflow: 'hidden' }}
      >
        {/* Main cursor dot — GPU transform, no layout thrash */}
        <div
          id="hand-cursor-dot"
          style={{
            position: 'absolute',
            width: dotSize, height: dotSize,
            borderRadius: '50%',
            background: isPinching
              ? 'radial-gradient(circle, #ffffff 0%, #63d2ff 50%, transparent 100%)'
              : 'radial-gradient(circle, #63d2ff 0%, #1e90ff 60%, transparent 100%)',
            boxShadow: isPinching
              ? '0 0 24px 10px rgba(99,210,255,0.9), 0 0 48px 20px rgba(30,144,255,0.45)'
              : '0 0 12px 4px rgba(99,210,255,0.6)',
            opacity: enabled ? 1 : 0,
            transform: `translate(${cursorPos.x - dotSize / 2}px, ${cursorPos.y - dotSize / 2}px)`,
            willChange: 'transform',
            transition: 'width 100ms ease, height 100ms ease, box-shadow 100ms ease, opacity 200ms ease',
          }}
        >
          {/* Dwell progress ring */}
          {!isPinching && dwellProgress > 0 && <DwellRing progress={dwellProgress} />}

          {/* Pinch pulse ring */}
          {isPinching && (
            <div style={{
              position: 'absolute', inset: -8, borderRadius: '50%',
              border: '2px solid rgba(99,210,255,0.6)',
              animation: 'hc-ripple 0.5s ease-out infinite',
            }} />
          )}
        </div>

        {/* Scroll zone arrow near cursor */}
        {scrollZone && (
          <div style={{
            position: 'absolute',
            transform: `translate(${cursorPos.x}px, ${cursorPos.y + (scrollZone === 'up' ? -28 : 28)}px) translate(-50%, -50%)`,
            willChange: 'transform',
            fontSize: '1.2rem',
            pointerEvents: 'none',
            filter: 'drop-shadow(0 0 6px rgba(99,210,255,0.8))',
            color: 'rgba(99,210,255,0.95)',
          }}>
            {scrollZone === 'up' ? '\u2B06' : '\u2B07'}
          </div>
        )}
      </div>

      {/* Ripple burst */}
      <RippleBurst x={cursorPos.x} y={cursorPos.y} active={ripple} />

      {/* Toggle Button */}
      <button
        id="hand-cursor-toggle"
        ref={btnRef}
        onClick={toggle}
        aria-label={enabled ? 'Disable hand cursor' : 'Enable hand cursor'}
        title={enabled ? 'Hand Cursor ON — pinch to click, move to edges to scroll' : 'Enable hand cursor control'}
        style={{
          position: 'fixed',
          bottom: '1.5rem',
          right: '1.5rem',
          zIndex: 100000,
          display: 'flex',
          alignItems: 'center',
          gap: '0.45rem',
          padding: '0.55rem 1rem',
          borderRadius: '2rem',
          border: enabled
            ? '1.5px solid rgba(99,210,255,0.7)'
            : '1.5px solid rgba(255,255,255,0.15)',
          background: enabled
            ? 'linear-gradient(135deg, rgba(30,144,255,0.25) 0%, rgba(99,210,255,0.15) 100%)'
            : 'rgba(15,15,25,0.75)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          color: enabled ? '#63d2ff' : 'rgba(255,255,255,0.6)',
          fontSize: '0.8rem',
          fontWeight: 600,
          letterSpacing: '0.03em',
          cursor: 'pointer',
          animation: enabled ? 'hc-btn-pulse 2.5s ease-in-out infinite' : 'none',
          boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
          transition: 'background 0.25s ease, border-color 0.25s ease, color 0.25s ease',
          userSelect: 'none',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px) scale(1.04)' }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = '' }}
      >
        {/* Hand icon */}
        <svg
          width="16" height="16" viewBox="0 0 24 24"
          fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
          <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2" />
          <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
          <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
        </svg>

        {/* Status dot */}
        <span
          aria-hidden="true"
          style={{
            width: 7, height: 7,
            borderRadius: '50%',
            background: enabled ? '#63d2ff' : 'rgba(255,255,255,0.3)',
            boxShadow: enabled ? '0 0 6px #63d2ff' : 'none',
            flexShrink: 0,
            transition: 'all 250ms ease',
          }}
        />

        <span>{enabled ? 'Hand ON' : 'Hand OFF'}</span>
      </button>
    </>
  )
}
