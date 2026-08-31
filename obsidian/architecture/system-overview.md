---
tags: [architecture, stable]
updated: 2026-05-21
---

# System Overview

## What this is

**Stride** is a **frontend-first Next.js 16 site** — an editorial concept for a modern
banking brand, built as one animation-heavy scrolling page. It carries a complete
spring-animation system, smooth scrolling, WebGL set pieces, SEO metadata, and cookie
consent.

There is **no database or auth** — only a single contact Route Handler. See
[[backend/README]].

## Mental model

```
Browser request
   │
   ▼
app/layout.tsx ──────────────► RootLayout
   │   loads Onest font, globals.css, metadata
   │
   ├─ <ScrollLayout>  ◄──── Lenis smooth scroll + Zustand scroll store
   │     │
   │     ├─ <LazyCookie/> ◄── cookie consent banner + modal (client, dynamic, no SSR)
   │     │
   │     └─ {children}
   │           │
   │           ▼
   │        app/page.tsx ──► delegates to ──► views/home.tsx (HomeView)
   │           │
   │           ▼
   │        composed UI = spring animation components + text engine
   │
   ▼
Rendered page — Server Components by default; "use client" only at animation leaves
```

## The three pillars

1. **Routing → Views.** `app/` files are thin; they delegate to `src/views/`.
   See [[routing]].
2. **Spring animation system.** Every motion uses `@react-spring/web` through a
   custom component layer. See [[animation-system]] and [[text-engine]].
3. **Smooth scroll.** Lenis drives a global `requestAnimationFrame` loop; scroll
   state is shared via a Zustand store. See [[smooth-scroll]].

## Request lifecycle

1. Next.js resolves the route under `app/`.
2. `RootLayout` wraps the page in `<ScrollLayout>` → `<LazyCookie/>` → `{children}`.
   The provider order is fixed — see [[data-flow]].
3. The route file renders its **View** component.
4. The View composes animation primitives. These are all `"use client"`.
5. `<ScrollController>` (inside `ScrollLayout`) initialises Lenis on mount.

## Rendering strategy

- **Server Components by default.** `layout.tsx`, `page.tsx`, and SEO utilities run
  on the server.
- **`"use client"` only at the leaves** — animation components and views that use
  hooks. Never mark a layout/page client just to avoid a boundary.
- `isBot()` lets Server Components skip heavy animation for crawlers — see [[seo-metadata]].

## Key entry points

| File | Role |
|------|------|
| `src/app/layout.tsx` | Root layout, font, provider tree |
| `src/app/page.tsx` | Home route → `HomeView` |
| `src/views/home.tsx` | Demo view showcasing the animation system |
| `src/layouts/scroll-layout.tsx` | Lenis integration |
| `src/lib/springs/config.ts` | Global animation config |

## Related

[[tech-stack]] · [[folder-structure]] · [[data-flow]]
