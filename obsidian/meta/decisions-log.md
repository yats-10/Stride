---
tags: [meta, decision]
updated: 2026-08-31
---

# Decisions Log (ADRs)

Architecture Decision Records. Each entry captures a choice, its context, and its
consequences. Use [[templates/adr-note]] for new entries. Newest first.

---

## ADR-0017 — Ship Stride as a credited editorial concept, not a fictional company

- **Status:** Accepted
- **Date:** 2026-08-31

### Context

Stride is being published as a portfolio piece (Behance + a live URL). The project
had been carrying the scaffolding of a *real* company: `Organization` JSON-LD, a
`@stride` Twitter handle, a postal address, a phone number and a `hello@stride.finance`
inbox in the footer, social links to bare `x.com`/`linkedin.com` homepages, and
`href="#"` on every nav item and CTA. It also still carried the upstream starter's
authorship (README, `package.json`, the distribution wrapper `HOW_TO_USE.md`).

Two problems with that. **Truthfulness:** Stride is a fictional brand, and
`Organization` schema plus an `@handle` and a `mailto:` assert an entity that does
not exist — the handle and the domain may well belong to somebody else. **Craft:** a
showcase judged on detail should not have a footer of dead anchors.

### Decision

Frame the project as what it is — *an editorial concept, designed and built by
Yatharth Madaan* — and let that framing drive the metadata:

1. **Authorship in one place.** `siteConfig` gained `author`, `authorUrl`, `year`
   and `conceptNote`; `package.json` gained `author`/`description`/`license`. The
   footer credit, copyright, colophon and JSON-LD all derive from those fields.
2. **`CreativeWork` + `Person`, not `Organization`.** `getSiteStructuredData()` now
   emits a `Person` (the author), a `CreativeWork` (the concept — `genre`,
   `abstract`, `copyrightYear`) and a `WebSite` that points at both.
3. **Nothing invented that could point at a real person.** Dropped
   `siteConfig.twitterHandle` and the Twitter `site`/`creator` fields; dropped the
   footer's fictional address, phone, email and social accounts.
4. **Every clickable label carries its destination.** A shared `SiteLink`
   (`{ label, href, external? }`) in `lib/site.ts` replaced the bare strings in the
   nav, hero, showcase and product content. Sections gained the ids those anchors
   point at (`#about`, `#approach`, `#work`, `#product`; `#contact` already existed),
   and the two dead `<button>` CTAs became anchors.
5. **A real footer bottom bar.** `copyright` and `credit` had been declared in
   `FooterContent` and never rendered. They render now, alongside the fictional-brand
   note, with a **Colophon** column (project/year, role, stack) where the invented
   contact block used to be.
6. **`authorUrl` degrades to text.** It ships empty; the credit renders as a plain
   `<span>` until a real profile URL is set, so an unset value can never become a
   dead link.

### Consequences

- The concept reads as a concept — in the footer, in the `<meta>` description, and
  in the structured data — with no risk of being taken for a real bank.
- Every anchor on the page resolves to a section that exists.
- Adding the author's profile link later is a one-line change in `siteConfig`.
- `FooterContent` changed shape (`contact`/`social`/`tagline` → `colophon`/`note`);
  any future footer variant must follow it.
- Removed: `HOW_TO_USE.md` (a distribution wrapper, not part of the piece) and
  `public/browserconfig.xml` (unreferenced, pointing at three icons that were never
  in `public/`).

---

## ADR-0016 — WebGL scenes render only while on-screen (visibility-gated loops + shader precompile)

- **Status:** Accepted
- **Date:** 2026-07-05

**Context.** The page mounts three self-running WebGL scenes — the hero plasma burst
(`lib/three/plasma-burst-scene.ts`, with a bloom `EffectComposer`) and two chrome models
sharing `lib/three/chain-scene.ts` (the chain + the footer heart, each with a PMREM
environment). Each owned an unconditional `requestAnimationFrame` loop that ran from mount to
unmount, so **all three rendered every frame even while scrolled far off-screen** — the main
cause of scroll jank. Separately, three.js compiles a material's GL program lazily on its
**first render**, so a chrome model hitched the moment it scrolled into view.

