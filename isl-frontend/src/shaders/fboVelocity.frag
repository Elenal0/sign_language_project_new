precision highp float;

uniform sampler2D uPosition;
uniform sampler2D uVelocity;

varying vec2 vUv;

void main(){
  vec4 vel = texture2D(uVelocity, vUv);
  gl_FragColor = vel;
}
