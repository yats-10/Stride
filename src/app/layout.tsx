import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";

import {
  generateMetadata,
  generateViewport,
} from "@/utils/seo/generate-page-metadata";
import { getSiteStructuredData } from "@/utils/seo/structured-data";
import { siteConfig } from "@/lib/site";

import { LazyCookie } from "@/components/common/Cookie";
import { AdaptiveGrid } from "@/components/common/grid";
import { ReducedMotion } from "@/components/common/reduced-motion";
import { Preloader } from "@/components/common/preloader";
import { ScrollLayout } from "@/layouts/scroll-layout";

import "@/app/globals.css";

const mulish = localFont({
  variable: "--font-mulish",
  display: "swap",
  src: [
    { path: "./fonts/Mulish-Light.ttf", weight: "300", style: "normal" },
    { path: "./fonts/Mulish-Regular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/Mulish-Medium.ttf", weight: "500", style: "normal" },
  ],
});

// Homepage title carries the brand + tagline (keyword-rich); subpages pass their own.
export const metadata: Metadata = generateMetadata({
  title: `${siteConfig.name} — ${siteConfig.tagline}`,
});
export const viewport: Viewport = generateViewport();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${mulish.variable}`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(getSiteStructuredData()),
          }}
        />
        <Preloader />
        <ScrollLayout>
          {/* coef=1 → root font-size scales fully proportionally with the viewport
              on displays wider than the base width, so the rem-based layout grows to
              fill large monitors instead of staying small. */}
          <AdaptiveGrid coef={1} />
          <ReducedMotion />
          <LazyCookie />
          {children}
        </ScrollLayout>
      </body>
    </html>
  );
}
