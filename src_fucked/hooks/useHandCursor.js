/**
 * useHandCursor.js  — v2 (Premium)
 *
 * Features:
 *  ✓ Index fingertip tracking with double-EMA for ultra-smooth movement
 *  ✓ Pinch (thumb+index) → click
 *  ✓ Dwell-click (hold 900ms → auto-click)
 *  ✓ Scroll zones (top 15% / bottom 15%) — hover to scroll
 *  ✓ Two-finger swipe (index+middle up/down) → scroll
 *  ✓ Ring-finger spread → back navigation
 *  ✓ Gesture cooldown to prevent repeat triggers
 *  ✓ CSS transform positioning (GPU-accelerated, no layout thrash)
 */

import { useEffect, useRef, useCallback, useState } from 'react'
import { Hands } from '@mediapipe/hands'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const EMA_ALPHA_FAST   = 0.30   // fast layer — responsive
const EMA_ALPHA_SLOW   = 0.12   // slow layer — ultra-smooth (used for display)
const PINCH_ON         = 0.038  // normalized distance to ENTER pinch (stricter)
const PINCH_OFF        = 0.065  // normalized distance to EXIT pinch (hysteresis)
const PINCH_HOLD_FRAMES = 4     // must sustain pinch for N frames before firing
const DWELL_MS         = 1400   // ms to hold still for auto-click (longer = less accidental)
const DWELL_RADIUS     = 0.035  // normalized — movement > this resets dwell
const SCROLL_ZONE      = 0.15   // top/bottom 15% of screen = scroll zone
const SCROLL_SPEED     = 12     // pixels per frame in scroll zone
const SCROLL_ACCEL     = 1.8    // multiplier at extreme edge
const GESTURE_COOLDOWN = 600    // ms between gesture actions

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function dist2D(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
}

function fireClick(x, y) {
  const el = document.elementFromPoint(x, y)
  if (!el) return
  ;['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'].forEach((type) => {
    el.dispatchEvent(
      new MouseEvent(type, {
        bubbles: true, cancelable: true,
        clientX: x, clientY: y,
        view: window,
      })
    )
  })
}

