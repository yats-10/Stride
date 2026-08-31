"use client";

// Reusable heading with the hero title's per-letter intro: each letter rises from just
// below, fading up out of a soft blur, in a smooth easeOutQuart cascade. Unlike the hero
// (which plays on mount), this triggers when the heading scrolls into view.
//
// Mechanism mirrors views/hero-title.tsx: spring-text-engine can't animate under the
// pinned react-spring, and react-spring's self-running springs don't progress in this
// project — so a single value `p` (0→1) is driven each frame from the shared ticker, and
// each letter derives its opacity / rise / blur from `p` with a per-letter stagger. See
// [[decisions-log]] ADR-0015.
//
// Words are kept unbreakable (letters are inline-block inside an inline-block word) so the
// heading still wraps at spaces. The tag carries the full `aria-label`; letters are
// aria-hidden. Reduced motion + headings containing digits (the request: don't animate
// numeric headings) render static. Solid colour is inherited from `className`; pass
// `alpha` for a per-letter opacity ramp (e.g. to reproduce a gradient).
import { useMemo } from "react";
import type { ElementType } from "react";
import { animated } from "@react-spring/web";
import { useRevealCascade } from "@/components/common/use-reveal-cascade";

export interface AnimatedHeadingProps {
  children: string;
  as?: "h1" | "h2";
  className?: string;
  id?: string;
  /** Per-letter target opacity given the letter's 0..1 position; default solid (1). */
  alpha?: (fraction: number) => number;
}

const RISE = 16; // px each letter rises from
const BLUR = 8; // px start blur

export const AnimatedHeading = ({
  children: text,
  as = "h2",
  className,
  id,
  alpha,
}: AnimatedHeadingProps) => {
  const Tag = as as ElementType;
  const hasDigit = /\d/.test(text);
  const words = useMemo(() => text.split(" "), [text]);
  const total = useMemo(
    () => words.reduce((n, w) => n + [...w].length, 0),
    [words],
  );
  // Digit / numeric headings stay static (hook still called — order stable).
  const { p, rootRef, localProg } = useRevealCascade(hasDigit ? 0 : total);

  if (hasDigit) {
    return (
      <Tag id={id} className={className}>
        {text}
      </Tag>
    );
  }

  let li = 0;
  return (
    <Tag ref={rootRef} id={id} aria-label={text} className={className}>
      {words.flatMap((word, wi) => {
        const nodes = [
          <span key={`w${wi}`} aria-hidden="true" className="inline-block">
            {[...word].map((ch, ci) => {
              const i = li;
              li += 1;
              const a = alpha ? alpha(total > 1 ? i / (total - 1) : 0) : 1;
              return (
                <animated.span
                  key={ci}
                  className="inline-block [will-change:transform,opacity]"
                  style={{
                    opacity: p.to((v) => a * localProg(v, i)),
                    transform: p.to(
                      (v) => `translateY(${RISE * (1 - localProg(v, i))}px)`,
                    ),
                    filter: p.to(
                      (v) => `blur(${BLUR * (1 - localProg(v, i))}px)`,
                    ),
                  }}
                >
                  {ch}
                </animated.span>
              );
            })}
          </span>,
        ];
        if (wi < words.length - 1) {
          nodes.push(
            <span key={`s${wi}`} aria-hidden="true">
              {" "}
            </span>,
          );
        }
        return nodes;
      })}
    </Tag>
  );
};