**Decision.** (1) Gate every render loop on an `IntersectionObserver` over the canvas's
parent section (`rootMargin` ~200–300px so it spins up just before entering view): start the
rAF loop on intersect, `cancelAnimationFrame` + stop on exit. On resume the loops reset their
time/scroll baselines (`lastT`, `lastScroll`) so a paused gap doesn't step `dt` or inject a
spin spike. (2) In `chain-scene.ts`, call `renderer.compile(scene, camera)` right after the
GLB loads (off the scroll path), so the first on-screen frame doesn't JIT-compile the chrome
shader. The one-shot gradient backdrops (`gradient-background-scene.ts`) already render once,
so they were left alone.

**Consequences.** Only the section(s) actually on screen render, freeing the main thread while
the user reads other sections; the model shaders are warm before they appear. Reduced-motion
still draws a single static frame (no loop to gate). Trade-off: a scene is idle (last frame
frozen) while off-screen — invisible in practice thanks to the `rootMargin` lead. These files
are the WebGL subsystem (exempt from ADR-0002), not the spring engine, so no sign-off needed.

---

## ADR-0015 — Hero title per-letter animation via the shared ticker (spring-text-engine unusable)

- **Status:** Accepted
- **Date:** 2026-07-04

**Context.** The home hero title needed a per-letter intro (each letter rising from below
with a soft blur + fade). ADR-0002 mandates that **text** animation go through
**`spring-text-engine`**. In practice that engine does **not** work in this project:
`spring-text-engine@0.1.5` (the latest published — no newer version exists) renders letters
straight to their **end state on mount** under the installed `@react-spring/web@10` — its
spring config is ignored (peer range allows `>=9`, but v10 broke the API the engine uses).
This was never noticed because **nothing in the codebase used TextEngine before.**

