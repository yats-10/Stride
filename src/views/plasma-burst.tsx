"use client";

// 📖 Docs: obsidian/meta/decisions-log.md ADR-0014 · tech-stack.md (three)
//
// Client leaf for the home hero. Owns the tunable config and drives two stacked
// WebGL layers: the static grainy gradient backdrop, and the animated Plasma Burst
// (composited over it via `mix-blend-lighten`). In development it also mounts the
// controls panel so the model + colours can be dialled in by hand.
import { useEffect, useRef, useState, type RefObject } from "react";
import {
  createPlasmaBurst,
  defaultPlasmaConfig,
  type PlasmaBurstHandle,
  type PlasmaConfig,
} from "@/lib/three/plasma-burst-scene";
import {
  createGradientBackground,
  type GradientBackgroundHandle,
} from "@/lib/three/gradient-background-scene";
import { PlasmaControls } from "@/views/plasma-controls";
import { usePreloader } from "@/hooks/use-preloader";

// Dev scene-tuning panel — hidden. Flip to true to bring it back while tuning.
const SHOW_CONTROLS = false;

export interface PlasmaBurstProps {
  /** Accessible label — the canvas is otherwise a decorative background. */
  label: string;
  /** Live hero-shrink progress 0..1 — speeds the spin and zooms the burst in. */
  progressRef?: RefObject<number>;
}

export const PlasmaBurst = ({ label, progressRef }: PlasmaBurstProps) => {
  const bgRef = useRef<HTMLCanvasElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handleRef = useRef<PlasmaBurstHandle | null>(null);
  const bgHandleRef = useRef<GradientBackgroundHandle | null>(null);
  // Live cursor position (NDC, and whether it's over the hero canvas) — read each
  // frame by the scene so the filament tips magnetise toward it.
  const pointerRef = useRef({ x: 0, y: 0, active: false });
  const [config, setConfig] = useState<PlasmaConfig>(defaultPlasmaConfig);

  // Track the pointer against the canvas rect. Listen on the window (not the canvas)
  // so the hero overlay UI on top of the canvas doesn't swallow the moves.
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const r = canvas.getBoundingClientRect();
      const inside =
        e.clientX >= r.left &&
        e.clientX <= r.right &&
        e.clientY >= r.top &&
        e.clientY <= r.bottom;
      pointerRef.current = {
        x: ((e.clientX - r.left) / r.width) * 2 - 1,
        y: -(((e.clientY - r.top) / r.height) * 2 - 1), // flip Y → NDC
        active: inside,
      };
    };
    const onLeave = () => {
      pointerRef.current = { ...pointerRef.current, active: false };
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("blur", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("blur", onLeave);
    };
  }, []);

  // Create both scenes once; live changes flow through their update() methods.
  useEffect(() => {
    const canvas = canvasRef.current;
    const bg = bgRef.current;
    if (!canvas || !bg) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    try {
      bgHandleRef.current = createGradientBackground(bg, {
        base: defaultPlasmaConfig.stageColor,
        light: defaultPlasmaConfig.glowColor,
      });
    } catch {
      // No WebGL — the CSS hero-gradient fallback on the section stays visible.
    }
    try {
      handleRef.current = createPlasmaBurst(canvas, {
        config: defaultPlasmaConfig,
        reducedMotion,
        heroProgress: () => progressRef?.current ?? 0,
        pointer: () => pointerRef.current,
        // Hold the burst hidden until the first-load preloader finishes, then play its
        // intro (scale-up + fade + spin-up) on the revealed hero.
        started: () => usePreloader.getState().done,
      });
    } catch {
      // No WebGL / context creation failed — the gradient backdrop stays.
    }
    return () => {
      handleRef.current?.dispose();
      bgHandleRef.current?.dispose();
      handleRef.current = null;
      bgHandleRef.current = null;
    };
    // progressRef is a stable ref (read lazily in the getter) — listed to satisfy
    // exhaustive-deps without re-running this create-once effect.
  }, [progressRef]);

  // Push config changes to both scenes.
  useEffect(() => {
    handleRef.current?.update(config);
    bgHandleRef.current?.update({
      base: config.stageColor,
      light: config.glowColor,
    });
  }, [config]);

  return (
    <>
      <canvas
        ref={bgRef}
        aria-hidden="true"
        className="absolute inset-0 block h-full w-full"
      />
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={label}
        // Rendered on black; `mix-blend-lighten` composites the burst over the
        // gradient backdrop behind it — dark backdrop areas let the burst glow
        // through, bright areas hide it. Absolute so its drawing-buffer size can't
        // drive the flex parent's height. See scene factory.
        className="absolute inset-0 block h-full w-full mix-blend-lighten"
      />
      {SHOW_CONTROLS && (
        <PlasmaControls
          config={config}
          onChange={setConfig}
          onReset={() => setConfig(defaultPlasmaConfig)}
        />
      )}
    </>
  );
};
