"use client";

import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { PageBanner, PageCta } from "@/components/layout/page-banner";
import { useSiteSettings } from "@/context/site-settings-context";
import { apiFetch } from "@/lib/api";
import { brand } from "@/lib/brand";
import { sanitizeRichText } from "@/lib/sanitize";
import type { PageItem } from "@/lib/types";

/* Styles the raw HTML saved from the admin dashboard (no typography plugin needed). */
const richText = [
  "text-[1.05rem] leading-relaxed text-muted-foreground",
  "[&_h2]:mb-5 [&_h2]:font-display [&_h2]:text-3xl [&_h2]:font-bold [&_h2]:leading-[1.1] [&_h2]:tracking-tight [&_h2]:text-ink sm:[&_h2]:text-[2.6rem]",
  "[&_h3]:mb-2 [&_h3]:mt-8 [&_h3]:font-display [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-ink",
  "[&_p]:mb-4",
  "[&_ul]:mt-7 [&_ul]:space-y-3 [&_ul]:p-0",
  "[&_li]:flex [&_li]:items-start [&_li]:gap-3 [&_li]:text-sm [&_li]:font-medium [&_li]:text-ink sm:[&_li]:text-base",
  "[&_li]:before:mt-0.5 [&_li]:before:flex [&_li]:before:size-5 [&_li]:before:shrink-0 [&_li]:before:items-center [&_li]:before:justify-center [&_li]:before:rounded-full [&_li]:before:bg-primary/10 [&_li]:before:text-xs [&_li]:before:font-bold [&_li]:before:text-primary [&_li]:before:content-['✓']",
].join(" ");

/*
 * The one memorable moment: a fogged pane that gets wiped clear across the photo
 * when the page loads, like a squeegee pass. Skipped for reduced-motion users.
 */
const wipeCss = `
@keyframes stz-wipe { from { transform: translateX(0); } to { transform: translateX(102%); } }
.stz-fog {
  background: color-mix(in oklab, var(--primary) 14%, white);
  border-right: 3px solid rgb(255 255 255 / 0.95);
  backdrop-filter: blur(10px);
  animation: stz-wipe 1.3s cubic-bezier(0.65, 0, 0.35, 1) 0.3s both;
}
@media (prefers-reduced-motion: reduce) { .stz-fog { display: none; } }
`;

export default function AboutPage() {
  const site = useSiteSettings();
  const [page, setPage] = useState<PageItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<PageItem>("/api/pages/about")
      .then(setPage)
      .catch(() => setPage(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-fill bg-atmosphere">
      <style>{wipeCss}</style>

      <PageBanner
        title={page?.title || "Professional local cleaning you can trust"}
        description="Trained cleaners, flexible bookings, and consistent results across Busselton."
      />

      <div className="page-shell page-pad flex-1">
        <section className="grid items-center gap-12 lg:grid-cols-[1fr_0.9fr] lg:gap-20">
          {/* Story: controlled from the admin dashboard */}
          <div className="max-w-xl">
            {loading ? (
              <div className="space-y-4" aria-hidden="true">
                <div className="h-10 w-4/5 animate-pulse rounded bg-border/60" />
                <div className="h-4 w-full animate-pulse rounded bg-border/50" />
                <div className="h-4 w-11/12 animate-pulse rounded bg-border/50" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-border/50" />
              </div>
            ) : page?.content ? (
              <div
                className={richText}
                dangerouslySetInnerHTML={{ __html: sanitizeRichText(page.content) }}
              />
            ) : (
              <>
                <h2 className="section-title">Reliable cleans for homes and workplaces</h2>
                <p className="page-lead mt-5">{brand.about}</p>
                <ul className="mt-7 space-y-3">
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
              </>
            )}
          </div>

          {/* Photo with an offset outline and the wipe-clear reveal */}
          <div className="relative">
            <div
              className="absolute -bottom-3 -right-3 hidden size-full rounded-xl border border-primary/30 sm:block"
              aria-hidden="true"
            />
            <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-muted sm:aspect-[5/6] lg:max-h-[560px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={site.aboutImageUrl}
                alt={`${site.siteName} cleaning team at work`}
                className="absolute inset-0 size-full object-cover"
              />
              <div className="stz-fog pointer-events-none absolute inset-0" aria-hidden="true" />
            </div>
          </div>
        </section>

        {/* Trust strip */}
        <section className="mt-20 grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-4 lg:gap-x-10">
          {brand.trustSignals.map((item) => (
            <div key={item.label} className="border-t border-primary/25 pt-4">
              <p className="font-display text-lg font-bold text-ink">{item.label}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.detail}</p>
            </div>
          ))}
        </section>

        <div className="mt-16">
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
