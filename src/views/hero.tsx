"use client";

// Home hero. A full-bleed WebGL burst (PlasmaBurst) on a blue gradient, with the
// marketing UI laid over it (from Figma): the display heading, a lower-right insight
// block with CTAs, and a bottom-left stats row. The nav is the shared fixed <SiteNav>
// (rendered once in home.tsx), not part of this overlay. As the
// page scrolls the whole card shrinks into a rounded inset (a `clip-path` inset+radius
// — no canvas resize, so no jank) while the burst spins faster. Driven off scroll via
// the shared ticker + a react-spring value (ADR-0002). All copy comes from props.
import { useEffect, useRef } from "react";
import { animated, useSpring } from "@react-spring/web";
import { subscribeToTicker } from "@/lib/animation/ticker";
import { PlasmaBurst } from "@/views/plasma-burst";
import { HeroTitle } from "@/views/hero-title";
import { usePreloader } from "@/hooks/use-preloader";
import { useRevealCascade } from "@/components/common/use-reveal-cascade";
import type { SiteLink } from "@/lib/site";

export interface HeroStat {
  value: string;
  label: string;
}

export interface HeroContent {
  /** Display heading lines (visible h1) — one gradient span per line, the fade
   *  direction alternating so successive lines mirror each other. */
  titleLines: string[];
  /** Accessible name for the hero section landmark. */
  sectionLabel: string;
  /** Accessible label for the decorative canvas. */
  sceneLabel: string;
  cta: SiteLink;
  secondaryCta: SiteLink;
  insightTitle: string;
  insightBody: string;
  stats: HeroStat[];
}

export interface HeroProps {
  content: HeroContent;
}

const INSET = 24; // px gap from the edges once shrunk (design request)
const RADIUS = 24; // px corner radius once shrunk
const SHRINK_VH = 0.6; // viewports of scroll to complete the shrink
// Soft reveal for the non-heading hero elements (stats + insight), played once the
// preloader clears (same gate as the heading + burst).
const REVEAL_RISE = 20; // px rise
const REVEAL_BLUR = 10; // px start blur
const HERO_ITEMS = 6; // 3 stats + insight title + body + buttons

export const Hero = ({ content }: HeroProps) => {
  const {
    titleLines,
    sectionLabel,
    sceneLabel,
    cta,
    secondaryCta,
    insightTitle,
    insightBody,
    stats,
  } = content;

  const sectionRef = useRef<HTMLElement>(null);
  const progressRef = useRef(0); // hero-shrink progress 0..1 → burst spin + zoom
  const [{ p }, api] = useSpring(() => ({
    p: 0,
    config: { tension: 420, friction: 44 },
  }));

  // Non-heading elements fade/blur/rise in once the preloader releases the hero.
  const preloaderDone = usePreloader((s) => s.done);
  const { p: rp, localProg: revealProg } = useRevealCascade(HERO_ITEMS, {
    startWhen: preloaderDone,
  });
  const revealStyle = (i: number) => ({
    opacity: rp.to((v) => revealProg(v, i)),
    transform: rp.to((v) => `translateY(${REVEAL_RISE * (1 - revealProg(v, i))}px)`),
    filter: rp.to((v) => `blur(${REVEAL_BLUR * (1 - revealProg(v, i))}px)`),
  });

  useEffect(() => {
    const unsubscribe = subscribeToTicker(
      () => {
        const el = sectionRef.current;
        if (!el) return;
        const top = el.getBoundingClientRect().top;
        const dist = Math.max(1, window.innerHeight * SHRINK_VH);
        const raw = Math.min(Math.max(-top / dist, 0), 1);
        api.start({ p: raw });
        progressRef.current = raw;
      },
      () => 0,
    );
    return unsubscribe;
  }, [api]);

  return (
    <section
      ref={sectionRef}
      aria-label={sectionLabel}
      className="relative h-lvh bg-hero-page"
    >
      <animated.div
        style={{
          clipPath: p.to(
            (v) => `inset(${v * INSET}px round ${v * RADIUS}px)`,
          ),
        }}
        className="absolute inset-0 overflow-hidden"
      >
        <PlasmaBurst label={sceneLabel} progressRef={progressRef} />

        {/* Marketing UI overlaid on the burst. Scales down in step with the card
            shrink (transform-origin centre) so it recedes with the container as it
            collapses — the burst keeps its own zoom (progressRef), untouched. */}
        <animated.div
          style={{ transform: p.to((v) => `scale(${1 - v * 0.1})`) }}
          className="absolute inset-0 z-10 flex flex-col px-6 pb-6 pt-5 text-white md:px-10 md:pb-10 lg:px-12 lg:pb-12"
        >
          {/* Display heading — per-letter intro (rise + blur + fade), with the old
              per-line inverted gradient kept as a per-letter alpha ramp. Top margin
              clears the fixed site header. See hero-title.tsx. */}
          <HeroTitle
            lines={titleLines}
            className="mt-24 text-4xl font-light leading-[0.95] tracking-tight sm:text-6xl lg:text-8xl"
          />

          {/* Bottom band: stats (left) | insight + CTAs (right) */}
          <div className="mt-auto flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
            <ul className="flex gap-6 sm:gap-10">
              {stats.map((s, i) => (
                <animated.li
                  key={s.label}
                  style={revealStyle(i)}
                  className="border-l border-white pl-5 [will-change:transform,opacity]"
                >
                  <span className="block text-5xl font-light leading-none sm:text-7xl">
                    {s.value}
                  </span>
                  <span className="mt-3 block text-sm text-white">
                    {s.label}
                  </span>
                </animated.li>
              ))}
            </ul>

            <div className="max-w-lg">
              <animated.p
                style={revealStyle(3)}
                className="text-2xl font-medium leading-snug [will-change:transform,opacity]"
              >
                {insightTitle}
              </animated.p>
              {/* Long supporting paragraph — hidden on mobile so the hero breathes and
                  the insight title sits at the very bottom; shown from `sm` up. */}
              <animated.p
                style={revealStyle(4)}
                className="mt-4 hidden text-base leading-relaxed text-white/55 sm:block [will-change:transform,opacity]"
              >
                {insightBody}
              </animated.p>
              <animated.div
                style={revealStyle(5)}
                className="mt-16 flex items-center gap-6 [will-change:transform,opacity]"
              >
                <a
                  href={cta.href}
                  className="rounded-full bg-white px-6 py-3 text-sm font-medium text-black hover:bg-white/90"
                >
                  {cta.label}
                </a>
                <a
                  href={secondaryCta.href}
                  className="text-sm text-white underline underline-offset-4 hover:text-white/80"
                >
                  {secondaryCta.label}
                </a>
              </animated.div>
            </div>
          </div>
        </animated.div>
      </animated.div>
    </section>
  );
};
