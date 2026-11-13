"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Clock3, Mail, MapPin, Phone } from "lucide-react";
import { useSiteSettings } from "@/context/site-settings-context";
import { apiFetch } from "@/lib/api";
import { emailHref, phoneHref } from "@/lib/site-settings";
import type { MenuItem } from "@/lib/types";

const fallbackExplore = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
  { href: "/posts", label: "Tips & updates" },
  { href: "/contact", label: "Contact" },
  { href: "/book", label: "Book online" },
];

export function SiteFooter() {
  const site = useSiteSettings();
  const [explore, setExplore] = useState(fallbackExplore);

  useEffect(() => {
    apiFetch<MenuItem[]>("/api/menus/FOOTER")
      .then((data) => {
        if (data.length) {
          setExplore(data.map((item) => ({ href: item.href, label: item.label })));
        }
      })
      .catch(() => undefined);
  }, []);

  return (
    <footer className="mt-auto bg-primary text-primary-foreground">
      <div className="page-shell py-14 sm:py-16">
        <div className="grid gap-12 lg:grid-cols-[1.25fr_0.75fr_1fr] lg:gap-16">
          <div>
            <Link href="/" className="inline-flex items-center gap-3">
              <Image
                src={site.logoUrl}
                alt={site.siteName}
                width={40}
                height={40}
                className="size-10 object-cover"
                unoptimized
              />
              <span className="font-display text-2xl font-bold tracking-tight text-white">
                {site.siteName}
              </span>
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/70">
              Professional residential, office, and commercial cleaning across Busselton and the
              surrounding region.
            </p>
            <Link
              href="/book"
              className="mt-7 inline-flex items-center gap-2 rounded-md bg-accent px-5 py-2.5 text-sm font-bold text-accent-foreground transition hover:bg-accent/90"
            >
              Get a free quote
              <ArrowRight className="size-4" />
            </Link>
          </div>

          <div>
            <p className="text-[0.68rem] font-bold tracking-[0.18em] text-white/45 uppercase">
              Explore
            </p>
            <nav className="mt-5 flex flex-col gap-2.5">
              {explore.map((link) => (
                <Link
                  key={`${link.href}-${link.label}`}
                  href={link.href}
                  className="text-sm font-medium text-white/75 transition hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div>
            <p className="text-[0.68rem] font-bold tracking-[0.18em] text-white/45 uppercase">
              Contact
            </p>
            <div className="mt-5 space-y-4 text-sm">
              <a
                href={phoneHref(site.phone)}
                className="flex items-start gap-3 font-semibold text-white transition hover:text-white/90"
              >
                <Phone className="mt-0.5 size-3.5 shrink-0" strokeWidth={1.75} />
                {site.phone}
              </a>
              <a
                href={emailHref(site.email)}
                className="flex items-start gap-3 text-white/75 transition hover:text-white"
              >
                <Mail className="mt-0.5 size-3.5 shrink-0" strokeWidth={1.75} />
                {site.email}
              </a>
              <p className="flex items-start gap-3 text-white/75">
                <MapPin className="mt-0.5 size-3.5 shrink-0" strokeWidth={1.75} />
                {site.address}
              </p>
              <p className="flex items-start gap-3 text-white/75">
                <Clock3 className="mt-0.5 size-3.5 shrink-0" strokeWidth={1.75} />
                {site.hours}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="page-shell flex flex-col gap-2 py-4 text-xs text-white/40 sm:flex-row sm:justify-between">
          <p>
            © {new Date().getFullYear()} {site.siteName}. All rights reserved.
          </p>
          <p>Busselton, Western Australia</p>
        </div>
      </div>
    </footer>
  );
}
