"use client";

import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { PageBanner, PageCta } from "@/components/layout/page-banner";
import { useSiteSettings } from "@/context/site-settings-context";
import { apiFetch } from "@/lib/api";
import { brand } from "@/lib/brand";
import { sanitizeRichText } from "@/lib/sanitize";
import type { PageItem } from "@/lib/types";

export default function AboutPage() {
  const site = useSiteSettings();
  const [page, setPage] = useState<PageItem | null>(null);

  useEffect(() => {
    apiFetch<PageItem>("/pages/about")
      .then(setPage)
      .catch(() => setPage(null));
  }, []);

  return (
    <div className="page-fill bg-atmosphere">
      <PageBanner
        title={page?.title || "Professional local cleaning you can trust"}
        description="Trained cleaners, flexible bookings, and consistent results across Busselton."
      />

      <div className="page-shell page-pad flex-1">
        {page?.content ? (
          <div
            className="prose prose-neutral mb-12 max-w-3xl text-[1.05rem] leading-relaxed text-foreground/85"
            dangerouslySetInnerHTML={{ __html: sanitizeRichText(page.content) }}
          />
        ) : null}

        <section className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="media-frame relative aspect-[4/5] w-full overflow-hidden sm:aspect-[5/6] lg:max-h-[560px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={site.aboutImageUrl}
              alt={`${site.siteName} cleaning team`}
              className="absolute inset-0 size-full object-cover"
              loading="lazy"
            />
          </div>
          <div className="max-w-lg">
            <p className="section-label">Our story</p>
            <h2 className="section-title mt-3">Reliable cleans for homes and workplaces</h2>
            {!page?.content ? (
              <>
                <p className="page-lead mt-5">{brand.about}</p>
                <p className="mt-4 text-[1.02rem] leading-relaxed text-muted-foreground">
                  {brand.aboutExtended}
                </p>
              </>
            ) : (
              <p className="page-lead mt-5">{brand.about}</p>
            )}
            <ul className="mt-8 space-y-3">
              {brand.promises.map((promise) => (
                <li
                  key={promise}
                  className="flex items-start gap-3 text-sm font-medium text-ink sm:text-base"
                >
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" strokeWidth={1.75} />
                  {promise}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mt-16 border-t border-border/70 pt-14">
          <p className="section-label">How we work</p>
          <h2 className="section-title mt-3 max-w-2xl">A clear process from quote to clean</h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {brand.howItWorks.map((item) => (
              <div key={item.step} className="border-t border-primary/20 pt-5">
                <p className="font-display text-sm font-bold text-accent">{item.step}</p>
                <h3 className="mt-3 font-display text-xl text-ink sm:text-[1.35rem]">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-14">
          <PageCta
            title="Ready to book with us?"
            description="Request a free quote online — or call us and we’ll help you choose the right clean."
            primaryHref="/book"
            primaryLabel="Get a free quote"
            secondaryHref="/contact"
            secondaryLabel="Contact"
          />
        </div>
      </div>
    </div>
  );
}
