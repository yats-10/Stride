---
tags: [architecture, stable]
updated: 2026-05-21
---

# Tech Stack

Every dependency in `package.json`, what it does, and why it is here.
Package name: `stride` · version `1.0.0` · private · author Yatharth Madaan.

## Core framework

| Package | Version | Role |
|---------|---------|------|
| `next` | `16.2.0` | App Router framework. ⚠️ See warning below. |
| `react` / `react-dom` | `19.2.4` | UI runtime |
| `typescript` | `^5` | Type system — `any` is banned |

> [!warning] This is not the Next.js you may know
> `AGENTS.md` warns: APIs, conventions, and file structure may differ from older
> Next.js knowledge. Always check [[routing]] before writing routing code, and
> heed deprecation notices.

## Styling

| Package | Version | Role |
|---------|---------|------|
| `tailwindcss` | `^4` | Utility CSS — **no `tailwind.config.js`** |
| `@tailwindcss/postcss` | `^4` | PostCSS integration |

Tailwind v4 is configured entirely in `src/app/globals.css` via `@theme inline`.
See [[design-system]].

## Animation (the heart of the starter)

| Package | Version | Role |
|---------|---------|------|
| `@react-spring/web` | `^10.0.3` | Spring physics — drives **all** motion |
| `spring-text-engine` | `^0.1.5` | Scroll-aware spring text animation |

No `framer-motion`, no CSS transitions/keyframes. See [[animation-system]] and
[[text-engine]]. ADR: [[decisions-log]] ADR-0002.

## 3D / WebGL

| Package | Version | Role |
|---------|---------|------|
| `three` | `0.143.0` | WebGL/GLSL scene for the home hero ("Plasma Burst"). **Exact-pinned.** |
| `@types/three` | `0.143.0` | Types (dev). Lacks `EffectComposer.dispose()` — see below. |

`three` renders `<canvas>` artwork — a different medium from the spring engine, so
it is **exempt from ADR-0002** (which governs DOM/UI motion). The hero stacks two
WebGL layers, both under `src/lib/three/` and mounted by one client leaf
(`src/views/plasma-burst.tsx`; `HomeView` stays a Server Component): the animated
`plasma-burst-scene` (own rAF loop) in front, and a static `gradient-background-scene`
(rendered once / on resize — no loop) behind it. Version pinned to `0.143.0` to match the source scene spec. ADR:
[[decisions-log]] ADR-0014. Note: `@types/three@0.143` omits
`EffectComposer.dispose()` (present at runtime) — called via a narrow type, not
`any`.

Beyond the hero, `three` also powers the "Our Works" 3D card stack
(`views/works.tsx`) and the **chrome GLB section** (`lib/three/chain-scene.ts`):
`GLTFLoader` + `DRACOLoader` load a Draco-compressed model, given a
`MeshStandardMaterial` chrome look reflecting a **PMREM `RoomEnvironment`**. All of
these (`GLTFLoader`/`DRACOLoader`/`RoomEnvironment`/`PMREMGenerator`) come from
`three/examples/jsm` — **no extra npm dependency**. The Draco decoder binaries are
vendored to `public/draco/` (from `three/examples/js/libs/draco/gltf/`) and
`DRACOLoader.setDecoderPath("/draco/")`; ESLint ignores `public/**` so the vendored
decoder isn't linted.

## Scroll & state

| Package | Version | Role |
|---------|---------|------|
| `lenis` | `^1.3.19` | Smooth scrolling |
| `zustand` | `^5.0.12` | Lightweight global state (scroll store) |
| `resize-observer-polyfill` | `^1.5.1` | ResizeObserver fallback for animation hooks |
| `zod` | `^4.4.3` | Schema validation — env (`src/env.ts`) + API payloads. See [[api-architecture]] |

See [[smooth-scroll]] and [[data-flow]].

## Misc

No miscellaneous runtime dependencies. Cookie consent is an in-house component
(`src/components/common/Cookie/`) built on Zustand + `@react-spring/web` — the
former `react-cookie-consent` package was removed. See [[components/common]].

## Tooling

| Package | Role |
|---------|------|
| `eslint` `^9` + `eslint-config-next` | Linting — run `yarn lint` before commits |
| `@types/*` | Type definitions for node/react |

## Scripts

```bash
yarn dev          # next dev — local development
yarn build        # next build — production build
yarn start        # next start — serve production build
yarn lint         # eslint
yarn check:links  # builds, boots, and asserts every in-page anchor resolves
```

`check:links` runs `scripts/check-links.mjs` (plain Node, no test framework): it
fetches `/` from the production build and fails if any `href="#…"` has no matching
`id`, if the page emits `Organization` schema, or if the author credit is missing.
Run it before publishing — the nav/footer anchors are content, so a renamed section
id breaks them silently. ADR: [[decisions-log]] ADR-0017.

Package manager: **Yarn** (`yarn.lock` is committed).

## Not yet in the stack

Auth, database/ORM, payments, i18n, data-fetching libraries. The original starter
spec listed these as "add as needed" placeholders. Document them here when adopted,
and add an ADR to [[decisions-log]].

## Related

[[system-overview]] · [[folder-structure]]
