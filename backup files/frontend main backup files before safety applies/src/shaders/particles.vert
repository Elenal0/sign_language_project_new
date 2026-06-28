precision highp float;

uniform sampler2D uPosition;
uniform float uTime;
uniform vec3 uCameraPos;
uniform float uFogNear;
uniform float uFogFar;

attribute vec2 aRef;        // UV into FBO textures
attribute float aRandom;    // per-particle random [0,1]

varying float vSpeed;
varying float vFog;
varying float vLife;

void main(){
  vec4 pos = texture2D(uPosition, aRef);
  vec3 worldPos = pos.xyz;

  /* Depth fog */
  float depth = length(worldPos - uCameraPos);
  vFog = 1.0 - smoothstep(uFogNear, uFogFar, depth);

  /* Twinkle based on time + random */
  vLife = 0.6 + 0.4 * sin(uTime * 2.5 * (aRandom * 0.7 + 0.3) + aRandom * 6.283);

  vec4 mvPosition = modelViewMatrix * vec4(worldPos, 1.0);
  gl_PointSize = max(1.2, (3.5 + aRandom * 2.5) * (1.0 / -mvPosition.z) * 400.0);
  gl_Position  = projectionMatrix * mvPosition;
}
