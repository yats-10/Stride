"use client";

// 📖 Docs: obsidian/meta/decisions-log.md ADR-0014
//
// Dev-only tuning panel for the hero's Plasma Burst. Lets the values be dialled in
// by hand and copied out as JSON. Rendered only in development (see the leaf), so
// it never ships to production. Uses plain utilities — it is tooling, not UI.
import { useState } from "react";
import type { PlasmaConfig } from "@/lib/three/plasma-burst-scene";

export interface PlasmaControlsProps {
  config: PlasmaConfig;
  onChange: (config: PlasmaConfig) => void;
  onReset: () => void;
}

interface SliderSpec {
  key: keyof PlasmaConfig;
  label: string;
  min: number;
  max: number;
  step: number;
}

interface ColorSpec {
  key: keyof PlasmaConfig;
  label: string;
}

// Colours of the 3D figure itself (filament gradient + core sprite).
const FIGURE_COLORS: ColorSpec[] = [
  { key: "colCore", label: "Base flash" },
  { key: "colInner", label: "Inner" },
  { key: "colMid", label: "Mid" },
  { key: "colOuter", label: "Tip" },
  { key: "coreColor", label: "Core" },
  { key: "coreHalo", label: "Core halo" },
];

const GROUPS: { title: string; sliders: SliderSpec[] }[] = [
  {
    title: "Camera & motion",
    sliders: [
      { key: "cameraZ", label: "Camera distance", min: 4, max: 20, step: 0.1 },
      { key: "rotateSpeed", label: "Spin speed", min: 0, max: 0.4, step: 0.01 },
    ],
  },
  {
    title: "Core",
    sliders: [
      { key: "coreSize", label: "Core size", min: 0, max: 1.5, step: 0.01 },
      { key: "coreGlow", label: "Core glow", min: 0, max: 1.5, step: 0.01 },
    ],
  },
  {
    title: "Bloom",
    sliders: [
      { key: "bloomStr", label: "Strength", min: 0, max: 1.5, step: 0.01 },
      { key: "bloomRadius", label: "Radius", min: 0, max: 1, step: 0.01 },
      { key: "bloomThresh", label: "Threshold", min: 0, max: 1, step: 0.01 },
    ],
  },
  {
    title: "Filaments",
    sliders: [
      { key: "lineBrightness", label: "Brightness", min: 0, max: 2, step: 0.01 },
      { key: "sway", label: "Sway", min: 0, max: 0.6, step: 0.01 },
      { key: "swaySpeed", label: "Sway speed", min: 0, max: 4, step: 0.05 },
      { key: "shimmer", label: "Shimmer", min: 0, max: 1.5, step: 0.01 },
      { key: "shimmerSpeed", label: "Shimmer speed", min: 0, max: 8, step: 0.1 },
    ],
  },
  {
    title: "Sparks",
    sliders: [
      { key: "sparkBrightness", label: "Brightness", min: 0, max: 2, step: 0.01 },
      { key: "sparkSize", label: "Size", min: 0, max: 0.6, step: 0.01 },
      { key: "twinkle", label: "Twinkle", min: 0, max: 6, step: 0.1 },
    ],
  },
  {
    title: "Structure (rebuilds)",
    sliders: [
      { key: "filaments", label: "Filaments", min: 20, max: 600, step: 10 },
      { key: "sparks", label: "Sparks", min: 0, max: 1500, step: 20 },
      { key: "spread", label: "Spread", min: 0.5, max: 4, step: 0.05 },
      { key: "curl", label: "Curl", min: 0, max: 2, step: 0.01 },
    ],
  },
];

export const PlasmaControls = ({
  config,
  onChange,
  onReset,
}: PlasmaControlsProps) => {
  const [open, setOpen] = useState(true);
  const [copied, setCopied] = useState(false);

  const set = <K extends keyof PlasmaConfig>(key: K, value: PlasmaConfig[K]) =>
    onChange({ ...config, [key]: value });

  const json = JSON.stringify(config, null, 2);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* clipboard unavailable — the textarea below is selectable as a fallback */
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed right-4 top-4 z-50 rounded-lg bg-black/80 px-3 py-2 text-xs font-medium text-white shadow-lg backdrop-blur"
      >
        ⚙ Tune
      </button>
    );
  }

  return (
    <aside
      aria-label="Plasma burst controls"
      className="fixed right-4 top-4 z-50 flex max-h-[calc(100dvh-2rem)] w-72 flex-col gap-3 overflow-y-auto rounded-xl bg-black/85 p-4 text-xs text-white shadow-2xl backdrop-blur-md"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">Plasma controls</span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded px-2 py-1 text-white/60 hover:text-white"
          aria-label="Collapse controls"
        >
          ✕
        </button>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-white/50 uppercase tracking-wide">
          Background
        </legend>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-1">
            <span className="text-white/70">Base (blue)</span>
            <input
              type="color"
              value={config.stageColor}
              onChange={(e) => set("stageColor", e.target.value)}
              className="h-8 w-full cursor-pointer rounded bg-transparent"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-white/70">Light (glow)</span>
            <input
              type="color"
              value={config.glowColor}
              onChange={(e) => set("glowColor", e.target.value)}
              className="h-8 w-full cursor-pointer rounded bg-transparent"
            />
          </label>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-white/50 uppercase tracking-wide">
          Figure colours
        </legend>
        <div className="grid grid-cols-3 gap-2">
          {FIGURE_COLORS.map((c) => (
            <label key={c.key} className="flex flex-col gap-1">
              <span className="text-white/70">{c.label}</span>
              <input
                type="color"
                value={config[c.key] as string}
                onChange={(e) => set(c.key, e.target.value)}
                className="h-8 w-full cursor-pointer rounded bg-transparent"
              />
            </label>
          ))}
        </div>
      </fieldset>

      {GROUPS.map((group) => (
        <fieldset key={group.title} className="flex flex-col gap-2">
          <legend className="mb-1 text-white/50 uppercase tracking-wide">
            {group.title}
          </legend>
          {group.sliders.map((s) => {
            const value = config[s.key] as number;
            return (
              <label key={s.key} className="flex flex-col gap-1">
                <span className="flex justify-between text-white/70">
                  <span>{s.label}</span>
                  <span className="tabular-nums text-white">{value}</span>
                </span>
                <input
                  type="range"
                  min={s.min}
                  max={s.max}
                  step={s.step}
                  value={value}
                  onChange={(e) => set(s.key, Number(e.target.value))}
                  className="w-full accent-white"
                />
              </label>
            );
          })}
        </fieldset>
      ))}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={copy}
          className="flex-1 rounded-lg bg-white px-3 py-2 font-medium text-black hover:bg-white/90"
        >
          {copied ? "Copied ✓" : "Copy config"}
        </button>
        <button
          type="button"
          onClick={onReset}
          className="rounded-lg bg-white/10 px-3 py-2 font-medium text-white hover:bg-white/20"
        >
          Reset
        </button>
      </div>

      <textarea
        readOnly
        value={json}
        onFocus={(e) => e.currentTarget.select()}
        className="h-32 w-full resize-none rounded-lg bg-black/60 p-2 font-mono text-[10px] leading-tight text-white/80"
      />
    </aside>
  );
};