Digging further: react-spring's own **self-running** `from→to` springs (`useSpring`/`useTrail`,
declarative or via `enabled`-flip) also don't progress here — they snap to the target. The
**only** animation mechanism that actually runs in this project is driving a spring value
**imperatively every frame from the shared ticker** (`subscribeToTicker` + `api.start({…},
immediate:true)`), which is exactly how the hero shrink, works card stack, and chain scene
animate. (react-spring's frameloop appears not to advance declarative springs in this build.)

**Decision.** Animate the hero title per-letter with the **shared-ticker drive**, not
spring-text-engine. `src/views/hero-title.tsx` (a client leaf) advances one react-spring
value `p` 0→1 over a duration from the ticker; each letter derives its opacity / rise / blur
from `p` with a per-letter stagger and an `easeOutQuart`. The old per-line inverted gradient
is preserved as each letter's **target opacity** (a per-letter alpha ramp — a `bg-clip-text`
gradient can't survive per-letter transforms). Accessibility: the `<h1>` keeps the full
`aria-label`; letters are `aria-hidden`. Reduced motion jumps straight to `p=1`.

This is a **scoped exception** to "text animation uses spring-text-engine" (ADR-0002 hard
rule) — taken only because that engine is non-functional under the pinned react-spring.

**Consequences.** `spring-text-engine` stays effectively unusable until the dependency is
resolved (downgrade react-spring to v9 — risky, the protected vendored engine is built on
v10 — or a v10-compatible engine release). Any future per-letter/word text animation should
use the same ticker-drive pattern (or fix the dep). See [[text-engine]] (warning) and
[[changelog]].

---

## ADR-0014 — Three.js WebGL scene for the home hero

- **Status:** Accepted
- **Date:** 2026-07-01

**Context.** The home hero needed a rich animated "Plasma Burst" — a white-hot core
erupting into curling electric-violet filaments with twinkling sparks. This is a
real-time GPU particle/shader effect (custom GLSL, additive blending, an UnrealBloom
postprocessing chain), which `@react-spring/web` (ADR-0002) does not and should not
express — that engine drives DOM/CSS-property motion, not a WebGL render target.
(The scene originally also had mouse-tilt + click-shock interaction; those were
removed. It turntable-spins and now also has a **cursor magnet** — filament tips lean
toward the pointer, applied in view space in the line vertex shader — plus an **intro**
(fade + scale-up + spin-up) gated on the `started` flag from the [[components/common|preloader
store]], so the burst appears only after the first-load preloader finishes. See [[changelog]].)

**Decision.** Introduce **Three.js (`three`, pinned `0.143.0`)** for canvas/WebGL
artwork, and scope ADR-0002 explicitly:

- **ADR-0002 governs DOM/UI motion.** "All motion is spring-based" means the spring
  system is the only way to animate DOM elements / CSS properties — no
  `framer-motion`, no CSS transitions/keyframes. A `<canvas>` WebGL scene is a
  different medium and is exempt; it owns its own `requestAnimationFrame` loop,
  isolated from the shared spring ticker.
- **Placement.** The heavy, framework-agnostic scene lives in a factory —
  `src/lib/three/plasma-burst-scene.ts` (`createPlasmaBurst(canvas, opts)` →
  `{ dispose }`). A thin `"use client"` leaf, `src/views/plasma-burst.tsx`, only
  mounts/disposes it (feature-specific, so it sits next to the view, not in
  `components/`). `HomeView` stays a Server Component (hard rule #6).
- **Compositing.** The scene renders exactly as designed — additive plasma on pure
  **black** under bloom. Behind it is a **second WebGL layer** — a static fragment
  shader (`gradient-background-scene`) painting a grainy blue gradient with organic
  dark clouds. The burst canvas composites onto it with CSS **`mix-blend-lighten`**,
  so black reads as the backdrop and only the bright burst punches through. This
  keeps additive+bloom on black (where it works) instead of washing out over a
  coloured clear. Scene tuning deviates from the source spec where the composition
  demands it (camera pulled back, bloom threshold raised off 0 and tightened, global
  brightness lowered, core tamed, sparks recoloured to white shades) — see the
  factory header for the annotated deltas. (The backdrop evolved: solid rounded blue
  "card" → full-bleed CSS gradient → the current shader backdrop, with the CSS
  `hero-gradient` kept as a no-WebGL fallback — see [[changelog]].)
- **Design tokens vs scene constants.** The backdrop gradient colours are **design
  tokens** in `globals.css` (`--hero-base`/`--hero-stage`/`--hero-glow`). The scene's
  shader/geometry constants are **artwork parameters**, hardcoded in the factory —
  they are not design tokens and the token rule (ADR-0004/0012) does not apply.
- **Accessibility.** The canvas honours `prefers-reduced-motion` (renders a single
  static frame, no loop), carries `role="img"` + a label, and fails safe (a WebGL
  failure leaves the gradient backdrop visible).
- **Tunability.** The factory is config-driven — `createPlasmaBurst(canvas, {config})`
  plus a live `update(config)` (uniform/bloom/camera changes apply instantly;
  structural changes rebuild geometry in place). `PlasmaConfig` +
  `defaultPlasmaConfig` are exported as the single source of the tuned values. A
  **development-only** controls panel (`src/views/plasma-controls.tsx`) exposes them
  as sliders + colour pickers with a copy-out JSON export; it is gated on
  `NODE_ENV` so it never ships to production. The tuned defaults in
  `defaultPlasmaConfig` are what render in prod.
  - **Reused by the chain model.** `createChainScene` follows the same shape —
    `ChainMaterialConfig` + `defaultChainMaterial` exported, a live `update(material)`
    on the handle, and a dev-only `src/views/chain-controls.tsx` panel (pinned
    top-**left** to clear the Plasma panel top-right) tuning the chrome look
    (tint, metalness, roughness, reflection/`envMapIntensity`, tone-mapping exposure).
    The model's chrome is a **material look**, not a design token — same reasoning as
    the scene constants above. `createChainScene` is a **general chrome-model scene**:
    the caller drives the model's vertical position each frame via `progress`
    (0 above → .5 centre → 1 below) and picks a `spinDirection` (+1/−1). It drives
    both models — the **chain**'s progress is driven off the layered **wrapper's**
    scroll (the pinned section's `rect.top` is frozen at 0 through the pin) in two
    continuous phases: fly-in (`wrap.top` vh→0 maps top-edge → centre) then a slow drift
    (`wrap.top` 0→−pinDist maps centre → out the bottom, `pinDist ≈ Product height`), so
    it gently keeps falling as the Product slides up rather than freezing at centre and
    dropping abruptly. That target is **low-passed** (`fall += (target − fall)·0.12`) so
    it eases in instead of tracking scroll 1:1 (which felt rigid), and it spins with
    **scroll momentum** (`scrollSpin: true`, tuned up via the optional `spinAccel`/`maxSpin`
    overrides) — scrolling visibly speeds up the turn, easing back to idle; the **footer
    heart** (`views/footer-scene.tsx`,
    `heart.glb`) flies in with parallax (progress tied to the footer's scroll position,
    settling at centre) and spins the opposite way (`spinDirection: -1`, scroll-momentum
    spin).

**Consequences.** First 3D dependency (`three` + `@types/three`, both `0.143.0`);
first `src/lib/three/` and `src/data/mocks/`. The starter's `body` flex-centering
(a placeholder for the empty page) was removed so real full-width layouts work.
`@types/three@0.143` lacks `EffectComposer.dispose()` (present at runtime) — called
through a narrow type, not `any`. Turbopack bundles the r0.143 `examples/jsm`
addons without config. See [[tech-stack]] and [[changelog]].

---

## ADR-0013 — `<Inview>` self-observe fix; spring components honour resize

- **Status:** Accepted
- **Date:** 2026-06-07

**Context.** `<Inview>` only animated when an external `trigger` ref was passed.
Without one it never revealed. Root cause: `useDynamicInView` returns its target
attachment as a **callback ref** (`setNode`) in the first tuple slot, but
`in-view.tsx` destructured it as `inViewRef` and wrote `inViewRef.current = node`
in the JSX `ref` callback — assigning `.current` to a function instead of calling
it. `setNode` never ran, the observed `node` stayed `null`, and with no `trigger`
the observer had nothing to watch (`trigger?.current ?? node` → `null`). With a
`trigger` it worked only because `trigger.current` bypassed the dead `node` path.
TypeScript flagged this at build time (`Property 'current' does not exist on type
'TargetRefCallback'`), so the build was already failing.

Separately, `<Inview>`, `<Spring>`, and `<Hover>` tracked `width`
(`useWindowWidth()`) as a `useMemo`/`useEffect` dependency to re-evaluate mobile
gating on resize, but never passed it to `isMobileDisabled()` — so the value was
genuinely unused (ESLint `react-hooks/exhaustive-deps` warning) **and** resize
re-evaluation silently did nothing; the check always read `window.innerWidth` at
call time.

**Decision.** This is the second authorized edit to the `#do-not-modify` engine
(after ADR-0009). Two corrections:
1. In `in-view.tsx`, call the callback ref — `setInViewNode(node)` — instead of
   assigning `.current`, so the component observes itself when no `trigger` is
   given.
2. Pass the React-tracked `width` into every `isMobileDisabled(value, width)`
   call across `in-view.tsx`, `spring.tsx`, and `hover.tsx`. This is the
   documented second parameter of `isMobileDisabled` and makes the `width`
   dependency meaningful, fixing resize re-evaluation and clearing the lint
   warnings.

**Consequences.** `<Inview>` now works standalone (the common case). `yarn build`
and `yarn lint` are both clean (0 errors, 0 warnings). The springs folder remains
`#do-not-modify` by default — these were explicitly signed-off bug fixes.

---

## ADR-0012 — Styling lives in utilities and components, not `globals.css`

- **Status:** Accepted
- **Date:** 2026-05-22

**Context.** ADR-0004 made design tokens the styling currency and ruled that
"new values must be added to `globals.css` first." Combined with the
design-system guidance to *"extract repeated multi-class patterns to
`@layer components`"*, the path of least resistance for any repeated visual
pattern became a named class in `globals.css`. On an animation-heavy,
multi-section marketing site that grows the file without bound — a single
global stylesheet accumulating hundreds of component-specific classes that are
never deleted when their component is. The fix is a placement rule, not a
file-splitting trick: splitting `globals.css` into many files only spreads the
same bloat.

**Decision.** Styling follows a strict placement order; `globals.css` stays
bounded by design.

- One-off styling → **Tailwind utilities** in `className`. Nothing enters CSS.
- A repeated pattern with markup/structure/props → a **React component**
  (`components/ui/`), *not* a CSS class. This is the default answer to "this
  looks repeated" — e.g. an eyebrow label with a `::before` dot is an
  `<Eyebrow>` component, not a `.label-eyebrow` class.
- A repeated pure-utility combo with no structure → a Tailwind v4 `@utility`.
- `@layer components` is reserved **strictly** for what utilities and
  components genuinely cannot express: pseudo-elements (`::before`/`::after`),
  third-party DOM overrides (`!important` on library markup), complex
  descendant/state selectors.
- `globals.css` only ever holds: `@import`, tokens (`:root` + `@theme`), base
  element resets (`@layer base`), and the narrow `@layer components`
  exceptions above. If it grows past that, something was misplaced.
- CSS Modules were considered and **rejected** — a second styling mechanism
  for the rare bespoke-CSS case is not worth the extra mental model when
  motion is spring-based (no keyframes — ADR-0002) and utilities + components
  cover everything else.

**Consequences.** `globals.css` stays a few-hundred-line file indefinitely.
"Repeated thing" pressure now pushes toward React components — which the
project wants anyway. This **amends ADR-0004**: design *tokens* still go in
`globals.css` first, but component-specific *classes* no longer do.
[[design-system]] and [[component-conventions]] updated to match.

---

## ADR-0011 — API layer: `app/api` route handlers, secrets server-side

- **Status:** Accepted
- **Date:** 2026-05-22

**Context.** The starter had no API layer. It needs a convention for reaching
external services that keeps secret keys off the client and gives endpoints a
consistent shape.

**Decision.** External calls go through Next.js Route Handlers —
`src/app/api/<resource>/route.ts`:
- **The handler owns the work** — business logic, multiple upstream calls,
  filtering, and reading secret env vars all live in `route.ts`. No mandatory
  passthrough service layer; extract shared code only when genuinely reused.
- Secrets are safe in handlers because `route.ts` is never bundled to the
  browser. Secret env vars are **unprefixed**; `NEXT_PUBLIC_` only for
  browser-safe values.
- Every endpoint: validates input with `zod`, returns the `{ data }` /
  `{ error }` envelope via the shared `handle()` wrapper (`src/lib/api/`), runs
  on the Node runtime (not Edge).
- `src/env.ts` validates env with zod — `publicEnv` vs `getServerEnv()`.
- Client Components fetch via `apiFetch` (`src/lib/api-client.ts`), same-origin
  only. Render-time data is read in Server Components.
- Added `zod`. The example endpoint is `app/api/contact/route.ts`.
- Codified as **AGENTS.md hard rule #9**.

**Consequences.** A clear, secret-safe API convention (full note:
[[api-architecture]]). Server Actions were considered for mutations but
deferred — for now everything goes through `app/api`. The choice can be
revisited if forms need progressive enhancement. First server dependency
(`zod`) and first server-only env var (`CONTACT_ENDPOINT`) now exist.

---

## ADR-0010 — SEO & performance hardening

- **Status:** Accepted
- **Date:** 2026-05-21

**Context.** A review found gaps that would hurt a production marketing site:
`metadataBase` defaulted to `null` (relative OG/canonical URLs never resolved to
absolute — broken social previews); `themeColor` sat on the deprecated metadata
field; there was no `robots.txt`, `sitemap.xml`, or structured data; the
`next.config.ts` was empty; `ScrollLayout` leaked a `requestAnimationFrame`
loop; the home view was a top-level `"use client"` (violating hard rule #6);
and the animation-heavy starter ignored `prefers-reduced-motion`.

**Decision.**
- **Site config.** `src/lib/site.ts` (`siteConfig`) is the single source of
  truth for SEO, fed by `NEXT_PUBLIC_SITE_URL` (fallback `http://localhost:3000`).
- **Metadata.** `metadataBase` is always set; `themeColor` moved to a
  `generateViewport()` / `viewport` export; dead `keywords` / `other` tags
  dropped; OG dimensions corrected to match the asset.
- **Crawlability.** Added `app/robots.ts`, `app/sitemap.ts`, and a JSON-LD
  `Organization`+`WebSite` helper rendered once in the root layout.
- **App Router files.** Added `loading.tsx` (enables streaming), `error.tsx`,
  `not-found.tsx`.
- **Rendering.** `HomeView` is a Server Component; client-only animation moved
  to the `HomeShowcase` leaf — models hard rule #6 instead of breaking it.
- **Reduced motion.** `<ReducedMotion>` calls react-spring's `useReducedMotion`,
  toggling the global `skipAnimation` — one app-root mount covers every spring
  and `spring-text-engine`. Chosen over per-component handling for its reach.
- **Build config.** `next.config.ts` now sets `removeConsole` (prod),
  AVIF/WebP, `next/image` breakpoints aligned to the adaptive-grid widths, and
  `poweredByHeader: false`. React Compiler is left as a documented opt-in (needs
  `babel-plugin-react-compiler`).
- Fixed the `ScrollLayout` Lenis rAF leak (cancel on unmount).

**Consequences.** Social/SEO metadata is correct in production once
`NEXT_PUBLIC_SITE_URL` is set. The first project env var now exists (see
[[environment-variables]]). `isBot()` stays available but is discouraged — it
opts routes out of static rendering; reduced-motion is the preferred lever (see
[[seo-metadata]]). React Compiler remains opt-in pending a dependency install.

---

## ADR-0009 — Shared animation ticker; authorized engine performance refactor

- **Status:** Accepted
- **Date:** 2026-05-21

**Context.** A performance review of the animation engine found load issues that
scale with the number of animated components on a page:
- `useLoop` started a **private `requestAnimationFrame` loop per hook instance** —
  N scroll-driven components meant N rAF loops, none of which ever stopped.
- `useWindowWidth` attached a **separate debounced `resize` listener per call** —
  one per spring component.
- `useDynamicInView` re-created its `IntersectionObserver` **on every render**
  (effect keyed on an unstable `options` object), and a dead `Proxy` branch
  created observers that were never disconnected.
- `useLoop`'s mount-only effect captured a **stale `onRender`**, so prop changes
  after mount were ignored.
All of this lives under `src/hooks/animation/` and `src/components/animation/springs/`
— `#do-not-modify` (ADR-0002).

**Decision.** With explicit user sign-off, apply a one-time performance refactor
to the protected engine, and introduce a shared, unprotected loop primitive:
- New `src/lib/animation/ticker.ts` — a single app-wide, reference-counted rAF
  loop (`subscribeToTicker`). It starts on the first subscriber, stops on the
  last, and throttles each subscriber independently. **Not** `#do-not-modify` —
  it is the supported extension point.
- `useLoop` now subscribes to the ticker and reads `onRender` / `framerate`
  through refs (fixes the stale-closure bug). Public signature unchanged.
- `useDynamicInView` rewritten without the `Proxy`: one observer, re-created only
  when the observed element or options actually change; exposes a callback ref.
- `use-window-size.ts` (not protected) now serves all three hooks from one
  debounced `resize` listener via `useSyncExternalStore`. The unused
  `debounceDelay` parameter was dropped.
- `mode="forward"` `scroll` listeners in `<Spring>` / `<Inview>` made `passive`.
- Hard rule #2 amended: the engine stays protected by default; changes require
  explicit sign-off.

**Consequences.** A page with N animated components now runs **one** rAF loop and
**one** resize listener instead of N of each, with no observer churn. Public
hook/component APIs are unchanged except `useWindowWidth`/`Height`/`Size`, which
no longer take a `debounceDelay` argument (no caller passed one). This **amends
ADR-0002's** do-not-modify scope.

A follow-up pass then cleared all 13 pre-existing ESLint problems in the engine
(also authorized): `isMobileDisabled` gained an optional `viewportWidth`
argument, missing `disableOnMobile` effect deps were added, a
`trigger.current`-in-cleanup hazard in `<Hover>` was fixed, `<Handle>`'s
transition effects were ref-stabilised, and `useProgressTrigger` now returns
`progress` as a `RefObject<number>` (no consumer affected).

---

## ADR-0008 — Adaptive scaling grid via root font-size

- **Status:** Accepted
- **Date:** 2026-05-21

**Context.** An adaptive scaling system was dropped into `src/components/common/`
to keep a rem-based design proportional across viewports. It shipped as a
`styled-components` implementation (`createGlobalStyle`, a `css` `media` helper,
`rm`/`em` helpers, plus `colors.ts` / `fonts.ts` / `utils.ts`). `styled-components`
is not a project dependency, and global CSS belongs in `globals.css` per ADR-0004.

**Decision.** Keep only the scaling behaviour; rebuild it to the project stack.
- **Scale down** (viewport ≤ largest breakpoint) — `vw`-based `html { font-size }`
  media queries in `globals.css`, inside `@layer base`.
- **Scale up** (viewport > largest breakpoint) — a `<AdaptiveGrid>` client
  component (`useAdaptiveGrid` hook) sets an inline `html` font-size at runtime,
  reusing the existing `useResizeLoop` render loop.
- Breakpoints live in `grid.config.ts` as typed config; the `globals.css` media
  queries mirror them and must be kept in sync (formula in both files).
- The dropped `styled-components` files were deleted, not committed.

**Consequences.** A rem-based layout now scales as one unit on every viewport.
`styled-components` stays out of the dependency tree. The breakpoint set is
duplicated across `grid.config.ts` and `globals.css` by design — the CSS-only
config rule (ADR-0004) forbids generating the media queries from JS.

---

## ADR-0007 — Automate the vault workflow with Claude Code hooks

- **Status:** Accepted
- **Date:** 2026-05-21

**Context.** The "read the vault first, follow the relevant guide, update the docs
after every change" workflow depended on the user reminding the agent each time.
Documentation drifts the moment it relies on memory.

**Decision.** Encode the workflow as Claude Code hooks in `.claude/settings.json`
(committed, team-wide):
- `SessionStart` — injects a pointer to read the vault first.
- `UserPromptSubmit` — on every request, reminds the agent to consult the relevant
  guide and to update docs for any change made.
- `Stop` — at the end of every turn, blocks **once** to confirm the vault was
  updated. A `${TMPDIR}` marker keyed by session id guarantees it blocks at most
  once per turn (no infinite loop).

**Consequences.** The documentation workflow is enforced without user prompting.
`.claude/settings.json` is now a tracked project file. Hooks are reviewable and
disableable via `/hooks`. New hooks take effect on the next session start (or after
opening `/hooks`). See [[ai-agent-guide]].

---

## ADR-0006 — The vault is the single source of truth

- **Status:** Accepted
- **Date:** 2026-05-21

**Context.** ADR-0001 left dense spec files (`project-specs.md`, `text-engine-docs.md`)
at the repo root alongside the vault, creating duplication — the same conventions
existed both as terse specs and as expanded vault notes, which would drift.

**Decision.** The vault is the **only** documentation source.
- `project-specs.md` — deleted; its content was already decomposed into the
  `architecture/` and `frontend/` notes (and `environment-variables.md`).
- `text-engine-docs.md` — moved into the vault as [[text-engine-reference]].
- `generic-layout-prompt.md` — moved into the vault (see ADR via [[changelog]]).
- Root keeps only thin shims: `AGENTS.md` carries the breaking-change warning and
  hard rules and points into the vault; `CLAUDE.md` and `.cursorrules` both
  `@`-import `AGENTS.md`.

**Consequences.** No documentation duplication. Agents bootstrap from `AGENTS.md`
and read vault notes on demand. This **amends ADR-0001** — root files no longer
hold canonical spec content.

---

## ADR-0005 — Use standard `next/link` for navigation

- **Status:** Accepted
- **Date:** 2026-05-21

**Context.** Two conflicting conventions existed: `project-specs.md` specified
standard `next/link` / `useRouter`, while `generic-layout-prompt.md` specified
custom `<AnimLink>` / `useAnimRouter()` wrappers. The custom wrappers were never
built.

**Decision.** Use standard Next.js navigation — `<Link>` from `next/link` and
`useRouter` from `next/navigation`. The `AnimLink` / `useAnimRouter` convention is
dropped. See [[routing]].

**Consequences.** `generic-layout-prompt.md` §5 updated to match. No animated-route-
transition layer exists; if one is needed later, revisit with a new ADR.

---

## ADR-0001 — Adopt an Obsidian vault as the project brain

- **Status:** Accepted — amended by ADR-0006
- **Date:** 2026-05-21

**Context.** Project knowledge was scattered across root markdown files
(`project-specs.md`, `text-engine-docs.md`, `AGENTS.md`). New contributors and AI
agents had no structured map of the system.

**Decision.** Introduce `obsidian/` as an Obsidian vault — a linked, navigable
second brain. Root spec files remain as machine-read sources; the vault expands on
them. See [[ai-agent-guide]].

**Consequences.** Docs must now be maintained alongside code. The vault is the
canonical place to *understand* the project; root files stay canonical for *tooling*.

---

## ADR-0002 — All motion is spring-based (`@react-spring/web`)

- **Status:** Accepted (inherited from starter)
- **Date:** Project baseline

**Context.** Marketing sites need rich, interruptible, physically natural motion.
CSS transitions and keyframes are rigid; competing libraries add weight.

**Decision.** Use `@react-spring/web` for every animation. A custom component layer
(`src/components/animation/springs/`) wraps it. CSS transitions, CSS keyframes, and
`framer-motion` are **banned**.

**Consequences.** All animation goes through the [[animation-system]]. The springs
folder is `#do-not-modify`. Text animation is delegated to [[text-engine]].

---

## ADR-0003 — Routes delegate to Views

- **Status:** Accepted (inherited from starter)
- **Date:** Project baseline

**Context.** Mixing routing concerns with page UI makes `app/` files heavy and hard
to test.

**Decision.** `app/**/page.tsx` files only import and render a component from
`src/views/`. All layout/UI logic lives in the view. See [[routing]].

**Consequences.** Every route is a 3-line file. Views are the real page components.

---

## ADR-0004 — Tailwind v4 with CSS-based config

- **Status:** Accepted (inherited from starter)
- **Date:** Project baseline

**Context.** Tailwind v4 removes `tailwind.config.js` in favour of CSS-native config.

**Decision.** All theme tokens live in `globals.css` under `:root` and `@theme inline`.
No JS config file. Raw values in class names are banned. See [[design-system]].

**Consequences.** Design tokens are the only styling currency. New values must be
added to `globals.css` first.
