// 📖 Docs: obsidian/architecture/tech-stack.md (three) · decisions-log.md ADR-0014
//
// Loads a GLB model and gives it a chrome material (metal + a PMREM RoomEnvironment
// for reflections). The caller drives its vertical position each frame via
// `progress` (0 = above the top edge, .5 = centred, 1 = below the bottom edge) — so
// the same factory can hold a model dead-centre (constant .5) or fly it in with
// parallax (progress tied to scroll). It always spins; `spinDirection` (+1/−1) flips
// which way. `scrollSpin` picks the feel: true adds scroll momentum (spins at scroll
// speed, capped, easing back to idle), false is a **constant linear** turn at a fixed
// rate. Renders on a transparent canvas so the gradient backdrop shows behind it.
// Owns its own rAF loop (WebGL artwork, exempt from ADR-0002). Used by the chain
// (held centred, constant-linear spin) and the footer heart (fly-in, reversed spin).
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

/** Tunable chrome-material look for the model (live-editable via the dev panel). */
export interface ChainMaterialConfig {
  color: string; // base tint (hex) — white keeps it a pure mirror
  metalness: number; // 0 = dielectric, 1 = metal
  roughness: number; // 0 = mirror, 1 = matte
  envMapIntensity: number; // strength of the environment reflection
  exposure: number; // renderer tone-mapping exposure (overall brightness)
}

export const defaultChainMaterial: ChainMaterialConfig = {
  color: "#a5ade3",
  metalness: 1,
  roughness: 0.1,
  envMapIntensity: 2.8,
  exposure: 0.2,
};

export interface ChainSceneOptions {
  url: string;
  /** Fall progress 0..1 (read each frame): 0 = above the top edge, 0.5 = centred,
   *  1 = below the bottom edge. */
  progress: () => number;
  reducedMotion: boolean;
  /** Initial chrome-material look. Live changes flow through the handle's update(). */
  material?: ChainMaterialConfig;
  /** Spin sense: +1 (default) or −1 to turn the other way. */
  spinDirection?: number;
  /** true (default): scroll adds spin momentum. false: constant linear spin. */
  scrollSpin?: boolean;
  /** rad added to the spin per px of scroll (momentum injection). Higher = the model
   *  accelerates harder when scrolling. Defaults to `SCROLL_ACCEL`. */
  spinAccel?: number;
  /** rad/frame cap on the scroll-injected spin. Defaults to `MAX_SPIN`. */
  maxSpin?: number;
}

export interface ChainSceneHandle {
  dispose: () => void;
  /** Push a new chrome-material look (colour, metalness, roughness, reflection, exposure). */
  update: (material: ChainMaterialConfig) => void;
}

const IDLE_SPIN = 0.004; // rad/frame — gentle constant turn when idle
const SCROLL_ACCEL = 0.00009; // how much a px of scroll adds to the spin
const FRICTION = 0.965; // momentum decay toward the idle turn
const MAX_SPIN = 0.22; // rad/frame cap so fast scrolls can't spin it wildly
const TILT_X = 0.22; // fixed viewing tilt
const FALL_TOP = 9; // world Y above the frame at progress 0
const FALL_BOTTOM = -9; // world Y below the frame at progress 1

