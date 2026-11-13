"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, CheckCircle2, Mail, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageCta } from "@/components/layout/page-banner";
import { useSiteSettings } from "@/context/site-settings-context";
import { apiFetch } from "@/lib/api";
import { brand, stationServices } from "@/lib/brand";
import { emailHref, phoneHref } from "@/lib/site-settings";
import type { ServiceItem } from "@/lib/types";

function asServiceItems(items: typeof stationServices): ServiceItem[] {
  return items as unknown as ServiceItem[];
}

function serviceImage(service: ServiceItem) {
  return service.imageUrl || service.image || brand.aboutImage;
}

export default function HomePage() {
  const site = useSiteSettings();
  const heroMinHeight = `${site.heroHeight}svh`;
  const [services, setServices] = useState<ServiceItem[]>(asServiceItems(stationServices));

  useEffect(() => {
    apiFetch<ServiceItem[]>("/api/services")
      .then((data) => {
        const active = data
          .filter((s) => s.active)
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
        if (active.length) setServices(active);
      })
      .catch(() => undefined);
  }, []);

  const featured = services.filter((s) => s.featured);
  const display = (featured.length ? featured : services).slice(0, 6);

  return (
    <div className="bg-atmosphere">
      {/* Hero — brand-first full-bleed (international cleaning standard) */}
      <section
        id="home"
        className="relative overflow-hidden"
        style={{ minHeight: heroMinHeight }}
      >
        <div
          className="absolute inset-0 animate-ken bg-cover bg-center"
          style={{ backgroundImage: `url('${site.bannerUrl}')` }}
        />
        <div className="hero-scrim absolute inset-0" />

        <div
          className="page-shell relative flex items-center"
          style={{ minHeight: heroMinHeight }}
        >
          <div className="w-full max-w-2xl py-10 sm:py-12">
            <p className="animate-rise font-display text-[clamp(2.5rem,6.2vw,3.85rem)] leading-[1.02] font-bold tracking-tight text-white text-balance">
              {site.siteName}
            </p>
            <h1 className="animate-rise delay-1 mt-4 max-w-lg text-[1.12rem] leading-relaxed font-normal text-white/90 sm:text-[1.22rem]">
              {site.tagline}
            </h1>
            <div className="animate-rise delay-2 mt-8 flex flex-wrap items-center gap-3 sm:gap-4">
              <Button
                asChild
                size="lg"
                className="h-12 rounded-md bg-accent px-7 text-base text-accent-foreground hover:bg-accent/90"
              >
                <Link href="/book">
                  Get a free quote <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 rounded-md border-white/35 bg-white/10 text-white backdrop-blur-sm hover:bg-white/18 hover:text-white"
              >
                <a href={phoneHref(site.phone)}>
                  <Phone className="size-4" /> Call {site.phone}
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip — market standard below hero */}
      <section className="trust-strip">
        <div className="page-shell grid gap-6 py-7 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8 lg:py-8">
          {brand.trustSignals.map((item, i) => (
            <div
              key={item.label}
              className={`flex gap-3 ${i % 4 === 0 ? "animate-rise" : i % 4 === 1 ? "animate-rise delay-1" : i % 4 === 2 ? "animate-rise delay-2" : "animate-rise delay-3"}`}
            >
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" strokeWidth={1.75} />
              <div>
                <p className="text-sm font-bold text-ink">{item.label}</p>
                <p className="mt-0.5 text-xs leading-snug text-muted-foreground sm:text-[0.8125rem]">
                  {item.detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Services */}
      <section id="services" className="section-space">
        <div className="page-shell">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div className="max-w-2xl">
              <p className="section-label">Our services</p>
              <h2 className="section-title mt-3">Cleaning for every space</h2>
              <p className="page-lead mt-4">
                Residential, office, and commercial cleans — book online or request a tailored quote.
              </p>
            </div>
            <Link
              href="/services"
              className="inline-flex shrink-0 items-center gap-2 text-sm font-bold text-primary transition hover:gap-3"
            >
              View all services <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="mt-12 grid gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
            {display.map((service, i) => (
              <Link
                key={service.id}
                href={`/book?service=${service.slug}`}
                className={`group block ${
                  i % 3 === 0
                    ? "animate-rise"
                    : i % 3 === 1
                      ? "animate-rise delay-1"
                      : "animate-rise delay-2"
                }`}
              >
                <div
                  className="media-frame aspect-[4/3] bg-cover bg-center transition duration-500 group-hover:brightness-[0.97]"
                  style={{ backgroundImage: `url('${serviceImage(service)}')` }}
                />
                <div className="mt-5">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-display text-[1.35rem] text-ink transition group-hover:text-primary sm:text-xl">
                      {service.name}
                    </h3>
                    <ArrowUpRight className="size-4 shrink-0 text-primary/40 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {service.shortDescription}
                  </p>
                  <p className="mt-4 text-xs font-bold tracking-[0.14em] text-accent uppercase">
                    Book this clean
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-border/70 bg-white">
        <div className="page-shell section-space">
          <div className="max-w-2xl">
            <p className="section-label">How it works</p>
            <h2 className="section-title mt-3">Book a clean in three simple steps</h2>
          </div>
          <div className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
            {brand.howItWorks.map((item, i) => (
              <div
                key={item.step}
                className={
                  i === 0 ? "animate-rise" : i === 1 ? "animate-rise delay-1" : "animate-rise delay-2"
                }
              >
                <p className="font-display text-sm font-bold text-accent">{item.step}</p>
                <h3 className="mt-3 font-display text-xl text-ink">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="section-space">
        <div className="page-shell">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
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
              <p className="section-label">Why {site.siteName}</p>
              <h2 className="section-title mt-3">Local cleaning you can rely on</h2>
              <p className="page-lead mt-5">{brand.about}</p>
              <ul className="mt-8 space-y-3">
                {brand.promises.map((promise) => (
                  <li key={promise} className="flex items-start gap-3 text-sm font-medium text-ink sm:text-base">
                    <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" strokeWidth={1.75} />
                    {promise}
                  </li>
                ))}
              </ul>
              <Link
                href="/about"
                className="mt-9 inline-flex items-center gap-2 text-sm font-bold text-primary transition hover:gap-3"
              >
                Learn more about us <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="border-t border-border/70 bg-white">
        <div className="page-shell section-space space-y-10">
          <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16">
            <div>
              <p className="section-label">Get in touch</p>
              <h2 className="section-title mt-3">Ready for a spotless space?</h2>
              <p className="page-lead mt-4">
                Call, email, or book online — we&apos;ll help you pick the right clean for your home
                or workplace in Busselton.
              </p>
            </div>
            <div className="space-y-5">
              <a href={phoneHref(site.phone)} className="group flex items-center gap-4 text-ink">
                <span className="flex size-10 items-center justify-center rounded-md bg-mist text-primary">
                  <Phone className="size-4" strokeWidth={1.75} />
                </span>
                <span className="text-lg font-bold transition group-hover:text-primary">
                  {site.phone}
                </span>
              </a>
              <a href={emailHref(site.email)} className="group flex items-center gap-4 text-ink">
                <span className="flex size-10 items-center justify-center rounded-md bg-mist text-primary">
                  <Mail className="size-4" strokeWidth={1.75} />
                </span>
                <span className="text-base font-medium transition group-hover:text-primary">
                  {site.email}
                </span>
              </a>
              <p className="flex items-start gap-4 text-ink">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-mist text-primary">
                  <MapPin className="size-4" strokeWidth={1.75} />
                </span>
                <span className="pt-2 text-base leading-snug">{site.address}</span>
              </p>
            </div>
          </div>

          <PageCta
            title="Get your free cleaning quote"
            description="Tell us what you need cleaned — we’ll confirm availability and pricing quickly."
            primaryHref="/book"
            primaryLabel="Book online"
            secondaryHref="/contact"
            secondaryLabel="Contact us"
          />
        </div>
      </section>
    </div>
  );
}
