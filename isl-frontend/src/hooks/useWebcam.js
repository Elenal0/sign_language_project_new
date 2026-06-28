import { useRef, useState, useCallback, useEffect } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const API_KEY = import.meta.env.VITE_API_KEY || 'dev-secret-key'
const TARGET_FPS = 10
const FRAME_INTERVAL = 1000 / TARGET_FPS

export function useWebcam() {
  const videoRef   = useRef(null)
  const canvasRef  = useRef(null)
  const streamRef  = useRef(null)
  const rafRef     = useRef(null)
  const lastTickRef = useRef(0)

  const [isActive,    setIsActive]    = useState(false)
  const [isDetecting, setIsDetecting] = useState(false)
  const [error,       setError]       = useState(null)
  const [fps,         setFps]         = useState(0)
  const [prediction,  setPrediction]  = useState(null)  // { sign, confidence, all_scores, hand_detected, inference_ms }
  const [backendReady, setBackendReady] = useState(false)

  // Check backend health on mount
  useEffect(() => {
    fetch(`${API_URL}/health`)
      .then(r => r.json())
      .then(d => setBackendReady(d.model_loaded === true))
      .catch(() => setBackendReady(false))
  }, [])

  const captureFrame = useCallback(() => {
    const video  = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.readyState < 2) return null

    canvas.width  = video.videoWidth  || 640
    canvas.height = video.videoHeight || 480
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Return base64 without the "data:image/jpeg;base64," prefix
    return canvas.toDataURL('image/jpeg', 0.7).split(',')[1]
  }, [])

  const sendFrame = useCallback(async (base64) => {
    try {
      const res = await fetch(`${API_URL}/predict`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY
        },
        body: JSON.stringify({ image: base64 }),
      })
      if (!res.ok) return
      const data = await res.json()
      setPrediction(data)
    } catch {
      // silently skip on network error — don't crash detection loop
    }
  }, [])

  const detectionLoop = useCallback((timestamp) => {
    if (!isDetecting) return
    rafRef.current = requestAnimationFrame(detectionLoop)

    const elapsed = timestamp - lastTickRef.current
    if (elapsed < FRAME_INTERVAL) return
    lastTickRef.current = timestamp

    // FPS counter
    setFps(Math.round(1000 / elapsed))

    const frame = captureFrame()
    if (frame) sendFrame(frame)
  }, [isDetecting, captureFrame, sendFrame])

  // Start/stop detection loop when isDetecting changes
  useEffect(() => {
    if (isDetecting) {
      lastTickRef.current = 0
      rafRef.current = requestAnimationFrame(detectionLoop)
    } else {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [isDetecting, detectionLoop])

  const start = useCallback(async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setIsActive(true)
      setIsDetecting(true)
    } catch (err) {
      setError(err.message || 'Camera access denied')
    }
  }, [])

  const stop = useCallback(() => {
    setIsDetecting(false)
    setIsActive(false)
    setPrediction(null)
    setFps(0)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) videoRef.current.srcObject = null
  }, [])

  const stopDetection = useCallback(() => setIsDetecting(false), [])

  return {
    videoRef, canvasRef,
    isActive, isDetecting, error, fps,
    prediction, backendReady,
    start, stop, stopDetection,
  }
}