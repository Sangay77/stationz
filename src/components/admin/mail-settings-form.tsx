"use client";

import { useEffect, useState } from "react";
import { AdminFeedback, useAdminStatus } from "@/components/admin/feedback";
import { apiFetch } from "@/lib/api";
import { getErrorMessage } from "@/lib/admin-form";
import { useAuth } from "@/context/auth-context";
import type { MailSettings } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const empty: MailSettings = {
  enabled: false,
  host: "smtp.gmail.com",
  port: 587,
  username: "",
  passwordConfigured: false,
  from: "",
  fromName: "STATIONZ",
};

export function MailSettingsForm() {
  const { user } = useAuth();
  const status = useAdminStatus();
  const [form, setForm] = useState<MailSettings>(empty);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await apiFetch<MailSettings>("/admin/mail-settings", { token: user.token });
      setForm(data);
      setPassword("");
    } catch (error) {
      status.error(getErrorMessage(error, "We couldn’t load email settings. Please refresh and try again."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user]);

  async function save() {
    if (!user) return;
    if (form.enabled) {
      if (!form.host.trim() || !form.username.trim() || !form.from.trim()) {
        status.error("Please fill in SMTP host, username, and from address before turning email on.");
        return;
      }
      if (!form.passwordConfigured && !password.trim()) {
        status.error("Please enter an email password (or app password) before turning email on.");
        return;
      }
    }

    setSaving(true);
    try {
      const updated = await apiFetch<MailSettings>("/admin/mail-settings", {
        method: "PUT",
        token: user.token,
        body: {
          enabled: form.enabled,
          host: form.host.trim(),
          port: Number(form.port) || 587,
          username: form.username.trim(),
          password: password.trim() || undefined,
          from: form.from.trim(),
          fromName: form.fromName.trim() || "STATIONZ",
        },
      });
      setForm(updated);
      setPassword("");
      status.success(
        updated.enabled
          ? "Mail settings saved. Booking acknowledgements will send email."
          : "Mail settings saved. Outbound email is disabled."
      );
    } catch (error) {
      status.error(getErrorMessage(error, "We couldn’t save email settings. Please check the details and try again."));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading mail settings…</p>;
  }

  return (
    <div className="space-y-4">
      <AdminFeedback feedback={status.feedback} onDismiss={status.clear} />

      <div className="rounded-2xl border border-border/70 bg-white p-5 sm:p-6 space-y-5">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="mt-1 size-4 accent-primary"
            checked={form.enabled}
            onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
          />
          <span>
            <span className="block text-sm font-semibold text-ink">Enable outbound email</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              When on, “Acknowledge &amp; send email” delivers to the customer via SMTP.
            </span>
          </span>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>SMTP host</Label>
            <Input
              value={form.host}
              onChange={(e) => setForm({ ...form, host: e.target.value })}
              placeholder="smtp.gmail.com"
            />
          </div>
          <div className="space-y-2">
            <Label>Port</Label>
            <Input
              type="number"
              value={form.port}
              onChange={(e) => setForm({ ...form, port: Number(e.target.value) || 587 })}
            />
          </div>
          <div className="space-y-2">
            <Label>From name</Label>
            <Input
              value={form.fromName}
              onChange={(e) => setForm({ ...form, fromName: e.target.value })}
              placeholder="STATIONZ"
            />
          </div>
          <div className="space-y-2">
            <Label>SMTP username</Label>
            <Input
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="you@gmail.com"
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label>From address</Label>
            <Input
              type="email"
              value={form.from}
              onChange={(e) => setForm({ ...form, from: e.target.value })}
              placeholder="you@gmail.com"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>SMTP password / app password</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={
                form.passwordConfigured
                  ? "Leave blank to keep the current password"
                  : "Gmail app password"
              }
              autoComplete="new-password"
            />
            <p className="text-xs text-muted-foreground">
              {form.passwordConfigured
                ? "A password is already saved. Enter a new one only if you need to change it."
                : "For Gmail, use an App Password (not your normal login password)."}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Button type="button" disabled={saving} onClick={save}>
            {saving ? "Saving…" : "Save mail settings"}
          </Button>
          <p className="text-xs text-muted-foreground">
            Status: {form.enabled ? "enabled" : "disabled"}
            {form.passwordConfigured ? " · password saved" : " · password missing"}
          </p>
        </div>
      </div>
    </div>
  );
}
