// Content for the contact form + site footer.
//
// Stride is a fictional brand, so the footer carries no invented postal address,
// phone number or social accounts — a made-up `mailto:`/`tel:` is a dead link, and
// a made-up @handle points at somebody else's account. In their place: a colophon
// (year, role, stack) and an authorship line, which is what an editorial concept
// piece actually wants. See `lib/site.ts`.
import { siteConfig, type SiteLink } from "@/lib/site";

export interface ContactContent {
  labelId: string;
  /** Bold intro prompt above the form. */
  heading: string;
  /** Placeholder / label text for each field. */
  fields: { name: string; phone: string; email: string };
  cta: string;
  /** Inline submit feedback. `sent` says plainly where a real submission goes. */
  status: { sending: string; sent: string; error: string };
}

export const contactContent: ContactContent = {
  labelId: "contact-title",
  heading:
    "Stride is always looking to connect with sharp, curious people. Feel free to drop us a line.",
  fields: { name: "Name", phone: "Phone number", email: "Email" },
  cta: "Send",
  status: {
    sending: "Sending…",
    sent: "Thanks — received. Stride is a concept piece, so this reaches a demo endpoint, not a staffed inbox.",
    error: "That didn't send. Please try again.",
  },
};

export interface FooterNavGroup {
  title: string;
  links: SiteLink[];
}

/** A label/value pair in the colophon column (not a link). */
export interface ColophonItem {
  label: string;
  value: string;
}

export interface FooterContent {
  labelId: string;
  heading: string;
  cta: SiteLink;
  backToTop: SiteLink;
  linksLabel: string;
  sitemap: FooterNavGroup;
  colophon: { title: string; items: ColophonItem[] };
  /** Bottom bar. `credit.href` is optional — empty renders plain text, not a dead link. */
  copyright: string;
  credit: SiteLink;
  /** Says plainly that the brand is fictional. */
  note: string;
}

export const footerContent: FooterContent = {
  labelId: "footer-title",
  heading: "Have questions? Let's talk.",
  cta: { label: "Fill in the form", href: "#contact" },
  backToTop: { label: "Back to top", href: "#top" },
  linksLabel: "Links",
  sitemap: {
    title: "Sitemap",
    links: [
      { label: "Story", href: "#about" },
      { label: "Approach", href: "#approach" },
      { label: "Work", href: "#work" },
      { label: "Product", href: "#product" },
      { label: "Contact", href: "#contact" },
    ],
  },
  colophon: {
    title: "Colophon",
    items: [
      { label: "Project", value: `Editorial concept · ${siteConfig.year}` },
      { label: "Design & build", value: siteConfig.author },
      { label: "Built with", value: "Next.js · Three.js · React Spring · Lenis" },
    ],
  },
  copyright: `© ${siteConfig.year} ${siteConfig.author}. All rights reserved.`,
  credit: {
    label: `Design & build — ${siteConfig.author}`,
    href: siteConfig.authorUrl,
    external: true,
  },
  note: siteConfig.conceptNote,
};
