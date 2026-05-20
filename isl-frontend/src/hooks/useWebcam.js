// isl-frontend/src/hooks/useWebcam.js

import { useRef, useState, useCallback, useEffect } from 'react'

// Empty string = relative URL — Vite proxy routes it to localhost:8000
// Works on both PC (localhost:5173) and Android (192.168.x.x:5173)
const API_URL = ''
const DEFAULT_FPS   = 4
const CALL_FPS      = 2   // halved during active WebRTC call to free CPU for video encoding
const DEFAULT_JPEG  = 0.7
const CALL_JPEG     = 0.5  // lower quality during call reduces encode CPU further

export function useWebcam() {
  const videoRef          = useRef(null)
  const canvasRef         = useRef(null)
  const streamRef         = useRef(null)
  const timerRef          = useRef(null)             // setTimeout handle
  const lastTickRef       = useRef(0)
  const isDetectingRef    = useRef(false)
  const frameIntervalRef  = useRef(1000 / DEFAULT_FPS)  // dynamic — updated by setDetectionFps
  const jpegQualityRef    = useRef(DEFAULT_JPEG)         // dynamic — lowered during calls

  const [isActive,     setIsActive]     = useState(false)
  const [error,        setError]        = useState(null)
  const [fps,          setFps]          = useState(0)
  const [prediction,   setPrediction]   = useState(null)
  const [backendReady, setBackendReady] = useState(false)
  const [isDetecting,  setIsDetecting]  = useState(false)

  // Check backend health on mount
  useEffect(() => {
    let cancelled = false
    fetch(`${API_URL}/health`)
      .then(r => r.json())
      .then(d => { if (!cancelled) setBackendReady(d.model_loaded === true) })
      .catch(() => { if (!cancelled) setBackendReady(false) })
    return () => { cancelled = true }
  }, [])

  const captureFrame = useCallback(() => {
    const video  = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.readyState < 2) return null

    canvas.width  = video.videoWidth  || 640
    canvas.height = video.videoHeight || 480
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', jpegQualityRef.current).split(',')[1]
  }, [])

  const sendFrame = useCallback(async (base64) => {
    try {
      const res = await fetch(`${API_URL}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64 }),
      })
      if (!res.ok) return
      const data = await res.json()
      setPrediction(data)
    } catch {
      // silently skip — don't crash the detection loop
    }
  }, [])

  // ── Detection loop via setTimeout (non-blocking, no rAF competition with WebRTC) ──
  const detectionTick = useCallback(async () => {
    if (!isDetectingRef.current) return

    const t0 = performance.now()
    const frame = captureFrame()
    if (frame) await sendFrame(frame)
    const elapsed = performance.now() - t0

    // Compute display FPS based on actual interval
    const interval = frameIntervalRef.current
    setFps(Math.min(Math.round(1000 / interval), Math.round(1000 / Math.max(elapsed, 1))))

    // Schedule next tick — subtract processing time to stay on target
    if (isDetectingRef.current) {
      timerRef.current = setTimeout(detectionTick, Math.max(0, interval - elapsed))
    }
  }, [captureFrame, sendFrame])

  const startDetection = useCallback(() => {
    if (!streamRef.current || isDetectingRef.current) return false
    isDetectingRef.current = true
    lastTickRef.current = 0
    setIsDetecting(true)
    detectionTick()   // kick off the loop
    return true
  }, [detectionTick])

  const stopDetection = useCallback(() => {
    isDetectingRef.current = false
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setIsDetecting(false)
    setFps(0)
  }, [])

  const start = useCallback(async (options = {}) => {
    const detect = options.detect !== false
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width:       { ideal: 480 },
          height:      { ideal: 360 },
          facingMode:  'user',
          frameRate:   { ideal: 20, max: 24 },  // limit source fps → less WebRTC encode CPU
        },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setIsActive(true)
      if (detect) startDetection()
      return true
    } catch (err) {
      setError(err.message || 'Camera access denied')
      return false
    }
  }, [startDetection])

  const stop = useCallback(() => {
    stopDetection()
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) videoRef.current.srcObject = null
    setIsActive(false)
    setPrediction(null)
  }, [stopDetection])

  // Expose the raw stream so useVideoCall can use it for peer connection
  const getStream = useCallback(() => streamRef.current, [])

  // Called by Translator when call status changes to throttle detection and save CPU
  const setDetectionFps = useCallback((fps) => {
    frameIntervalRef.current = 1000 / fps
    jpegQualityRef.current   = fps <= CALL_FPS ? CALL_JPEG : DEFAULT_JPEG
  }, [])

  return {
    videoRef, canvasRef,
    isActive, isDetecting, error, fps,
    prediction, backendReady,
    start, stop, startDetection, stopDetection, getStream, setDetectionFps,
  }
}
