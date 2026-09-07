"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Phone, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useSiteSettings } from "@/context/site-settings-context";
import { apiFetch } from "@/lib/api";
import { phoneHref } from "@/lib/site-settings";
import type { MenuItem } from "@/lib/types";
import { cn } from "@/lib/utils";

const fallbackLinks: Pick<MenuItem, "href" | "label">[] = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
  { href: "/posts", label: "Tips" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const site = useSiteSettings();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [links, setLinks] = useState(fallbackLinks);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    apiFetch<MenuItem[]>("/menus/NAVBAR")
      .then((data) => {
        if (data.length) {
          setLinks(data.map((item) => ({ href: item.href, label: item.label })));
        }
      })
      .catch(() => undefined);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-border/70 bg-white transition-shadow duration-300",
        scrolled || open ? "shadow-[0_2px_12px_rgb(19_34_40/0.06)]" : "shadow-none"
      )}
    >
      <div className="page-shell flex h-[4.5rem] items-center justify-between gap-4">
        <Link href="/" className="group flex min-w-0 items-center gap-2.5">
          <Image
            src={site.logoUrl}
            alt={site.siteName}
            width={36}
            height={36}
            className="size-9 object-cover"
            unoptimized
          />
          <span className="font-display truncate text-[1.3rem] font-bold tracking-tight text-ink">
            {site.siteName}
          </span>
        </Link>

        <nav className="hidden items-center gap-0.5 lg:flex">
          {links.map((link) => {
            const active =
              pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
            return (
              <Link
                key={`${link.href}-${link.label}`}
                href={link.href}
                className={cn(
                  "nav-link text-[0.875rem]",
                  active
                    ? "text-primary"
                    : "text-ink/80 hover:text-primary"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          <a
            href={phoneHref(site.phone)}
            className="inline-flex items-center gap-2 text-sm font-semibold text-ink transition hover:text-primary"
          >
            <Phone className="size-3.5 text-primary" strokeWidth={2} />
            {site.phone}
          </a>
          <Button
            asChild
            size="sm"
            className="rounded-md bg-accent px-4 font-semibold text-accent-foreground hover:bg-accent/90"
          >
            <Link href="/book">Get a free quote</Link>
          </Button>
        </div>

        <button
          className="text-ink lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-white px-5 py-5 lg:hidden">
          <div className="flex flex-col gap-1">
            {links.map((link) => {
              const active =
                pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
              return (
                <Link
                  key={`${link.href}-${link.label}-mobile`}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "nav-link py-3 text-[0.95rem] text-ink",
                    active ? "font-bold text-primary" : "hover:text-primary"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
            <a
              href={phoneHref(site.phone)}
              className="nav-link inline-flex items-center gap-2 py-3 text-[0.95rem] font-semibold text-ink hover:text-primary"
              onClick={() => setOpen(false)}
            >
              <Phone className="size-3.5 text-primary" />
              {site.phone}
            </a>
            <Link
              href="/book"
              onClick={() => setOpen(false)}
              className="nav-link py-3 text-[0.95rem] font-bold text-accent"
            >
              Get a free quote
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
