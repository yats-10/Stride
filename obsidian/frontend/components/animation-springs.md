---
tags: [frontend, animation, stable, do-not-modify]
updated: 2026-05-21
---

# Catalog — Spring Components

Files in `src/components/animation/springs/`. The animation engine — `#do-not-modify`.
Conceptual overview: [[animation-system]].

All components accept `tag` (semantic HTML element), `className`, and react-spring
`config`. Each is `"use client"`.

## `<Inview>` — `in-view.tsx`

Springs `from` → `to` when the element enters the viewport (IntersectionObserver).

- `mode`: `"once"` (play once, stay) · `"always"` (reverse on leave) · `"forward"`
  (only on downward scroll).
- `delayIn` / `delayOut`, `immediateOut`, `disableOnMobile`.
- `trigger` — optional external element to observe. Omit it and the component
  observes its own rendered element (the common case).
- `innerTag` / `innerClassName` — the inner animated wrapper.

## `<Spring>` — `spring.tsx`

Unconditional spring driven by mount / the `enabled` flag. Same `mode` set as
`<Inview>`. Use when motion shouldn't depend on the viewport.

## `<SpringTrigger>` — `spring-trigger.tsx`

Scroll-progress animation between two trigger points.

- `mode`: `"scrub"` (continuously interpolate with scroll — parallax, progress bars)
  · `"toggle"` (snap between `from`/`to` at the trigger point).
- `start` / `end` — `TriggerPos` strings (see [[text-engine]]).
- `trigger` — optional external scroll-reference element.
- `onChange({ progress, interpolatedProgress })` callback.
- `frameInterval` — throttle for the scroll handler.

## `<ProgressTrigger>` — `progress-trigger.tsx`

Tracks scroll position and emits a normalised **0–1 progress** value via
`onChange` — no animation of its own. Use to drive custom logic.

## `<Hover>` — `hover.tsx`

Spring on mouse enter/leave. Disabled on mobile by default (`disableOnMobile.hover`
is always `true`). `trigger` lets a different element fire the hover.

## `<Handle>` — `handle.tsx`

Smooth enter/exit when `children` change — caches previous content during the
transition. Configurable `from`/`to`, `delayIn`/`delayOut`, `enabled`.

## `<AnimatedVarTextTag>` — `animated-var-text-tag.tsx`

Low-level primitive: renders `animated[tag]` with a forwarded ref. Building block
for the other components — rarely used directly.

## Related

[[animation-system]] · [[hooks]] · [[components/common]]
