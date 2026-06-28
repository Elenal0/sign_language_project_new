import { useRef, useEffect, useState, useCallback } from 'react'
import { Canvas, useFrame, useThree, addAfterEffect, invalidate } from '@react-three/fiber'
import { Sparkles, Stars } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import FloatingRocks from './FloatingRocks'

function getScrollEl() { return document.getElementById('main-scroll') || window }
function getScrollTop(el) { return el === window ? window.scrollY : el.scrollTop }
function getScrollMax(el) {
  return el === window
    ? document.documentElement.scrollHeight - window.innerHeight
    : el.scrollHeight - el.clientHeight
}

// Scroll + mouse driven camera
function CameraController({ mouseRef }) {
  const { camera } = useThree()
  const currentZ = useRef(15)
  const targetZ  = useRef(15)
  const currentX = useRef(0)
  const currentY = useRef(0)

  useEffect(() => {
    const el = getScrollEl()
    const onScroll = () => {
      const max = getScrollMax(el)
      const progress = max > 0 ? Math.min(1, getScrollTop(el) / max) : 0
      targetZ.current = 15 - progress * 145
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  useFrame((state, delta) => {
    // Smooth camera Z travel
    currentZ.current = THREE.MathUtils.damp(currentZ.current, targetZ.current, 3, delta)
    camera.position.z = currentZ.current

    // Mouse parallax — subtle scene tilt
    const mx = mouseRef.current.x * 4
    const my = mouseRef.current.y * 2.5
    currentX.current = THREE.MathUtils.damp(currentX.current, mx, 3, delta)
    currentY.current = THREE.MathUtils.damp(currentY.current, my, 3, delta)
    camera.position.x = currentX.current
    camera.position.y = currentY.current

    // Subtle sway on top of mouse
    const t = state.clock.getElapsedTime()
    camera.position.x += Math.sin(t * 0.25) * 0.4
    camera.position.y += Math.cos(t * 0.18) * 0.3

    camera.lookAt(currentX.current * 0.3, currentY.current * 0.3, currentZ.current - 25)
  })

  return null
}

// Animated fog color that slowly shifts hue — throttled to every 10 frames
function DynamicFog() {
  const frameCount = useRef(0)
  useFrame(({ clock, scene }) => {
    frameCount.current++
    if (frameCount.current % 10 !== 0) return
    const t = clock.getElapsedTime()
    const hue = 0.74 + Math.sin(t * 0.1) * 0.05
    scene.fog.color.setHSL(hue, 0.6, 0.06)
  })
  return null
}

export default function CinematicScene() {
  const mouseRef = useRef({ x: 0, y: 0 })
  const [ready, setReady] = useState(false)
  const rafRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    // Mouse parallax
    const onMove = (e) => {
      mouseRef.current.x = (e.clientX / window.innerWidth  - 0.5) * 2
      mouseRef.current.y = -(e.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('mousemove', onMove, { passive: true })

    // Slight fade-in delay so we don't show a blank frame
    const t = setTimeout(() => setReady(true), 300)

    // Manual RAF ticker for frameloop="demand" — keeps animation alive but
    // pauses automatically when the tab is hidden (visibilitychange).
    let running = true
    const tick = () => {
      if (!running) return
      invalidate()
      rafRef.current = requestAnimationFrame(tick)
    }

    const onVisibility = () => {
      if (document.hidden) {
        running = false
        if (rafRef.current) cancelAnimationFrame(rafRef.current)
      } else {
        running = true
        tick()
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    tick()

    return () => {
      running = false
      window.removeEventListener('mousemove', onMove)
      document.removeEventListener('visibilitychange', onVisibility)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      clearTimeout(t)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: '#0a0614',
        opacity: ready ? 1 : 0,
        transition: 'opacity 1s ease',
        contain: 'strict',
        willChange: 'opacity',
      }}
    >
      <Canvas
        gl={{ antialias: false, alpha: false, powerPreference: 'high-performance', stencil: false, depth: true }}
        dpr={[1, 1.2]}
        camera={{ position: [0, 0, 15], fov: 50 }}
        frameloop="demand"
        performance={{ min: 0.5 }}
      >
        {/* Background color */}
        <color attach="background" args={['#0a0614']} />

        {/* Dynamic shifting fog — throttled */}
        <fogExp2 attach="fog" args={['#130a22', 0.013]} />
        <DynamicFog />

        {/* Lighting setup */}
        <ambientLight intensity={0.2} color="#8b5cf6" />
        <directionalLight position={[5, 15, 10]} intensity={2.5} color="#e879f9" />
        <directionalLight position={[-10, -5, -20]} intensity={1} color="#38bdf8" />
        <pointLight position={[0, 0, -50]} intensity={80} color="#c084fc" distance={120} />
        <pointLight position={[20, 10, -80]} intensity={60} color="#f472b6" distance={100} />

        {/* Deep-space star field — reduced count */}
        <Stars radius={200} depth={80} count={1500} factor={3} saturation={0.6} fade speed={0.3} />

        {/* Floating dust motes — reduced counts */}
        <Sparkles count={200} scale={120} size={1.5} speed={0.1} opacity={0.5} color="#e879f9" />
        <Sparkles count={100} scale={60}  size={3}   speed={0.3} opacity={0.3} color="#c084fc" />

        {/* The rocks, rings, and wireframes */}
        <FloatingRocks />

        {/* Camera driven by scroll + mouse */}
        <CameraController mouseRef={mouseRef} />

        {/* POST-PROCESSING — simplified (removed ChromaticAberration which was costly) */}
        <EffectComposer multisampling={0}>
          <Bloom
            intensity={2.0}
            luminanceThreshold={0.25}
            luminanceSmoothing={0.9}
            mipmapBlur
          />
          <Vignette eskil={false} offset={0.2} darkness={0.7} />
        </EffectComposer>
      </Canvas>

      {/* Radial glow overlay — extra depth */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(139,92,246,0.18) 0%, transparent 70%)',
      }} />
    </div>
  )
}
