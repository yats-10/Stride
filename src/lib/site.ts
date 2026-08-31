/**
 * Site-wide configuration — the single source of truth for SEO and authorship.
 *
 * Consumed by the metadata generator, `robots.ts`, `sitemap.ts`, the JSON-LD
 * structured-data helper, and the footer credit.
 *
 * Stride is a **fictional brand**: this site is a self-initiated editorial
 * concept, so the schema describes a `CreativeWork` by a `Person`, not a real
 * `Organization` (see `utils/seo/structured-data.ts`).
 */
import { publicEnv } from "@/env";

/** A labelled link. Shared by the nav, hero CTAs, and the footer columns. */
export interface SiteLink {
  label: string;
  href: string;
  /** External links open in a new tab and get `rel="noopener"`. */
  external?: boolean;
}

export const siteConfig = {
  name: "Stride",
  /** Short brand promise — used in the page title, PWA, and JSON-LD. */
  tagline: "Modern banking for people and businesses",
  description:
    "Stride — an editorial concept for a modern banking brand. A scroll-driven, spring-animated one-pager with WebGL set pieces, designed and built by Yatharth Madaan.",
  /**
   * Public origin, no trailing slash. Drives canonical URLs, OG tags, the
   * sitemap, and JSON-LD. Set `NEXT_PUBLIC_SITE_URL` in production.
   */
  url: publicEnv.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  /** Default Open Graph / Twitter share image (path under `public/`, 900×600). */
  ogImage: "/open-graph.png",
  author: "Yatharth Madaan",
  /**
   * Author's portfolio / profile URL — renders the footer credit as a link.
   * Leave empty and the credit renders as plain text (no dead link).
   */
  authorUrl: "",
  /** Year the concept was published — footer copyright + JSON-LD. */
  year: "2026",
  /** Keeps the concept from ever being mistaken for a real financial product. */
  conceptNote:
    "Stride is a fictional brand. This is a self-initiated editorial concept, not a real financial product.",
  /** Browser theme-color (address bar / PWA) — the dark hero backdrop the page opens on. */
  themeColor: "#04070f",
} as const;
