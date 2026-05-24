import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Pre-calculate random data for rocks so it doesn't change on re-renders
const ROCK_COUNT = 60
const Z_DEPTH = 150 // How deep the scene goes

export default function FloatingRocks() {
  const rocks = useMemo(() => {
    const temp = []
    for (let i = 0; i < ROCK_COUNT; i++) {
      temp.push({
        position: [
          (Math.random() - 0.5) * 40, // Spread X wide
          (Math.random() - 0.5) * 30, // Spread Y high
          -Math.random() * Z_DEPTH + 10, // Spread Z deep into the screen
        ],
        rotation: [Math.random() * Math.PI, Math.random() * Math.PI, 0],
        scale: [
          Math.random() * 2 + 1,
          Math.random() * 3 + 1.5,
          Math.random() * 2 + 1,
        ],
        speed: {
          rx: (Math.random() - 0.5) * 0.005,
          ry: (Math.random() - 0.5) * 0.005,
          rz: (Math.random() - 0.5) * 0.005,
        },
      })
    }
    return temp
  }, [])

  return (
    <>
      {rocks.map((data, index) => (
        <SingleRock key={index} data={data} />
      ))}
    </>
  )
}

function SingleRock({ data }) {
  const ref = useRef()

  useFrame(() => {
    if (!ref.current) return
    // Very subtle continuous rotation
    ref.current.rotation.x += data.speed.rx
    ref.current.rotation.y += data.speed.ry
    ref.current.rotation.z += data.speed.rz
  })

  return (
    <mesh
      ref={ref}
      position={data.position}
      rotation={data.rotation}
      scale={data.scale}
      castShadow
      receiveShadow
    >
      <icosahedronGeometry args={[1, 1]} />
      {/* Premium minimal material: dark rock with slight shine */}
      <meshStandardMaterial 
        color="#1a1a24" 
        roughness={0.7} 
        metalness={0.2}
        flatShading={true}
      />
    </mesh>
  )
}
