"use client";

import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageBanner } from "@/components/layout/page-banner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";
import { brand, stationServices } from "@/lib/brand";
import { useSiteSettings } from "@/context/site-settings-context";
import { phoneHref } from "@/lib/site-settings";
import type { ServiceItem } from "@/lib/types";

function asServiceItems(items: typeof stationServices): ServiceItem[] {
  return items as unknown as ServiceItem[];
}

export default function BookForm() {
  const site = useSiteSettings();
  const searchParams = useSearchParams();
  const [services, setServices] = useState<ServiceItem[]>(asServiceItems(stationServices));
  const [serviceId, setServiceId] = useState<string>("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiFetch<ServiceItem[]>("/services")
      .then((data) => {
        const active = data.filter((s) => s.active).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
        if (active.length) setServices(active);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!services.length) return;
    const preset = searchParams.get("service");
    if (preset) {
      const match = services.find((s) => s.slug === preset || String(s.id) === preset);
      setServiceId(String(match?.id ?? services[0].id));
    } else if (!serviceId) {
      setServiceId(String(services[0].id));
    }
  }, [searchParams, services, serviceId]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    setLoading(true);
    setStatus(null);
    setError(null);
    const form = new FormData(formEl);
    try {
      await apiFetch("/bookings", {
        method: "POST",
        body: {
          serviceId: Number(serviceId),
          customerName: form.get("customerName"),
          customerEmail: form.get("customerEmail"),
          customerPhone: form.get("customerPhone"),
          preferredDate: form.get("preferredDate"),
          preferredTime: form.get("preferredTime") || null,
          address: form.get("address"),
          propertyType: form.get("propertyType"),
          notes: form.get("notes"),
        },
      });
      setStatus("Booking received! We’ll confirm your appointment shortly.");
      formEl.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create booking. Please call us instead.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-fill bg-atmosphere">
      <PageBanner
        title="Book a professional clean"
        description="Request a free quote online — we’ll confirm your appointment shortly."
      />

      <div className="page-shell page-pad flex-1">
        <p className="page-lead mb-10 max-w-2xl">{brand.appointmentBlurb}</p>

        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
          <div>
            <p className="section-label">Prefer to talk?</p>
            <h2 className="mt-3 font-display text-2xl text-ink">Call us for a fast quote</h2>
            <p className="page-lead mt-4 max-w-md">
              Speak with the team on{" "}
              <a href={phoneHref(site.phone)} className="font-semibold text-primary">
                {site.phone}
              </a>{" "}
              — open {site.hours}.
            </p>
          </div>

          <form className="surface-panel w-full space-y-5 rounded-xl p-6 sm:p-8" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label>Service</Label>
              <Select value={serviceId} onValueChange={setServiceId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a service" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={String(service.id)}>
                      {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="customerName">Full name</Label>
                <Input id="customerName" name="customerName" required maxLength={120} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerEmail">Email</Label>
                <Input id="customerEmail" name="customerEmail" type="email" required maxLength={180} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="customerPhone">Phone</Label>
                <Input id="customerPhone" name="customerPhone" maxLength={40} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="propertyType">Property type</Label>
                <Input
                  id="propertyType"
                  name="propertyType"
                  placeholder="Home, office, commercial..."
                  maxLength={80}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="preferredDate">Preferred date</Label>
                <Input id="preferredDate" name="preferredDate" type="date" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="preferredTime">Preferred time</Label>
                <Input id="preferredTime" name="preferredTime" type="time" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" name="address" required maxLength={255} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Access instructions, focus areas..."
                className="min-h-28"
                maxLength={2000}
              />
            </div>
            {status && <p className="text-sm font-medium text-primary">{status}</p>}
            {error && (
              <p className="text-sm text-destructive">
                {error} Or call{" "}
                <a href={phoneHref(site.phone)} className="underline">
                  {site.phone}
                </a>
                .
              </p>
            )}
            <Button
              type="submit"
              size="lg"
              className="h-12 rounded-md bg-accent text-accent-foreground hover:bg-accent/90"
              disabled={loading || !serviceId}
            >
              {loading ? "Submitting..." : "Request free quote"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
