"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminFeedback, useAdminStatus } from "@/components/admin/feedback";
import { apiFetch } from "@/lib/api";
import { getErrorMessage } from "@/lib/admin-form";
import { useAuth } from "@/context/auth-context";
import type { BookingItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const statuses = ["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

export default function AdminBookingsPage() {
  const { user } = useAuth();
  const status = useAdminStatus();
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [filter, setFilter] = useState<string>("ALL");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<number, string>>({});
  const [openAckId, setOpenAckId] = useState<number | null>(null);

  const load = async () => {
    if (!user) return;
    try {
      const data = await apiFetch<BookingItem[]>("/admin/bookings", { token: user.token });
      setBookings(data);
    } catch (error) {
      status.error(getErrorMessage(error, "We couldn’t load bookings. Please refresh and try again."));
    }
  };

  useEffect(() => {
    load();
  }, [user]);

  const visible = useMemo(
    () => (filter === "ALL" ? bookings : bookings.filter((b) => b.status === filter)),
    [bookings, filter]
  );

  const pendingCount = bookings.filter((b) => b.status === "PENDING").length;

  async function updateStatus(id: number, next: string) {
    if (!user) return;
    setBusyId(id);
    try {
      await apiFetch(`/admin/bookings/${id}/status`, {
        method: "PATCH",
        token: user.token,
        body: { status: next },
      });
      status.success(`Booking #${id} marked ${next}.`);
      await load();
    } catch (error) {
      status.error(getErrorMessage(error, "We couldn’t update that booking status. Please try again."));
    } finally {
      setBusyId(null);
    }
  }

  async function acknowledge(booking: BookingItem) {
    if (!user) return;
    setBusyId(booking.id);
    try {
      const updated = await apiFetch<BookingItem>(`/admin/bookings/${booking.id}/acknowledge`, {
        method: "POST",
        token: user.token,
        body: {
          message: replyDrafts[booking.id]?.trim() || undefined,
          status: "CONFIRMED",
        },
      });
      status.success(
        updated.acknowledgmentEmailSent
          ? `Acknowledged booking #${booking.id} and emailed ${booking.customerEmail}.`
          : `Acknowledged booking #${booking.id}. Email was not sent (mail not configured) — status saved.`
      );
      setOpenAckId(null);
      await load();
    } catch (error) {
      status.error(getErrorMessage(error, "We couldn’t acknowledge that booking. Please try again."));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-ink">Bookings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review requests, update status, and acknowledge customers by email.
            {pendingCount > 0 ? ` ${pendingCount} pending.` : ""}
          </p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {statuses.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <AdminFeedback feedback={status.feedback} onDismiss={status.clear} />

      <div className="space-y-3">
        {visible.map((booking) => {
          const isOpen = openAckId === booking.id;
          return (
            <div
              key={booking.id}
              className={`rounded-xl border p-4 ${
                booking.status === "PENDING" ? "border-amber-200 bg-amber-50/40" : "border-border bg-white"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-ink">
                    #{booking.id} · {booking.customerName} · {booking.serviceName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {booking.preferredDate} {booking.preferredTime || ""} · {booking.address}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {booking.customerEmail}
                    {booking.customerPhone ? ` · ${booking.customerPhone}` : ""}
                    {booking.propertyType ? ` · ${booking.propertyType}` : ""}
                  </p>
                  {booking.notes && <p className="mt-2 text-sm text-foreground/80">{booking.notes}</p>}
                  {booking.acknowledgedAt && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Acknowledged {new Date(booking.acknowledgedAt).toLocaleString()}
                      {booking.acknowledgmentEmailSent ? " · email sent" : " · email not sent"}
                    </p>
                  )}
                  {booking.acknowledgmentMessage && (
                    <p className="mt-1 text-xs text-foreground/70">
                      Message: {booking.acknowledgmentMessage}
                    </p>
                  )}
                </div>
                <Badge
                  className={
                    booking.status === "PENDING"
                      ? "bg-amber-100 text-amber-900"
                      : "bg-primary/10 text-primary"
                  }
                >
                  {booking.status}
                </Badge>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Select
                  value={booking.status}
                  onValueChange={(v) => updateStatus(booking.id, v)}
                  disabled={busyId === booking.id}
                >
                  <SelectTrigger className="w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  disabled={busyId === booking.id}
                  onClick={() => setOpenAckId(isOpen ? null : booking.id)}
                >
                  {isOpen ? "Cancel review" : "Review & email"}
                </Button>
              </div>

              {isOpen && (
                <div className="mt-4 space-y-3 rounded-lg border border-border bg-white p-3">
                  <div className="space-y-2">
                    <Label>Acknowledgement message to customer</Label>
                    <Textarea
                      className="min-h-24"
                      placeholder="Optional custom message. Leave blank to use the default confirmation text."
                      value={replyDrafts[booking.id] ?? ""}
                      onChange={(e) =>
                        setReplyDrafts((prev) => ({ ...prev, [booking.id]: e.target.value }))
                      }
                      maxLength={2000}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This confirms the booking and emails {booking.customerEmail}.
                  </p>
                  <Button
                    size="sm"
                    disabled={busyId === booking.id}
                    onClick={() => acknowledge(booking)}
                  >
                    {busyId === booking.id ? "Sending…" : "Acknowledge & send email"}
                  </Button>
                </div>
              )}
            </div>
          );
        })}
        {visible.length === 0 && (
          <p className="text-sm text-muted-foreground">No bookings in this view.</p>
        )}
      </div>
    </div>
  );
}
