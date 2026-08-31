---
tags: [meta, changelog]
updated: 2026-08-31
---

# Changelog

Chronological log of notable changes to the project. Newest first.
This is a human-curated log — not a mirror of `git log`.

## 2026-08-31

- **Positioned as a credited editorial concept, ready to publish** — see
  [[decisions-log]] ADR-0017. The project now presents as *Stride, an editorial
  concept designed and built by Yatharth Madaan*, rather than as a real company
  built on somebody else's starter:
  - **Authorship** (`lib/site.ts`, `package.json`, `README.md`, `AGENTS.md`,
    `.claude/settings.json`, this vault): `siteConfig` gained `author`
    ("Yatharth Madaan"), `authorUrl`, `year` and `conceptNote`; `package.json` is
    `stride` `1.0.0` with `author`/`description`/`license`. The README was rewritten
    as a case study (the idea, a section-by-section table of the set pieces, stack,
    run/deploy, credits). Upstream starter framing and the `HOW_TO_USE.md`
    distribution wrapper are gone.
  - **Metadata** (`utils/seo/*`, `public/manifest.json`): JSON-LD switched from
    `Organization` + `WebSite` to **`Person` + `CreativeWork` + `WebSite`** — Stride
    is fictional, and `Organization` schema asserts a company that doesn't exist.
    Dropped `siteConfig.twitterHandle` and the Twitter `site`/`creator` fields (a
    made-up `@handle` points at someone else's account); the card still carries
    `card`/`title`/`description`/`images`. Manifest name/description now say
    "Editorial Concept". Deleted `public/browserconfig.xml` — nothing referenced it
    and its three `ms-icon-*.png` tiles were never in `public/`.
  - **Links** (`lib/site.ts`, `views/{site-nav,hero,showcase,product,about,works}.tsx`,
    `data/mocks/{home,product,contact}.ts`): a shared **`SiteLink`**
    (`{ label, href, external? }`) replaced the bare CTA/nav strings, so every
    clickable label carries its destination as content. The four nav items, the nav
    CTA, both hero CTAs and the showcase/product CTAs now point at real sections;
    the sections gained the ids (`#about`, `#approach`, `#work`, `#product` —
    `#contact` already existed). The two CTA `<button>`s with no handler became
    anchors. **No `href="#"` remains in `src/`.**
  - **Footer** (`views/site-footer.tsx`, `data/mocks/contact.ts`): `copyright` and
    `credit` were declared in `FooterContent` but **never rendered** — there is now a
    bottom bar carrying copyright, the authorship credit and the fictional-brand
    note. The invented address/phone/email and the three social links to bare
    platform homepages were replaced by a **Colophon** column (project + year, design
    & build, stack). `credit.href` comes from `siteConfig.authorUrl`, which ships
    empty and renders as plain text — an unset profile URL can never become a dead
    anchor. Sitemap column links now point at the real in-page sections. Dropped the
    unused `tagline` field. The bar carries a soft `from-footer/80` scrim and
    near-white text: it sits at the base of the mesh gradient, whose bottom-left
    corner goes near-white, where `text-footer-muted` was illegible.
  - **`yarn check:links`** (new `scripts/check-links.mjs`, plain Node + `assert`):
    builds, boots the production server, fetches `/`, and fails if any `href="#…"`
    has no matching `id`, if `Organization` schema reappears, or if the author credit
    is missing. Verified: 16 in-page anchors, all resolving.

## 2026-07-05

- **Metadata wired to the Stride brand** (`lib/site.ts`, `app/layout.tsx`,
  `utils/seo/structured-data.ts`, `public/manifest.json`, `public/browserconfig.xml`):
  replaced the starter placeholders with the real site content. `siteConfig` gained a
  `tagline` ("Modern banking for people and businesses") and now carries `name: "Stride"`,
  a fintech description, `twitterHandle: @stride`, `themeColor: #04070f` (the dark hero
  backdrop). The homepage `<title>` is `Stride — Modern banking for people and businesses`
  (layout override); the Organization JSON-LD gained `description` + `slogan`; the PWA
  manifest got a real name/short_name/description + `theme_color`/`background_color`/
  `display`/`start_url`; the MS tile colour matches. Also fixed a stray placeholder
  inconsistency — the footer used **Northwind** (actually a portfolio client) as the site
  owner in the copyright/credit/contact copy; changed those to **Stride** (`mocks/contact.ts`)
  so the visible text matches the metadata. `NEXT_PUBLIC_SITE_URL` is still
  `https://example.com` — must be set to the real domain before launch.

- **Tablet/mobile responsive pass + hydration fix**:
  - **Root font-size no longer balloons on small tablets** (`app/globals.css`): the mobile
    tier was `font-size: 4.444vw` (base 360), which kept scaling *up* across its whole 0–640
    range — by ~620px the root hit ~28px and every heading/stat/card overflowed, then snapped
    to ~10px at 641px. Replaced with `clamp(12px, 1.5625vw, 16px)`: a readable 12px floor,
    continuous with the 1024 tier at the 640 boundary, never ballooning. (The `AdaptiveGrid`
    JS still handles scale-**up** above 1440 via `GRID_BASE_WIDTH`; unchanged.)
  - **Hero title never breaks mid-word** (`views/hero-title.tsx`): letters were `inline-block`
    with no word grouping, so narrow viewports wrapped "into" as "i / nto". Now each word's
    letters sit in an `inline-block` wrapper with real breakable spaces between words (mirrors
    `<AnimatedHeading>`); the per-letter stagger index is precomputed in the memo. Also
    dropped the mobile hero title a step (`text-4xl` base) and **hid the insight body
    paragraph on mobile** (`views/hero.tsx`, `sm:block`) so the hero breathes.
  - **Showcase = cards on touch** (`views/showcase.tsx`): the hover-reveal columns showed
    blank on mobile/tablet (no hover). Now a 2-col grid of rounded cards with the photo
    **always visible** (dark scrim + white label) below `lg`; the full-height hover columns
    return at `lg`. The heading/CTA moved into normal flow above the cards on mobile, staying
    an absolute top-right overlay on `lg`.
  - **Works metadata row fits mobile** (`views/works.tsx`): `View project` is now
    `whitespace-nowrap` (one line), the grid gained horizontal `gap`, and the name truncates
    / shrinks below `sm`.
  - **Footer heading wraps to two lines** (`views/site-footer.tsx`): `max-w-[14ch]` forces
    "Have questions?" / "Let's talk." on mobile/tablet (unconstrained on `lg`); added
    `mt-16` above the link-column divider so it clears the CTA when the flex spacer collapses.
  - **Hydration mismatch fixed** (`views/works.tsx`): the 3D card-stack's `Math.sin/cos`
    transforms serialised differently in react-spring's SSR vs. client paths (full-precision
    + numeric opacity on the server, rounded + string on the client), tripping a hydration
    attribute mismatch. The values are numerically identical and react-spring overwrites them
    imperatively on mount, so the three animated leaves carry `suppressHydrationWarning`.
- **WebGL scenes render only while on-screen** (`lib/three/chain-scene.ts`,
  `lib/three/plasma-burst-scene.ts`): the hero burst + both chrome models each ran a
  continuous rAF loop even off-screen (the main scroll-jank cause). Loops are now gated on an
  `IntersectionObserver`, and the chain/heart shader is precompiled right after the GLB loads
  so it doesn't hitch on first view. See [[decisions-log]] ADR-0016.

## 2026-07-04

- **Hero intros fire earlier + the rest of the hero animates** (`components/common/preloader.tsx`,
  `views/hero.tsx`, `components/common/use-reveal-cascade.ts`): the preloader now flips the
  `done` flag **partway through its slide-up** (`DONE_AT = A + 0.6·(1−A)` — ~380ms sooner)
  instead of at the very end, so the hero intros start as the loader clears (no dead pause).
  The non-heading hero elements — the three stats, the insight title, the insight body, and
  the CTA row — now do a soft staggered reveal (opacity + blur(10px→0) + 20px rise) gated on
  the same flag. `useRevealCascade` gained an optional `{ startWhen }` — start on a boolean
  flag instead of the default IntersectionObserver (the hero is on-screen behind the loader,
  not scroll-triggered); existing scroll-triggered consumers are unchanged.

