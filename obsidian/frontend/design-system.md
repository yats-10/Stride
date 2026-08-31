---
tags: [frontend, design-system, stable]
updated: 2026-07-04
---

# Design System — Tailwind v4

Styling uses **Tailwind CSS v4**, configured entirely in CSS. There is **no
`tailwind.config.js`**. ADR: [[decisions-log]] ADR-0004.

## Where config lives

`src/app/globals.css` is the single config file:

```css
@import "tailwindcss";

:root {
  --background: #ffffff;
  --foreground: #171717;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-onest);
}
```

Extra CSS layers can be split into `src/style/index.css` and imported.

## Design tokens

All colours, spacing, font sizes, radii, and shadows are **tokens** declared under
`:root` (raw values) and `@theme inline` (Tailwind bindings).

Once a token is in `@theme`, it becomes a utility automatically:

| Token | Generated utilities |
|-------|--------------------|
| `--color-brand` | `bg-brand`, `text-brand`, `border-brand` |
| `--radius-card` | `rounded-card` |
| `--spacing-section` | `pt-section`, `mt-section`, … |

> [!important] The token rule
> **Never** hardcode hex values, pixel spacing, or named colours in `className` or
> inline styles. If a value doesn't exist as a token, **add it to `globals.css`
> first** — with a comment noting where it came from (e.g. a Figma frame).

## CSS layers

Every custom style goes inside a layer — never outside one:

```css
@layer base {        /* element resets & defaults: h1, p, a … */ }
@layer components {  /* pseudo-elements & 3rd-party overrides only — see below */ }
@layer utilities {   /* single-purpose helpers: .scrollbar-none … */ }
```

## Where a style goes (ADR-0012)

`globals.css` is **not** a place to park component styles — it holds tokens and
base resets and stays a few hundred lines forever. Follow this order; the first
match wins:

| Situation | Goes where |
|-----------|-----------|
| One-off styling | Tailwind utilities in `className` — nothing in CSS |
| Repeated pattern with markup / structure / props | a **React component** in `components/ui/` |
| Repeated *pure-utility* combo, no structure | a Tailwind v4 `@utility` |
| Pseudo-elements, 3rd-party DOM overrides, complex selectors | `@layer components` — the genuine exceptions |
| A new colour / spacing / radius value | a **token** in `:root` + `@theme` |

> [!important] The default answer to "this looks repeated" is a **React
> component**, not a CSS class. An eyebrow label with a `::before` dot is an
> `<Eyebrow>` component — not a `.label-eyebrow` global class. `@layer
> components` is for what utilities and components genuinely *cannot* express.

There are **no CSS Modules** in this project — utilities + components cover
every case (motion is spring-based, so there are no keyframes to co-locate).

## Current theme state

The starter ships a **minimal** theme: `background` / `foreground` and the Onest
font, with a dark-mode override via `@media (prefers-color-scheme: dark)`. The
`@layer base/components/utilities` blocks are empty — fill them per project.

Home-hero tokens have been added for the **full-bleed symmetric gradient** backdrop:
`--hero-base` (near-black), `--hero-stage` (`#1246e2` blue), `--hero-glow`
(`#2ad4ff` cyan). They feed the `@utility hero-gradient` (two cyan side glows rising
into a blue bottom-centre pool over a dark base — now a no-WebGL fallback behind the
shader backdrop). The dev controls panel tints `--hero-stage`/`--hero-glow` live.
Note: the WebGL hero's *scene* colours are artwork constants baked into the scene
factory, **not** tokens — see [[decisions-log]] ADR-0014.

Home-page section tokens: `--hero-page` (white — the card gap when the hero shrinks,
and the section backgrounds), `--logo` (flat light-grey for every marquee logo),
`--accent-blue` / `--accent-lime` (about-heading icon chips), `--muted` (de-emphasised
heading words), `--card-blue` / `--card-gray` / `--card-dark` (stats bento cards),
and `--spacing-page-gutter` (`120px` — wide-section edge inset → `px-page-gutter`);
plus the product explainer's purple set `--plum` / `--lilac` (card fills; its section
now uses `bg-hero-page` so it can occlude the pinned chain layer, so `--paper` is
currently unused but retained); and the **site-footer** set `--footer` (dark-navy
solid fallback behind the footer's blue WebGL mesh-gradient backdrop), `--footer-fg`
(near-white text) and `--footer-muted` (cool labels / secondary). The oversized
wordmark uses `text-footer-fg/15` (no dedicated token). All bound in `@theme` →
`bg-hero-page`, `text-logo`, `bg-accent-blue`, `bg-accent-lime`, `text-muted`,
`bg-card-blue`/`-gray`/`-dark`, `bg-plum`/`text-plum`, `bg-lilac`, `bg-paper`,
`bg-footer`/`text-footer`, `text-footer-fg`, `text-footer-muted`; and the **preloader**
bar gradient `--preloader-from` (pale blue) / `--preloader-to` (royal blue) →
`from-preloader-from` / `to-preloader-to`.
Note: the contact form is inked with `--plum` / `bg-hero-page` (not `--foreground`/
`--background`, which flip under `prefers-color-scheme: dark` — the light sections
pin explicit tokens to stay stable across schemes).

## Typography

Font: **Mulish** (`next/font/local`, files in `src/app/fonts/`), weights **300 / 400 /
500** only. Loaded in `src/app/layout.tsx` (variable `--font-mulish`) and exposed on
`<body>`; `globals.css` sets `body { font-family: var(--font-mulish) … }` directly and
binds `--font-sans: var(--font-mulish)` in `@theme` for the `font-sans` utility.
Note: since `@theme inline` inlines `--font-sans` (it isn't a live CSS var), the body
rule references `--font-mulish` directly. Only up to weight 500 ships, so
`font-semibold`/`font-bold` (600/700) synthesise — prefer `font-light`/`font-medium`.

## Buttons

One shared button shape across the site (the hero primary is the reference), applied
as inline utilities:

- **Base:** `rounded-full px-6 py-3 text-sm font-medium` — normal case (no `uppercase`),
  no tracking overrides, no icon/arrow.
- **Filled:** add a solid fill + contrasting text — `bg-black text-white hover:bg-black/90`
  on light sections; the hero's on-dark primary is `bg-white text-black`.
- **Outline:** same base but `border` + transparent fill, inheriting/among the section's
  text colour (e.g. `border-black/30 text-black hover:bg-black hover:text-hero-page`;
  on dark sections `border-white/25` / `border-footer-fg/40`).

**Exceptions:** the fixed header pill (`site-nav`) keeps its own `h-11` sizing; the hero
secondary "Learn more" is a plain underlined text link, not a pill.

## Styling rules

- Use utilities in JSX `className`; keep class strings short and readable.
- Extract a repeated pattern to a **React component** — not a `@layer
  components` class. See *Where a style goes* above (ADR-0012).
- Mobile-first responsive: `sm:` / `md:` / `lg:` / `xl:` prefixes.
- Dark mode: `dark:` prefix or token overrides in a `prefers-color-scheme` block.
- No inline `style` except for dynamic values (e.g. spring-animated values).

## Related

[[component-conventions]] · [[animation-system]] · [[new-page]]
