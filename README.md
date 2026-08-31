# Stride — Editorial Concept

**An editorial concept for a modern banking brand.** A scroll-driven, spring-animated
one-pager: a WebGL plasma hero that collapses into a rounded card, a per-letter type
system, a 3D portfolio stack, a pinned chrome-chain stage, and a chrome heart that
settles into the footer.

> **Stride is a fictional brand.** This is a self-initiated concept piece — not a real
> financial product, and not affiliated with any company.

**Concept, design & build — Yatharth Madaan · 2026**

---

## The idea

Fintech marketing sites default to the same grammar: a gradient, a phone mockup, a row
of logos. Stride asks what the category looks like when it's art-directed like an
editorial spread instead — one continuous scroll where each section is a set piece, type
carries the story, and motion is the layout, not decoration.

Everything moves on springs. There is not a single CSS transition or keyframe in the
project — every reveal, shrink, pin and cascade is a physical simulation driven from one
shared render loop.

## Sections

| # | Section | The move |
|---|---------|----------|
| 1 | **Hero** | Full-bleed WebGL plasma burst; the whole card shrinks into a rounded inset via `clip-path` on scroll while the burst spins up |
| 2 | **Marquee** | Two logo rows marqueeing in opposite directions |
| 3 | **Story** | Statement headline assembled letter-by-letter, with icon chips scaling out of blur |
| 4 | **Stats** | Bento of four cards on a soft staggered reveal |
| 5 | **Approach** | Full-height columns; hover reveals each photo bottom-to-top through a clip mask (cards on touch) |
| 6 | **Work** | Scroll-driven 3D card stack travelling a vertical cylinder, with a cross-fading blurred backdrop |
| 7 | **Product** | A pinned chrome chain the product section scrolls out from under |
| 8 | **Contact / Footer** | The form pins while a blue mesh-gradient footer slides up over it, a chrome heart settling at its centre |

## Stack

- **Next.js 16** (App Router, Server Components by default) · **React 19** · **TypeScript**
- **@react-spring/web** — all motion, driven from one shared ticker
- **Three.js** — plasma burst, chrome chain and heart (Draco-compressed GLB)
- **Lenis** — smooth scroll
- **Tailwind CSS v4** — CSS-first config, design tokens in `globals.css`
- **Zustand** · **Zod**

Layout scales by root font-size (a rem-based adaptive grid), so the design holds its
proportions from 360px to ultrawide.

## Run it

```bash
yarn install
yarn dev        # http://localhost:3000
```

| Script | Purpose |
|--------|---------|
| `yarn dev` | Development server |
| `yarn build` | Production build |
| `yarn start` | Serve the production build |
| `yarn lint` | ESLint |

Set `NEXT_PUBLIC_SITE_URL` to the deployed origin before shipping — it drives canonical
URLs, OG tags, the sitemap, and JSON-LD. Everything else is optional; see
[`obsidian/architecture/environment-variables.md`](./obsidian/architecture/environment-variables.md).

## Deploy

```bash
vercel          # preview
vercel --prod   # production
```

The Next.js preset auto-configures the build — no `vercel.json` needed. Add
`NEXT_PUBLIC_SITE_URL` under **Project Settings → Environment Variables**.

## Documentation

The full build log — architecture, the animation system, every decision and why —
lives in the **`obsidian/`** vault. Open that folder in [Obsidian](https://obsidian.md)
for a linked, navigable version, or start at
[`obsidian/README.md`](./obsidian/README.md).

## Credits

Concept, art direction, design and front-end build by **Yatharth Madaan**.

Built on Next.js, Three.js, React Spring and Lenis. Type is
[Mulish](https://fonts.google.com/specimen/Mulish) (SIL Open Font License). Photography
and 3D assets are placeholders for the concept and are not licensed for redistribution —
swap them before any commercial use.