- **Hero intros wait for the preloader; 3D burst gets an intro** (`hooks/use-preloader.ts`,
  `components/common/preloader.tsx`, `views/hero-title.tsx`, `views/plasma-burst.tsx`,
  `lib/three/plasma-burst-scene.ts`): added a tiny Zustand `usePreloader` store (`done`
  flag). The Preloader flips it on completion; the hero title's per-letter cascade now
  early-returns until `done` (so it plays on the revealed page, not hidden behind the
  loader). The hero **plasma burst** gained an intro gated on the same flag — it stays
  hidden (`uAlpha` 0, group scaled down) until the loader finishes, then **fades in +
  scales up (0.45→1) + spins up** (a decaying `+3.2 rad/s` boost) over ~1.4s (easeOutCubic).
  Reduced motion shows the burst fully at once. Replaced the burst's old on-mount `appear`
  clock with this `started`-gated intro.

- **Soft card reveal in the Stats + Product bentos** (`views/stats.tsx`, `views/product.tsx`):
  the bento cards in the second section (Stats) and the pre-footer section (Product) now do
  a very soft staggered reveal on scroll — **opacity + blur (12px→0) + a gentle 24px rise**,
  `easeOutQuart`. Both previously used `<Inview>`, which snaps in this project (react-spring
  self-springs don't run — ADR-0015); they now drive the reveal off the shared ticker via
  the shared **`useRevealCascade`** hook (one `p` 0→1 on scroll-in, per-card stagger via
  `localProg`), each card an `animated.article`. Both views became client components; the
  old `RISE`/`SPRING` Inview constants were dropped.

- **First-load preloader** (`components/common/preloader.tsx`, mounted in `app/layout.tsx`;
  `--preloader-from`/`--preloader-to` tokens in `globals.css`): a white overlay (`z-[100]`)
  with the centred Stride logo, a thick pale→royal-blue gradient bar that fills left→right
  along the bottom, and a big counter (hero-heading scale — `text-5xl/6xl/8xl font-light`)
  that tracks the fill edge (sits just above the bar) and counts 0→100%. On completion the
  **same bottom bar scales up** (`scaleY` from its thin strip to full-screen) **while the
  whole overlay — logo, counter and bar together — slides up** to reveal the page, then the
  component unmounts. The bar is rendered last (on top), so as it grows it covers the
  counter and logo. All motion is one ticker-driven value `m` 0→1 (react-spring self-
  springs don't run here — ADR-0015); the counter text is written imperatively. Reduced
  motion isn't special-cased (it's a brief timed intro, not scroll-reactive). SSR-rendered
  so it covers the page from first paint.

- **About heading joins the per-letter reveal; chips scale in** (`views/about.tsx`,
  `components/common/use-reveal-cascade.ts`): the About statement headline previously used
  a whole-block `<Inview>` reveal (its inline icon chips + dual colour blocked the string-
  only `<AnimatedHeading>`). Extracted the shared cascade timing into a **`useRevealCascade`**
  hook (react-spring `p` 0→1 driven from the shared ticker on scroll-in; `<AnimatedHeading>`
  now uses it too) and hand-assembled the About h2 on one staggered timeline: the text
  animates letter-by-letter (rise + blur + fade) exactly like the other headings, and each
  round icon chip **scales up** (`0.3→1`) out of a blur + fade. The `<h2>` keeps the full
  `aria-label`; letters/chips are `aria-hidden`. About became a client leaf.

- **Per-letter heading reveal rolled out to h1/h2** (`components/common/animated-heading.tsx`
  + `views/{showcase,product,works,contact-form,site-footer,chain}.tsx`): generalised the
  hero title's letter cascade into a reusable `<AnimatedHeading>` — same ticker-driven
  per-letter rise + blur + fade (ADR-0015 mechanism), but triggered when the heading
  **scrolls into view** (IntersectionObserver) rather than on mount. Words stay unbreakable
  (letters are inline-block inside inline-block words) so headings still wrap; the tag keeps
  the full `aria-label` with `aria-hidden` letters; reduced motion renders static. Applied
  to the Showcase / Product / Works / Contact / Footer h2s; the Chain h2 keeps its
  white→muted gradient via an `alpha` per-letter opacity ramp (its `bg-clip-text` gradient
  was dropped, since it can't survive per-letter transforms). **Excluded:** headings
  containing digits (a built-in guard — per request; none currently qualify, the stat
  numbers aren't headings) and the **About** h2 (inline icon chips + dual colour make a
  clean per-letter split impractical — it keeps its existing `<Inview>` block reveal). (`views/hero-title.tsx`, `views/hero.tsx`):
  the display heading now reveals letter-by-letter on load — each letter rises from just
  below, fading up out of a soft blur, in a smooth left-to-right `easeOutQuart` cascade.
  The old per-line inverted gradient is preserved as a per-letter target-opacity ramp; the
  `<h1>` keeps its full `aria-label` (letters `aria-hidden`); reduced motion jumps to the
  revealed state. **Notable:** this had to bypass `spring-text-engine` — that engine
  (`0.1.5`, latest) doesn't animate under `@react-spring/web@10` (snaps to end on mount),
  and react-spring's own self-running springs don't progress in this project either. The
  only mechanism that animates here is driving a spring value each frame from the shared
  ticker (as hero/works/chain do), so the letters use that. Full diagnosis + the scoped
  exception to the "text uses spring-text-engine" rule: [[decisions-log]] ADR-0015; warning
  added to [[text-engine]].

- **Site-wide: blue text → black; unified button style** (`views/hero`, `about`,
  `showcase`, `product`, `contact-form`, `site-footer`, `works`): recoloured every
  `text-plum` (deep navy/purple that reads blue) to `text-black` — about/showcase/contact
  headings, showcase labels, product & showcase section defaults, contact status, and the
  hero primary button's label (the **header** is deliberately left on `text-plum`).
  Standardised all buttons (except the header pill) to the hero spec —
  `rounded-full px-6 py-3 text-sm font-medium`, normal case: the contact **Send** button
  lost `px-20 py-4`/`uppercase`/`font-semibold` and is now a black pill; the Works "View
  project" lost `text-xs uppercase tracking-widest`/`px-4 py-2`; product `px-7`→`px-6`.
  Outline buttons stay outline (showcase, footer CTA, Works) but adopt the same size/text.
  Removed the decorative arrows (footer CTA `→`, Works `↳`). New convention documented in
  [[design-system]] (Buttons).

- **Footer link grouping + heart raised** (`views/site-footer.tsx`, `views/footer-scene.tsx`):
  the link nav went from an even 4-col grid to two `justify-between` groups — LINKS +
  SITEMAP hug the left (SITEMAP close to LINKS), CONTACT + FOLLOW US sit at the right so
  FOLLOW US's right gutter matches LINKS's left (48px both, symmetric to the page edges).
  Heart settle nudged back `.53` → `.5` (centred; its pointed tip falls in the empty gap
  between the two link groups, no text overlap).

- **Portfolio heading + caption** (`views/works.tsx`): moved the "Our Portfolio" heading
  down (`top-10` → `top-24`) so the fixed header no longer overlaps it. In the caption
  row (now a `grid-cols-[1fr_auto_1fr]`), the case name is centred and restyled to match
  the product card text ("Fully hands-off" → `text-2xl leading-snug tracking-tight`,
  dropping `font-medium`); the year was removed (span + `yearElRef` + its ticker update
  deleted; `WorkItem.year` stays in data).

- **Footer → full-height, centred, heart in the middle** (`views/site-footer.tsx`): the
  footer is now a full-viewport column (`min-h-lvh flex flex-col`). Removed the brand-mark
  (`N`) + tagline row; the "Have questions?" heading and its jump-to-form CTA are centred
  at the top (`items-center text-center`). A `flex-1` spacer opens the centre so the
  `FooterScene` chrome heart settles at the footer's vertical middle, and the link columns
  + bottom bar are pushed to the base (nav gained a `border-t` divider). Dropped the now
  unused `tagline` from the destructure (the `FooterContent.tagline` field stays in data).
  - **Follow-up:** removed the bottom bar (copyright + credit; those fields stay in data)
    so the link columns sit at the very base. Footer gutters retuned to the **hero**
    scale (`px-6 md:px-10 lg:px-12`) with a matching bottom pad (`pb-6 md:pb-10 lg:pb-12`),
    and the nav's top divider is now full-bleed (`-mx-6 … lg:-mx-12` + re-inset `px`) so the
    line runs edge-to-edge. Nudged the heart's settle from `.5` → `.53` (the ±9 fall range
    is ~280px/0.1, so this is a small drop that stays clear of the links).

- **Product header centred; contact heading + inputs restyled** (`views/product.tsx`,
  `views/contact-form.tsx`): the Product block dropped its right-hand lead paragraph and
  now centres the heading + CTA (`flex flex-col items-center text-center`). The contact
  form's intro heading lost its `uppercase`/bold `text-lg` treatment for the card text
  style (`text-2xl leading-snug tracking-tight`, weight 400), centred; and the form
  fields were recoloured black (input text `text-black`, underline `border-black/25`,
  status dot `bg-black`).

- **Product bento recolour** (`views/product.tsx`, `public/assets/images/6th.png`): the
  wide "Capital that compounds" card swapped its `bg-lilac` fill (+ plum gradient) for a
  full-bleed `6th.png` photo via **next/image** (`fill`/`object-cover`) with black text.
  The two dark-purple cards ("Always liquid…", "Fully hands-off") are now light grey
  (`bg-card-gray` = #EDEDF0) with black text. The block heading ("What is Northwind?") and
  its "Explore now" CTA were recoloured black (`text-black` / `bg-black`).

- **Hero plasma — filaments magnetise to the cursor** (`lib/three/plasma-burst-scene.ts`,
  `views/plasma-burst.tsx`): the burst's filament tips now lean toward the pointer. The
  leaf tracks the pointer (window `pointermove`, NDC relative to the canvas rect, `active`
  = over the hero) and feeds a `pointer()` getter to the scene. The line **vertex shader**
  gained `uPointer`/`uMagnet`/`uTanHalfFov`/`uAspect`: it transforms each vertex to view
  space, reconstructs the cursor's view-space xy at that depth, and `mix`es the vertex
  toward it by `uMagnet · aAlong²` — base anchored at the core, tips pulled most, applied
  post-modelView so the lean tracks the cursor on screen regardless of the turntable spin.
  Strength (0.38) and the pointer position both ease in/out per frame for a smooth
  attract/release; disabled under reduced-motion (static frame, no pointer). Verified in
  preview — filaments lean left vs right as the cursor crosses the hero.
  - **Proximity gating** (follow-up): only filaments whose tips are near the cursor cling,
    not the whole burst. Added `uMagnetRadius` (0.9 view units) and a Gaussian falloff
    `prox = exp(−dist²/radius²)` on the view-space tip↔cursor distance, folded into the
    pull (`uMagnet · aAlong² · prox`). Far filaments (prox→0) stay put; a local cluster
    reaches toward the pointer.

- **Smooth scroll made perceptible + properly integrated** (`layouts/scroll-layout.tsx`,
  `app/globals.css`): the Lenis integration existed but was subtle and missing its
  integration CSS. Added Lenis's official CSS (`html.lenis`, `.lenis.lenis-smooth`, …) so
  the `lenis-smooth` class engages and native `scroll-behavior` can't fight the
  interpolation; lowered the glide `lerp` to `0.08` (from the `0.1` default) for a longer,
  clearly-felt smooth scroll; and gated `smoothWheel` behind `prefers-reduced-motion`.
  Verified by sampling the wheel-scroll interpolation (eases out over ~14 frames) — every
  scroll-driven effect rides the same smoothed scroll. See [[smooth-scroll]].

- **Portfolio cards fly continuously; central card un-dimmed** (`views/works.tsx`): the
  scroll→index map now runs a *small* amount past each end
  (`p·(count−1 + 2·OVERSCAN) − OVERSCAN`, `OVERSCAN = 0.2`). A first attempt used a full
  card past each end (`−1 → count`), but that left a dead lead-in (first card a whole
  step below centre with empty space above) and an early exit (last card a whole step
  gone before you leave the block). The 0.2 fraction keeps the end cards essentially
  centred with only a hint of motion — no gap on entry, the last card doesn't leave
  early, and neither freezes perfectly still. The per-card black scrim is now distance-scaled
  (`opacity = min(0.35, |i − f|·0.22)`), so the **focused/central card is fully clear**
  and only the receding neighbours dim.

- **Chain spin — softened scroll acceleration** (`views/chain.tsx`): dialled the chain's
  scroll→spin coupling down in steps to a calm `spinAccel 0.00004 / maxSpin 0.045` (from
  `0.0004 / 0.5`, via `0.0002 / 0.3` and `0.00008 / 0.11`) — scrolling now nudges the turn
  only slightly above idle instead of whipping it around. Note: the intermediate
  reductions *looked* ineffective because the chain's `useEffect([])` scene wasn't
  re-mounting on Fast Refresh (stale scene kept the old value); a clean `.next` restart
  applied it. Verified with a scroll-burst A/B — consecutive frames now show only a small
  rotation delta vs a large swing before.

- **Chain scene — tunable scroll→spin coupling; stronger chain acceleration**
  (`lib/three/chain-scene.ts`, `views/chain.tsx`): `createChainScene` gained optional
  `spinAccel` (rad added to the spin per px of scroll) and `maxSpin` (rad/frame cap)
  overrides, both defaulting to the existing `SCROLL_ACCEL`/`MAX_SPIN` so the footer
  heart is unchanged. The chain passes a much stronger `spinAccel: 0.0004` / `maxSpin:
  0.5` so its rotation visibly accelerates while scrolling and eases back to idle. Note:
  the previous turn's scroll-spin + slow-drift changes weren't taking effect live — the
  chain's `useEffect([])` scene setup wasn't re-running under Fast Refresh; a clean
  `.next` restart applied them (drift + spin verified fresh).

- **Chain block — hero-scale aside, opaque tagline, eased + scroll-spun model**
  (`views/chain.tsx`): the bottom-right aside ("when it matters most") now uses the
  hero display scale (`text-8xl`, was `text-[4rem]`); it keeps its muted `text-white/40`.
  The bottom-left tagline lost its opacity (`text-white/60` → `text-white`). **Model
  feel:** the fall target is now low-passed (`fall += (target − fall)·0.12`) so it eases
  toward the scroll position instead of tracking it 1:1 — fixes the rigid "втыкается
  колом" feel and smooths the phase change. Switched the chain to scroll-momentum spin
  (`scrollSpin: true`, was `false`) so scrolling accelerates the model's turn and eases
  back to idle. The shared ticker runs every frame (framerate 0), so the eased value
  keeps converging after scroll stops.

- **Chain block — hero-scale heading, balanced padding, model slow-drift exit**
  (`views/chain.tsx`): the section heading now uses the hero's display scale
  (`text-5xl sm:text-6xl lg:text-8xl`, was `2rem/2.5rem/4rem`). The overlay's bottom
  padding was split out to match the horizontal gutter (`px-6 pb-6 pt-5 md:px-10
  md:pb-10 lg:px-12 lg:pb-12`, matching the hero overlay) so the gap below the content
  equals the side insets. **Model motion reworked:** it no longer counter-scrolls to
  hold dead-centre through the pin and then drop abruptly. Travel is now driven off the
  layered **wrapper's** scroll (the pinned section's `rect.top` is frozen at 0) in two
  continuous phases — fly-in (`wrap.top` vh→0: top edge → centre) then a slow drift
  (`wrap.top` 0→−pinDist: centre → out the bottom, `pinDist ≈ Product height`). The
  drift is far slower than the fly-in, so the chain gently keeps falling as the Product
  slides up over it instead of stopping. Removed the `CENTER_TRACK` constant.

- **Stats block — photos, avatar circles, blue data card, heading-scale numbers**
  (`views/stats.tsx`, `views/about.tsx`, `public/assets/images/2nd/`): the collaboration
  card now shows a `people.png` photo full-bleed (next/image `fill`/`object-cover`) under
  its existing gradient + white number box. The commitment card's avatar stack swapped
  flat colour discs for real avatar photos (`avatars/1–4.png`) in `overflow-hidden
  rounded-full` circles. The green data card (`bg-accent-lime`) is now blue (`bg-card-blue`,
  white text). All four card figures now use a shared `STAT_NUM` class matching the block
  heading's display scale (`text-[2rem]/sm:2.5rem/lg:4rem font-light`) instead of the old
  `text-5xl/7xl`. The About lead heading was narrowed (`max-w-7xl` → `max-w-4xl`) so it
  wraps to three lines.

- **Showcase columns reveal real photos through the mask, with a scaling white scrim**
  (`views/showcase.tsx`, `data/mocks/home.ts`, `public/assets/images/3rd/`): the third
  section's four columns now reveal a real photo (`approach.png`, `technology.jpg`,
  `security.jpg`, `team.jpg`, served via **next/image** `fill`/`object-cover`/`sizes`)
  instead of the flat gradients. The existing hover `clip-path` mask (`inset(100%…)` →
  `inset(0%…)`) now wipes the image in bottom-to-top. Behind the caption a white
  semi-transparent gradient (`bg-gradient-to-t from-white via-white/80 to-transparent`,
  `h-1/2`, `origin-bottom`) scales in on hover (`scaleY(0)` → `scaleY(1)`) so the dark
  `text-plum` label keeps good contrast over the photo. Both are `<Hover>` springs
  (ADR-0002) driven off the column ref; the heading + outline CTA overlay is unchanged.
  `ShowcaseItem` gained an `image` field; dropped the `GRADIENTS` array.

