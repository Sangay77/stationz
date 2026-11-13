"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/auth-context";
import { getErrorMessage } from "@/lib/admin-form";
import { brand } from "@/lib/brand";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    try {
      const user = await login(String(form.get("email")), String(form.get("password")));
      router.push(user.role === "ADMIN" || user.role === "STAFF" ? "/admin" : "/");
    } catch (err) {
      setError(
        getErrorMessage(err, "We couldn’t sign you in. Please check your email and password.")
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-fill bg-atmosphere">
      <div className="page-shell flex flex-1 items-center py-12">
        <div className="grid w-full overflow-hidden rounded-xl border border-border/80 bg-white shadow-[0_1px_2px_rgb(19_34_40/0.04)] lg:grid-cols-2">
          <div
            className="relative hidden min-h-[360px] lg:block"
            style={{
              backgroundImage: `linear-gradient(155deg, color-mix(in oklab, var(--primary) 90%, black), color-mix(in oklab, var(--primary) 45%, transparent)), url('${brand.heroImage}')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="absolute inset-0 flex flex-col justify-end p-8 text-white">
              <Image
                src={brand.logo}
                alt={brand.name}
                width={48}
                height={48}
                className="mb-4 size-12 rounded-full object-cover"
                unoptimized
              />
              <p className="font-display text-3xl font-bold">{brand.name}</p>
              <p className="mt-2 max-w-xs text-sm text-white/75">{brand.support}</p>
            </div>
          </div>
          <div className="flex flex-col justify-center p-8 sm:p-10">
            <p className="section-label">Staff access</p>
            <h1 className="page-title mt-2">Sign in</h1>
            <p className="page-lead mt-2">Open the admin workspace to manage the site.</p>
            <form className="mt-8 space-y-4" onSubmit={onSubmit} autoComplete="on">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required autoComplete="username" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full rounded-md" size="lg" disabled={loading}>
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </form>
            <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
              Looking for a clean?{" "}
              <Link href="/book" className="font-semibold text-primary underline-offset-2 hover:underline">
                Get a free quote
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
