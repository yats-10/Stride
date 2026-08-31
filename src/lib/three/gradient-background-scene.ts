// 📖 Docs: obsidian/architecture/tech-stack.md (three) · decisions-log.md ADR-0014
//
// Static fullscreen fragment shader for the hero backdrop — a smooth blue "mesh
// gradient": soft-edged gaussian dark blobs overlapping into one near-black mass
// over a blue field, with a bright bottom-left glow and a softer top-right glow.
// No grain (kept smooth for contrast). Reproduces a supplied reference. It renders
// once (and on resize / colour change) — no render loop — and sits behind the
// Plasma Burst canvas, which composites onto it via `mix-blend-lighten`. Base +
// light colours are configurable (panel-driven); the blob shapes and glow
// positions are baked artwork.
import * as THREE from "three";

export interface GradientBackgroundColors {
  base: string; // blue field (`#rrggbb`)
  light: string; // bright glow (`#rrggbb`)
  /** Shifts the blob layout for a different pattern (same style). Default 0. */
  seed?: number;
}

export interface GradientBackgroundHandle {
  update: (colors: GradientBackgroundColors) => void;
  dispose: () => void;
}

const vertexShader = /* glsl */ `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const fragmentShader = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform vec2  uResolution;
uniform vec3  uBase;
uniform vec3  uLight;
uniform float uSeed;

// Soft elliptical gaussian blob — the building block of the smooth mesh gradient.
float blob(vec2 uv, vec2 c, vec2 r){ vec2 d = (uv - c) / r; return exp(-dot(d, d)); }

void main(){
  vec2 uv = vUv;                       // 0..1, (0,0) bottom-left
  vec3 navy   = vec3(0.015, 0.028, 0.085); // deep blue-black (keeps a blue hue, not grey)
  vec3 ltblue = vec3(0.42, 0.60, 1.0);

  // Base: vivid blue, only a gentle vertical falloff (stays saturated).
  vec3 col = mix(uBase * 0.88, uBase * 1.08, smoothstep(0.0, 1.0, uv.y));

  // Per-blob offset — same style, different arrangement when uSeed != 0.
  vec2 o1 = 0.22 * vec2(sin(uSeed * 1.3), cos(uSeed * 1.9));
  vec2 o2 = 0.22 * vec2(sin(uSeed * 2.1 + 1.7), cos(uSeed * 1.1 + 0.6));
  vec2 o3 = 0.22 * vec2(sin(uSeed * 0.7 + 3.1), cos(uSeed * 2.4 + 2.2));
  vec2 o4 = 0.22 * vec2(sin(uSeed * 1.7 + 4.2), cos(uSeed * 0.9 + 5.0));

  // Smooth dark blobs — soft-edged, overlapping into one blue-black mass. No turbulence.
  float dark = 0.0;
  dark += blob(uv, vec2(0.06, 0.86) + o1, vec2(0.30, 0.34)) * 0.85;
  dark += blob(uv, vec2(0.34, 0.66) + o2, vec2(0.34, 0.34)) * 1.00;
  dark += blob(uv, vec2(0.66, 0.56) + o3, vec2(0.46, 0.32)) * 1.10;
  dark += blob(uv, vec2(0.95, 0.66) + o4, vec2(0.30, 0.36)) * 0.80;
  dark = smoothstep(0.10, 0.9, clamp(dark, 0.0, 1.0));
  col = mix(col, navy, dark);

  // Bright soft glow, bottom-left — tighter so it doesn't wash the blue to grey.
  float g1 = blob(uv, vec2(0.08, -0.04), vec2(0.42, 0.36));
  col = mix(col, uLight, pow(clamp(g1, 0.0, 1.0), 1.7) * 0.95);

  // Softer light, top-right.
  float g2 = blob(uv, vec2(0.98, 1.05), vec2(0.40, 0.40));
  col = mix(col, ltblue, clamp(g2, 0.0, 1.0) * 0.4);

  // Punch: boost saturation + a touch of contrast so mid-tones read blue, not grey.
  float l = dot(col, vec3(0.299, 0.587, 0.114));
  col = max(mix(vec3(l), col, 1.4), 0.0);      // saturate (factor > 1)
  col = max((col - 0.5) * 1.1 + 0.5, 0.0);     // slight contrast

  gl_FragColor = vec4(col, 1.0);
}
`;

function hexToVec3(hex: string): THREE.Vector3 {
  const n = parseInt(hex.slice(1), 16);
  return new THREE.Vector3(
    ((n >> 16) & 255) / 255,
    ((n >> 8) & 255) / 255,
    (n & 255) / 255,
  );
}

export function createGradientBackground(
  canvas: HTMLCanvasElement,
  colors: GradientBackgroundColors,
): GradientBackgroundHandle {
  const parent = canvas.parentElement ?? canvas;
  const dpr = Math.min(window.devicePixelRatio, 2);
  const sizeOf = () => {
    const r = parent.getBoundingClientRect();
    return { w: Math.max(1, r.width), h: Math.max(1, r.height) };
  };
  let { w, h } = sizeOf();

  const renderer = new THREE.WebGL1Renderer({ canvas, antialias: true });
  renderer.setPixelRatio(dpr);
  renderer.setSize(w, h, false);

  const scene = new THREE.Scene();
  const camera = new THREE.Camera();
  const uniforms = {
    uResolution: { value: new THREE.Vector2(w * dpr, h * dpr) },
    uBase: { value: hexToVec3(colors.base) },
    uLight: { value: hexToVec3(colors.light) },
    uSeed: { value: colors.seed ?? 0 },
  };
  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
    depthTest: false,
    depthWrite: false,
  });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  scene.add(quad);

  const render = () => renderer.render(scene, camera);

  const resize = () => {
    const s = sizeOf();
    w = s.w;
    h = s.h;
    renderer.setSize(w, h, false);
    uniforms.uResolution.value.set(w * dpr, h * dpr);
    render();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(parent);
  render();

  return {
    update(next: GradientBackgroundColors) {
      uniforms.uBase.value.copy(hexToVec3(next.base));
      uniforms.uLight.value.copy(hexToVec3(next.light));
      uniforms.uSeed.value = next.seed ?? 0;
      render();
    },
    dispose() {
      ro.disconnect();
      material.dispose();
      quad.geometry.dispose();
      renderer.dispose();
      // Release the context so a remount (StrictMode/HMR) can attach a fresh
      // renderer to the same canvas instead of failing on the existing context.
      renderer.forceContextLoss();
    },
  };
}