## 2026-07-03

- **Portfolio — blurred image backdrop that drifts up on scroll** (`views/works.tsx`):
  replaced the flat `bg-card-dark` behind the card stack with a layer of the six
  portfolio photos (blurred `blur-2xl`, small `sizes="60vw"`/`quality=30`), each
  cross-fading by proximity to the focused index (`opacity = 1 − |i − f|`) and drifting
  bottom-to-top (`translateY((i − f)·22%) scale(1.6)`) off the same spring `f` the cards
  use — so the backdrop always matches the focused card and floats with scroll. A
  `bg-card-dark/55` scrim keeps the cards + caption dominant. Decorative (`alt=""`),
  behind everything (first child, cards/caption keep their z-index).

- **Portfolio cards use real photos** (`views/works.tsx`, `data/mocks/home.ts`,
  `public/assets/images/portfolio/`): replaced the placeholder gradient card fills with
  the six portfolio images (`1.jpg`–`6.jpg`) served via **next/image** (`fill`,
  `object-cover`, `sizes`), each with `alt` = the project name. Added a subtle
  `bg-black/25` scrim over each so the centred white caption stays legible. `WorkItem`
  gained an `image` field; dropped the `GRADIENTS` array.

- **Works cards no longer collide; Showcase heading padding balanced**
  (`views/works.tsx`, `views/showcase.tsx`): the portfolio card stack's cylinder
  `RADIUS` went 1020 → 1350px, so the vertical spacing between adjacent cards
  (`RADIUS·sin(STEP)`) is ~730px — well clear of the ~460px card height, fixing the
  cards crashing into each other (worst at mid-transition). The Showcase heading was
  hugging the centre grid line (0px) with 48px on the right; it now sits in the right
  half inset **equally** (`lg:left-1/2 lg:right-0 lg:px-12` → 48px from the centre line
  and 48px from the right edge), verified 48/48.

