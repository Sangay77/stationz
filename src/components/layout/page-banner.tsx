"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSiteSettings } from "@/context/site-settings-context";
import { cn } from "@/lib/utils";

type PageBannerProps = {
  title: string;
  /** Short supporting line only — longer copy belongs below the banner */
  description?: string;
  /** Override image; defaults to site banner */
  imageUrl?: string;
  className?: string;
  /** @deprecated Unused — kept for existing call sites */
  label?: string;
};

/** Shared inner-page banner — title + short supporting text. */
export function PageBanner({ title, description, imageUrl, className }: PageBannerProps) {
  const site = useSiteSettings();
  const bg = imageUrl || site.bannerUrl;

  return (
    <section className={cn("relative overflow-hidden", className)}>
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('${bg}')` }}
        aria-hidden
      />
      <div className="page-banner-scrim absolute inset-0" aria-hidden />

      <div className="page-shell relative flex min-h-[13.5rem] items-center py-12 sm:min-h-[15rem] sm:py-14 lg:min-h-[16rem]">
        <div className="w-full max-w-2xl">
          <h1 className="font-display text-[clamp(1.75rem,3.6vw,2.5rem)] leading-[1.12] font-bold tracking-tight text-white text-balance">
            {title}
          </h1>
          {description ? (
            <p className="mt-3 max-w-xl text-[1rem] leading-relaxed text-white/90 sm:text-[1.05rem]">
              {description}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

type PageCtaProps = {
  title: string;
  description: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

/** Shared bottom CTA used across public pages. */
export function PageCta({
  title,
  description,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: PageCtaProps) {
  return (
    <div className="cta-band flex w-full flex-col items-start justify-between gap-6 rounded-xl px-7 py-9 sm:flex-row sm:items-center sm:px-10 sm:py-11">
      <div className="max-w-xl">
        <h2 className="font-display text-[clamp(1.4rem,2.4vw,1.85rem)] leading-tight text-white">
          {title}
        </h2>
        <p className="mt-2 text-[1.02rem] leading-relaxed text-white/75">{description}</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button
          asChild
          size="lg"
          className="h-12 rounded-md bg-accent px-6 text-accent-foreground hover:bg-accent/90"
        >
          <Link href={primaryHref}>
            {primaryLabel} <ArrowRight className="size-4" />
          </Link>
        </Button>
        {secondaryHref && secondaryLabel ? (
          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-12 rounded-md border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
          >
            <Link href={secondaryHref}>{secondaryLabel}</Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
