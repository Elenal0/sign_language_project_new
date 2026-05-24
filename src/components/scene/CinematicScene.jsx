import { useRef, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Sparkles } from '@react-three/drei'
import * as THREE from 'three'
import FloatingRocks from './FloatingRocks'

// Helper: returns the real scroll container (either #main-scroll or window)
function getScrollEl() {
  return document.getElementById('main-scroll') || window
}

function getScrollTop(el) {
  return el === window ? window.scrollY : el.scrollTop
}

function getScrollMax(el) {
  if (el === window) {
    return document.documentElement.scrollHeight - window.innerHeight
  }
  return el.scrollHeight - el.clientHeight
}

// The camera controller that listens to the REAL scroll container
function CameraController() {
  const { camera } = useThree()
  const currentZ = useRef(15)
  const targetZ = useRef(15)

  useEffect(() => {
    const el = getScrollEl()

    const handleScroll = () => {
      const scrollTop = getScrollTop(el)
      const maxScroll = getScrollMax(el)
      const progress = maxScroll > 0 ? Math.max(0, Math.min(1, scrollTop / maxScroll)) : 0
      // Map 0→1 progress to z: 15 → -120
      targetZ.current = 15 - progress * 135
    }

    el.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // run once on mount
    return () => el.removeEventListener('scroll', handleScroll)
  }, [])

  useFrame((state, delta) => {
    currentZ.current = THREE.MathUtils.damp(currentZ.current, targetZ.current, 3, delta)
    camera.position.z = currentZ.current

    const time = state.clock.getElapsedTime()
    camera.position.x = Math.sin(time * 0.3) * 1.2
    camera.position.y = Math.cos(time * 0.25) * 1.2
    camera.lookAt(0, 0, currentZ.current - 20)
  })

  return null
}

export default function CinematicScene() {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', background: '#0f0c16' }}>
      <Canvas
        shadows={false}
        gl={{ antialias: false, alpha: false, powerPreference: 'high-performance' }}
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 15], fov: 45 }}
      >
        <color attach="background" args={['#0f0c16']} />
        <fogExp2 attach="fog" args={['#1e152a', 0.015]} />

        <ambientLight intensity={0.5} color="#cda4fa" />
        <directionalLight position={[10, 20, 15]} intensity={1.5} color="#f4c2ff" />
        <pointLight position={[-10, -10, -10]} intensity={1} color="#60a5fa" />

        <Sparkles count={300} scale={100} size={2} speed={0.2} opacity={0.25} color="#f4c2ff" />

        <FloatingRocks />
        <CameraController />
      </Canvas>

      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(circle at center, rgba(162, 102, 255, 0.12) 0%, transparent 60%)',
        pointerEvents: 'none',
      }} />
    </div>
  )
}