- **Hero heading — per-line alternating gradient** (`views/hero.tsx`,
  `data/mocks/home.ts`): the `h1` was one `bg-clip-text` gradient spanning both lines;
  now each line is its own gradient span with the fade direction **alternating**
  (line 1 `bg-gradient-to-r` white→muted, line 2 `bg-gradient-to-l` muted→white) to
  match the Figma. Content changed `title: string` → `titleLines: string[]`
  (`["Turn balance into", "momentum"]`); the `h1` carries `aria-label` = the joined
  lines so its accessible name stays intact. Also bumped the gap from the insight
  copy to the CTAs again (`mt-10 → mt-16`).

- **Header + hero polish** (`views/site-nav.tsx`, `views/hero.tsx`): split the header
  into a **separate brand pill and links pill** (were one plaque) and gave the brand
  pill, links pill, and "request a demo" button a shared explicit height (`h-11`) so
  all three are exactly equal (items-center, no reliance on stretch). Hero overlay:
  **bottom padding now equals the side padding** (`pb-6 md:pb-10 lg:pb-12` matching
  `px-*`, was a flat `py-5`); stat labels ("User Reviews" etc.) and the vertical
  dividers are now **full opacity** (`text-white`/`border-white`, were `/60` and `/20`);
  and the gap from the insight title+paragraph to the CTAs grew (`mt-6 → mt-10`).

- **Nav → single fixed site header** (`views/site-nav.tsx`, `views/home.tsx`,
  `views/hero.tsx`, `views/chain.tsx`, `data/mocks/home.ts`): `SiteNav` is now
  `position: fixed` at the top of the viewport with **symmetric insets** (top = sides:
  `inset-x-4 top-4 md:inset-x-6 md:top-6`) and the "request a demo" button stretched to
  the left pill's height (`items-stretch` on the header + `inline-flex items-center` on
  the button). It's rendered **once** in `home.tsx` (as a sibling before `<main>`, so
  it's a real banner landmark and sits outside the hero's transformed overlay — a
  `fixed` child of a `transform`ed ancestor would be positioned wrong). Removed the two
  inline copies (hero overlay + chain overlay — the latter was the duplicate to kill).
  Content model: `HomeContent.nav: SiteNavContent` (shared `siteNav`); `HeroContent`
  dropped `brand`/`nav`, `ChainContent` dropped `nav`; hero/chain headings gained
  `mt-24` to clear the fixed header. The pill's dark backdrop keeps the nav legible over
  light sections; the white button carries a `shadow-sm` for definition there.

- **Section headings scaled down 1.5×** (`views/about.tsx`, `works.tsx`, `product.tsx`,
  `site-footer.tsx`, `chain.tsx`, `showcase.tsx`): every non-hero display heading had
  its size ramp divided by 1.5 — `text-5xl/sm:text-6xl/lg:text-8xl`
  (3/3.75/6rem) → `text-[2rem]/sm:text-[2.5rem]/lg:text-[4rem]`; the showcase ramp
  (…`lg:text-7xl` = 4.5rem) → `lg:text-[3rem]`; the chain "when it matters most" aside
  `text-8xl` → `text-[4rem]`. The hero `h1` is unchanged, so the sections now read a
  step below it. (These headings share the same type — a candidate for a shared
  `<DisplayHeading>` component per [[design-system]] ADR-0012.)

- **Showcase — heading + outline CTA over the interactive columns** (`views/showcase.tsx`,
  `data/mocks/home.ts`): kept the hover-reveal gradient columns (`<Hover>` clip-path,
  ADR-0002) and *added* the reference elements over them — a display heading + outline
  CTA top-right (`pointer-events-none` wrapper so column hover still works; the button
  re-enables its own), the thin vertical column lines (`divide-x divide-plum/10`), and
  de-capitalised base labels (`text-plum`, no `uppercase`). `ShowcaseContent` gained
  `heading` + `cta`, dropped `label`. New sentence-case copy: heading "Thoughtful
  engineering behind every detail", CTA "Explore the platform".

- **WebGL scenes release their context on dispose** (`lib/three/chain-scene.ts`,
  `gradient-background-scene.ts`, `plasma-burst-scene.ts`): added
  `renderer.forceContextLoss()` after `renderer.dispose()`. On dev remounts
  (StrictMode double-invoke / HMR) the effect re-ran and `new WebGLRenderer({canvas})`
  failed with "Canvas has an existing context", silently killing the scene — which is
  why the footer chrome heart (and other models) intermittently vanished. Releasing the
  context lets a remount attach a fresh renderer to the same canvas.

- **Chain section — Figma UI overlay + shared `<SiteNav>`** (new `views/site-nav.tsx`,
  `views/chain.tsx`, `views/hero.tsx`, `data/mocks/home.ts`, `views/home.tsx`):
  brought the chain section's UI over from Figma (node 459:623) — the marketing nav,
  a "Financial momentum" `h2` (top-left, hero gradient type), a bottom-left paragraph,
  and an oversized muted "when it matters most" phrase (bottom-right, `lg:` only). The
  overlay sits over the chrome-model canvases (z-10) and gets covered by the Product
  as it slides up (unchanged two-layer reveal); the model animation is untouched.
  Extracted the nav (previously inline in the hero) into a reusable **`<SiteNav>`**
  (`{brand, items, cta, navLabel}`) used by both hero and chain, per [[design-system]]
  ADR-0012. `ChainProps` is now `{ content: ChainContent }` (heading/tagline/aside/nav,
  replacing the old `label`); the nav content is a shared `siteNav` object in the mock.

- **Product texts restyled; footer wordmark removed + heading to 2 lines**
  (`views/product.tsx`, `views/site-footer.tsx`, `data/mocks/contact.ts`): the product
  lead ("Northwind is a smart…") and the three card titles ("Capital that…", "Always
  liquid…", "Fully hands-off") now use the stats quote style
  `text-2xl leading-snug tracking-tight` (regular weight, was `text-3xl font-medium` /
  `text-2xl font-medium`); colours unchanged. Removed the oversized "Northwind"
  wordmark from the footer (dropped the `wordmark` field from `FooterContent` + mock)
  and widened the heading column (`lg:grid-cols-2 → lg:grid-cols-[1fr_1.8fr]`, dropped
  `max-w-md`) so "Have questions? Let's talk." lands on **2 lines**. Footer file
  comment refreshed (blue gradient + chrome heart, no wordmark).

- **Stats numbers/paragraphs matched to the hero type** (`views/stats.tsx`): the four
  stat values (120+, 99.99%, 520k+, 60+) now use the hero stat-number style
  `text-5xl font-light leading-none sm:text-7xl` (were `text-6xl/7xl font-medium`), and
  the collab desc / commitment eyebrow / data desc use the hero paragraph style
  `text-base leading-relaxed` (were `text-sm`/`text-lg`). Text colours unchanged.

- **About heading widened + contrast fix; stats cards blackened; Works → "Our
  Portfolio"** (`views/about.tsx`, `views/stats.tsx`, `views/works.tsx`,
  `data/mocks/home.ts`): widened the About statement heading (`max-w-5xl → max-w-7xl`)
  so it wraps to **3 lines**, and recoloured it `text-foreground → text-plum` (the
  eyebrow dot too) — `--foreground` flips light under dark scheme, so it read as
  low-contrast grey on the white section; `--plum` is stable. Stats bento cards now use
  **`text-black`** everywhere (blue/grey/lime cards) except the dark reach card, which
  keeps `text-white` — replacing the flip-prone `text-foreground`. Renamed the Works
  heading **"Our Works" → "Our Portfolio"**, now rendered from props (was a hardcoded
  `Our<br/>Works`), **centred** and on a **single line**.

