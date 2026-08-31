"use client";

// 📖 Docs: obsidian/meta/decisions-log.md ADR-0014
//
// Dev-only tuning panel for the chain model's chrome material. Lets the look be
// dialled in by hand and copied out as JSON. Rendered only in development (see the
// Chain leaf), so it never ships to production. Sits top-left to clear the hero's
// Plasma panel (top-right). Uses plain utilities — it is tooling, not UI.
import { useState } from "react";
import type { ChainMaterialConfig } from "@/lib/three/chain-scene";

export interface ChainControlsProps {
  config: ChainMaterialConfig;
  onChange: (config: ChainMaterialConfig) => void;
  onReset: () => void;
}

interface SliderSpec {
  key: keyof ChainMaterialConfig;
  label: string;
  min: number;
  max: number;
  step: number;
}

const SLIDERS: SliderSpec[] = [
  { key: "metalness", label: "Metalness", min: 0, max: 1, step: 0.01 },
  { key: "roughness", label: "Roughness", min: 0, max: 1, step: 0.01 },
  { key: "envMapIntensity", label: "Reflection", min: 0, max: 3, step: 0.05 },
  { key: "exposure", label: "Exposure", min: 0, max: 2, step: 0.05 },
];

export const ChainControls = ({
  config,
  onChange,
  onReset,
}: ChainControlsProps) => {
  const [open, setOpen] = useState(true);
  const [copied, setCopied] = useState(false);

  const set = <K extends keyof ChainMaterialConfig>(
    key: K,
    value: ChainMaterialConfig[K],
  ) => onChange({ ...config, [key]: value });

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
        className="fixed left-4 top-4 z-50 rounded-lg bg-black/80 px-3 py-2 text-xs font-medium text-white shadow-lg backdrop-blur"
      >
        ⚙ Material
      </button>
    );
  }

  return (
    <aside
      aria-label="Chain material controls"
      className="fixed left-4 top-4 z-50 flex max-h-[calc(100dvh-2rem)] w-64 flex-col gap-3 overflow-y-auto rounded-xl bg-black/85 p-4 text-xs text-white shadow-2xl backdrop-blur-md"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">Chrome material</span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded px-2 py-1 text-white/60 hover:text-white"
          aria-label="Collapse controls"
        >
          ✕
        </button>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-white/70">Tint</span>
        <input
          type="color"
          value={config.color}
          onChange={(e) => set("color", e.target.value)}
          className="h-8 w-full cursor-pointer rounded bg-transparent"
        />
      </label>

      {SLIDERS.map((s) => {
        const value = config[s.key];
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
        className="h-28 w-full resize-none rounded-lg bg-black/60 p-2 font-mono text-[10px] leading-tight text-white/80"
      />
    </aside>
  );
};
