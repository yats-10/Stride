// 📖 Docs: obsidian/architecture/tech-stack.md (three) · decisions-log.md ADR-0014
//
// Config-driven factory for the home hero's WebGL "Plasma Burst" scene. This is
// the WebGL subsystem — it owns its own renderer, geometry, shaders, bloom
// composer and render loop, isolated from the spring animation engine (ADR-0002
// governs DOM/UI motion; a canvas artwork runs its own loop). The React leaf
// (src/views/plasma-burst.tsx) mounts it, feeds live config via `update()`, and
// disposes it.
//
// Ported from a fixed Three.js r0.143 spec. The scene renders on pure black under
// bloom; the blue "stage" is a DOM element behind the canvas, composited via CSS
// `mix-blend-lighten` (see the leaf), so black reads as the deep-blue stage and
// only the bright burst punches through — keeping additive+bloom on black (where
// it works) instead of washing out over a coloured clear.
//
// One deliberate deviation from the spec: sparks are white shades only
// (filaments/core keep their violet/indigo). The tunable defaults below also
// deviate from the spec where the blue-stage composition demands it — they are
// surfaced in the dev controls panel (src/views/plasma-controls.tsx) so the exact
// values can be dialled in by hand.
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { GammaCorrectionShader } from "three/examples/jsm/shaders/GammaCorrectionShader.js";

/** Live-tunable configuration for the scene + its DOM stage. */
export interface PlasmaConfig {
  // Background shader colours (the grainy gradient behind the burst)
  stageColor: string; // blue field / base
  glowColor: string; // bright glow (bottom-left + top-right lights)
  // Camera & motion
  cameraZ: number; // camera distance — larger = more contained burst
  rotateSpeed: number; // turntable spin (rad/s)
  // Core sprite
  coreSize: number;
  coreGlow: number;
  // Bloom (UnrealBloomPass)
  bloomStr: number;
  bloomRadius: number;
  bloomThresh: number;
  // Filaments
  lineBrightness: number; // global brightness multiplier
  sway: number;
  swaySpeed: number;
  shimmer: number;
  shimmerSpeed: number;
  // Sparks
  sparkBrightness: number;
  sparkSize: number;
  twinkle: number;
  // Figure colours (`#rrggbb`). Filament colours are baked into geometry, so
  // changing them rebuilds; the core-sprite colours are live uniforms.
  colCore: string; // white-hot base flash (blended into the gradient near the base)
  colInner: string; // filament inner (near base)
  colMid: string; // filament mid (electric violet)
  colOuter: string; // filament tip (deep indigo)
  coreColor: string; // core sprite centre
  coreHalo: string; // core sprite halo
  // Structure (changing these rebuilds geometry)
  filaments: number;
  sparks: number;
  spread: number;
  curl: number;
}

/** Current tuned defaults (the values shipped in the hero). */
export const defaultPlasmaConfig: PlasmaConfig = {
  stageColor: "#1c3ee6",
  glowColor: "#eef3ff",
  cameraZ: 4,
  rotateSpeed: 0.24,
  coreSize: 0.39,
  coreGlow: 0.59,
  bloomStr: 0.44,
  bloomRadius: 0,
  bloomThresh: 0.11,
  lineBrightness: 0.48,
  sway: 0.19,
  swaySpeed: 0.6,
  shimmer: 0,
  shimmerSpeed: 0.4,
  sparkBrightness: 0.32,
  sparkSize: 0.05,
  twinkle: 0.1,
  colCore: "#ffffff",
  colInner: "#c2c6ff",
  colMid: "#5c7cff",
  colOuter: "#242c9e",
  coreColor: "#a3a6ff",
  coreHalo: "#5f5cff",
  filaments: 60,
  sparks: 700,
  spread: 2.65,
  curl: 0,
};

export interface PlasmaBurstOptions {
  config: PlasmaConfig;
  /** Render a single static frame instead of animating (prefers-reduced-motion). */
  reducedMotion: boolean;
  /** Live hero-shrink progress 0..1 (read each frame): speeds the spin and zooms
   *  the camera in as the hero shrinks. Default 0. */
  heroProgress?: () => number;
  /** Live cursor position (read each frame): NDC x/y (-1..1) and whether the pointer
   *  is over the hero. Filament tips magnetise toward it. Omit to disable. */
  pointer?: () => { x: number; y: number; active: boolean };
  /** Gate the intro (read each frame): the burst stays hidden until this returns true,
   *  then plays its scale-up + fade + spin-up. Omit → starts immediately. */
  started?: () => boolean;
}

