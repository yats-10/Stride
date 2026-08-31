"use client";

// First-load preloader overlay. A white screen with the centred logo, a thick blue
// gradient bar that fills left→right along the bottom, and a big counter (styled like the
// hero heading) that tracks the fill edge and counts 0→100%. When it completes, the SAME
// bottom bar scales up (grows from its thin strip to full-screen) while the whole overlay
// — logo, counter and bar together — slides up to reveal the page; then it unmounts.
//
// All motion is driven from the shared ticker (react-spring's own self-running springs
// don't progress in this project — see [[decisions-log]] ADR-0015): one value `m` runs
// 0→1 over the whole timeline and every part derives from it. The counter text is written
// imperatively so the component never re-renders mid-animation.
import { useEffect, useRef, useState } from "react";
import { animated, useSpring } from "@react-spring/web";
import { subscribeToTicker } from "@/lib/animation/ticker";
import { usePreloader } from "@/hooks/use-preloader";

const LOAD = 1900; // ms — bar fills + counter
const EXIT = 950; // ms — bar scales up while the overlay slides up
const TOTAL = LOAD + EXIT;
const A = LOAD / TOTAL;
// Release the hero intros partway through the slide-up (not at the very end) so they play
// as the loader is clearing, without a dead pause.
const DONE_AT = A + (1 - A) * 0.6;
const BAR_PX = 64; // thin bar height (matches h-16)

const clamp01 = (x: number) => Math.min(Math.max(x, 0), 1);
const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);
const easeInOutQuart = (t: number) =>
  t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;

const BoltIcon = () => (
  <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden="true">
    <path d="M13 2 4.5 13.5H11l-1 8.5L19.5 10H13z" />
  </svg>
);

export const Preloader = () => {
  const [gone, setGone] = useState(false);
  const setDone = usePreloader((s) => s.setDone);
  const doneFired = useRef(false);
  // Thin-bar height as a fraction of the viewport, so the full-height bar renders as a
  // ~64px strip while loading, then scales up to cover.
  const [thin, setThin] = useState(0.09);
  const [{ m }, api] = useSpring(() => ({ m: 0 }));
  const pctRef = useRef<HTMLSpanElement>(null);
  const lastPct = useRef(-1);

  useEffect(() => {
    setThin(clamp01(BAR_PX / window.innerHeight));
    let t0: number | null = null;
    let done = false;
    const unsubscribe = subscribeToTicker(
      (time) => {
        if (done) return;
        if (t0 === null) t0 = time;
        const v = clamp01((time - t0) / TOTAL);
        api.start({ m: v, immediate: true });
        const pct = Math.round(easeOutQuart(clamp01(v / A)) * 100);
        if (pct !== lastPct.current && pctRef.current) {
          lastPct.current = pct;
          pctRef.current.textContent = `${pct}%`;
        }
        if (!doneFired.current && v >= DONE_AT) {
          doneFired.current = true;
          setDone(); // release the hero title + 3D burst intros as the loader clears
        }
        if (v >= 1) {
          done = true;
          unsubscribe();
          setGone(true);
        }
      },
      () => 0,
    );
    return unsubscribe;
  }, [api, setDone]);

  if (gone) return null;

  const fill = m.to((v) => easeOutQuart(clamp01(v / A)));
  const exit = m.to((v) => easeInOutQuart(clamp01((v - A) / (1 - A))));

  return (
    <animated.div
      aria-hidden="true"
      className="fixed inset-0 z-[100] overflow-hidden bg-white"
      style={{ transform: exit.to((e) => `translateY(${-e * 100}%)`) }}
    >
      {/* Centre logo. */}
      <div className="absolute inset-0 flex items-center justify-center text-black">
        <span className="flex items-center gap-2 text-3xl font-medium">
          <BoltIcon />
          Stride
        </span>
      </div>

      {/* Counter — tracks the fill edge, hero-heading scale. */}
      <animated.div
        className="pointer-events-none absolute bottom-16 md:bottom-20"
        style={{
          left: fill.to((f) => `${Math.max(f, 0.16) * 100}%`),
          transform: "translateX(-100%)",
        }}
      >
        <span
          ref={pctRef}
          className="block whitespace-nowrap pr-6 text-5xl font-light leading-[0.95] tracking-tight text-black sm:text-6xl lg:text-8xl"
        >
          0%
        </span>
      </animated.div>

      {/* Bottom bar — fills left→right (inner scaleX), then the whole strip scales up
          (outer scaleY, from the bottom) at the end. Rendered last so the growing bar
          covers the counter and logo during the final scale. */}
      <animated.div
        className="absolute inset-x-0 bottom-0 h-lvh origin-bottom overflow-hidden"
        style={{ transform: exit.to((e) => `scaleY(${thin + (1 - thin) * e})`) }}
      >
        <animated.div
          className="h-full w-full origin-left bg-gradient-to-r from-preloader-from to-preloader-to"
          style={{ transform: fill.to((f) => `scaleX(${f})`) }}
        />
      </animated.div>
    </animated.div>
  );
};