export function createChainScene(
  canvas: HTMLCanvasElement,
  {
    url,
    progress,
    reducedMotion,
    material = defaultChainMaterial,
    spinDirection = 1,
    scrollSpin = true,
    spinAccel = SCROLL_ACCEL,
    maxSpin = MAX_SPIN,
  }: ChainSceneOptions,
): ChainSceneHandle {
  const parent = canvas.parentElement ?? canvas;
  const sizeOf = () => {
    const r = parent.getBoundingClientRect();
    return { w: Math.max(1, r.width), h: Math.max(1, r.height) };
  };
  let { w, h } = sizeOf();

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(w, h, false);
  renderer.setClearColor(0x000000, 0);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = material.exposure;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 100);
  camera.position.set(0, 0, 8);

  // Chrome environment — a soft studio room, prefiltered for metal reflections.
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
  scene.environment = envRT.texture;

  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(4, 6, 5);
  scene.add(key);

  const chrome = new THREE.MeshStandardMaterial({
    color: new THREE.Color(material.color),
    metalness: material.metalness,
    roughness: material.roughness,
    envMapIntensity: material.envMapIntensity,
  });

  const group = new THREE.Group();
  scene.add(group);

  // The GLB is Draco-compressed; decoder files live in public/draco/.
  const draco = new DRACOLoader();
  draco.setDecoderPath("/draco/");
  const loader = new GLTFLoader();
  loader.setDRACOLoader(draco);

  let disposed = false;
  loader.load(
    url,
    (gltf) => {
      if (disposed) return;
      const model = gltf.scene;
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      model.position.sub(center); // centre on origin
      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      model.scale.setScalar(3.6 / maxDim); // fit to ~3.6 world units
      model.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (mesh.isMesh) mesh.material = chrome;
      });
      group.add(model);
      // Precompile the chrome shader now (off the main scroll path), so the first
      // frame after the model scrolls into view doesn't hitch on JIT compilation.
      try {
        renderer.compile(scene, camera);
      } catch {
        /* compile is best-effort — the first render will compile if this throws */
      }
    },
    undefined,
    () => {
      /* model failed to load — the gradient backdrop stays */
    },
  );

  group.rotation.x = TILT_X; // centred; only Y spins
  let lastScroll = typeof window !== "undefined" ? window.scrollY : 0;
  let spinVel = 0; // scroll-injected angular momentum

  const render = () => {
    // Fall from above the top edge, through centre, out the bottom.
    const p = Math.min(Math.max(progress(), 0), 1);
    group.position.y = FALL_TOP + (FALL_BOTTOM - FALL_TOP) * p;

    if (!reducedMotion) {
      if (scrollSpin) {
        const sc = window.scrollY;
        // scroll adds momentum; it eases back toward the idle turn (never stops).
        spinVel = spinVel * FRICTION + (sc - lastScroll) * spinAccel;
        spinVel = Math.max(-maxSpin, Math.min(maxSpin, spinVel)); // cap fast-scroll spin
        lastScroll = sc;
        group.rotation.y += spinDirection * (IDLE_SPIN + spinVel);
      } else {
        // Constant, linear spin — a steady angular velocity, no scroll momentum.
        group.rotation.y += spinDirection * IDLE_SPIN;
      }
    }
    renderer.render(scene, camera);
  };

  // Visibility-gated render loop. Three WebGL scenes (hero, chain, footer heart) each
  // ran their own rAF forever — rendering continuously even while off-screen was the
  // main cause of scroll jank. Only render while the section is on (or near) screen.
  let raf = 0;
  let running = false;
  const loop = () => {
    render();
    raf = requestAnimationFrame(loop);
  };
  const startLoop = () => {
    if (running) return;
    running = true;
    lastScroll = window.scrollY; // reset so a paused gap doesn't inject a spin spike
    raf = requestAnimationFrame(loop);
  };
  const stopLoop = () => {
    if (!running) return;
    running = false;
    cancelAnimationFrame(raf);
    raf = 0;
  };
  const io = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) startLoop();
      else stopLoop();
    },
    { rootMargin: "300px 0px" }, // spin up a little before it scrolls into view
  );
  io.observe(parent);

  const resize = () => {
    const s = sizeOf();
    w = s.w;
    h = s.h;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(parent);

  return {
    update(next: ChainMaterialConfig) {
      chrome.color.set(next.color);
      chrome.metalness = next.metalness;
      chrome.roughness = next.roughness;
      chrome.envMapIntensity = next.envMapIntensity;
      renderer.toneMappingExposure = next.exposure;
    },
    dispose() {
      disposed = true;
      stopLoop();
      io.disconnect();
      ro.disconnect();
      group.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (mesh.isMesh) mesh.geometry.dispose();
      });
      chrome.dispose();
      draco.dispose();
      envRT.dispose();
      pmrem.dispose();
      renderer.dispose();
      // Release the context so a remount (StrictMode/HMR) can attach a fresh
      // renderer to the same canvas instead of failing on the existing context.
      renderer.forceContextLoss();
    },
  };
}
