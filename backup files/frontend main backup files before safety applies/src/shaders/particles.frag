precision highp float;

uniform vec3  uColorA;   // inner glow colour
uniform vec3  uColorB;   // outer haze colour
uniform vec3  uColorC;   // accent colour (tips)

varying float vFog;
varying float vLife;

void main(){
  /* Soft circular particle */
  vec2  coord = gl_PointCoord - 0.5;
  float r     = length(coord) * 2.0;
  if(r > 1.0) discard;

  /* Dual-layer glow */
  float core  = 1.0 - smoothstep(0.0, 0.35, r);
  float halo  = 1.0 - smoothstep(0.0, 1.00, r);
  halo = pow(halo, 2.5);

  vec3  col = mix(uColorA, uColorB, r);
  col       = mix(col, uColorC, core * 0.6);
  float a   = (core * 0.95 + halo * 0.25) * vFog * vLife;

  gl_FragColor = vec4(col, a);
}
