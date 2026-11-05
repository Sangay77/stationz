"use client";

import { useEffect, useState } from "react";
import { AdminFeedback, useAdminStatus } from "@/components/admin/feedback";
import { apiFetch } from "@/lib/api";
import { getErrorMessage } from "@/lib/admin-form";
import { useAuth } from "@/context/auth-context";
import type { ContactItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function AdminMessagesPage() {
  const { user } = useAuth();
  const status = useAdminStatus();
  const [messages, setMessages] = useState<ContactItem[]>([]);

  const load = async () => {
    if (!user) return;
    try {
      const data = await apiFetch<ContactItem[]>("/admin/messages", { token: user.token });
      setMessages(data);
    } catch (error) {
      status.error(getErrorMessage(error, "We couldn’t load messages. Please refresh and try again."));
    }
  };

  useEffect(() => {
    load();
  }, [user]);

  async function markRead(id: number) {
    if (!user) return;
    try {
      await apiFetch(`/admin/messages/${id}/read`, { method: "PATCH", token: user.token });
      status.success("Message marked as read.");
      await load();
      window.dispatchEvent(new Event("admin-messages-changed"));
    } catch (error) {
      status.error(getErrorMessage(error, "We couldn’t update that message. Please try again."));
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Messages</h1>
        <p className="mt-1 text-sm text-muted-foreground">Contact form inquiries from the website.</p>
      </div>

      <AdminFeedback feedback={status.feedback} onDismiss={status.clear} />

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
        {messages.length === 0 && (
          <p className="rounded-xl border border-dashed px-4 py-8 text-sm text-muted-foreground">
            No messages yet.
          </p>
        )}
      </div>
    </div>
  );
}