// How much the hero-shrink progress accelerates/enlarges the burst.
const SPIN_MULT = 5; // spin speed at full shrink
const ZOOM_MULT = 1.7; // apparent size at full shrink (camera moves closer)
// Intro (played once the `started` gate opens): fade + scale-up from small + a spin
// boost that decays to the idle turn.
const INTRO_MS = 1400;
const INTRO_SCALE_FROM = 0.45; // group scale at the start of the intro
const INTRO_SPIN = 3.2; // rad/s of extra spin at the start, easing to 0
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
// Cursor magnet: fraction of the way a filament tip leans toward the cursor at full
// strength, and how fast the lean + pointer position ease in/out each frame.
const MAGNET_STRENGTH = 0.38;
const MAGNET_EASE = 0.08;
const POINTER_EASE = 0.12;
// View-space reach of the magnet — only filament tips within ~this distance of the
// cursor react (smaller = fewer, more local hairs cling).
const MAGNET_RADIUS = 0.9;

export interface PlasmaBurstHandle {
  update: (config: PlasmaConfig) => void;
  dispose: () => void;
}

// --- fixed scene constants (artwork parameters, not design tokens) -----------
// Filament + core colours are configurable (see PlasmaConfig). Particles are white
// shades only (project request) — their colours stay fixed here, no violet tint.
const colSpark = "#ffffff";
const colPink = "#e6ecff";

const segments = 64; // points per filament
const bendCfg = 0.55;
const tipFade = 0.14;
const lineBright = 1.1; // spec base brightness (global mult is in config)
const mainAlpha = 1;

const TAU = 6.2831;
const { smoothstep, lerp } = THREE.MathUtils;

function hexToVec3(hex: string): THREE.Vector3 {
  const n = parseInt(hex.slice(1), 16);
  return new THREE.Vector3(
    ((n >> 16) & 255) / 255,
    ((n >> 8) & 255) / 255,
    (n & 255) / 255,
  );
}

