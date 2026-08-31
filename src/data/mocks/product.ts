// Content for the product explainer section of the Stride editorial concept.
// "Northwind" is a fictional product inside the fictional brand.
import type { SiteLink } from "@/lib/site";

export interface ProductContent {
  labelId: string;
  heading: string;
  cta: SiteLink;
  description: string;
  cards: {
    grow: { title: string; body: string };
    liquid: { title: string; body: string };
    hands: { title: string; body: string };
  };
}

export const productContent: ProductContent = {
  labelId: "product-title",
  heading: "What is Northwind?",
  cta: { label: "Explore now", href: "#contact" },
  description:
    "Northwind is a smart yield account that puts idle cash to work — compounding around the clock while staying liquid and dollar-steady.",
  cards: {
    grow: {
      title: "Capital that compounds",
      body: "Your balance earns automatically as it's routed into vetted, high-yield lending markets.",
    },
    liquid: {
      title: "Always liquid, always steady",
      body: "Move your money the moment you need it — fully backed, with no lockups or waiting.",
    },
    hands: {
      title: "Fully hands-off",
      body: "Nothing to manage. Northwind rebalances in the background, day and night.",
    },
  },
};
