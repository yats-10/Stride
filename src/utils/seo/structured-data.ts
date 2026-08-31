/**
 * @fileoverview JSON-LD structured data helpers.
 *
 * Structured data lets search engines understand the site as entities rather
 * than just text. Render the output inside a `<script type="application/ld+json">`.
 *
 * Stride is a fictional brand, so this site is described as a **`CreativeWork`
 * authored by a `Person`** — emitting `Organization` schema for a concept would
 * assert a company that does not exist (and can surface as a knowledge panel).
 */

import { siteConfig } from "@/lib/site";

/**
 * WebSite + CreativeWork + Person schema for the site root. Emit once, in the
 * root layout. The nodes are linked by `@id` so crawlers treat them as related.
 */
export function getSiteStructuredData() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": `${siteConfig.url}/#author`,
        name: siteConfig.author,
        ...(siteConfig.authorUrl ? { url: siteConfig.authorUrl } : {}),
      },
      {
        "@type": "CreativeWork",
        "@id": `${siteConfig.url}/#concept`,
        name: `${siteConfig.name} — ${siteConfig.tagline}`,
        description: siteConfig.description,
        genre: "Web design concept",
        abstract: siteConfig.conceptNote,
        copyrightYear: siteConfig.year,
        url: siteConfig.url,
        image: `${siteConfig.url}${siteConfig.ogImage}`,
        author: { "@id": `${siteConfig.url}/#author` },
        creator: { "@id": `${siteConfig.url}/#author` },
      },
      {
        "@type": "WebSite",
        "@id": `${siteConfig.url}/#website`,
        name: siteConfig.name,
        description: siteConfig.description,
        url: siteConfig.url,
        mainEntity: { "@id": `${siteConfig.url}/#concept` },
        publisher: { "@id": `${siteConfig.url}/#author` },
      },
    ],
  };
}
