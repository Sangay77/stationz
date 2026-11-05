"use client";

import { FormEvent, useEffect, useState } from "react";
import { AdminFeedback, useAdminStatus } from "@/components/admin/feedback";
import { apiFetch } from "@/lib/api";
import { getErrorMessage } from "@/lib/admin-form";
import { useAuth } from "@/context/auth-context";
import type { MenuItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const empty = {
  label: "",
  href: "/",
  location: "NAVBAR" as "NAVBAR" | "FOOTER",
  sortOrder: "0",
  active: true,
};

export default function AdminMenusPage() {
  const { user } = useAuth();
  const status = useAdminStatus();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = async () => {
    if (!user) return;
    try {
      const data = await apiFetch<MenuItem[]>("/admin/menus", { token: user.token });
      setItems(data);
    } catch (error) {
      status.error(getErrorMessage(error, "We couldn’t load menus. Please refresh and try again."));
    }
  };

  useEffect(() => {
    load();
  }, [user]);

  function resetForm() {
    setForm(empty);
    setEditingId(null);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      const body = {
        label: form.label.trim(),
        href: form.href.trim(),
        location: form.location,
        sortOrder: Number(form.sortOrder || 0),
        active: form.active,
      };
      if (editingId) {
        await apiFetch(`/admin/menus/${editingId}`, { method: "PUT", body, token: user.token });
        status.success("Menu item updated.");
      } else {
        await apiFetch("/admin/menus", { method: "POST", body, token: user.token });
        status.success("Menu item created.");
      }
      resetForm();
      await load();
    } catch (error) {
      status.error(getErrorMessage(error, "We couldn’t save that menu item. Please check the form and try again."));
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number, label: string) {
    if (!user) return;
    if (!window.confirm(`Delete menu item “${label}”?`)) return;
    setBusyId(id);
    try {
      await apiFetch(`/admin/menus/${id}`, { method: "DELETE", token: user.token });
      status.success(`Deleted “${label}”.`);
      await load();
    } catch (error) {
      status.error(getErrorMessage(error, "We couldn’t delete that menu item. Please try again."));
    } finally {
      setBusyId(null);
    }
  }

  async function toggleActive(item: MenuItem) {
    if (!user) return;
    setBusyId(item.id);
    try {
      await apiFetch(`/admin/menus/${item.id}/active`, {
        method: "PATCH",
        token: user.token,
        body: { active: !item.active },
      });
      status.success(
        item.active ? `Disabled “${item.label}” on the site.` : `Enabled “${item.label}” on the site.`
      );
      await load();
    } catch (error) {
      status.error(getErrorMessage(error, "We couldn’t update menu visibility. Please try again."));
    } finally {
      setBusyId(null);
    }
  }

  const navbar = items.filter((i) => i.location === "NAVBAR");
  const footer = items.filter((i) => i.location === "FOOTER");

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="font-display text-3xl text-ink">Menus</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Control navbar and footer links shown on the public website. Only admins can change these.
        </p>
      </div>

      <AdminFeedback feedback={status.feedback} onDismiss={status.clear} />

      <form className="grid gap-3 rounded-xl border border-border bg-white p-4 sm:p-5" onSubmit={onSubmit}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label>Label</Label>
            <Input
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              required
              maxLength={80}
              placeholder="Services"
            />
          </div>
          <div className="space-y-2">
            <Label>Link URL</Label>
            <Input
              value={form.href}
              onChange={(e) => setForm({ ...form, href: e.target.value })}
              required
              maxLength={255}
              placeholder="/services"
            />
          </div>
          <div className="space-y-2">
            <Label>Location</Label>
            <Select
              value={form.location}
              onValueChange={(value: "NAVBAR" | "FOOTER") => setForm({ ...form, location: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NAVBAR">Navbar</SelectItem>
                <SelectItem value="FOOTER">Footer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Sort order</Label>
            <Input
              type="number"
              value={form.sortOrder}
              onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm({ ...form, active: e.target.checked })}
          />
          Active (visible on site)
        </label>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : editingId ? "Update menu item" : "Add menu item"}
          </Button>
          {editingId && (
            <Button type="button" variant="outline" onClick={resetForm}>
              Cancel
            </Button>
          )}
        </div>
      </form>

      <MenuList
        title="Navbar menus"
        items={navbar}
        busyId={busyId}
        onEdit={(item) => {
          setEditingId(item.id);
          setForm({
            label: item.label,
            href: item.href,
            location: item.location,
            sortOrder: String(item.sortOrder ?? 0),
            active: item.active,
          });
        }}
        onToggleActive={toggleActive}
        onDelete={remove}
      />

      <MenuList
        title="Footer menus"
        items={footer}
        busyId={busyId}
        onEdit={(item) => {
          setEditingId(item.id);
          setForm({
            label: item.label,
            href: item.href,
            location: item.location,
            sortOrder: String(item.sortOrder ?? 0),
            active: item.active,
          });
        }}
        onToggleActive={toggleActive}
        onDelete={remove}
      />
    </div>
  );
}

function MenuList({
  title,
  items,
  busyId,
  onEdit,
  onToggleActive,
  onDelete,
}: {
  title: string;
  items: MenuItem[];
  busyId: number | null;
  onEdit: (item: MenuItem) => void;
  onToggleActive: (item: MenuItem) => void;
  onDelete: (id: number, label: string) => void;
}) {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-medium text-ink">{title}</h2>
      {items.map((item) => (
        <div
          key={item.id}
          className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 ${
            item.active ? "border-border bg-white" : "border-dashed border-border bg-muted/20 opacity-80"
          }`}
        >
          <div>
            <p className="font-medium text-ink">{item.label}</p>
            <p className="text-xs text-muted-foreground">
              {item.href} · order {item.sortOrder} · {item.active ? "Visible on site" : "Hidden"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={item.active ? "outline" : "default"}
              disabled={busyId === item.id}
              onClick={() => onToggleActive(item)}
            >
              {item.active ? "Disable" : "Enable"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => onEdit(item)}>
              Edit
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={busyId === item.id}
              onClick={() => onDelete(item.id, item.label)}
            >
              Delete
            </Button>
          </div>
        </div>
      ))}
      {items.length === 0 && (
        <p className="text-sm text-muted-foreground">No items yet. Add one above.</p>
      )}
    </div>
  );
}
