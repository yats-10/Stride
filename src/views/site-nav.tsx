// Fixed site header overlaid on the page: a brand pill and a separate links pill on
// the left, and a white "request a demo" button on the right — all the same height
// (h-11). Pinned to the viewport (position: fixed) with symmetric insets (top ===
// sides). White text works over the dark hero/chain stages; the pills' dark backdrop
// keeps them legible over light sections too. Rendered once near the app root — see
// home.tsx.
import type { SiteLink } from "@/lib/site";

export interface SiteNavContent {
  brand: string;
  /** In-page section anchors — every item scrolls somewhere real. */
  items: SiteLink[];
  cta: SiteLink;
}

export interface SiteNavProps extends SiteNavContent {
  /** Accessible name for the <nav> landmark. */
  navLabel?: string;
}

const BoltIcon = () => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    className="h-4 w-4"
    fill="currentColor"
  >
    <path d="M13 2 4.5 13.5H11l-1 8.5L19.5 10H13z" />
  </svg>
);

// Shared pill shell — brand and links pills sit in their own rounded plaques.
const PILL =
  "flex h-11 items-center rounded-full border border-white/10 bg-black/30 backdrop-blur-md";

export const SiteNav = ({
  brand,
  items,
  cta,
  navLabel = "Primary",
}: SiteNavProps) => (
  <header className="fixed inset-x-4 top-4 z-50 flex items-center justify-between gap-4 text-white md:inset-x-6 md:top-6">
    <div className="flex items-center gap-3">
      <span className={`${PILL} gap-2 px-5 font-medium`}>
        <BoltIcon />
        {brand}
      </span>
      <nav aria-label={navLabel} className={`${PILL} hidden px-2 md:flex`}>
        {items.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className="rounded-full px-4 py-2 text-sm text-white/80 hover:text-white"
          >
            {item.label}
          </a>
        ))}
      </nav>
    </div>
    <a
      href={cta.href}
      className="inline-flex h-11 items-center rounded-full bg-white px-6 text-sm font-medium text-plum shadow-sm hover:bg-white/90"
    >
      {cta.label}
    </a>
  </header>
);
