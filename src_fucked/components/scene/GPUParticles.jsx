/**
 * GPUParticles.jsx
 * Full GPU-based particle simulation using Frame Buffer Objects (FBOs).
 * Particles are shaped into a human hand/figure silhouette.
 * Mouse interaction causes repulsion, swirl and turbulence via GLSL.
 */
import { useMemo, useRef, useEffect, useCallback } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

// Inline shaders (avoids Vite shader plugin requirement)
const SIM_VERT = /* glsl */`
varying vec2 vUv;
void main(){
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
}
`

const SIM_FRAG = /* glsl */`
precision highp float;
uniform sampler2D uPosition;
uniform sampler2D uOriginal;
uniform float uTime;
uniform float uDelta;
uniform vec3  uMouse;

varying vec2 vUv;

vec3 mod289v3(vec3 x){return x-floor(x*(1./289.))*289.;}
vec4 mod289v4(vec4 x){return x-floor(x*(1./289.))*289.;}
vec4 permute(vec4 x){return mod289v4((x*34.+1.)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1./6.,1./3.);
  const vec4 D=vec4(0.,.5,1.,2.);
  vec3 i=floor(v+dot(v,C.yyy));
  vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);
  vec3 l=1.-g;
  vec3 i1=min(g.xyz,l.zxy);
  vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;
  vec3 x2=x0-i2+C.yyy;
  vec3 x3=x0-D.yyy;
  i=mod289v3(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
  float n_=0.142857142857;
  vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);
  vec4 y_=floor(j-7.*x_);
  vec4 x=x_*ns.x+ns.yyyy;
  vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);
  vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.+1.;
  vec4 s1=floor(b1)*2.+1.;
  vec4 sh=-step(h,vec4(0.));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);
  vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z);
  vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);
  m=m*m;
  return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
vec3 curlNoise(vec3 p){
  float e=0.01;
  float x=snoise(p+vec3(0,e,0))-snoise(p-vec3(0,e,0))
         -snoise(p+vec3(0,0,e))+snoise(p-vec3(0,0,e));
  float y=snoise(p+vec3(0,0,e))-snoise(p-vec3(0,0,e))
         -snoise(p+vec3(e,0,0))+snoise(p-vec3(e,0,0));
  float z=snoise(p+vec3(e,0,0))-snoise(p-vec3(e,0,0))
         -snoise(p+vec3(0,e,0))+snoise(p-vec3(0,e,0));
  return vec3(x,y,z)/(2.*e);
}

void main(){
  vec4 pos  = texture2D(uPosition, vUv);
  vec4 orig = texture2D(uOriginal, vUv);
  vec3 p = pos.xyz;
  // stored velocity in w+alpha trick: use separate velocity in pos.w as packed scalar
  // We keep velocity in a secondary texture; here we do Euler on pos directly:
  vec3 v = pos.www == vec3(0.) ? vec3(0.) : vec3(0.); // placeholder

  // Curl turbulence
  vec3 curl = curlNoise(p*0.35 + vec3(0.,0.,uTime*0.12)) * 0.12;

  // Mouse repulsion + swirl
  vec3 toM  = p - uMouse.xyz;
  float dist = length(toM) + 0.001;
  float rep  = uMouse.z * 4.5 / (dist*dist + 0.5);
  rep = clamp(rep, 0., 10.);
  vec3 repForce   = normalize(toM) * rep;
  vec3 swirlDir   = cross(vec3(0.,1.,0.5), normalize(toM));
  vec3 swirlForce = swirlDir * uMouse.z * 1.6 / (dist + 0.6);

  // Spring return
  vec3 toOrig = orig.xyz - p;
  vec3 spring = toOrig * 0.55;

  // Integrate (stored velocity via damping trick using pos.w = speed scalar)
  float spd = pos.w;
  vec3 acc   = (curl + repForce + swirlForce + spring) * uDelta * 55.;
  vec3 vel   = acc; // simple Euler; damping handled by spring
  p += vel;

  float newSpd = length(vel);
  gl_FragColor = vec4(p, newSpd);
}
`

const PART_VERT = /* glsl */`
precision highp float;
uniform sampler2D uPosition;
uniform float uTime;
attribute vec2  aRef;
attribute float aRnd;
varying  float  vFog;
varying  float  vLife;
varying  float  vSpd;
void main(){
  vec4 pos = texture2D(uPosition, aRef);
  vSpd  = pos.w;
  float depth = length(pos.xyz);
  vFog  = 1.0 - smoothstep(2.0, 8.0, depth);
  vLife = 0.5 + 0.5*sin(uTime*2.8*(aRnd*.7+.3)+aRnd*6.283);
  vec4 mv = modelViewMatrix * vec4(pos.xyz, 1.0);
  gl_PointSize = max(1.0, (2.8 + aRnd*3.)*300.0/(-mv.z));
  gl_Position  = projectionMatrix * mv;
}
`

