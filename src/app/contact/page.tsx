"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Mail, MapPin, Phone } from "lucide-react";
import { PageBanner } from "@/components/layout/page-banner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";
import { getErrorMessage } from "@/lib/admin-form";
import { brand } from "@/lib/brand";
import { sanitizeRichText } from "@/lib/sanitize";
import { useSiteSettings } from "@/context/site-settings-context";
import { emailHref, phoneHref } from "@/lib/site-settings";
import type { PageItem } from "@/lib/types";

export default function ContactPage() {
  const site = useSiteSettings();
  const [page, setPage] = useState<PageItem | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiFetch<PageItem>("/pages/contact")
      .then(setPage)
      .catch(() => setPage(null));
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    setLoading(true);
    setStatus(null);
    setError(null);
    const form = new FormData(formEl);
    try {
      await apiFetch("/contact", {
        method: "POST",
        body: {
          name: form.get("name"),
          email: form.get("email"),
          phone: form.get("phone"),
          subject: form.get("subject"),
          message: form.get("message"),
        },
      });
      setStatus("Thanks! We’ll get back to you soon.");
      formEl.reset();
    } catch (err) {
      setError(
        getErrorMessage(err, "We couldn’t send your message. Please try again or call us.")
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-fill bg-atmosphere">
      <PageBanner
        title={page?.title || "Request a quote or ask a question"}
        description="Call, email, or send a message — we’ll help you choose the right clean."
      />

      <section className="page-shell page-pad flex-1">
        {page?.content ? (
          <div
            className="prose prose-neutral mb-10 max-w-3xl text-[1.05rem] leading-relaxed text-foreground/85"
            dangerouslySetInnerHTML={{ __html: sanitizeRichText(page.content) }}
          />
        ) : (
          <p className="page-lead mb-10 max-w-2xl">{brand.contactIntro}</p>
        )}

        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
          <div className="space-y-6">
            <div>
              <p className="section-label">Reach us</p>
              <h2 className="section-title mt-3">We’re ready to help</h2>
              <p className="page-lead mt-3">Prefer to talk? Call during business hours for a fast quote.</p>
            </div>
            <div className="space-y-3">
              <a
                href={phoneHref(site.phone)}
                className="flex items-start gap-3 border border-border/80 bg-white p-5 transition hover:border-primary/30"
              >
                <Phone className="mt-0.5 size-5 text-primary" strokeWidth={1.75} />
                <div>
                  <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
                    Phone
                  </p>
                  <p className="mt-1 text-base font-semibold text-ink">{site.phone}</p>
                </div>
              </a>
              <a
                href={emailHref(site.email)}
                className="flex items-start gap-3 border border-border/80 bg-white p-5 transition hover:border-primary/30"
              >
                <Mail className="mt-0.5 size-5 text-primary" strokeWidth={1.75} />
                <div>
                  <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
                    Email
                  </p>
                  <p className="mt-1 text-base font-semibold text-ink">{site.email}</p>
                </div>
              </a>
              <div className="flex items-start gap-3 border border-border/80 bg-white p-5">
                <MapPin className="mt-0.5 size-5 text-primary" strokeWidth={1.75} />
                <div>
                  <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
                    Address
                  </p>
                  <p className="mt-1 text-base font-semibold text-ink">{site.address}</p>
                  <p className="mt-1 text-sm text-muted-foreground">Open {site.hours}</p>
                </div>
              </div>
            </div>
          </div>

          <form className="surface-panel w-full space-y-5 rounded-xl p-6 sm:p-8" onSubmit={onSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" required maxLength={120} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required maxLength={180} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" maxLength={40} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  name="subject"
                  placeholder="Quote, booking question..."
                  maxLength={180}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea id="message" name="message" required className="min-h-36" maxLength={4000} />
            </div>
            {status && <p className="font-medium text-primary">{status}</p>}
            {error && <p className="text-destructive">{error}</p>}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="submit"
                size="lg"
                className="h-12 rounded-md bg-accent text-accent-foreground hover:bg-accent/90"
                disabled={loading}
              >
                {loading ? "Sending..." : "Send message"}
              </Button>
              <Link
                href="/book"
                className="inline-flex items-center gap-1.5 font-semibold text-primary transition hover:gap-2.5"
              >
                Or book a clean online <ArrowUpRight className="size-4" />
              </Link>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
