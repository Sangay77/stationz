"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  FileText,
  LayoutTemplate,
  Mail,
  MessageSquare,
  Newspaper,
  PanelTop,
  Settings,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import type { DashboardStats } from "@/lib/types";
import { cn } from "@/lib/utils";

type Metric = {
  label: string;
  value: string | number;
  href: string;
  hint: string;
  icon: LucideIcon;
  tone?: "default" | "alert";
};

type Shortcut = {
  href: string;
  label: string;
  desc: string;
  icon: LucideIcon;
};

function MetricCard({ metric }: { metric: Metric }) {
  const Icon = metric.icon;
  return (
    <Link
      href={metric.href}
      className={cn(
        "admin-panel group relative flex flex-col gap-4 px-5 py-4 transition-colors hover:border-primary/30",
        metric.tone === "alert" && "border-amber-300/80 bg-amber-50/40"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
          {metric.label}
        </p>
        <span
          className={cn(
            "flex size-8 items-center justify-center rounded-md",
            metric.tone === "alert" ? "bg-amber-100 text-amber-800" : "bg-mist text-primary"
          )}
        >
          <Icon className="size-4" strokeWidth={1.75} />
        </span>
      </div>
      <div>
        <p className="font-display text-[1.85rem] leading-none tracking-tight text-ink">
          {metric.value}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">{metric.hint}</p>
      </div>
    </Link>
  );
}

function ShortcutRow({ item }: { item: Shortcut }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className="group flex items-center gap-3 border-b border-border/70 px-4 py-3.5 last:border-b-0 transition-colors hover:bg-mist/60"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-mist text-primary">
        <Icon className="size-4" strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink">{item.label}</p>
        <p className="truncate text-xs text-muted-foreground">{item.desc}</p>
      </div>
      <ArrowRight className="size-4 shrink-0 text-muted-foreground/50 transition group-hover:translate-x-0.5 group-hover:text-primary" />
    </Link>
  );
}

export default function AdminDashboardPage() {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    apiFetch<DashboardStats>("/admin/dashboard", { token: user.token })
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, [user]);

  const today = useMemo(
    () =>
      new Intl.DateTimeFormat("en-AU", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date()),
    []
  );

  const metrics: Metric[] = isAdmin
    ? [
        {
          label: "Bookings",
          value: loading ? "—" : (stats?.totalBookings ?? 0),
          href: "/admin/bookings",
          hint: `${stats?.pendingBookings ?? 0} pending review`,
          icon: CalendarDays,
          tone: (stats?.pendingBookings ?? 0) > 0 ? "alert" : "default",
        },
        {
          label: "Unread messages",
          value: loading ? "—" : (stats?.unreadMessages ?? 0),
          href: "/admin/messages",
          hint: "Contact form inbox",
          icon: MessageSquare,
          tone: (stats?.unreadMessages ?? 0) > 0 ? "alert" : "default",
        },
        {
          label: "Services",
          value: loading ? "—" : (stats?.totalServices ?? 0),
          href: "/admin/services",
          hint: "Active catalogue",
          icon: Sparkles,
        },
        {
          label: "Posts",
          value: loading ? "—" : (stats?.totalPosts ?? 0),
          href: "/admin/posts",
          hint: "Published & drafts",
          icon: Newspaper,
        },
      ]
    : [
        {
          label: "Posts",
          value: loading ? "—" : (stats?.totalPosts ?? 0),
          href: "/admin/posts",
          hint: "Your content library",
          icon: Newspaper,
        },
        {
          label: "Pages",
          value: loading ? "—" : (stats?.totalPages ?? 0),
          href: "/admin/pages",
          hint: "Site pages",
          icon: FileText,
        },
      ];

  const attentionItems = [
    {
      href: "/admin/bookings",
      label: "Pending bookings",
      count: stats?.pendingBookings ?? 0,
      empty: "No bookings waiting",
      icon: CalendarDays,
    },
    {
      href: "/admin/messages",
      label: "Unread messages",
      count: stats?.unreadMessages ?? 0,
      empty: "Inbox is clear",
      icon: MessageSquare,
    },
  ];

  const contentShortcuts: Shortcut[] = [
    {
      href: "/admin/posts",
      label: "Posts",
      desc: "Create and publish updates",
      icon: Newspaper,
    },
    {
      href: "/admin/pages",
      label: "Pages",
      desc: "Edit About, Contact, and custom pages",
      icon: FileText,
    },
  ];

  const adminShortcuts: Shortcut[] = [
    {
      href: "/admin/settings",
      label: "Settings & branding",
      desc: "Logo, colors, fonts, contact details",
      icon: Settings,
    },
    {
      href: "/admin/settings#email",
      label: "Email (SMTP)",
      desc: "Outbound mail for booking acknowledgements",
      icon: Mail,
    },
    {
      href: "/admin/settings#layout",
      label: "Homepage layout",
      desc: "Banner image and section photos",
      icon: LayoutTemplate,
    },
    {
      href: "/admin/services",
      label: "Services",
      desc: "Catalogue pricing and descriptions",
      icon: Sparkles,
    },
    {
      href: "/admin/menus",
      label: "Menus",
      desc: "Header and footer navigation",
      icon: PanelTop,
    },
    {
      href: "/admin/users",
      label: "Users",
      desc: "Admins and editor access",
      icon: Users,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{today}</p>
          <h1 className="mt-1 font-display text-2xl tracking-tight text-ink sm:text-[1.75rem]">
            {user?.firstName ? `Welcome back, ${user.firstName}` : "Dashboard"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isAdmin
              ? "Overview of bookings, inbox, and site content."
              : "Create and manage posts and pages."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isAdmin ? (
            <>
              <Link
                href="/admin/bookings"
                className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3.5 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90"
              >
                Review bookings
                <ArrowRight className="size-3.5" />
              </Link>
              <Link
                href="/admin/messages"
                className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-white px-3.5 text-xs font-semibold text-ink transition hover:bg-mist"
              >
                Open inbox
              </Link>
            </>
          ) : (
            <Link
              href="/admin/posts"
              className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3.5 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              New post
              <ArrowRight className="size-3.5" />
            </Link>
          )}
        </div>
      </header>

      <section className={cn("grid gap-3", isAdmin ? "sm:grid-cols-2 xl:grid-cols-4" : "sm:grid-cols-2")}>
        {metrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </section>

      <div className={cn("grid gap-4", isAdmin ? "lg:grid-cols-[1fr_1.15fr]" : "lg:grid-cols-1")}>
        {isAdmin && (
          <section className="admin-panel overflow-hidden">
            <div className="border-b border-border/80 px-4 py-3">
              <h2 className="text-sm font-semibold text-ink">Needs attention</h2>
              <p className="text-xs text-muted-foreground">Items waiting for action</p>
            </div>
            <div className="divide-y divide-border/70">
              {attentionItems.map((item) => {
                const Icon = item.icon;
                const hasWork = item.count > 0;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 px-4 py-4 transition-colors hover:bg-mist/60"
                  >
                    <span
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-md",
                        hasWork ? "bg-amber-100 text-amber-800" : "bg-mist text-primary"
                      )}
                    >
                      <Icon className="size-4" strokeWidth={1.75} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-ink">{item.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {hasWork ? `${item.count} to review` : item.empty}
                      </p>
                    </div>
                    {hasWork ? (
                      <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-900">
                        {item.count}
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-muted-foreground">Clear</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        <section className="admin-panel overflow-hidden">
          <div className="border-b border-border/80 px-4 py-3">
            <h2 className="text-sm font-semibold text-ink">Shortcuts</h2>
            <p className="text-xs text-muted-foreground">
              {isAdmin ? "Content, design, and team tools" : "Content tools"}
            </p>
          </div>
          <div>
            {contentShortcuts.map((item) => (
              <ShortcutRow key={item.href} item={item} />
            ))}
            {isAdmin &&
              adminShortcuts.map((item) => <ShortcutRow key={item.href} item={item} />)}
          </div>
        </section>
      </div>
    </div>
  );
}