- **Section headings unified to the hero display type** (`views/about.tsx`,
  `views/works.tsx`, `views/product.tsx`, `views/site-footer.tsx`): the About
  ("A fintech platform…"), Our Works, What is Northwind?, and footer "Have questions?"
  `h2`s now use the hero heading's size/weight/line-height —
  `text-5xl font-light leading-[0.95] tracking-tight sm:text-6xl lg:text-8xl` (were a
  mix of `font-medium`/`font-semibold`, `text-5xl/6xl/7xl`, `leading-[0.9]`/`1.08`/
  `tight`). Consistent display-heading look across the page. (Could be extracted to a
  shared heading component later per [[design-system]] ADR-0012.)

- **Hero — UI overlay scales with the shrink; style pass** (`views/hero.tsx`): the UI
  overlay (nav / heading / stats / insight) is now an `animated.div` that scales down
  with the scroll shrink (`transform: scale(1 − p·0.1)`, transform-origin centre) so it
  recedes *with* the collapsing card instead of drifting toward the card edge as the
  `clip-path` insets. The burst keeps its own zoom (`progressRef`), untouched. Also
  widened the insight block `max-w-md → max-w-lg` (~499px design). Paddings/type
  reviewed against the mockup.

- **Grid recalibrated to the 1440 Figma base; hero sized to the mockup; dev panels
  hidden** (`components/common/grid/grid.config.ts`, `globals.css`, `views/hero.tsx`,
  `views/plasma-burst.tsx`, `views/chain.tsx`): the layout read ~25% smaller than the
  Figma because the scaling grid's base was **1920** while the design is **1440**.
  Dropped the `{1920,1920}` breakpoint (and its `globals.css` `vw` media query) so
  **1440 is the base** — root font-size is 16px at 1440 (design 1:1) and, with the
  earlier `coef={1}`, scales up proportionally above it (2560px → `28.44px`, was
  `19.56px`). Bumped hero elements to match the mockup (stats `text-5xl`→`text-7xl`
  ~72px, insight lead `text-xl`→`text-2xl`). Hid the dev scene-tuning panels
  (`plasma-controls`, `chain-controls`) behind a `SHOW_CONTROLS = false` flag (was
  gated on `NODE_ENV`) — flip to re-enable while tuning. See [[components/common]].

- **Adaptive grid — full-proportional scale-up on large monitors** (`app/layout.tsx`):
  mount `AdaptiveGrid` with `coef={1}` (was the hook default `0.6666`). Above the base
  width (1920) the root font-size now tracks the viewport **1:1** — e.g. a 2560px
  display gets a `21.33px` root (fully proportional) instead of the damped `19.56px`,
  so the rem-based layout grows to fill big screens instead of looking small. Down-
  scaling (`vw` media queries below 1920) is unchanged; the hook still clears its inline
  font-size at/below the base width. See [[components/common]] / [[hooks]].

- **Hero — Figma UI overlay + font swap to Mulish** (`views/hero.tsx`,
  `data/mocks/home.ts`, `views/home.tsx`, `app/layout.tsx`, `globals.css`,
  new `app/fonts/`): rebuilt the hero from the Figma design — the live `PlasmaBurst`
  now sits under a full marketing overlay: a pill nav (brand + links) with a
  "request a demo", the display `h1` "Turn balance into momentum" (white→muted
  `bg-clip-text` gradient), a lower-right insight block with CTAs, and a bottom-left
  stats row. Overlay lives inside the hero's `clip-path` card so it shrinks on scroll
  with the burst. `HeroContent` (exported from `hero.tsx`) replaced the old 3-field
  hero content; all copy is props (`data/mocks/home.ts`). **Swapped the site font
  Onest → Mulish**: `next/font/google` → `next/font/local` (`Mulish-Light/Regular/
  Medium.ttf` in `src/app/fonts/`, weights 300/400/500), variable `--font-mulish`;
  `globals.css` applies it on `<body>` and rebinds `--font-sans`. See
  [[design-system]] (only ≤500 ships — 600/700 synthesise).