const PART_FRAG = /* glsl */`
precision highp float;
uniform vec3 uColA;
uniform vec3 uColB;
uniform vec3 uColC;
varying float vFog;
varying float vLife;
varying float vSpd;
void main(){
  vec2  co = gl_PointCoord - .5;
  float r  = length(co)*2.0;
  if(r>1.0) discard;
  float core = 1.0-smoothstep(0.0,0.3,r);
  float halo = pow(1.0-smoothstep(0.0,1.0,r), 2.8);
  float speed01 = clamp(vSpd*6., 0.,1.);
  vec3 col = mix(uColA, uColB, r);
  col = mix(col, uColC, core*.7 + speed01*.4);
  float alpha = (core*.9 + halo*.22)*vFog*vLife;
  gl_FragColor = vec4(col, alpha);
}
`

// ── Particle shape: signed-language hand silhouette ───────────────────────────
function buildHandPositions(count) {
  const positions = new Float32Array(count * 4)

  // Define a hand shape with palm + 5 fingers as bezier-ish point clouds
  const segments = [
    // Palm (wide oval)
    { cx: 0, cy: -0.5, rx: 0.55, ry: 0.45, weight: 0.30 },
    // Thumb
    { type: 'finger', x0: -0.48, y0: -0.15, x1: -0.95, y1: 0.45, width: 0.12, weight: 0.10 },
    // Index
    { type: 'finger', x0: -0.24, y0:  0.0,  x1: -0.28, y1: 1.05, width: 0.10, weight: 0.14 },
    // Middle
    { type: 'finger', x0:  0.0,  y0:  0.0,  x1:  0.0,  y1: 1.18, width: 0.10, weight: 0.14 },
    // Ring
    { type: 'finger', x0:  0.24, y0:  0.0,  x1:  0.26, y1: 1.08, width: 0.10, weight: 0.14 },
    // Pinky
    { type: 'finger', x0:  0.45, y0: -0.08, x1:  0.52, y1: 0.82, width: 0.09, weight: 0.12 },
    // Wrist
    { cx: 0.04, cy: -0.9, rx: 0.28, ry: 0.18, weight: 0.06 },
  ]

  let idx = 0
  for (let i = 0; i < count; i++) {
    // Pick a segment weighted by density
    const rand = Math.random()
    let cumul = 0
    let seg = segments[0]
    for (const s of segments) {
      cumul += s.weight
      if (rand < cumul) { seg = s; break }
    }

    let x = 0, y = 0, z = 0
    if (seg.type === 'finger') {
      const t = Math.random()
      x = seg.x0 + (seg.x1 - seg.x0) * t + (Math.random() - 0.5) * seg.width
      y = seg.y0 + (seg.y1 - seg.y0) * t + (Math.random() - 0.5) * seg.width * 0.5
      z = (Math.random() - 0.5) * 0.08
    } else {
      // Ellipse palm/wrist
      const angle = Math.random() * Math.PI * 2
      const r = Math.sqrt(Math.random())
      x = seg.cx + r * Math.cos(angle) * seg.rx + (Math.random() - 0.5) * 0.04
      y = seg.cy + r * Math.sin(angle) * seg.ry + (Math.random() - 0.5) * 0.04
      z = (Math.random() - 0.5) * 0.12
    }

    // Scale up
    positions[idx * 4 + 0] = x * 1.8
    positions[idx * 4 + 1] = y * 1.8
    positions[idx * 4 + 2] = z * 1.8
    positions[idx * 4 + 3] = 0 // initial speed = 0
    idx++
  }
  return positions
}

