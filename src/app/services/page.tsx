"use client";

import { useEffect, useState } from "react";
import { PageBanner, PageCta } from "@/components/layout/page-banner";
import { ServiceCard } from "@/components/service-card";
import { apiFetch } from "@/lib/api";
import { stationServices } from "@/lib/brand";
import { sanitizeRichText } from "@/lib/sanitize";
import type { PageItem, ServiceItem } from "@/lib/types";

function asServiceItems(items: typeof stationServices): ServiceItem[] {
  return items as unknown as ServiceItem[];
}

export default function ServicesPage() {
  const [services, setServices] = useState<ServiceItem[]>(asServiceItems(stationServices));
  const [page, setPage] = useState<PageItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch<ServiceItem[]>("/api/services").catch(() => [] as ServiceItem[]),
      apiFetch<PageItem>("/api/pages/services").catch(() => null),
    ])
      .then(([serviceData, pageData]) => {
        const active = serviceData
          .filter((s) => s.active)
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
        if (active.length) setServices(active);
        setPage(pageData);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-fill bg-atmosphere">
      <PageBanner
        title={page?.title || "Residential, office & commercial cleaning"}
        description="Choose a service and request a free quote — we’ll confirm timing and details."
      />

      <div className="page-shell page-pad flex-1">
        {page?.content ? (
          <div
            className="prose prose-neutral mb-12 max-w-3xl text-[1.05rem] leading-relaxed text-foreground/85"
            dangerouslySetInnerHTML={{ __html: sanitizeRichText(page.content) }}
          />
        ) : null}

        <div className="grid gap-10 sm:grid-cols-2 xl:grid-cols-3">
          {loading && services.length === 0 && (
            <p className="text-muted-foreground">Loading services...</p>
          )}
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>

        <div className="mt-14">
          <PageCta
            title="Need a quote for your space?"
            description="Tell us your preferred date and we’ll confirm availability."
            primaryHref="/book"
            primaryLabel="Get a free quote"
            secondaryHref="/contact"
            secondaryLabel="Ask a question"
          />
        </div>
      </div>
    </div>
  );
}