- **Chain counter-scrolls to stay screen-centred (top-edge fly-in) + constant linear
  spin; footer heart flies in with parallax + reversed spin**
  (`lib/three/chain-scene.ts`, `views/chain.tsx`, `views/footer-scene.tsx`): added
  `spinDirection` (+1/−1) and `scrollSpin` (true default / false) options to
  `createChainScene`. The **chain** model's progress is driven off the section's live
  `getBoundingClientRect().top` as `0.5 − top/(CENTER_TRACK·vh)` (`CENTER_TRACK ≈ 3` =
  the model's fall range ÷ its on-screen range), so it **counter-scrolls** the section
  and stays locked to the screen centre while the block covers the centre: it flies in
  **linearly from the block's top edge**, holds dead-centre through the whole pin
  (section top = 0 the entire pinned range → progress .5), and exits the bottom edge.
  Its spin is **constant and linear** (`scrollSpin: false`) — a steady rate, not
  scroll-accelerated. (Superseded several same-day attempts: fall-out, fly-in-and-hold,
  a full linear descent, and a plain constant-centre — the user wanted a top-edge
  fly-in that stays centred.) The **footer heart** keeps its **parallax fly-in**
  (progress tied to the footer's scroll position, settling at centre) with
  scroll-momentum spin the **opposite way** (`spinDirection: -1`).
  `createChainScene`'s header/ADR note updated (general chrome-model scene, spin
  configurable).

- **Footer — blue mesh-gradient backdrop + centred chrome heart** (new
  `views/footer-scene.tsx`, `views/site-footer.tsx`, `globals.css`,
  `public/assets/heart.glb`): the footer's flat sage panel became the hero "mesh
  gradient" (same blue palette, a new `seed` 7.2 → different blob pattern) with a
  **chrome heart** centred over it. The heart reuses the chain's scene factory
  (`createChainScene` held at centre via a constant `progress: () => 0.5`, so it
  inherits the exact `defaultChainMaterial` chrome + idle spin) — no new model
  factory. `FooterScene` is a decorative client leaf (two stacked canvases,
  `aria-hidden`) behind the footer content (now wrapped `relative z-10`). Retuned the
  footer tokens for blue: `--footer` → dark-navy WebGL fallback, `--footer-muted` →
  cool grey; dropped `--footer-mark` (wordmark now `text-footer-fg/15`). Six live
  WebGL contexts total (hero ×2, chain ×2, footer ×2) — all verified un-lost.

- **Contact form + site footer (second pinned two-layer reveal)** (new
  `views/contact-form.tsx`, `views/site-footer.tsx`, `data/mocks/contact.ts`;
  `views/home.tsx`, `globals.css`): added a contact block and a footer below the
  product. The **contact form** is a client leaf — a bold uppercase prompt, three
  underlined fields (name + phone on a row, email below, each with a status dot) and
  a centred pill submit (local submit stub, no backend yet). The **footer** is a
  semantic `<footer>` (sage panel): brand mark + tagline, a "questions?" heading with
  a jump-to-form link, `<nav>` link columns, an `<address>` block, an oversized
  decorative wordmark, and a copyright/credit bar. They reuse the **pinned two-layer
  reveal**: the form is `sticky top-0 z-10 h-lvh`, the footer `relative z-20` (opaque
  `bg-footer`) slides up over it — wrapped in a second `relative` div in `home.tsx`
  (which also gained `id="top"` for "Back to top"). New sage footer tokens
  `--footer` / `--footer-fg` / `--footer-muted` / `--footer-mark` (see
  [[design-system]]). Form inked with `--plum` (not `--foreground`, which flips in
  dark scheme).

- **Chain model — chrome-material dev tuning panel** (`lib/three/chain-scene.ts`,
  `views/chain.tsx`, new `views/chain-controls.tsx`): made the model's chrome
  material config-driven, mirroring the hero's Plasma pattern (ADR-0014). New
  `ChainMaterialConfig` + `defaultChainMaterial` exports and a live `update(material)`
  on the scene handle; the `Chain` leaf holds the config in state and pushes edits.
  A **development-only** panel (`chain-controls.tsx`, gated on `NODE_ENV`, pinned
  top-left to clear the Plasma panel) exposes **tint, metalness, roughness,
  reflection (`envMapIntensity`) and exposure** as a colour picker + sliders with a
  copy-out JSON export. Tuned `defaultChainMaterial` is what ships in prod.

- **Chain section — pinned two-layer reveal + tuned chrome default**
  (`views/chain.tsx`, `views/product.tsx`, `views/home.tsx`, `lib/three/chain-scene.ts`):
  - Reworked the chain→product transition into a **two-layer parallax**: the chain is
    now `sticky top-0 z-10 h-lvh` inside a `relative` wrapper (`home.tsx`) that also
    holds the product, so the chain **pins** while the **product** (`z-20`, opaque
    `bg-hero-page` again) **scrolls up over it** and reads as sliding out from under the
    model — two layers at different scroll heights. (Iterates the earlier same-day
    un-pinned/transparent attempt, which gave no relative motion between the layers.)
  - The model motion is driven off `scrollY` + the section's absolute `offsetTop`
    (unaffected by sticky): `enter` 0→0.5 as it rises to pin, `pinned` 0.5→1 over the
    first `FALL_VH` viewports so the model flies in, sits centred at the pin, then
    falls out as the product covers it. The hero-style `clip-path` shrink was dropped
    (it doesn't fit a pinned layer); the `MAX_SPIN` spin clamp is retained.
  - Applied a tuned **`defaultChainMaterial`** — periwinkle tint `#a5ade3`,
    roughness `0.1`, `envMapIntensity` `2.8`, tone-mapping exposure `0.2` (darker,
    higher-contrast chrome). Dialled in via the dev panel and copied out.

## 2026-07-02

- **Chain section — fall-through + hero-style shrink; new explainer bento**
  (`views/chain.tsx`, `lib/three/chain-scene.ts`, `views/product.tsx`):
  - The chrome model now **falls through** the section on scroll (top edge →
    centre → out the bottom, `progress` 0..1) instead of stopping centred, and its
    scroll-spin is **clamped** (`MAX_SPIN`) so fast scrolls can't spin it wildly.
  - The chain block now **shrinks into a rounded inset card like the hero** as it
    scrolls (an animated `clip-path` inset+radius over the pinned range, revealing a
    white margin) — the model keeps falling while it shrinks.
  - Added a **product explainer bento** below it (`views/product.tsx`,
    `data/mocks/product.ts`): a heading + CTA and right-aligned lead, then a wide
    light card and two dark purple cards (original copy). New purple tokens
    `--plum` / `--lilac` / `--paper`. See [[design-system]].

- **Motion tuning** — slowed the chain model's scroll-driven spin (`SCROLL_ACCEL`
  0.00022 → 0.00009 in `lib/three/chain-scene.ts`) and roughly halved the hero logo
  marquee row speeds (`0.012`/`0.009` → `0.005`/`0.0038` in
  `views/logo-marquee.tsx`) — both felt too fast on scroll.

## 2026-07-01

- **Home — chrome GLB section** (`src/views/chain.tsx` + `lib/three/chain-scene.ts`):
  a pinned section where a **chrome-material GLB model** (`public/assets/chain.glb`)
  **flies in from the block's top edge** as the section scrolls into view (`entry`
  0→1, smoothstepped), then stays **centred** and **spins from scroll** — scrolling
  injects angular momentum (turns at scroll speed) and it keeps turning when idle
  (momentum eases toward a gentle constant) — over the same hero "mesh gradient" but
  with a **different blob pattern** (new `seed` uniform on
  `gradient-background-scene`). (Evolved from a top-to-bottom fall → centred
  scroll-spin → top-edge fly-in + centred spin, per successive requests.) Chrome = `MeshStandardMaterial` (metal, low
  roughness) reflecting a **PMREM `RoomEnvironment`**. The GLB is Draco-compressed,
  so a `DRACOLoader` is wired up with three's decoder copied to `public/draco/`
  (ESLint now ignores `public/**`). Two stacked WebGL layers (opaque gradient +
  transparent model), progress fed from scroll via the shared ticker. No new npm
  deps — `GLTFLoader`/`DRACOLoader`/`RoomEnvironment`/`PMREMGenerator` are all from
  `three/examples/jsm`. See [[tech-stack]] and [[decisions-log]] ADR-0014.

- **Home — "Our Works" scroll-driven 3D card stack** (`src/views/works.tsx`): a
  pinned (sticky) section over a tall scroll region; scroll progress advances a
  float index `f` and each **large, landscape** card is placed on a vertical
  **cylinder** from it (`translateY = R·sin θ`, `translateZ = R·cos θ − R`,
  `rotateX = θ`), so cards travel **bottom-to-top**, curving away top and bottom
  without self-intersecting. Depth sorting is left to `transform-style: preserve-3d`
  (no animated `z-index`). Scroll follow is jitter-free: the metadata updates via
  **refs** (no `setState` during scroll → the component never re-renders, so the
  spring interpolations stay stable), and the index is a **manually low-passed**
  value applied immediately (`api.start({ immediate: true })`) instead of a spring
  re-targeting a cross-rAF-jittery scroll read. The focused card
  drives a metadata row (`NN / NN`, name, year, a "View project" button). Motion is
  a react-spring value fed from scroll via the shared ticker (spring-based,
  ADR-0002); dark section (`bg-card-dark`). Card media are placeholder gradients
  with fictional project names (`mocks/home.ts`) — swap for real media under
  `public/assets/works/`.

