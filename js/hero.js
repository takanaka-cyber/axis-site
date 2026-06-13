// AXIS — hero iridescent ribbon (Three.js)
import * as THREE from 'three';

const canvas = document.getElementById('hero-canvas');
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setClearColor(0x000000, 0);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
camera.position.set(0, 1.1, 6.2);
camera.lookAt(0, -0.2, 0);

const uniforms = {
  uTime: { value: 0 },
  uMouse: { value: new THREE.Vector2(0, 0) },
};

const material = new THREE.ShaderMaterial({
  uniforms,
  transparent: true,
  side: THREE.DoubleSide,
  vertexShader: /* glsl */`
    uniform float uTime;
    uniform vec2 uMouse;
    varying vec3 vWorld;
    varying vec2 vUv;

    float wave(vec2 p, float t) {
      float v = 0.0;
      v += sin(p.x * 0.55 - t * 0.32 + p.y * 0.45) * 0.95;
      v += sin(p.x * 1.05 + t * 0.55) * 0.45;
      v += sin(p.y * 1.55 + t * 0.42 + p.x * 0.6) * 0.30;
      v += sin((p.x + p.y) * 2.3 + t * 0.85) * 0.12;
      v += sin((p.x * 3.4 - p.y * 2.1) + t * 1.25) * 0.05;
      return v;
    }

    void main() {
      vUv = uv;
      vec3 pos = position;
      vec2 p = pos.xy * 0.85;
      // edge envelope keeps the silk pinned softly at the borders
      float env = smoothstep(0.0, 0.18, uv.x) * smoothstep(1.0, 0.82, uv.x)
                * smoothstep(0.0, 0.25, uv.y) * smoothstep(1.0, 0.75, uv.y);
      env = mix(0.35, 1.0, env);
      float h = wave(p + uMouse * 0.4, uTime);
      pos.z += h * 0.85 * env;
      vec4 wp = modelMatrix * vec4(pos, 1.0);
      vWorld = wp.xyz;
      gl_Position = projectionMatrix * viewMatrix * wp;
    }
  `,
  fragmentShader: /* glsl */`
    uniform float uTime;
    uniform vec2 uMouse;
    varying vec3 vWorld;
    varying vec2 vUv;

    // cosine spectral palette — oil-slick iridescence
    vec3 pal(float t) {
      return 0.5 + 0.5 * cos(6.28318 * (t + vec3(0.0, 0.33, 0.67)));
    }

    void main() {
      vec3 n = normalize(cross(dFdx(vWorld), dFdy(vWorld)));
      vec3 v = normalize(cameraPosition - vWorld);
      float ndv = clamp(dot(n, v), 0.0, 1.0);
      float fres = pow(1.0 - ndv, 2.4);

      float band = n.x * 0.55 + n.y * 0.25 + vUv.x * 1.7 - uTime * 0.035 + uMouse.x * 0.25;
      vec3 irid = pal(band);

      vec3 base = vec3(0.026, 0.043, 0.056);
      vec3 col = base
        + irid * fres * 0.58
        + vec3(0.55, 0.6, 0.66) * pow(max(n.y, 0.0), 3.0) * 0.10
        + vec3(1.0) * pow(ndv, 48.0) * 0.05;

      // fade the plane into the page background at its edges
      float a = smoothstep(0.0, 0.16, vUv.x) * smoothstep(1.0, 0.84, vUv.x)
              * smoothstep(0.0, 0.2, vUv.y) * smoothstep(1.0, 0.8, vUv.y);
      gl_FragColor = vec4(col, a);
    }
  `,
});

const geometry = new THREE.PlaneGeometry(16, 9, 240, 140);
const mesh = new THREE.Mesh(geometry, material);
mesh.rotation.x = -Math.PI / 2.5;
mesh.position.y = -0.7;
scene.add(mesh);

const mouseTarget = new THREE.Vector2(0, 0);
window.addEventListener('pointermove', (e) => {
  mouseTarget.set(
    (e.clientX / window.innerWidth) * 2 - 1,
    (e.clientY / window.innerHeight) * 2 - 1
  );
});

function resize() {
  const w = canvas.clientWidth || canvas.parentElement.clientWidth;
  const h = canvas.clientHeight || canvas.parentElement.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

let visible = true;
new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; })
  .observe(canvas.parentElement);

const clock = new THREE.Clock();
function tick() {
  if (visible) {
    uniforms.uTime.value = clock.getElapsedTime();
    uniforms.uMouse.value.lerp(mouseTarget, 0.04);
    camera.position.x = uniforms.uMouse.value.x * 0.25;
    camera.position.y = 1.1 - uniforms.uMouse.value.y * 0.12;
    camera.lookAt(0, -0.2, 0);
    renderer.render(scene, camera);
  }
  if (!reduced) requestAnimationFrame(tick);
}

if (reduced) {
  uniforms.uTime.value = 4.2;
  renderer.render(scene, camera);
} else {
  tick();
}
