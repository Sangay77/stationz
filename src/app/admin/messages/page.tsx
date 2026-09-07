"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import type { ContactItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function AdminMessagesPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ContactItem[]>([]);

  const load = () => {
    if (!user) return;
    apiFetch<ContactItem[]>("/admin/messages", { token: user.token }).then(setMessages);
  };

  useEffect(load, [user]);

  async function markRead(id: number) {
    if (!user) return;
    await apiFetch(`/admin/messages/${id}/read`, { method: "PATCH", token: user.token });
    load();
    window.dispatchEvent(new Event("admin-messages-changed"));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Messages</h1>
        <p className="mt-1 text-sm text-muted-foreground">Contact form inquiries from the website.</p>
      </div>
      <div className="space-y-3">
        {messages.map((message) => (
          <div key={message.id} className="rounded-xl border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-medium">{message.name}</p>
                <p className="text-xs text-muted-foreground">{message.email} · {message.subject || "General"}</p>
              </div>
              <Badge className={message.read ? "bg-muted text-muted-foreground" : undefined}>
                {message.read ? "Read" : "Unread"}
              </Badge>
            </div>
            <p className="mt-3 text-sm">{message.message}</p>
            {!message.read && (
              <Button size="sm" className="mt-3" variant="outline" onClick={() => markRead(message.id)}>
                Mark as read
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