- **Home — showcase columns with hover mask-reveal** (`src/views/showcase.tsx`): a
  full-width row of four full-height columns, each labelled at the bottom
  ("OUR APPROACH / TECHNOLOGY / SECURITY / TEAM"), with thin dividers. On hover the
  column's image reveals **bottom-to-top through a `clip-path` mask** (`inset(100%
  0 0 0)` → `inset(0 0 0 0)`) via the spring `<Hover>` primitive. The whole column
  is the hover `trigger` (a clip-collapsed element has no hit area, so it can't
  trigger itself); hover is desktop-only per the engine's mobile-disable. Images are
  placeholder gradients (reused accent/card/muted tokens) — swap for real media
  under `public/assets/showcase/`. Content from `mocks/home.ts`.

- **Home — stats bento, hero zoom-in, lighter marquee** — follow-up polish:
  - **Stats bento section** (`src/views/stats.tsx`): a blue collaboration card + an
    inner white stat, a grey commitment/quote card with an avatar cluster, and a
    right column with a lime data-points card over a dark reach card. Inset **120px**
    from the edges (new `--spacing-page-gutter` token → `px-page-gutter`, responsive
    below `lg`). Cards reveal on scroll via `<Inview>`. New tokens `--card-blue` /
    `--card-gray` / `--card-dark`. Fintech placeholder copy in `mocks/home.ts`.
  - **Hero shrink now also zooms the figure in** — the shrink progress drives both a
    faster spin **and** a camera pull-in (`heroProgress` getter → `SPIN_MULT` /
    `ZOOM_MULT`, replacing the spin-only `spinBoost`; `<PlasmaBurst progressRef>`).
  - **Marquee** — motion is much lighter/slower (small scroll-tied drift) and the
    logos are larger; softer spring for smoothness.
  - See [[design-system]] for the new tokens.

- **Home page — scroll-shrink hero, logo marquee, about heading** — grew the home
  view from a single hero into three composed sections (`src/views/home.tsx`):
  - **Scroll-shrink hero** (`src/views/hero.tsx`): a full-bleed hero that shrinks
    into a rounded card inset 24px from the edges **as it scrolls** — shrink and
    scroll happen together (no sticky pin). The shrink is an animated `clip-path`
    inset+radius, **not** a resize, so the WebGL canvas never resizes mid-scroll (no
    churn / flicker, smooth). Driven off scroll position via the shared ticker + a
    snappy react-spring value (spring-based, ADR-0002). Added a `spinBoost` getter to
    the Plasma Burst scene + a `spinBoostRef` prop on `<PlasmaBurst>`; the hero ramps
    the turntable spin up to 5× with the same scroll progress. Also calmed the core
    shader's fast flicker term.
  - **Logo marquee** (`src/views/logo-marquee.tsx`): two rows of light-grey
    monochrome placeholder logos whose motion is **tied to scroll position** (not
    autoplay), moving in opposite directions. Each row's translate is wrapped into a
    `[-ONE_SET, 0]` band over an over-duplicated track, so it's seamless and always
    filled edge-to-edge at any width. react-spring value chasing the scroll offset
    (no CSS keyframes).
  - **About heading** (`src/views/about.tsx`): an eyebrow + large statement headline
    with two inline icon chips (blue/lime) and muted words, revealed via `<Inview>`.
    Original fintech placeholder copy from `src/data/mocks/home.ts`.
  - New tokens in `globals.css`: `--hero-page` (white card gap), `--logo` (flat
    grey), `--accent-blue` / `--accent-lime` (chip accents), `--muted` (de-emphasised
    words). See [[design-system]].

- **Hero — new burst defaults; pointer interaction removed** — dialled in a fresh
  `defaultPlasmaConfig` (fewer/dimmer filaments — 60, cooler blue-violet gradient,
  smaller sparks, softer bloom). Removed the cursor interactivity entirely: the
  mouse-tilt + pointer-energy and the click shock-front are gone — the figure now
  **just turntable-spins**. Dropped the related state/handlers/uniform pushes from
  the scene factory (the `uEnergy`/`uShock`/`uShockAmp` uniforms remain at 0). See
  [[decisions-log]] ADR-0014.

- **Hero — grainy gradient backdrop as a fragment shader** — replaced the CSS
  `hero-gradient` backdrop with a **second WebGL layer**: a static fullscreen
  fragment shader (`src/lib/three/gradient-background-scene.ts`) reproducing a
  supplied reference — a smooth "mesh gradient": soft-edged gaussian dark blobs
  over a blue field, a bright bottom-left glow + softer top-right glow. Grain was
  tried, then removed for a cleaner look; the palette was pushed to vivid cobalt
  with blue-black darks plus a saturation/contrast boost in-shader (earlier mixes
  read grey/desaturated). It renders once (and on
  resize / colour change), no loop. The `PlasmaBurst` leaf now stacks two canvases:
  the opaque gradient behind, the burst in front (still `mix-blend-lighten`, so the
  dark cloud areas let it glow through). Base + light colours are panel-driven
  (`stageColor` → base blue, `glowColor` → glow; the panel "Background" pickers are
  now **Base** / **Light**); the cloud shapes, glow positions and grain are baked
  artwork constants. The CSS `hero-gradient` utility remains as a no-WebGL fallback.
  See [[decisions-log]] ADR-0014 and [[tech-stack]].

- **Hero — full-bleed symmetric gradient backdrop** — dropped the inset + rounded
  blue "card": the hero is now edge-to-edge with no white frame. Replaced the solid
  `bg-hero-stage` with an `@utility hero-gradient` (two cyan side glows rising into a
  blue bottom-centre pool over a near-black base — symmetric, matching a supplied
  ref). Token changes: removed `--hero-page`/`--hero-inset`/`--hero-radius` (and the
  `bg-hero-page`/`p-hero-inset`/`rounded-hero` bindings); added `--hero-base`
  (near-black) and `--hero-glow` (`#2ad4ff` cyan); kept `--hero-stage` (`#1246e2`).
  The dev panel's dead "Page" picker became a **Glow** picker, so both gradient
  colours (Stage blue + Glow cyan) tune live (`PlasmaConfig.pageColor` →
  `glowColor`). The Plasma Burst still composites over the gradient via
  `mix-blend-lighten`. No visible text added. See [[design-system]] and
  [[decisions-log]] ADR-0014.

- **Hero — tuned defaults dialled in** — replaced `defaultPlasmaConfig` (and the
  `--hero-stage` token, now `#1246e2`) with a hand-tuned pass: a brighter blue
  stage, a tight bright core, straight radiating filaments (`curl: 0`), fewer
  filaments (110) with denser sparks (940), faster spin, and a cool
  cyan→blue→teal filament gradient. These are now the shipped look.

- **Hero — config-driven scene + dev tuning panel** — refactored the Plasma Burst
  factory to take a `PlasmaConfig` (exported with `defaultPlasmaConfig`) and return
  a live `update(config)`: uniform/bloom/camera/motion changes apply instantly,
  structural changes (filaments, sparks, spread, curl, **and the filament gradient
  colours**) rebuild geometry in place (renderer/composer are reused). Added
  `src/views/plasma-controls.tsx` — a **development-only** panel
  (`process.env.NODE_ENV !== "production"`) with sliders; stage/page colour pickers;
  **figure colour pickers** (filament base/inner/mid/tip + core/core-halo — the
  core-sprite colours are live uniforms, the filament colours rebuild); a live JSON
  readout; and Copy/Reset, so the model + colours can be dialled in by hand and the
  exact values copied out. The client leaf owns the config state, drives `update()`,
  and applies the stage/page colours to the DOM via the `--hero-*` CSS vars. No new
  dependencies. See [[decisions-log]] ADR-0014.

- **Home hero — Three.js "Plasma Burst" WebGL scene** — built the first real home
  view: a full-viewport white page framing a **blue rounded stage** (20px inset,
  16px radius) that hosts a real-time WebGL burst — a white-hot core erupting into
  hundreds of electric-violet filaments with twinkling **white** sparks, turntable
  spin, mouse-tilt, and a click shock-front. New dependency **`three` `0.143.0`**
  (+ `@types/three`); this is canvas/WebGL artwork, a different medium from the
  spring engine, so ADR-0002 was scoped to DOM/UI motion and the scene is exempt
  (it owns its own rAF loop). New: `src/lib/three/plasma-burst-scene.ts` (framework-
  agnostic scene factory), `src/views/plasma-burst.tsx` (`"use client"` leaf),
  `src/data/mocks/home.ts` (placeholder hero copy). `HomeView` stays a Server
  Component. The scene renders on black and is composited over the blue stage with
  CSS `mix-blend-lighten`; sparks recoloured to white shades and the scene tuned
  (camera, bloom, brightness, core) for the blue-stage composition. Honours
  `prefers-reduced-motion` (static frame). New `globals.css` tokens: `--hero-page`,
  `--hero-stage` (`#1e40af`), `--hero-inset` (20px), `--hero-radius` (16px). Removed
  the starter `body` flex-centering (an empty-page placeholder) so full-width
  layouts work. See [[decisions-log]] ADR-0014 and [[tech-stack]].

## 2026-06-07

- **Fixed `<Inview>` standalone reveal + spring resize gating** — `<Inview>`
  never animated unless an external `trigger` ref was passed. The JSX `ref`
  callback wrote `inViewRef.current = node`, but that tuple slot is a *callback
  ref* (`setNode`), so the element was never observed and the `node` stayed
  `null`. Now calls `setInViewNode(node)`. This was also a build-breaking type
  error. Additionally, `<Inview>`, `<Spring>`, and `<Hover>` tracked `width` as a
  hook dependency but never passed it to `isMobileDisabled` — fixed by passing the
  tracked `width`, restoring resize re-evaluation and clearing the
  `react-hooks/exhaustive-deps` warnings. `yarn build` and `yarn lint` are now
  clean. See [[decisions-log]] ADR-0013 and [[components/animation-springs]].

## 2026-06-05

- **Home view emptied** — removed the animation showcase (`src/views/home-showcase.tsx`
  deleted) and reduced `HomeView` to an empty `<main>`. The home view is now the
  blank starting point for new work. Documented the convention — *if the project
  is empty and no other instructions are provided, start developing in the home
  view on route `/`* — in [[ai-agent-guide]] and [[new-page]].

## 2026-05-23

- **README — setup + Vercel deploy steps added** — *Getting started* expanded
  into a four-step flow (clone the template → delete bundled `.git` →
  initialise your own GitHub repo → install & run), with a macOS hint for
  revealing the hidden `.git` folder (`⇧ + ⌘ + .`). Added a *🚀 Deploy to
  Vercel* section covering the CLI flow (`vercel` / `vercel --prod`) and the
  dashboard import path, plus an `env pull` pointer to
  [[environment-variables]].
- **README rewritten to lead with the AI workflow** — root `README.md`
  reorganised so the AI usage guide is the first section: how the three
  `.claude/settings.json` hooks (`SessionStart`, `UserPromptSubmit`, `Stop`)
  enforce the vault workflow automatically, how to write a good request
  against this convention layer, and a cost-expectations note recommending
  **Claude Max (5×)** as the minimum plan (the vault-fan-out + hook
  re-injection on every turn is token-intensive by design). Technical
  *Getting started* and the existing AI-agents entry-point pointer stay
  below.

## 2026-05-22

