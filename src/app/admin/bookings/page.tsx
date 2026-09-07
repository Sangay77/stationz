"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import type { BookingItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const statuses = ["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

export default function AdminBookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingItem[]>([]);

  const load = () => {
    if (!user) return;
    apiFetch<BookingItem[]>("/admin/bookings", { token: user.token }).then(setBookings);
  };

  useEffect(load, [user]);

  async function updateStatus(id: number, status: string) {
    if (!user) return;
    await apiFetch(`/admin/bookings/${id}/status`, {
      method: "PATCH",
      token: user.token,
      body: { status },
    });
    load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Bookings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Track and update cleaning appointments.</p>
      </div>
      <div className="space-y-3">
        {bookings.map((booking) => (
          <div key={booking.id} className="rounded-xl border p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium">{booking.customerName} · {booking.serviceName}</p>
                <p className="text-sm text-muted-foreground">
                  {booking.preferredDate} {booking.preferredTime || ""} · {booking.address}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{booking.customerEmail} {booking.customerPhone}</p>
                {booking.notes && <p className="mt-2 text-sm">{booking.notes}</p>}
              </div>
              <Badge>{booking.status}</Badge>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Select value={booking.status} onValueChange={(v) => updateStatus(booking.id, v)}>
                <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" variant="outline" onClick={() => updateStatus(booking.id, "CONFIRMED")}>Confirm</Button>
            </div>
          </div>
        ))}
        {bookings.length === 0 && <p className="text-sm text-muted-foreground">No bookings yet.</p>}
      </div>
    </div>
  );
}
