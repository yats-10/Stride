"use client";

// WebGL backdrop for the site footer: the hero "mesh gradient" (same blue as the
// hero/chain, a different seed → different blob pattern) with a chrome heart model
// that flies in with parallax and spins the opposite way to the chain. The heart
// reuses the chain's scene factory, so it inherits the exact same chrome material;
// its vertical position is driven off the footer's scroll position (flies from the
// top edge down to centre as the footer scrolls fully into view), and it takes the
// reversed spin (`spinDirection: -1`). Two stacked canvases behind the footer
// content, decorative (aria-hidden). See ADR-0014.
import { useEffect, useRef } from "react";
import { subscribeToTicker } from "@/lib/animation/ticker";
import {
  createGradientBackground,
  type GradientBackgroundHandle,
} from "@/lib/three/gradient-background-scene";
import {
  createChainScene,
  defaultChainMaterial,
  type ChainSceneHandle,
} from "@/lib/three/chain-scene";

// Same blue palette as the hero/chain; a new seed → a different blob pattern.
const BASE = "#1c3ee6";
const LIGHT = "#eef3ff";
const SEED = 7.2;
const MODEL_URL = "/assets/heart.glb";

// Absolute document offset of an element (walks offsetParent).
const absoluteTop = (el: HTMLElement) => {
  let top = 0;
  let node: HTMLElement | null = el;
  while (node) {
    top += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return top;
};

export const FooterScene = () => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLCanvasElement>(null);
  const modelRef = useRef<HTMLCanvasElement>(null);
  const fallRef = useRef(0.5); // heart progress: 0 = above, .5 = centre

  useEffect(() => {
    const bg = bgRef.current;
    const model = modelRef.current;
    if (!bg || !model) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let bgHandle: GradientBackgroundHandle | undefined;
    let modelHandle: ChainSceneHandle | undefined;
    try {
      bgHandle = createGradientBackground(bg, {
        base: BASE,
        light: LIGHT,
        seed: SEED,
      });
    } catch {
      /* no WebGL — the footer's solid fallback background shows */
    }
    try {
      modelHandle = createChainScene(model, {
        url: MODEL_URL,
        progress: () => fallRef.current,
        reducedMotion,
        material: defaultChainMaterial,
        spinDirection: -1, // spin the opposite way to the chain
      });
    } catch {
      /* no WebGL — the gradient backdrop stays */
    }

    let absTop = wrapRef.current ? absoluteTop(wrapRef.current) : 0;
    const measure = () => {
      if (wrapRef.current) absTop = absoluteTop(wrapRef.current);
    };
    window.addEventListener("resize", measure);

    const unsubscribe = subscribeToTicker(
      () => {
        const vh = window.innerHeight || 1;
        const y = window.scrollY;
        // Fly in with parallax: 0 (above the frame) as the footer's top edge enters
        // from the bottom → .5 (centred) once the footer has scrolled fully into view.
        const enter = Math.min(Math.max((y - (absTop - vh)) / vh, 0), 1);
        fallRef.current = 0.5 * enter;
      },
      () => 0,
    );

    return () => {
      unsubscribe();
      window.removeEventListener("resize", measure);
      modelHandle?.dispose();
      bgHandle?.dispose();
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
    >
      <canvas ref={bgRef} className="absolute inset-0 block h-full w-full" />
      <canvas ref={modelRef} className="absolute inset-0 block h-full w-full" />
    </div>
  );
};
