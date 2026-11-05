"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  ExternalLink,
  FileText,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Newspaper,
  PanelTop,
  Settings,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { useSiteSettings } from "@/context/site-settings-context";
import type { DashboardStats } from "@/lib/types";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  badgeKey?: "messages";
  adminOnly?: boolean;
  staffOnly?: boolean;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Content",
    items: [
      { href: "/admin/posts", label: "Posts", icon: Newspaper },
      { href: "/admin/pages", label: "Pages", icon: FileText },
      { href: "/admin/comments", label: "Comments", icon: Heart },
      { href: "/admin/services", label: "Services", icon: Sparkles, adminOnly: true },
    ],
  },
  {
    label: "Design",
    items: [
      { href: "/admin/settings", label: "Settings", icon: Settings, adminOnly: true },
      { href: "/admin/menus", label: "Menus", icon: PanelTop, adminOnly: true },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/admin/bookings", label: "Bookings", icon: CalendarDays, adminOnly: true },
      {
        href: "/admin/messages",
        label: "Messages",
        icon: MessageSquare,
        badgeKey: "messages",
        adminOnly: true,
      },
      { href: "/admin/users", label: "Users", icon: Users, adminOnly: true },
      { href: "/admin/users", label: "My password", icon: Users, staffOnly: true },
    ],
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function initials(firstName?: string, lastName?: string) {
  const a = (firstName || "").trim().charAt(0);
  const b = (lastName || "").trim().charAt(0);
  const value = `${a}${b}`.toUpperCase();
  return value || "A";
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin, canAccessCms, logout } = useAuth();
  const site = useSiteSettings();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [badgePulse, setBadgePulse] = useState(false);
  const prevUnread = useRef<number | null>(null);

  const visibleGroups = useMemo(
    () =>
      navGroups
        .map((group) => ({
          ...group,
          items: group.items.filter((item) => {
            if (item.adminOnly) return isAdmin;
            if (item.staffOnly) return !isAdmin;
            return true;
          }),
        }))
        .filter((group) => group.items.length > 0),
    [isAdmin]
  );

  const allItems = useMemo(() => visibleGroups.flatMap((g) => g.items), [visibleGroups]);

  useEffect(() => {
    if (!loading && (!user || !canAccessCms)) {
      router.replace("/login");
    }
  }, [user, loading, canAccessCms, router]);

  useEffect(() => {
    if (!loading && user && canAccessCms && !isAdmin) {
      const allowed = allItems.some((item) => isActive(pathname, item.href));
      if (!allowed) {
        router.replace("/admin");
      }
    }
  }, [loading, user, canAccessCms, isAdmin, pathname, allItems, router]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const refreshUnread = useCallback(async () => {
    if (!user || !isAdmin) return;
    try {
      const stats = await apiFetch<DashboardStats>("/admin/dashboard", { token: user.token });
      const next = stats.unreadMessages ?? 0;
      if (prevUnread.current !== null && next > prevUnread.current) {
        setBadgePulse(true);
        window.setTimeout(() => setBadgePulse(false), 2200);
      }
      prevUnread.current = next;
      setUnreadMessages(next);
    } catch {
      // keep last known count
    }
  }, [user, isAdmin]);

  useEffect(() => {
    if (!user || !isAdmin) return;
    refreshUnread();
    const id = window.setInterval(refreshUnread, 12000);
    const onRefresh = () => refreshUnread();
    window.addEventListener("admin-messages-changed", onRefresh);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("admin-messages-changed", onRefresh);
    };
  }, [user, isAdmin, refreshUnread]);

  useEffect(() => {
    if (pathname.startsWith("/admin/messages")) {
      refreshUnread();
    }
  }, [pathname, refreshUnread]);

  if (loading || !user || !canAccessCms) {
    return (
      <div className="flex min-h-screen items-center justify-center admin-canvas text-sm text-muted-foreground">
        Checking CMS access...
      </div>
    );
  }

  const pageTitle = allItems.find((item) => isActive(pathname, item.href))?.label || "CMS";
  const userInitials = initials(user.firstName, user.lastName);

  const sidebar = (
    <div className="flex h-full flex-col bg-[var(--admin-sidebar,#0c4a54)] text-white">
      <div className="flex h-14 items-center gap-3 border-b border-white/10 px-4">
        <Image
          src={site.logoUrl}
          alt={site.siteName}
          width={32}
          height={32}
          className="size-8 rounded-md object-cover ring-1 ring-white/15"
          unoptimized
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-tight">{site.siteName}</p>
          <p className="truncate text-[11px] text-white/45">
            {isAdmin ? "Admin console" : "Editor console"}
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-2.5 py-4">
        {visibleGroups.map((group) => (
          <div key={group.label}>
            <p className="mb-1.5 px-3 text-[10px] font-semibold tracking-[0.14em] text-white/35 uppercase">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(pathname, item.href);
                const showMessagesBadge = item.badgeKey === "messages" && unreadMessages > 0;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "relative flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] font-medium transition-colors",
                      active
                        ? "bg-white/12 text-white shadow-[inset_3px_0_0_0_rgb(255_255_255/0.85)]"
                        : "text-white/60 hover:bg-white/[0.06] hover:text-white"
                    )}
                  >
                    <span className="relative shrink-0">
                      <item.icon className="size-4" strokeWidth={1.75} />
                      {showMessagesBadge && (
                        <span
                          className={cn(
                            "absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#e85d04] px-1 text-[10px] font-bold text-white ring-2 ring-[var(--admin-sidebar,#0c4a54)]",
                            badgePulse && "animate-bounce"
                          )}
                          aria-label={`${unreadMessages} unread messages`}
                        >
                          {unreadMessages > 99 ? "99+" : unreadMessages}
                        </span>
                      )}
                    </span>
                    <span className="flex-1">{item.label}</span>
                    {showMessagesBadge && (
                      <span
                        className={cn(
                          "rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold text-white/80",
                          badgePulse && "animate-pulse"
                        )}
                      >
                        {unreadMessages > 99 ? "99+" : unreadMessages}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 p-3">
        <div className="mb-2 flex items-center gap-2.5 rounded-md px-2 py-1.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-white/10 text-[11px] font-semibold tracking-wide text-white">
            {userInitials}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {user.firstName} {user.lastName}
            </p>
            <p className="truncate text-[11px] text-white/40">{user.email}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-[13px] text-white/55 transition hover:bg-white/[0.06] hover:text-white"
        >
          <LogOut className="size-4" strokeWidth={1.75} />
          Log out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen admin-canvas font-sans text-foreground">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 lg:block">{sidebar}</aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-ink/40 backdrop-blur-[1px]"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-64 shadow-2xl">{sidebar}</aside>
        </div>
      )}

      <div className="flex min-h-screen flex-1 flex-col lg:pl-60">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border/70 bg-white/95 px-4 backdrop-blur-sm sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="rounded-md p-1.5 text-ink transition hover:bg-mist lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span>CMS</span>
                <span className="text-border">/</span>
                <span className="truncate font-medium text-ink">{pageTitle}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Link
                href="/admin/messages"
                className={cn(
                  "relative inline-flex size-9 items-center justify-center rounded-md border border-border text-ink transition hover:bg-mist",
                  unreadMessages > 0 && "border-amber-300 bg-amber-50"
                )}
                aria-label={
                  unreadMessages > 0 ? `${unreadMessages} unread messages` : "Messages"
                }
              >
                <MessageSquare className="size-4" strokeWidth={1.75} />
                {unreadMessages > 0 && (
                  <span
                    className={cn(
                      "absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#e85d04] px-1 text-[10px] font-bold text-white",
                      badgePulse && "animate-bounce"
                    )}
                  >
                    {unreadMessages > 99 ? "99+" : unreadMessages}
                  </span>
                )}
              </Link>
            )}
            <Link
              href="/"
              target="_blank"
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-white px-3 text-xs font-semibold text-ink transition hover:bg-mist"
            >
              View site
              <ExternalLink className="size-3.5 opacity-70" />
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