- **Styling-placement convention added** — to stop `globals.css` accumulating
  hundreds of component-specific classes, styling now follows a strict
  placement order: one-offs are Tailwind utilities, repeated patterns become
  **React components** (not `@layer components` classes), and `@layer
  components` is reserved strictly for pseudo-elements and third-party
  overrides. `globals.css` stays bounded — `@import`, tokens, base resets only.
  No CSS Modules. Codified in [[decisions-log]] ADR-0012; [[design-system]]
  (new *Where a style goes* section) and [[component-conventions]] updated.
- **Semantic-HTML / SEO-markup convention added** — new [[html-semantics]]
  rulebook: landmarks, one `<h1>` + heading outline, native elements over
  `div`s, forms/images/ARIA, JSON-LD over microdata, a `data-*` convention, and
  passing a semantic `tag` to animation components. Codified as AGENTS.md hard
  rule #10; cross-linked from [[component-conventions]] and [[new-page]]. Fixed
  the demo (`home-showcase.tsx`) to a single `<h1>` to follow it.
- **API layer added** — a convention for reaching external services.
  `app/api/<resource>/route.ts` Route Handlers own their logic and read secret
  env vars directly (safe — route files never reach the browser). New: `zod`
  dependency; `src/env.ts` (validated env, public/server split); `src/lib/api/`
  (`handle` wrapper + `ApiError` + `{ data }`/`{ error }` envelope);
  `src/lib/api-client.ts` (typed same-origin fetch); example
  `app/api/contact/route.ts`. Codified as AGENTS.md hard rule #9. See
  [[decisions-log]] ADR-0011 and [[api-architecture]].

## 2026-05-21

- **Asset convention added** — site content assets (images, videos) now live
  under `public/assets/<section>/`, one folder per section; meta/PWA/SEO assets
  stay at the `public/` root. Documented in [[folder-structure]],
  [[component-conventions]], and the [[new-page]] playbook; `public/assets/`
  created with a `.gitkeep`.
- **SEO & performance hardening** — a broad pass on the starter. **SEO:** new
  `src/lib/site.ts` config (single source of truth, fed by `NEXT_PUBLIC_SITE_URL`);
  `metadataBase` is now always set (relative OG/canonical URLs resolve);
  `themeColor` moved to a `viewport` export; added `app/robots.ts`,
  `app/sitemap.ts`, and an `Organization`+`WebSite` JSON-LD helper; OG image
  dimensions corrected to match the asset; dead `keywords`/`other` tags dropped.
  **Performance:** populated `next.config.ts` (`removeConsole` in prod,
  AVIF/WebP, `next/image` breakpoints aligned to the grid, `poweredByHeader:
  false`); fixed a `requestAnimationFrame` leak in `ScrollLayout` (Lenis loop
  never cancelled on unmount); `HomeView` is now a Server Component with the
  animation demo split into the `HomeShowcase` client leaf; added
  `<ReducedMotion>` (honours `prefers-reduced-motion` via react-spring's global
  `skipAnimation`); removed a per-frame `console.log` from the demo; added
  `app/loading.tsx` / `error.tsx` / `not-found.tsx`. See [[decisions-log]]
  ADR-0010, [[seo-metadata]], and [[environment-variables]].
- **Animation engine — lint pass** — cleared all 13 pre-existing ESLint problems
  in the engine (2 errors + 11 warnings), an authorized engine edit (ADR-0009).
  `isMobileDisabled` now takes an optional `viewportWidth` argument, so the
  `active` memos in `<Spring>` / `<Hover>` / `<Inview>` / the trigger hooks
  depend on it genuinely. Added missing `disableOnMobile` effect deps; fixed a
  `trigger.current`-in-cleanup hazard in `<Hover>`; ref-stabilised `<Handle>`'s
  transition effects. **API change:** `useProgressTrigger` now returns `progress`
  as a `RefObject<number>` (read `.current`) instead of a render-time ref read —
  no consumer was affected (`<ProgressTrigger>` discards the return).
- **Animation engine — performance refactor** — fixed load issues that scaled
  with the number of animated components. Added `src/lib/animation/ticker.ts`, a
  single reference-counted `requestAnimationFrame` loop; `useLoop` (and all loop
  hooks) now subscribe to it instead of each starting its own rAF. `useWindowWidth`
  / `Height` / `Size` now share one debounced `resize` listener via a
  `useSyncExternalStore` store (the `debounceDelay` param was dropped — unused).
  `useDynamicInView` rewritten without the per-render `Proxy`/observer churn.
  Fixed a stale-closure bug in `useLoop`. `mode="forward"` scroll listeners made
  `passive`. This was an **authorized edit to `#do-not-modify` engine files** —
  hard rule #2 amended. See [[decisions-log]] ADR-0009 and [[animation-system]].
- **`spring-text-engine` updated** — bumped `^0.1.3` → `^0.1.5` (latest). The
  public API, types, and dependencies are unchanged between these versions
  (verified) — an internal-only patch bump, no code changes required.
- **Adaptive scaling grid added** — a root-font-size scaling system landed in
  `src/components/common/grid/` (`<AdaptiveGrid>` + `useAdaptiveGrid` hook +
  `grid.config.ts`), with `vw` media queries in `globals.css` for scale-down.
  It was dropped into `common/` as a `styled-components` system; ported to the
  project stack — config-driven TS + CSS-only Tailwind, no `styled-components`.
  The unused dropped files (`colors.ts`, `fonts.ts`, `utils.ts`, `index.ts`,
  the `styled-components` `grid.tsx`) were removed. Mounted via `<AdaptiveGrid>`
  in the root layout. See [[components/common]] and [[decisions-log]] ADR-0008.
- **Vault created** — `obsidian/` Obsidian vault initialised as the project's
  second brain. Architecture, frontend, and workflow docs populated. See [[decisions-log]] ADR-0001.
- **Root README rewritten** — replaced `create-next-app` boilerplate with a real
  project README that points into this vault.
- **`generic-layout-prompt.md` moved** — relocated from repo root to
  `obsidian/workflows/` as [[generic-layout-prompt]].
- **Navigation convention resolved** — standard `next/link` confirmed; the unbuilt
  `<AnimLink>` / `useAnimRouter()` convention dropped. See [[decisions-log]] ADR-0005.
- **Docs consolidated into the vault** — `project-specs.md` deleted (decomposed into
  vault notes + new [[environment-variables]]); `text-engine-docs.md` moved in as
  [[text-engine-reference]]. `AGENTS.md` rewritten as a thin shim; `.cursorrules`
  repointed to `@AGENTS.md`. The vault is now the single source of truth.
  See [[decisions-log]] ADR-0006.
- **Vault renamed & restructured** — vault folder `getlayers.io/` → `obsidian/`;
  number prefixes dropped from section folders (`00-meta` → `meta`, etc.). Project
  name standardised to **`next16-claude-starter`** across docs and `package.json`.
- **Components linked to docs** — every file in `src/components/` now carries a
  `// 📖 Docs:` pointer comment to its catalog note, so agents can jump from code
  to docs and back.
- **Vault workflow automated** — added `.claude/settings.json` with `SessionStart`,
  `UserPromptSubmit`, and `Stop` hooks that make agents read the vault first,
  follow the relevant guide, and update docs after every change — with no manual
  reminder. See [[decisions-log]] ADR-0007 and [[ai-agent-guide]].
- **Cookie component replaced** — the `react-cookie-consent`-based `cookie.tsx`
  was replaced by an in-house `Cookie/` component (banner + category preferences
  modal + Zustand store). `react-cookie-consent` removed from dependencies. The
  component shipped using `styled-components` + an external design system; it was
  ported to the project stack — Tailwind v4 tokens and `@react-spring/web` motion.
  Mounted via `<LazyCookie>`. See [[components/common]].
- **Fixed TextEngine spring type mismatch** — the `mode="once"` heading in
  `views/home.tsx` mixed `lineIn={{ y: 0 }}` (number) with `lineOut={{ y: "100%" }}`
  (string), throwing *"Cannot animate between _AnimatedString and _AnimatedValue"*.
  Changed to `y: "0%"`. The buggy pattern in [[text-engine]] / [[text-engine-reference]]
  examples was corrected and a type-matching gotcha note added.

## Project baseline (git history)

| Commit | Description |
|--------|-------------|
| `94b0870` | feat: update starter |
| `5280ef2` | fix: linter errors & build |
| `b2b84e6` | initial — `next16-claude-starter` scaffold |

> [!note]
> The starter shipped with: Next.js 16.2, React 19.2, Tailwind v4, `@react-spring/web`,
> `spring-text-engine`, Lenis, and Zustand. See [[tech-stack]] for the current state.
