// Content for the home view of the Stride editorial concept. Stride is a fictional
// brand; the partner/portfolio names below are invented for the piece. Kept out of
// components per the data rules — passed in as props.
// See obsidian/frontend/component-conventions.md (Data rules).
import type { HeroContent } from "@/views/hero";
import type { AboutContent } from "@/views/about";
import type { StatsContent } from "@/views/stats";
import type { ShowcaseContent } from "@/views/showcase";
import type { WorksContent } from "@/views/works";
import type { ChainContent } from "@/views/chain";
import type { SiteNavContent } from "@/views/site-nav";

export interface HomeContent {
  /** Shared fixed site header (rendered once). */
  nav: SiteNavContent;
  hero: HeroContent;
  logos: {
    label: string;
    /** Placeholder partner/customer names — rendered as one flat grey. */
    items: string[];
  };
  about: AboutContent & { labelId: string };
  stats: StatsContent;
  showcase: ShowcaseContent;
  works: WorksContent;
  chain: ChainContent;
}

// The marketing nav is shared across the hero and chain stages. Every item is an
// in-page anchor to a section that exists — the ids live on the section elements
// (about.tsx, showcase.tsx, works.tsx, product.tsx, contact-form.tsx).
const siteNav: SiteNavContent = {
  brand: "Stride",
  items: [
    { label: "Story", href: "#about" },
    { label: "Approach", href: "#approach" },
    { label: "Work", href: "#work" },
    { label: "Product", href: "#product" },
  ],
  cta: { label: "Request a demo", href: "#contact" },
};

export const homeContent: HomeContent = {
  nav: siteNav,
  hero: {
    titleLines: ["Turn balance into", "momentum"],
    sectionLabel: "Hero",
    sceneLabel: "Animated plasma burst",
    cta: siteNav.cta,
    secondaryCta: { label: "Learn more", href: "#about" },
    insightTitle:
      "Get the insight and control to act with confidence, exactly when it counts.",
    insightBody:
      "Watch your money work as hard as you do. Automated saving, real returns, and a clear view of where every dollar goes — no jargon, no guesswork.",
    stats: [
      { value: "4.9", label: "User Reviews" },
      { value: "30k", label: "Active clients" },
      { value: "15k", label: "Good Feedback" },
    ],
  },
  logos: {
    label: "Trusted by finance teams",
    items: [
      "Northwind",
      "Ledgerly",
      "Vaulted",
      "Paycore",
      "Finova",
      "Quanta",
      "Settle",
      "Corvus",
    ],
  },
  about: {
    labelId: "about-title",
    eyebrow: "About us",
    lead: "A fintech platform built to move money",
    mutedLead: "smarter and settle payments faster",
  },
  stats: {
    label: "By the numbers",
    brand: "LEDGERLY",
    collab: {
      value: "120+",
      desc: "Partnered with leading banks and payment networks.",
    },
    commitment: {
      eyebrow: "Commitment to uptime",
      value: "99.99%",
      quote:
        "Their payment rails completely reshaped how we move money. It's fast, reliable, and secure.",
    },
    data: {
      label: "Data points",
      value: "520k+",
      desc: "Analyzed every day to power smarter financial decisions.",
    },
    reach: { label: "Countries", value: "60+" },
  },
  chain: {
    heading: "Financial momentum",
    tagline:
      "Watch your money work as hard as you do. Automated saving, real returns, and a clear view of where every dollar goes — no jargon, no guesswork.",
    aside: "when it matters most",
  },
  showcase: {
    heading: "Thoughtful engineering behind every detail",
    cta: { label: "Explore the platform", href: "#product" },
    items: [
      { prefix: "Our", name: "Approach", image: "/assets/images/3rd/approach.png" },
      {
        prefix: "Our",
        name: "Technology",
        image: "/assets/images/3rd/technology.jpg",
      },
      { prefix: "Our", name: "Security", image: "/assets/images/3rd/security.jpg" },
      { prefix: "Our", name: "Team", image: "/assets/images/3rd/team.jpg" },
    ],
  },
  works: {
    heading: "Our Portfolio",
    items: [
      { name: "Northwind", year: "2026", image: "/assets/images/portfolio/1.jpg" },
      { name: "Ledgerly", year: "2025", image: "/assets/images/portfolio/2.jpg" },
      { name: "Vaulted", year: "2025", image: "/assets/images/portfolio/3.jpg" },
      { name: "Paycore", year: "2024", image: "/assets/images/portfolio/4.jpg" },
      { name: "Finova", year: "2024", image: "/assets/images/portfolio/5.jpg" },
      { name: "Corvus", year: "2023", image: "/assets/images/portfolio/6.jpg" },
    ],
  },
};
