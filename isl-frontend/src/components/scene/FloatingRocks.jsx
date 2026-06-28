import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const ROCK_DATA = (() => {
  const data = []
  // LAYER 1 — Giant foreground rocks with strong emissive glow
  for (let i = 0; i < 6; i++) {
    data.push({
      pos: [
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 20,
        -i * 18 - Math.random() * 8,
      ],
      rot: [Math.random() * Math.PI, Math.random() * Math.PI, 0],
      scale: 3 + Math.random() * 5,
      detail: 1,
      emissive: new THREE.Color().setHSL(0.75 + Math.random() * 0.15, 0.9, 0.35),
      emissiveIntensity: 0.6 + Math.random() * 0.8,
      speed: { rx: (Math.random() - 0.5) * 0.003, ry: (Math.random() - 0.5) * 0.004 },
      layer: 'giant',
    })
  }
  // LAYER 2 — Mid rocks
  for (let i = 0; i < 15; i++) {
    data.push({
      pos: [
        (Math.random() - 0.5) * 55,
        (Math.random() - 0.5) * 35,
        -Math.random() * 140 + 5,
      ],
      rot: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI],
      scale: 1 + Math.random() * 2.5,
      detail: 0,
      emissive: new THREE.Color().setHSL(0.7 + Math.random() * 0.2, 0.8, 0.25),
      emissiveIntensity: 0.3 + Math.random() * 0.5,
      speed: { rx: (Math.random() - 0.5) * 0.006, ry: (Math.random() - 0.5) * 0.007 },
      layer: 'mid',
    })
  }
  // LAYER 3 — Tiny distant specks
  for (let i = 0; i < 14; i++) {
    data.push({
      pos: [
        (Math.random() - 0.5) * 80,
        (Math.random() - 0.5) * 50,
        -Math.random() * 160 - 10,
      ],
      rot: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI],
      scale: 0.3 + Math.random() * 0.8,
      detail: 0,
      emissive: new THREE.Color().setHSL(0.72 + Math.random() * 0.2, 1, 0.4),
      emissiveIntensity: 1.5 + Math.random() * 2,
      speed: { rx: (Math.random() - 0.5) * 0.01, ry: (Math.random() - 0.5) * 0.01 },
      layer: 'tiny',
    })
  }
  return data
})()

function Rock({ data }) {
  const ref = useRef()
  useFrame(() => {
    if (!ref.current) return
    ref.current.rotation.x += data.speed.rx
    ref.current.rotation.y += data.speed.ry
  })

  return (
    <mesh ref={ref} position={data.pos} rotation={data.rot} scale={data.scale} castShadow>
      <icosahedronGeometry args={[1, data.detail]} />
      <meshStandardMaterial
        color="#0d0820"
        roughness={0.8}
        metalness={0.15}
        flatShading={true}
        emissive={data.emissive}
        emissiveIntensity={data.emissiveIntensity}
      />
    </mesh>
  )
}

// Glowing energy ring floating in the distance
function EnergyRing({ z, color, radius, thickness, speed }) {
  const ref = useRef()
  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.rotation.x = clock.getElapsedTime() * speed
    ref.current.rotation.y = clock.getElapsedTime() * speed * 0.7
  })
  return (
    <mesh ref={ref} position={[0, 0, z]}>
      <torusGeometry args={[radius, thickness, 3, 48]} />
      <meshStandardMaterial
        color="#000"
        emissive={color}
        emissiveIntensity={2.5}
        wireframe={false}
        transparent
        opacity={0.6}
      />
    </mesh>
  )
}

// Wireframe accent rock
function WireRock({ pos, scale, color }) {
  const ref = useRef()
  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.rotation.y = clock.getElapsedTime() * 0.3
    ref.current.rotation.x = clock.getElapsedTime() * 0.15
  })
  return (
    <mesh ref={ref} position={pos} scale={scale}>
      <icosahedronGeometry args={[1, 1]} />
      <meshBasicMaterial color={color} wireframe transparent opacity={0.4} />
    </mesh>
  )
}

export default function FloatingRocks() {
  return (
    <>
      {ROCK_DATA.map((data, i) => <Rock key={i} data={data} />)}

      {/* Giant glowing rings at different depths */}
      <EnergyRing z={-30} color={new THREE.Color('#9b59ff')} radius={18} thickness={0.12} speed={0.15} />
      <EnergyRing z={-70} color={new THREE.Color('#ff6ec7')} radius={25} thickness={0.08} speed={0.1} />
      <EnergyRing z={-110} color={new THREE.Color('#59d2ff')} radius={32} thickness={0.06} speed={0.07} />

      {/* Wireframe accent rocks */}
      <WireRock pos={[8, 4, -25]} scale={4} color="#c084fc" />
      <WireRock pos={[-12, -6, -55]} scale={6} color="#f472b6" />
      <WireRock pos={[15, -8, -85]} scale={5} color="#38bdf8" />
    </>
  )
}
