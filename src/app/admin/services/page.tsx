"use client";

import { FormEvent, useEffect, useState } from "react";
import { AdminFeedback, useAdminStatus } from "@/components/admin/feedback";
import { apiFetch, apiUpload } from "@/lib/api";
import { getErrorMessage } from "@/lib/admin-form";
import { useAuth } from "@/context/auth-context";
import type { ServiceItem } from "@/lib/types";
import { formatCurrency, slugify } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const empty = {
  name: "",
  slug: "",
  shortDescription: "",
  description: "",
  priceFrom: "",
  durationMinutes: "",
  icon: "sparkles",
  imageUrl: "",
  featured: true,
  active: true,
  sortOrder: "0",
};

export default function AdminServicesPage() {
  const { user } = useAuth();
  const status = useAdminStatus();
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = async () => {
    if (!user) return;
    try {
      const data = await apiFetch<ServiceItem[]>("/admin/services", { token: user.token });
      setServices(data);
    } catch (error) {
      status.error(getErrorMessage(error, "Failed to load services."));
    }
  };

  useEffect(() => {
    load();
  }, [user]);

  function resetForm() {
    setForm(empty);
    setEditingId(null);
  }

  async function onUpload(file: File | null) {
    if (!user || !file) return;
    setUploading(true);
    try {
      const result = await apiUpload("/admin/upload", file, user.token);
      setForm((prev) => ({ ...prev, imageUrl: result.url }));
      status.success("Image uploaded.");
    } catch (error) {
      status.error(getErrorMessage(error, "Image upload failed."));
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        slug: (form.slug || slugify(form.name)).trim(),
        shortDescription: form.shortDescription.trim(),
        description: form.description.trim(),
        priceFrom: Number(form.priceFrom || 0),
        durationMinutes: Number(form.durationMinutes || 0),
        icon: form.icon.trim() || "sparkles",
        imageUrl: form.imageUrl.trim() || null,
        featured: form.featured,
        active: form.active,
        sortOrder: Number(form.sortOrder || 0),
      };
      if (editingId) {
        await apiFetch(`/admin/services/${editingId}`, { method: "PUT", body, token: user.token });
        status.success(`Updated service “${body.name}”.`);
      } else {
        await apiFetch("/admin/services", { method: "POST", body, token: user.token });
        status.success(`Created service “${body.name}”.`);
      }
      resetForm();
      await load();
    } catch (error) {
      status.error(getErrorMessage(error, "Could not save service."));
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number, name: string) {
    if (!user) return;
    if (!window.confirm(`Delete service “${name}”?`)) return;
    setBusyId(id);
    try {
      await apiFetch(`/admin/services/${id}`, { method: "DELETE", token: user.token });
      if (editingId === id) resetForm();
      status.success(`Deleted “${name}”.`);
      await load();
    } catch (error) {
      status.error(getErrorMessage(error, "Could not delete service."));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="font-display text-3xl text-ink">Services</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add, edit, or delete cleaning packages shown on the public Services page and booking form.
        </p>
      </div>

      <AdminFeedback feedback={status.feedback} onDismiss={status.clear} />

      <form className="grid gap-3 rounded-xl border border-border bg-white p-4 sm:p-5" onSubmit={onSubmit}>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={form.name}
              onChange={(e) =>
                setForm({
                  ...form,
                  name: e.target.value,
                  slug: editingId ? form.slug : slugify(e.target.value),
                })
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Slug</Label>
            <Input
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Short description</Label>
          <Input
            value={form.shortDescription}
            onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Full description</Label>
          <Textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="min-h-28"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label>Price from</Label>
            <Input
              type="number"
              value={form.priceFrom}
              onChange={(e) => setForm({ ...form, priceFrom: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Duration (min)</Label>
            <Input
              type="number"
              value={form.durationMinutes}
              onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Icon</Label>
            <Input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
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
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <div className="space-y-2">
            <Label>Image URL</Label>
            <Input
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              placeholder="https://... or upload"
            />
          </div>
          <div>
            <Label className="mb-2 block">Upload image</Label>
            <Input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              disabled={uploading}
              onChange={(e) => onUpload(e.target.files?.[0] || null)}
            />
          </div>
        </div>
        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => setForm({ ...form, featured: e.target.checked })}
            />
            Featured on homepage
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
            />
            Active
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={saving || uploading}>
            {saving ? "Saving..." : editingId ? "Update service" : "Add service"}
          </Button>
          {editingId && (
            <Button type="button" variant="outline" onClick={resetForm}>
              Cancel
            </Button>
          )}
        </div>
      </form>

      <div className="space-y-3">
        <h2 className="text-lg font-medium text-ink">All services ({services.length})</h2>
        {services.map((service) => (
          <div
            key={service.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-white p-4"
          >
            <div className="min-w-0">
              <p className="font-medium text-ink">{service.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(service.priceFrom)} · /{service.slug} ·{" "}
                {service.active ? "Active" : "Inactive"}
                {service.featured ? " · Featured" : ""}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditingId(service.id);
                  setForm({
                    name: service.name,
                    slug: service.slug,
                    shortDescription: service.shortDescription || "",
                    description: service.description || "",
                    priceFrom: String(service.priceFrom || ""),
                    durationMinutes: String(service.durationMinutes || ""),
                    icon: service.icon || "sparkles",
                    imageUrl: service.imageUrl || service.image || "",
                    featured: service.featured,
                    active: service.active,
                    sortOrder: String(service.sortOrder || 0),
                  });
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                Edit
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={busyId === service.id}
                onClick={() => remove(service.id, service.name)}
              >
                {busyId === service.id ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        ))}
        {services.length === 0 && (
          <p className="text-sm text-muted-foreground">No services yet. Add your first package above.</p>
        )}
      </div>
    </div>
  );
}