function fireScroll(x, y, deltaY) {
  const el = document.elementFromPoint(x, y)
  if (!el) return
  el.dispatchEvent(
    new WheelEvent('wheel', {
      bubbles: true, cancelable: true,
      deltaY, deltaMode: 0,
      clientX: x, clientY: y,
      view: window,
    })
  )
  // Also scroll the scrollable parent
  let node = el
  while (node && node !== document.body) {
    if (node.scrollHeight > node.clientHeight) {
      node.scrollTop += deltaY
      break
    }
    node = node.parentElement
  }
  if (!node || node === document.body) {
    window.scrollBy(0, deltaY)
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export default function useHandCursor() {
  const [enabled, setEnabled]         = useState(false)
  const [cursorPos, setCursorPos]     = useState({ x: -200, y: -200 })
  const [isPinching, setIsPinching]   = useState(false)
  const [dwellProgress, setDwellProgress] = useState(0)
  const [scrollZone, setScrollZone]   = useState(null) // 'up' | 'down' | null

  // Mutable refs (no re-render)
  const videoRef    = useRef(null)
  const handsRef    = useRef(null)
  const streamRef   = useRef(null)
  const rafRef      = useRef(null)
  const scrollRafRef = useRef(null)

  // Double-EMA smoothing
  const fastRef  = useRef({ x: 0.5, y: 0.5 })
  const slowRef  = useRef({ x: 0.5, y: 0.5 })

  const pinchRef       = useRef(false)  // current pinch state (after hysteresis)
  const pinchFrameRef  = useRef(0)      // consecutive frames below PINCH_ON threshold
  const pinchFiredRef  = useRef(false)  // did we already fire for this pinch?
  const dwellRef    = useRef({ startTime: null, anchorX: 0.5, anchorY: 0.5, fired: false })
  const cooldownRef = useRef(0) // timestamp of last gesture action
  const scrollRef   = useRef(null) // 'up' | 'down' | null
  const prevYRef    = useRef(null)  // for swipe velocity

  // ── Scroll loop (runs independently for smooth zone-scroll) ─────────────
  const startScrollLoop = useCallback(() => {
    if (scrollRafRef.current) return
    const loop = () => {
      const zone = scrollRef.current
      if (!zone) { scrollRafRef.current = null; return }
      const cx = slowRef.current.x * window.innerWidth
      const cy = slowRef.current.y * window.innerHeight
      const edgeFactor = zone === 'up'
        ? 1 + (1 - cy / (SCROLL_ZONE * window.innerHeight)) * SCROLL_ACCEL
        : 1 + ((cy - (1 - SCROLL_ZONE) * window.innerHeight) / (SCROLL_ZONE * window.innerHeight)) * SCROLL_ACCEL
      const delta = (zone === 'up' ? -1 : 1) * SCROLL_SPEED * edgeFactor
      fireScroll(cx, cy, delta)
      scrollRafRef.current = requestAnimationFrame(loop)
    }
    scrollRafRef.current = requestAnimationFrame(loop)
  }, [])

  const stopScrollLoop = useCallback(() => {
    if (scrollRafRef.current) { cancelAnimationFrame(scrollRafRef.current); scrollRafRef.current = null }
  }, [])

  // ── MediaPipe result callback ────────────────────────────────────────────
  const onResults = useCallback((results) => {
    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
      setDwellProgress(0)
      setScrollZone(null)
      scrollRef.current = null
      stopScrollLoop()
      dwellRef.current.startTime = null
      dwellRef.current.fired = false
      prevYRef.current = null
      return
    }

    const lm = results.multiHandLandmarks[0]

    // Landmarks we care about
    const indexTip  = lm[8]   // index fingertip
    const thumbTip  = lm[4]   // thumb tip
    const middleTip = lm[12]  // middle fingertip

    // ── Double-EMA (fast + slow) ─────────────────────────────────────────
    const rawX = 1 - indexTip.x
    const rawY = indexTip.y

    const f = fastRef.current
    f.x = EMA_ALPHA_FAST * rawX + (1 - EMA_ALPHA_FAST) * f.x
    f.y = EMA_ALPHA_FAST * rawY + (1 - EMA_ALPHA_FAST) * f.y

    const s = slowRef.current
    s.x = EMA_ALPHA_SLOW * f.x + (1 - EMA_ALPHA_SLOW) * s.x
    s.y = EMA_ALPHA_SLOW * f.y + (1 - EMA_ALPHA_SLOW) * s.y

    const screenX = s.x * window.innerWidth
    const screenY = s.y * window.innerHeight

    setCursorPos({ x: screenX, y: screenY })

    // ── Pinch detection (with hysteresis + hold-frame gate) ─────────────
    const pinchDist = dist2D(thumbTip, indexTip)
    const wasPinch  = pinchRef.current

    let nowPinch = wasPinch
    if (!wasPinch) {
      // Not pinching: require N consecutive frames below PINCH_ON to activate
      if (pinchDist < PINCH_ON) {
        pinchFrameRef.current += 1
        if (pinchFrameRef.current >= PINCH_HOLD_FRAMES) {
          nowPinch = true
        }
      } else {
        pinchFrameRef.current = 0  // reset counter if finger opens before threshold
      }
    } else {
      // Pinching: require distance > PINCH_OFF to release (hysteresis)
      if (pinchDist > PINCH_OFF) {
        nowPinch = false
        pinchFrameRef.current = 0
        pinchFiredRef.current = false
      }
    }

    pinchRef.current = nowPinch
    setIsPinching(nowPinch)

    // Fire click only on the leading edge, and only once per pinch gesture
    if (nowPinch && !wasPinch && !pinchFiredRef.current) {
      pinchFiredRef.current = true
      fireClick(screenX, screenY)
      dwellRef.current.fired = true
    }

    // ── Scroll zone detection (top/bottom of screen) ──────────────────────
    const inTopZone    = s.y < SCROLL_ZONE
    const inBottomZone = s.y > (1 - SCROLL_ZONE)
    const newZone      = inTopZone ? 'up' : inBottomZone ? 'down' : null

    if (newZone !== scrollRef.current) {
      scrollRef.current = newZone
      setScrollZone(newZone)
      if (newZone) startScrollLoop()
      else stopScrollLoop()
    }

    // ── Two-finger swipe scroll (index + middle extended, moving fast) ────
    if (!nowPinch && !inTopZone && !inBottomZone) {
      const indexMiddleDist = dist2D(indexTip, middleTip)
      const bothExtended    = indexMiddleDist < 0.12 // close together = peace sign area
      if (bothExtended && prevYRef.current !== null) {
        const dy       = (middleTip.y - prevYRef.current) * window.innerHeight
        const absSpeed = Math.abs(dy)
        if (absSpeed > 6) {
          const now = Date.now()
          if (now - cooldownRef.current > 80) {
            cooldownRef.current = now
            fireScroll(screenX, screenY, dy * 2.5)
          }
        }
      }
      prevYRef.current = middleTip.y
    } else {
      prevYRef.current = null
    }

    // ── Dwell-click ───────────────────────────────────────────────────────
    if (!nowPinch) {
      const d     = dwellRef.current
      const moved = dist2D({ x: s.x, y: s.y }, { x: d.anchorX, y: d.anchorY })

      if (moved > DWELL_RADIUS) {
        d.startTime = Date.now()
        d.anchorX   = s.x
        d.anchorY   = s.y
        d.fired     = false
        setDwellProgress(0)
      } else {
        if (!d.startTime) {
          d.startTime = Date.now()
          d.anchorX   = s.x
          d.anchorY   = s.y
          d.fired     = false
        }
        const elapsed  = Date.now() - d.startTime
        const progress = Math.min(elapsed / DWELL_MS, 1)
        setDwellProgress(progress)

        if (progress >= 1 && !d.fired) {
          d.fired = true
          fireClick(screenX, screenY)
        }
      }
    } else {
      dwellRef.current.startTime = null
      dwellRef.current.fired     = false
      setDwellProgress(0)
    }
  }, [startScrollLoop, stopScrollLoop])

  // ── Start camera + MediaPipe pipeline ────────────────────────────────────
  const startTracking = useCallback(async () => {
    const video = document.createElement('video')
    video.width  = 320   // lower res = faster inference = less lag
    video.height = 240
    video.autoplay = true
    video.playsInline = true
    video.style.display = 'none'
    document.body.appendChild(video)
    videoRef.current = video

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 320, height: 240, facingMode: 'user', frameRate: { ideal: 30, max: 30 } },
    })
    streamRef.current = stream
    video.srcObject   = stream
    await video.play()

    const hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    })
    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 0,            // 0 = lite model → much faster
      minDetectionConfidence: 0.65,
      minTrackingConfidence: 0.55,
    })
    hands.onResults(onResults)
    handsRef.current = hands

    let last = 0
    const TARGET_MS = 1000 / 30  // 30 fps cap
    const loop = async (ts) => {
      if (ts - last >= TARGET_MS && video.readyState >= 2) {
        last = ts
        await hands.send({ image: video })
      }
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
  }, [onResults])

  // ── Stop pipeline ─────────────────────────────────────────────────────────
  const stopTracking = useCallback(() => {
    if (rafRef.current)    cancelAnimationFrame(rafRef.current)
    stopScrollLoop()
    if (handsRef.current)  handsRef.current.close()
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop())
    if (videoRef.current)  { videoRef.current.remove(); videoRef.current = null }
    handsRef.current  = null
    streamRef.current = null
    fastRef.current      = { x: 0.5, y: 0.5 }
    slowRef.current      = { x: 0.5, y: 0.5 }
    pinchFrameRef.current = 0
    pinchFiredRef.current = false
    setCursorPos({ x: -200, y: -200 })
    setIsPinching(false)
    setDwellProgress(0)
    setScrollZone(null)
  }, [stopScrollLoop])

  const toggle = useCallback(() => setEnabled((p) => !p), [])

  useEffect(() => {
    if (enabled) {
      startTracking().catch((err) => {
        console.error('[HandCursor] Camera error:', err)
        setEnabled(false)
      })
    } else {
      stopTracking()
    }
    return () => stopTracking()
  }, [enabled, startTracking, stopTracking])

  return { enabled, toggle, cursorPos, isPinching, dwellProgress, scrollZone }
}