function mulberry32(a: number): () => number {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const lineVert = /* glsl */ `
attribute vec3  aColor;
attribute vec3  aSway;
attribute vec3  aSway2;
attribute float aAlong;
attribute float aSeed;
uniform float uTime, uSway, uSwaySpeed, uEnergy;
uniform vec2  uPointer;                 // cursor in NDC (-1..1), eased
uniform float uMagnet, uTanHalfFov, uAspect; // magnet strength (eased) + camera params
uniform float uMagnetRadius;            // view-space reach of the magnet
varying vec3  vColor;
varying float vAlong, vSeed;
void main(){
  vColor = aColor; vAlong = aAlong; vSeed = aSeed;
  vec3 p = position;
  float amp = uSway * aAlong * (1.0 + uEnergy * 1.6);
  float ph  = aSeed * 6.2831;
  float t   = uTime * uSwaySpeed;
  float w1 = sin(t + ph + aAlong * 5.0);
  float w2 = cos(t * 1.27 + ph * 1.7 + aAlong * 9.0);
  float w3 = 0.5 * sin(t * 0.6 + ph);
  p += aSway  * (w1 + w3) * amp;
  p += aSway2 * w2 * amp * 0.8;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  // Magnetise filaments toward the cursor in screen (view) space — base anchored
  // at the core (aAlong=0), tips pulled most (aAlong^2). uPointer is NDC; convert to
  // the view-space xy that projects there at this vertex's depth. Applied post-
  // modelView so the lean follows the cursor on screen regardless of the spin.
  float hy = -mv.z * uTanHalfFov;
  float hx = hy * uAspect;
  vec2 targetView = vec2(uPointer.x * hx, uPointer.y * hy);
  // Only filaments whose tip is near the cursor react: Gaussian falloff on the
  // view-space distance from the vertex to the cursor. Far filaments (prox→0) stay put.
  float dist = length(targetView - mv.xy);
  float prox = exp(-(dist * dist) / (uMagnetRadius * uMagnetRadius));
  float pull = uMagnet * aAlong * aAlong * prox;
  mv.xy = mix(mv.xy, targetView, pull);
  gl_Position = projectionMatrix * mv;
}`;

const lineFrag = /* glsl */ `
precision highp float;
uniform float uTime, uShimmer, uShimmerSpeed, uBright, uBrightness, uEnergy, uShock, uShockAmp;
varying vec3  vColor;
varying float vAlong, vSeed;
void main(){
  float sh = 0.6 + uShimmer * 0.55 * sin(vAlong * 16.0 - uTime * uShimmerSpeed + vSeed * 28.0);
  sh = max(sh, 0.0);
  float shock = 0.0;
  if (uShock >= 0.0) shock = uShockAmp * exp(-pow((vAlong - uShock) * 7.0, 2.0)) * 2.0;
  vec3 c = vColor * (sh * (1.0 + uEnergy * 0.8) + shock) * uBright * uBrightness;
  gl_FragColor = vec4(c, 1.0);
}`;

const sparkVert = /* glsl */ `
attribute vec3  aColor;
attribute float aSize;
attribute float aPhase;
uniform float uTime, uSparkSize, uTwinkle, uPixelRatio, uEnergy;
varying vec3  vColor;
varying float vTw;
void main(){
  vColor = aColor;
  float tw = 0.45 + 0.55 * sin(uTime * uTwinkle + aPhase * 6.2831);
  vTw = tw;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  float s = uSparkSize * aSize * uPixelRatio * (200.0 / max(0.001, -mv.z));
  gl_PointSize = s * (0.6 + 0.5 * tw) * (1.0 + uEnergy * 0.4);
  gl_Position = projectionMatrix * mv;
}`;

const sparkFrag = /* glsl */ `
precision highp float;
uniform float uBrightness, uEnergy;
varying vec3  vColor;
varying float vTw;
void main(){
  vec2 d = gl_PointCoord - 0.5;
  float r = length(d);
  float a = smoothstep(0.5, 0.0, r);
  a *= a;
  vec3 c = vColor * (0.4 + vTw) * (1.0 + uEnergy * 0.6) * uBrightness;
  gl_FragColor = vec4(c, a);
}`;

const coreVert = /* glsl */ `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

const coreFrag = /* glsl */ `
precision highp float;
uniform vec3 uColCore, uColMid;
uniform float uTime, uGlow, uBrightness, uAlpha, uEnergy;
varying vec2 vUv;
void main(){
  vec2 p = vUv - 0.5;
  float r = length(p) * 2.0;
  float core = exp(-r * r * 16.0);
  float halo = exp(-r * 4.2) * 0.22;
  float flick = 0.97 + 0.03 * sin(uTime * 1.5); // gentle breathe, no fast flicker
  float boost = 1.0 + uEnergy * 1.2;
  vec3 c = (uColCore * core + uColMid * halo) * uGlow * flick * boost * uBrightness;
  float a = clamp(core + halo, 0.0, 1.0) * uAlpha;
  gl_FragColor = vec4(c, a);
}`;

// White spark colours (constant across rebuilds)
const spark = hexToVec3(colSpark);
const pink = hexToVec3(colPink);

interface BuiltGeometry {
  lineGeo: THREE.BufferGeometry;
  sparkGeo: THREE.BufferGeometry;
}

// Deterministic geometry build from the structural config (one PRNG, filaments
// then sparks). Returns fresh BufferGeometries; callers swap + dispose the old.
function buildGeometry(cfg: PlasmaConfig): BuiltGeometry {
  const rng = mulberry32(0x9e3779b9);
  // Configurable filament gradient colours (baked into per-vertex aColor).
  const core = hexToVec3(cfg.colCore);
  const inner = hexToVec3(cfg.colInner);
  const mid = hexToVec3(cfg.colMid);
  const outer = hexToVec3(cfg.colOuter);
  const F = cfg.filaments;
  const P = segments;
  const segs = P - 1;
  const N = F * segs * 2;
  const pos = new Float32Array(N * 3);
  const aColor = new Float32Array(N * 3);
  const aSway = new Float32Array(N * 3);
  const aSway2 = new Float32Array(N * 3);
  const aAlong = new Float32Array(N);
  const aSeed = new Float32Array(N);
  const coreStart = 0.06;
  const tipFlare: THREE.Vector3[] = [];
  let wi = 0;

  const dir = new THREE.Vector3();
  const up = new THREE.Vector3();
  const u = new THREE.Vector3();
  const v = new THREE.Vector3();
  const bend = new THREE.Vector3();

  for (let f = 0; f < F; f++) {
    const seed = rng();
    const z = rng() * 2 - 1;
    const th = rng() * TAU;
    const rr = Math.sqrt(1 - z * z);
    dir.set(rr * Math.cos(th), rr * Math.sin(th), z);
    up.set(Math.abs(dir.y) > 0.99 ? 1 : 0, Math.abs(dir.y) > 0.99 ? 0 : 1, 0);
    u.copy(dir).cross(up).normalize();
    v.copy(dir).cross(u).normalize();

    let len = cfg.spread * (0.28 + rng() * rng() * 1.15);
    if (rng() > 0.86) len *= 1.7;
    const f1 = 2 + rng() * 5;
    const f2 = 2 + rng() * 5;
    const p1 = rng() * TAU;
    const p2 = rng() * TAU;
    const curlF = cfg.curl * (0.45 + rng());
    bend
      .copy(u)
      .multiplyScalar(rng() - 0.5)
      .addScaledVector(v, rng() - 0.5)
      .normalize()
      .multiplyScalar(bendCfg * (0.4 + rng()));

    const pts: THREE.Vector3[] = [];
    const cols: THREE.Vector3[] = [];
    for (let i = 0; i < P; i++) {
      const t = i / (P - 1);
      const radius = coreStart + len * t;
      const pt = new THREE.Vector3()
        .copy(dir)
        .multiplyScalar(radius)
        .addScaledVector(u, Math.sin(t * f1 * Math.PI + p1) * curlF * t)
        .addScaledVector(v, Math.cos(t * f2 * Math.PI + p2) * curlF * t)
        .addScaledVector(bend, t * t);

      const c1 = inner.clone().lerp(mid, smoothstep(t, 0.0, 0.5));
      const c = c1.lerp(outer, smoothstep(t, 0.5, 1.0));
      c.lerp(core, (1 - smoothstep(t, 0.0, 0.12)) * 0.9);
      const bright = lerp(1.15, tipFade, smoothstep(t, 0.0, 1.0));
      c.multiplyScalar(bright);

      pts.push(pt);
      cols.push(c);
    }
    tipFlare.push(pts[P - 1].clone());

    for (let i = 0; i < segs; i++) {
      for (let e = 0; e < 2; e++) {
        const idx = i + e;
        const t = idx / (P - 1);
        pos[wi * 3] = pts[idx].x;
        pos[wi * 3 + 1] = pts[idx].y;
        pos[wi * 3 + 2] = pts[idx].z;
        aColor[wi * 3] = cols[idx].x;
        aColor[wi * 3 + 1] = cols[idx].y;
        aColor[wi * 3 + 2] = cols[idx].z;
        aSway[wi * 3] = u.x;
        aSway[wi * 3 + 1] = u.y;
        aSway[wi * 3 + 2] = u.z;
        aSway2[wi * 3] = v.x;
        aSway2[wi * 3 + 1] = v.y;
        aSway2[wi * 3 + 2] = v.z;
        aAlong[wi] = t;
        aSeed[wi] = seed;
        wi++;
      }
    }
  }

  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  lineGeo.setAttribute("aColor", new THREE.BufferAttribute(aColor, 3));
  lineGeo.setAttribute("aSway", new THREE.BufferAttribute(aSway, 3));
  lineGeo.setAttribute("aSway2", new THREE.BufferAttribute(aSway2, 3));
  lineGeo.setAttribute("aAlong", new THREE.BufferAttribute(aAlong, 1));
  lineGeo.setAttribute("aSeed", new THREE.BufferAttribute(aSeed, 1));

  // Sparks — white shades only
  const S = cfg.sparks;
  const sp = new Float32Array(S * 3);
  const sc = new Float32Array(S * 3);
  const ss = new Float32Array(S);
  const sph = new Float32Array(S);
  const tmp = new THREE.Vector3();

  for (let i = 0; i < S; i++) {
    const roll = rng();
    let isBokeh = false;
    if (roll < 0.42 && tipFlare.length) {
      const base = tipFlare[(rng() * tipFlare.length) | 0];
      tmp.set(
        base.x + (rng() - 0.5) * 0.18,
        base.y + (rng() - 0.5) * 0.18,
        base.z + (rng() - 0.5) * 0.18,
      );
    } else if (roll < 0.88) {
      const z = rng() * 2 - 1;
      const th = rng() * TAU;
      const rr = Math.sqrt(1 - z * z);
      const rad = cfg.spread * (0.12 + Math.pow(rng(), 1.4) * 1.05);
      tmp.set(rr * Math.cos(th) * rad, rr * Math.sin(th) * rad, z * rad);
    } else {
      isBokeh = true;
      const z = rng() * 2 - 1;
      const th = rng() * TAU;
      const rr = Math.sqrt(1 - z * z);
      const rad = cfg.spread * (1.0 + rng() * 1.2);
      tmp.set(rr * Math.cos(th) * rad, rr * Math.sin(th) * rad, z * rad * 0.7);
    }

    const distN = Math.min(1, tmp.length() / (cfg.spread * 1.4));
    const c = (rng() > 0.82 ? pink : spark).clone();
    c.multiplyScalar(lerp(1.0, 0.35, distN) * (isBokeh ? 0.55 : 1.0));
    const size = isBokeh ? 1.1 + rng() * 1.3 : 0.3 + rng() * rng() * 0.85;

    sp[i * 3] = tmp.x;
    sp[i * 3 + 1] = tmp.y;
    sp[i * 3 + 2] = tmp.z;
    sc[i * 3] = c.x;
    sc[i * 3 + 1] = c.y;
    sc[i * 3 + 2] = c.z;
    ss[i] = size;
    sph[i] = rng();
  }

  const sparkGeo = new THREE.BufferGeometry();
  sparkGeo.setAttribute("position", new THREE.BufferAttribute(sp, 3));
  sparkGeo.setAttribute("aColor", new THREE.BufferAttribute(sc, 3));
  sparkGeo.setAttribute("aSize", new THREE.BufferAttribute(ss, 1));
  sparkGeo.setAttribute("aPhase", new THREE.BufferAttribute(sph, 1));

  return { lineGeo, sparkGeo };
}

export function createPlasmaBurst(
  canvas: HTMLCanvasElement,
  { config, reducedMotion, heroProgress, pointer, started }: PlasmaBurstOptions,
): PlasmaBurstHandle {
  let cfg = config;
  const parent = canvas.parentElement ?? canvas;
  const sizeOf = () => {
    const rect = parent.getBoundingClientRect();
    return { w: Math.max(1, rect.width), h: Math.max(1, rect.height) };
  };
  let { w, h } = sizeOf();
  const dpr = window.devicePixelRatio;

  const renderer = new THREE.WebGL1Renderer({ canvas, antialias: true });
  renderer.setPixelRatio(dpr);
  renderer.setSize(w, h, false);
  renderer.setClearColor(0x000000, 1); // black — composited over the blue stage via CSS mix-blend

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  const camera = new THREE.PerspectiveCamera(48, w / h, 0.1, 80);
  camera.position.set(0, 0, cfg.cameraZ);
  scene.add(camera);

  const group = new THREE.Group();
  scene.add(group);

  const lineMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uAlpha: { value: 0 },
      uSway: { value: cfg.sway },
      uSwaySpeed: { value: cfg.swaySpeed },
      uShimmer: { value: cfg.shimmer },
      uShimmerSpeed: { value: cfg.shimmerSpeed },
      uBright: { value: lineBright },
      uBrightness: { value: cfg.lineBrightness },
      uEnergy: { value: 0 },
      uShock: { value: 0 },
      uShockAmp: { value: 0 },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uMagnet: { value: 0 },
      uTanHalfFov: { value: Math.tan(((48 * Math.PI) / 180) / 2) },
      uAspect: { value: w / h },
      uMagnetRadius: { value: MAGNET_RADIUS },
    },
    vertexShader: lineVert,
    fragmentShader: lineFrag,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });

  const sparkMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uAlpha: { value: 0 },
      uSparkSize: { value: cfg.sparkSize },
      uTwinkle: { value: cfg.twinkle },
      uBrightness: { value: cfg.sparkBrightness },
      uEnergy: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
    },
    vertexShader: sparkVert,
    fragmentShader: sparkFrag,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });

  let built = buildGeometry(cfg);
  const lines = new THREE.LineSegments(built.lineGeo, lineMat);
  lines.frustumCulled = false;
  group.add(lines);
  const sparkPoints = new THREE.Points(built.sparkGeo, sparkMat);
  sparkPoints.frustumCulled = false;
  group.add(sparkPoints);

  const coreMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uAlpha: { value: 0 },
      uColCore: { value: hexToVec3(cfg.coreColor) },
      uColMid: { value: hexToVec3(cfg.coreHalo) },
      uGlow: { value: cfg.coreGlow },
      uBrightness: { value: 1 },
      uEnergy: { value: 0 },
    },
    vertexShader: coreVert,
    fragmentShader: coreFrag,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  const coreSprite = new THREE.Mesh(new THREE.PlaneGeometry(3, 3), coreMat);
  scene.add(coreSprite);

  // --- postprocessing --------------------------------------------------------
  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(dpr);
  composer.setSize(w, h);
  composer.addPass(new RenderPass(scene, camera));
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(w, h),
    cfg.bloomStr,
    cfg.bloomRadius,
    cfg.bloomThresh,
  );
  composer.addPass(bloomPass);
  composer.addPass(new ShaderPass(GammaCorrectionShader));

  // --- state -----------------------------------------------------------------
  // Intro clock — set when the `started` gate first opens; the burst stays hidden (alpha
  // 0, scaled down) until then. Reduced motion shows it fully at once (single static frame).
  let introStart: number | null = null;
  let lastT = performance.now() / 1000;
  let spin = 0;
  // Eased cursor-magnet state (view-space NDC target + strength).
  let magnet = 0;
  let pX = 0;
  let pY = 0;

  const lu = lineMat.uniforms;
  const su = sparkMat.uniforms;
  const cu = coreMat.uniforms;

  function renderFrame() {
    const now = performance.now() / 1000;
    const dt = Math.min(0.05, now - lastT);
    lastT = now;
    // Intro gate: hidden until `started`, then fade + scale-up + spin-up (once).
    if (introStart === null && (reducedMotion || !started || started())) {
      introStart = performance.now();
    }
    const introP =
      introStart === null
        ? 0
        : reducedMotion
          ? 1
          : THREE.MathUtils.clamp(
              (performance.now() - introStart) / INTRO_MS,
              0,
              1,
            );
    const introE = easeOutCubic(introP);
    const alpha = introE * mainAlpha;

    // The burst turntable-spins; hero-shrink progress speeds the spin and pulls the camera
    // closer (bigger). The intro adds a decaying spin boost and scales the group up.
    const hp = heroProgress ? heroProgress() : 0;
    const introSpin = (1 - introP) * INTRO_SPIN;
    spin += (cfg.rotateSpeed * (1 + hp * (SPIN_MULT - 1)) + introSpin) * dt;
    group.rotation.y = spin;
    group.scale.setScalar(THREE.MathUtils.lerp(INTRO_SCALE_FROM, 1, introE));
    camera.position.z = cfg.cameraZ / (1 + hp * (ZOOM_MULT - 1));

    // Cursor magnet — filament tips lean toward the pointer. Ease the target NDC and
    // the strength (0 when the pointer isn't over the hero) for a smooth attract/release.
    const pt = pointer ? pointer() : null;
    const targetMag = pt && pt.active ? MAGNET_STRENGTH : 0;
    magnet += (targetMag - magnet) * MAGNET_EASE;
    if (pt && pt.active) {
      pX += (pt.x - pX) * POINTER_EASE;
      pY += (pt.y - pY) * POINTER_EASE;
    }
    lu.uMagnet.value = magnet;
    lu.uPointer.value.set(pX, pY);

    coreSprite.quaternion.copy(camera.quaternion);
    coreSprite.scale.setScalar(cfg.coreSize);

    lu.uTime.value = now;
    lu.uAlpha.value = alpha;

    su.uTime.value = now;
    su.uAlpha.value = alpha;

    cu.uTime.value = now;
    cu.uAlpha.value = alpha;

    composer.render();
  }

  // --- resize ----------------------------------------------------------------
  const resize = () => {
    const s = sizeOf();
    w = s.w;
    h = s.h;
    const d = window.devicePixelRatio;
    renderer.setPixelRatio(d);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    composer.setPixelRatio(d);
    composer.setSize(w, h);
    su.uPixelRatio.value = Math.min(d, 2);
    lu.uAspect.value = w / h;
    if (reducedMotion) renderFrame();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(parent);

  // --- run -------------------------------------------------------------------
  // Visibility-gated: the bloom composer is expensive, so only run the loop while the
  // hero is on (or near) screen — no point rendering it while the user reads sections
  // further down. Reduced motion just draws one static frame.
  let raf = 0;
  let running = false;
  let io: IntersectionObserver | null = null;
  if (reducedMotion) {
    // Static frame: no auto-spin; show the fully-appeared burst.
    renderFrame();
  } else {
    const loop = () => {
      renderFrame();
      raf = requestAnimationFrame(loop);
    };
    const startLoop = () => {
      if (running) return;
      running = true;
      lastT = performance.now() / 1000; // reset dt so the paused gap isn't stepped
      raf = requestAnimationFrame(loop);
    };
    const stopLoop = () => {
      if (!running) return;
      running = false;
      cancelAnimationFrame(raf);
      raf = 0;
    };
    io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) startLoop();
        else stopLoop();
      },
      { rootMargin: "200px 0px" },
    );
    io.observe(parent);
  }

  const structuralKey = (c: PlasmaConfig) =>
    `${c.filaments}|${c.sparks}|${c.spread}|${c.curl}` +
    `|${c.colCore}|${c.colInner}|${c.colMid}|${c.colOuter}`;

  return {
    update(next: PlasmaConfig) {
      const rebuild = structuralKey(next) !== structuralKey(cfg);
      cfg = next;

      // Live params — applied immediately, no rebuild.
      camera.position.z = cfg.cameraZ;
      bloomPass.strength = cfg.bloomStr;
      bloomPass.radius = cfg.bloomRadius;
      bloomPass.threshold = cfg.bloomThresh;
      lu.uSway.value = cfg.sway;
      lu.uSwaySpeed.value = cfg.swaySpeed;
      lu.uShimmer.value = cfg.shimmer;
      lu.uShimmerSpeed.value = cfg.shimmerSpeed;
      lu.uBrightness.value = cfg.lineBrightness;
      su.uSparkSize.value = cfg.sparkSize;
      su.uTwinkle.value = cfg.twinkle;
      su.uBrightness.value = cfg.sparkBrightness;
      cu.uGlow.value = cfg.coreGlow;
      cu.uColCore.value.copy(hexToVec3(cfg.coreColor));
      cu.uColMid.value.copy(hexToVec3(cfg.coreHalo));

      if (rebuild) {
        const old = built;
        built = buildGeometry(cfg);
        lines.geometry = built.lineGeo;
        sparkPoints.geometry = built.sparkGeo;
        old.lineGeo.dispose();
        old.sparkGeo.dispose();
        if (reducedMotion) renderFrame();
      }
    },
    dispose() {
      cancelAnimationFrame(raf);
      io?.disconnect();
      ro.disconnect();
      built.lineGeo.dispose();
      built.sparkGeo.dispose();
      lineMat.dispose();
      sparkMat.dispose();
      coreSprite.geometry.dispose();
      coreMat.dispose();
      // EffectComposer.dispose() exists at runtime in r0.143 but is missing from
      // @types/three@0.143 — call it through a narrow type instead of `any`.
      (composer as unknown as { dispose?: () => void }).dispose?.();
      renderer.dispose();
      // Release the context so a remount (StrictMode/HMR) can attach a fresh
      // renderer to the same canvas instead of failing on the existing context.
      renderer.forceContextLoss();
    },
  };
}
