precision highp float;

uniform sampler2D uPosition;
uniform sampler2D uVelocity;
uniform float uTime;
uniform float uDelta;
uniform vec3 uMouse;         // world-space mouse, z = strength (0–1)
uniform sampler2D uOriginal; // rest positions

varying vec2 vUv;

/* ── Curl noise helpers ──────────────────────────────────────── */
vec3 mod289(vec3 x){ return x - floor(x*(1./289.))*289.; }
vec4 mod289(vec4 x){ return x - floor(x*(1./289.))*289.; }
vec4 permute(vec4 x){ return mod289((x*34.+1.)*x); }
vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314*r; }

float snoise(vec3 v){
  const vec2 C = vec2(1./6., 1./3.);
  const vec4 D = vec4(0., 0.5, 1., 2.);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 =   v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute( permute( permute(
             i.z + vec4(0., i1.z, i2.z, 1.)) +
             i.y + vec4(0., i1.y, i2.y, 1.)) +
             i.x + vec4(0., i1.x, i2.x, 1.));
  float n_ = 0.142857142857;
  vec3  ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49. * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7. * x_);
  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );
  vec4 s0 = floor(b0)*2. + 1.;
  vec4 s1 = floor(b1)*2. + 1.;
  vec4 sh = -step(h, vec4(0.));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42. * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
}

vec3 curl(vec3 p) {
  float eps = 0.01;
  vec3 dx = vec3(eps, 0., 0.);
  vec3 dy = vec3(0., eps, 0.);
  vec3 dz = vec3(0., 0., eps);
  float x = snoise(p+dy).x - snoise(p-dy).x
           - snoise(p+dz).x + snoise(p-dz).x;
  float y = snoise(p+dz).x - snoise(p-dz).x
           - snoise(p+dx).x + snoise(p-dx).x;
  float z = snoise(p+dx).x - snoise(p-dx).x
           - snoise(p+dy).x + snoise(p-dy).x;
  return vec3(x, y, z) / (2. * eps);
}

void main(){
  vec4 pos  = texture2D(uPosition, vUv);
  vec4 vel  = texture2D(uVelocity, vUv);
  vec4 orig = texture2D(uOriginal, vUv);

  vec3 p = pos.xyz;
  vec3 v = vel.xyz;

  /* ── Curl noise turbulence ──────── */
  float noiseScale = 0.4;
  vec3 noisePos = p * noiseScale + vec3(0., 0., uTime * 0.15);
  vec3 curlForce = curl(noisePos) * 0.08;

  /* ── Mouse repulsion ─────────────── */
  vec3 toMouse = p - uMouse.xyz;
  float dist = length(toMouse);
  float mouseStrength = uMouse.z; // 0 = idle, 1 = active
  float repel = mouseStrength * 3.5 / (dist * dist + 0.4);
  repel = clamp(repel, 0., 8.);
  vec3 mouseForce = normalize(toMouse + 0.001) * repel;

  /* ── Swirl around mouse ──────────── */
  vec3 axis = vec3(0., 1., 0.);
  vec3 toMouseDir = normalize(toMouse + 0.001);
  vec3 swirlDir = cross(axis, toMouseDir);
  float swirlStrength = mouseStrength * 1.2 / (dist + 0.5);
  vec3 swirlForce = swirlDir * swirlStrength;

  /* ── Spring return to rest ───────── */
  vec3 toOrig = orig.xyz - p;
  float stiffness = 0.6;
  vec3 springForce = toOrig * stiffness;

  /* ── Damping ─────────────────────── */
  v *= 0.88;

  /* ── Integrate forces ────────────── */
  v += (curlForce + mouseForce + swirlForce + springForce) * uDelta * 60.;
  p += v * uDelta * 60.;

  gl_FragColor = vec4(p, pos.w);
}
