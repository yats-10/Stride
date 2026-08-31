"use client";

// Two rows of logos whose horizontal motion is tied to scroll position (opposite
// directions), not autoplay. The list is repeated COPIES times and each row's
// translate is wrapped into the [-ONE_SET, 0] band, so it's seamless and always
// filled edge-to-edge (no gaps at start or end) at any width. Motion is a
// react-spring value chasing the scroll offset (spring-based, ADR-0002).
import { useEffect } from "react";
import { animated, useSpring } from "@react-spring/web";
import { subscribeToTicker } from "@/lib/animation/ticker";

export interface LogoMarqueeProps {
  logos: string[];
  label: string;
}

const COPIES = 6; // repeats of the set; half the track always overflows the viewport
const ONE_SET = 100 / COPIES; // percent width of one set

// Simple flat monochrome marks, picked by index — all one colour (currentColor).
const Mark = ({ i }: { i: number }) => {
  const paths = [
    <circle key="c" cx="12" cy="12" r="9" />,
    <rect key="r" x="4" y="4" width="16" height="16" rx="5" />,
    <path key="t" d="M12 2.5 21 20.5 3 20.5Z" />,
    <path key="d" d="M12 3a9 9 0 1 0 9 9h-9Z" />,
    <path key="s" d="M12 2l2.6 6.4L21 9l-5 4.2L17.8 20 12 16.3 6.2 20 8 13.2 3 9l6.4-.6z" />,
  ];
  return (
    <svg viewBox="0 0 24 24" className="h-9 w-9 shrink-0" fill="currentColor" aria-hidden="true">
      {paths[i % paths.length]}
    </svg>
  );
};

const Row = ({
  logos,
  direction,
  speed,
}: {
  logos: string[];
  direction: "left" | "right";
  speed: number;
}) => {
  // `s` chases the scroll offset (px * speed); the spring smooths it. The wrap into
  // [0, ONE_SET) happens in the interpolation, so the spring never sees a jump.
  const [{ s }, api] = useSpring(() => ({
    s: 0,
    config: { tension: 90, friction: 34 }, // soft → light, smooth drift
  }));

  useEffect(() => {
    const unsubscribe = subscribeToTicker(
      () => api.start({ s: window.scrollY * speed }),
      () => 0,
    );
    return unsubscribe;
  }, [api, speed]);

  const transform = s.to((v) => {
    const m = ((v % ONE_SET) + ONE_SET) % ONE_SET; // 0..ONE_SET
    const off = direction === "left" ? -m : -(ONE_SET - m); // stays in [-ONE_SET, 0]
    return `translate3d(${off}%,0,0)`;
  });

  return (
    <div className="flex overflow-hidden">
      <animated.div
        style={{ transform }}
        className="flex w-max shrink-0 items-center text-logo"
      >
        {Array.from({ length: COPIES }).flatMap((_, c) =>
          logos.map((name, i) => (
            <span
              key={`${c}-${i}`}
              className="flex shrink-0 items-center gap-3 pr-16"
            >
              <Mark i={i} />
              <span className="whitespace-nowrap text-3xl font-semibold tracking-tight">
                {name}
              </span>
            </span>
          )),
        )}
      </animated.div>
    </div>
  );
};

export const LogoMarquee = ({ logos, label }: LogoMarqueeProps) => {
  return (
    <section aria-label={label} className="bg-hero-page py-12">
      <div className="flex flex-col gap-10">
        <Row logos={logos} direction="left" speed={0.005} />
        <Row logos={logos} direction="right" speed={0.0038} />
      </div>
    </section>
  );
};