// ── FBO helper ────────────────────────────────────────────────────────────────
function createFBO(gl, width, height, data) {
  const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat, THREE.FloatType)
  texture.needsUpdate = true
  const fbo = new THREE.WebGLRenderTarget(width, height, {
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    format:    THREE.RGBAFormat,
    type:      THREE.FloatType,
    depthBuffer: false,
  })
  fbo.texture.generateMipmaps = false
  return { texture, fbo }
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function GPUParticles({ mouse3D }) {
  const { gl, camera } = useThree()
  const SIZE  = 256          // 256×256 = 65536 particles
  const COUNT = SIZE * SIZE

  const simScene  = useRef(new THREE.Scene())
  const simCamera = useRef(new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1))
  const simMesh   = useRef(null)
  const fboA      = useRef(null)
  const fboB      = useRef(null)
  const partGeo   = useRef(null)
  const partMat   = useRef(null)
  const partMesh  = useRef(null)

  // Build initial data
  const initData = useMemo(() => buildHandPositions(COUNT), [COUNT])

  useEffect(() => {
    // Check float texture support
    const ext = gl.getContext().getExtension('OES_texture_float')
    if (!ext) console.warn('[GPUParticles] OES_texture_float not supported – falling back')

    // Create two FBOs for ping-pong
    const dataA = initData.slice()
    const dataB = initData.slice()
    fboA.current = new THREE.WebGLRenderTarget(SIZE, SIZE, {
      minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat, type: THREE.FloatType, depthBuffer: false,
    })
    fboB.current = new THREE.WebGLRenderTarget(SIZE, SIZE, {
      minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat, type: THREE.FloatType, depthBuffer: false,
    })

    // Upload initial positions into fboA
    const initTex = new THREE.DataTexture(initData, SIZE, SIZE, THREE.RGBAFormat, THREE.FloatType)
    initTex.needsUpdate = true
    const origTex = new THREE.DataTexture(initData.slice(), SIZE, SIZE, THREE.RGBAFormat, THREE.FloatType)
    origTex.needsUpdate = true

    // Render initTex into fboA using a simple copy shader
    const copyMat = new THREE.MeshBasicMaterial({ map: initTex })
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), copyMat)
    simScene.current.add(quad)
    gl.setRenderTarget(fboA.current)
    gl.render(simScene.current, simCamera.current)
    gl.setRenderTarget(null)
    simScene.current.remove(quad)

    // Simulation quad
    const simMat = new THREE.ShaderMaterial({
      vertexShader:   SIM_VERT,
      fragmentShader: SIM_FRAG,
      uniforms: {
        uPosition: { value: fboA.current.texture },
        uOriginal: { value: origTex },
        uTime:     { value: 0 },
        uDelta:    { value: 0.016 },
        uMouse:    { value: new THREE.Vector3(0, 0, 0) },
      },
    })
    const simQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), simMat)
    simScene.current.add(simQuad)
    simMesh.current = simQuad

    // Build particle geometry: each particle maps to a UV in the FBO
    const refs = new Float32Array(COUNT * 2)
    const rnds = new Float32Array(COUNT)
    for (let i = 0; i < COUNT; i++) {
      refs[i * 2 + 0] = (i % SIZE + 0.5) / SIZE
      refs[i * 2 + 1] = (Math.floor(i / SIZE) + 0.5) / SIZE
      rnds[i] = Math.random()
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(COUNT * 3), 3))
    geo.setAttribute('aRef',     new THREE.BufferAttribute(refs, 2))
    geo.setAttribute('aRnd',     new THREE.BufferAttribute(rnds, 1))
    partGeo.current = geo

    const mat = new THREE.ShaderMaterial({
      vertexShader:   PART_VERT,
      fragmentShader: PART_FRAG,
      uniforms: {
        uPosition: { value: fboA.current.texture },
        uTime:     { value: 0 },
        uColA:     { value: new THREE.Color('#a78bfa') }, // violet
        uColB:     { value: new THREE.Color('#818cf8') }, // indigo
        uColC:     { value: new THREE.Color('#ffffff') }, // white core
      },
      transparent: true,
      depthWrite:  false,
      blending:    THREE.AdditiveBlending,
    })
    partMat.current = mat

    const mesh = new THREE.Points(geo, mat)
    partMesh.current = mesh

    return () => {
      fboA.current?.dispose()
      fboB.current?.dispose()
      geo.dispose()
      mat.dispose()
    }
  }, [gl, COUNT, initData])

  // Attach particle mesh to scene via ref trick
  const meshRef = useCallback(node => {
    if (node && partMesh.current) node.add(partMesh.current)
  }, [])

  useFrame(({ clock }, delta) => {
    if (!simMesh.current || !fboA.current || !fboB.current || !partMat.current) return
    const t = clock.getElapsedTime()
    const dt = Math.min(delta, 0.05)

    // Update simulation uniforms
    const simUni = simMesh.current.material.uniforms
    simUni.uPosition.value = fboA.current.texture
    simUni.uTime.value     = t
    simUni.uDelta.value    = dt
    simUni.uMouse.value.copy(mouse3D.current)

    // Render simulation → fboB
    gl.setRenderTarget(fboB.current)
    gl.render(simScene.current, simCamera.current)
    gl.setRenderTarget(null)

    // Swap FBOs
    const tmp = fboA.current
    fboA.current = fboB.current
    fboB.current = tmp

    // Feed result to particle render shader
    partMat.current.uniforms.uPosition.value = fboA.current.texture
    partMat.current.uniforms.uTime.value     = t
  })

  return <group ref={meshRef} />
}
