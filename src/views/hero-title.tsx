"use client";

// Hero display heading with a per-letter intro: each letter rises from just below,
// fading up out of a soft blur, in a gentle easeOutQuart cascade — very smooth and soft.
//
// Text animation normally goes through spring-text-engine, but that package (0.1.5, the
// latest) doesn't animate under the installed @react-spring/web@10 (it snaps to the end
// state on mount) — and react-spring's own self-running `from→to` springs don't progress
// in this project either; every real animation here (hero shrink, works cards, chain)
// drives a spring value each frame from the shared ticker. So this does the same: one
// react-spring value `p` (0→1) is advanced by the ticker over `DURATION`, and each letter
// derives its opacity / rise / blur from `p` with a per-letter stagger. See ADR-0015.
//
// The old per-line inverted gradient (line 1 white→muted, line 2 muted→white) is kept as
// each letter's target opacity. The h1 carries the full `aria-label`; letters are hidden
// from assistive tech.
import { useEffect, useMemo, useRef } from "react";
import { animated, useSpring } from "@react-spring/web";
import { subscribeToTicker } from "@/lib/animation/ticker";
import { usePreloader } from "@/hooks/use-preloader";

export interface HeroTitleProps {
  lines: string[];
  className?: string;
}

const DURATION = 1600; // ms for the whole cascade
const SPREAD = 0.55; // fraction of the timeline over which letter starts are staggered
const RISE = 16; // px each letter rises from
const BLUR = 8; // px start blur
const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

// Alpha ramp reproducing the old gradient: even lines fade white→muted, odd invert.
const letterAlpha = (line: number, pos: number) =>
  line % 2 === 0 ? 1 - pos * 0.6 : 0.4 + pos * 0.6;

export const HeroTitle = ({ lines, className }: HeroTitleProps) => {
  // Group each line into words (keeping every letter's gradient position), so letters
  // still animate individually but words stay unbreakable — otherwise the inline-block
  // letters wrap mid-word on narrow (mobile) viewports ("i / nto"). Mirrors the
  // word-grouping in <AnimatedHeading>.
  type Letter = { ch: string; alpha: number; i: number };
  const { lineWords, total } = useMemo(() => {
    let gi = 0; // running global letter index, drives the per-letter stagger
    const built = lines.map((line, li) => {
      const chars = [...line];
      const denom = chars.length > 1 ? chars.length - 1 : 1;
      const words: Letter[][] = [];
      let current: Letter[] = [];
      chars.forEach((ch, ci) => {
        if (ch === " ") {
          words.push(current);
          current = [];
        } else {
          current.push({ ch, alpha: letterAlpha(li, ci / denom), i: gi++ });
        }
      });
      words.push(current);
      return words;
    });
    return { lineWords: built, total: gi };
  }, [lines]);
  const [{ p }, api] = useSpring(() => ({ p: 0 }));
  const startRef = useRef<number | null>(null);
  // Wait for the first-load preloader to finish before playing the intro.
  const preloaderDone = usePreloader((s) => s.done);

  useEffect(() => {
    if (!preloaderDone) return;
    // Respect reduced motion — jump straight to the revealed state.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      api.start({ p: 1, immediate: true });
      return;
    }
    let finished = false;
    const unsubscribe = subscribeToTicker(
      (time) => {
        if (finished) return;
        if (startRef.current === null) startRef.current = time;
        const t = Math.min((time - startRef.current) / DURATION, 1);
        api.start({ p: t, immediate: true });
        if (t >= 1) {
          finished = true;
          unsubscribe();
        }
      },
      () => 0,
    );
    return unsubscribe;
  }, [api, preloaderDone]);

  // Per-letter reveal window inside the 0→1 timeline: letter i starts at `start`, then
  // eases over the remaining span. All read the same `p` each frame (no re-render).
  const span = 1 - SPREAD;
  const localProg = (v: number, i: number) => {
    const start = total > 1 ? (i / (total - 1)) * SPREAD : 0;
    return easeOutQuart(
      span <= 0 ? 1 : Math.min(Math.max((v - start) / span, 0), 1),
    );
  };

  return (
    <h1 aria-label={lines.join(" ")} className={className}>
      {lineWords.map((words, li) => (
        <span key={li} aria-hidden="true" className="block">
          {words.flatMap((word, wi) => {
            const wordNode = (
              <span key={`w${wi}`} className="inline-block">
                {word.map(({ ch, alpha, i }, ci) => (
                  <animated.span
                    key={ci}
                    className="inline-block text-white [will-change:transform,opacity]"
                    style={{
                      opacity: p.to((v) => alpha * localProg(v, i)),
                      transform: p.to(
                        (v) => `translateY(${RISE * (1 - localProg(v, i))}px)`,
                      ),
                      filter: p.to((v) => `blur(${BLUR * (1 - localProg(v, i))}px)`),
                    }}
                  >
                    {ch}
                  </animated.span>
                ))}
              </span>
            );
            // A real (breakable) space between words; the last word gets none.
            return wi < words.length - 1
              ? [wordNode, <span key={`sp${wi}`}> </span>]
              : [wordNode];
          })}
        </span>
      ))}
    </h1>
  );
};
