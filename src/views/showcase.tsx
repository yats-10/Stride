"use client";

// Row of full-height columns split by thin vertical lines. On hover a column's photo
// reveals bottom-to-top through a clip-path mask, and a white semi-transparent
// gradient scales up from the base (behind the label) so the dark caption keeps good
// contrast over the image — both are springs via <Hover> (ADR-0002). The whole column
// is the hover target (Hover's `trigger`) — a clip-collapsed element has no hit area,
// so it can't trigger itself. A display heading + outline CTA sit over the top-right
// (without blocking column hover); each column is labelled at its base. Photos live in
// public/assets/images/3rd/.
import { useRef } from "react";
import Image from "next/image";
import { Hover } from "@/components/animation/springs/hover";
import { AnimatedHeading } from "@/components/common/animated-heading";
import type { SiteLink } from "@/lib/site";

export interface ShowcaseItem {
  prefix: string;
  name: string;
  /** Column image (public path). */
  image: string;
}

export interface ShowcaseContent {
  heading: string;
  cta: SiteLink;
  items: ShowcaseItem[];
}

export interface ShowcaseProps {
  content: ShowcaseContent;
}

const REVEAL_CONFIG = { tension: 170, friction: 26 };

const Column = ({ prefix, name, image }: ShowcaseItem) => {
  const ref = useRef<HTMLElement>(null);
  return (
    <article
      ref={ref}
      className="relative min-h-[38vh] overflow-hidden rounded-2xl lg:min-h-[85vh] lg:rounded-none"
    >
      {/* Touch devices have no hover, so on mobile/tablet the photo is always visible
          (as a card); on lg it's hidden and the hover-reveal below takes over. */}
      <Image
        src={image}
        alt=""
        fill
        sizes="(max-width: 1024px) 50vw, 25vw"
        className="object-cover lg:hidden"
      />

      {/* lg+ : photo revealed bottom-to-top through a clip-path mask on hover */}
      <Hover
        trigger={ref}
        tag="div"
        className="absolute inset-0 hidden will-change-[clip-path] lg:block"
        from={{ clipPath: "inset(100% 0% 0% 0%)" }}
        to={{ clipPath: "inset(0% 0% 0% 0%)" }}
        config={REVEAL_CONFIG}
      >
        <Image src={image} alt="" fill sizes="25vw" className="object-cover" />
      </Hover>

      {/* Label contrast: a fixed dark scrim on mobile/tablet (image always shown); on lg
          a white scrim that scales up from the base on hover. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 via-black/30 to-transparent lg:hidden"
      />
      <Hover
        trigger={ref}
        tag="div"
        className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-1/2 origin-bottom bg-gradient-to-t from-white via-white/80 to-transparent will-change-transform lg:block"
        from={{ transform: "scaleY(0)" }}
        to={{ transform: "scaleY(1)" }}
        config={REVEAL_CONFIG}
      />

      <div className="pointer-events-none absolute inset-x-5 bottom-6 lg:inset-x-6 lg:bottom-8">
        <span className="block text-2xl font-normal leading-[1.05] tracking-tight text-white lg:text-4xl lg:text-black">
          {prefix}
        </span>
        <span className="block text-2xl font-normal leading-[1.05] tracking-tight text-white lg:text-4xl lg:text-black">
          {name}
        </span>
      </div>
    </article>
  );
};

export const Showcase = ({ content }: ShowcaseProps) => {
  const { heading, cta, items } = content;
  return (
    <section
      id="approach"
      aria-labelledby="showcase-title"
      className="relative overflow-hidden border-y border-plum/10 bg-hero-page text-black"
    >
      {/* Heading + CTA. In normal flow above the cards on mobile/tablet; on lg it's
          overlaid on the right half, inset equally (px-12) from the centre line and the
          right edge. On lg it's pointer-events-none so the columns stay hoverable; the
          button re-enables its own. */}
      <div className="relative z-10 px-6 pb-10 pt-14 md:px-10 lg:pointer-events-none lg:absolute lg:left-1/2 lg:right-0 lg:top-14 lg:z-20 lg:px-12 lg:pb-0">
        <AnimatedHeading
          as="h2"
          id="showcase-title"
          className="text-[2rem] font-light leading-[0.95] tracking-tight sm:text-[2.5rem] lg:text-[3rem]"
        >
          {heading}
        </AnimatedHeading>
        <a
          href={cta.href}
          className="pointer-events-auto mt-8 inline-block rounded-full border border-black/30 px-6 py-3 text-sm font-medium text-black hover:bg-black hover:text-hero-page"
        >
          {cta.label}
        </a>
      </div>

      {/* Cards: a 2-column grid with gaps on mobile/tablet; full-height, edge-to-edge,
          lined columns on lg (the hover showcase). */}
      <div className="grid grid-cols-2 gap-4 px-6 pb-6 sm:gap-5 md:px-10 lg:grid-cols-4 lg:gap-0 lg:px-0 lg:pb-0 lg:divide-x lg:divide-plum/10">
        {items.map((item) => (
          <Column
            key={item.name}
            prefix={item.prefix}
            name={item.name}
            image={item.image}
          />
        ))}
      </div>
    </section>
  );
};
