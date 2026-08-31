// Site footer — a full-height blue mesh-gradient panel (with a chrome heart that
// settles at its centre, see FooterScene) that slides up over the pinned contact form
// (relative z-20 over the form's sticky z-10, the same two-layer reveal the Product
// uses over the chain; see home.tsx). Laid out as a full-height column: a centred
// "questions?" heading + jump-to-form link at the top, the heart in the open centre,
// then the link columns and bottom bar pushed to the base. Server component —
// semantic <footer> + <nav>.
import type { FooterContent } from "@/data/mocks/contact";
import type { SiteLink } from "@/lib/site";
import { FooterScene } from "@/views/footer-scene";
import { AnimatedHeading } from "@/components/common/animated-heading";

export interface SiteFooterProps {
  content: FooterContent;
}

// External links open in a new tab and carry rel="noopener"; in-page anchors are
// plain same-origin hrefs.
const linkProps = (link: SiteLink) =>
  link.external
    ? { href: link.href, target: "_blank", rel: "noopener" as const }
    : { href: link.href };

export const SiteFooter = ({ content }: SiteFooterProps) => {
  const {
    labelId,
    heading,
    cta,
    backToTop,
    linksLabel,
    sitemap,
    colophon,
    copyright,
    credit,
    note,
  } = content;

  const colTitle =
    "mb-4 text-xs font-medium uppercase tracking-wide text-footer-muted";
  const colLink = "text-sm text-footer-fg/80 hover:text-footer-fg";

  return (
    <footer
      aria-labelledby={labelId}
      className="relative z-20 flex min-h-lvh flex-col overflow-hidden bg-footer px-6 pb-6 pt-20 text-footer-fg md:px-10 md:pb-10 lg:px-12 lg:pb-12"
    >
      {/* Blue mesh-gradient backdrop + centred chrome heart (decorative). */}
      <FooterScene />

      <div className="relative z-10 flex flex-1 flex-col">
      {/* Heading + jump-to-form, centred at the top */}
      <div className="flex flex-col items-center text-center">
        {/* Constrained so "Have questions?" and "Let's talk." fall on separate lines
            on mobile/tablet; unconstrained (one line allowed) on large screens. */}
        <AnimatedHeading
          as="h2"
          id={labelId}
          className="mx-auto max-w-[14ch] text-[2rem] font-light leading-[1.05] tracking-tight sm:text-[2.5rem] lg:max-w-none lg:text-[4rem]"
        >
          {heading}
        </AnimatedHeading>
        <a
          href={cta.href}
          className="mt-8 rounded-full border border-footer-fg/40 px-6 py-3 text-sm font-medium hover:bg-footer-fg hover:text-footer"
        >
          {cta.label}
        </a>
      </div>

      {/* Open centre — the chrome heart settles here (see FooterScene). */}
      <div className="flex-1" />

      {/* Link columns — pushed to the base. Negative margins break the top divider out
          to the screen edges, then the same hero gutters re-inset the columns. */}
      <nav
        aria-label="Footer"
        className="-mx-6 mt-16 flex flex-col gap-10 border-t border-footer-fg/15 px-6 pt-12 md:-mx-10 md:mt-12 md:flex-row md:justify-between md:px-10 lg:-mx-12 lg:px-12"
      >
        {/* Left group — SITEMAP sits close to LINKS */}
        <div className="flex gap-12 sm:gap-20">
          <div>
            <h3 className={colTitle}>{linksLabel}</h3>
            <a href={backToTop.href} className={colLink}>
              {backToTop.label}
            </a>
          </div>

          <div>
            <h3 className={colTitle}>{sitemap.title}</h3>
            <ul className="flex flex-col gap-2">
              {sitemap.links.map((link) => (
                <li key={link.label}>
                  <a {...linkProps(link)} className={colLink}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right group — the colophon, pushed to the right gutter (same inset as LINKS).
            Label/value pairs, not links: a concept piece credits its author and stack
            rather than inventing contact details for a brand that doesn't exist. */}
        <div className="max-w-sm">
          <h3 className={colTitle}>{colophon.title}</h3>
          <dl className="flex flex-col gap-2 text-sm">
            {colophon.items.map((item) => (
              <div key={item.label} className="flex flex-wrap gap-x-2">
                <dt className="text-footer-muted">{item.label}</dt>
                <dd className="text-footer-fg/80">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </nav>

      {/* Bottom bar — copyright + authorship on one row, the fictional-brand note
          below it. The credit is a link only when `authorUrl` is set, so an unset
          profile URL renders as plain text instead of a dead anchor. */}
      {/* The bar sits at the base of the mesh gradient, whose bottom-left corner goes
          near-white — so the text is near-white (not the cool `text-footer-muted`,
          which washes out) over a soft dark scrim that grounds it at both ends. */}
      <div className="-mx-6 -mb-6 mt-10 bg-gradient-to-t from-footer/80 to-transparent px-6 pb-6 pt-6 text-xs text-footer-fg/75 md:-mx-10 md:-mb-10 md:px-10 md:pb-10 lg:-mx-12 lg:-mb-12 lg:px-12 lg:pb-12">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p>{copyright}</p>
          {credit.href ? (
            <a
              {...linkProps(credit)}
              className="text-footer-fg/80 underline underline-offset-4 hover:text-footer-fg"
            >
              {credit.label}
            </a>
          ) : (
            <p className="text-footer-fg">{credit.label}</p>
          )}
        </div>
        <p className="mt-3 max-w-2xl text-footer-fg/70">{note}</p>
      </div>
      </div>
    </footer>
  );
};
