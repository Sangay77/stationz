"use client";

import { FormEvent, useEffect, useState } from "react";
import { AdminFeedback, FieldError, useAdminStatus } from "@/components/admin/feedback";
import { apiFetch } from "@/lib/api";
import {
  getErrorMessage,
  hasFormErrors,
  validateContentForm,
  type ContentFormErrors,
} from "@/lib/admin-form";
import { useAuth } from "@/context/auth-context";
import type { PageItem } from "@/lib/types";
import { slugify } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const FIXED_SLUGS = new Set(["about", "contact", "services"]);

const empty = {
  title: "",
  slug: "",
  content: "",
  metaTitle: "",
  metaDescription: "",
  published: true,
};

export default function AdminPagesPage() {
  const { user } = useAuth();
  const [pages, setPages] = useState<PageItem[]>([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [errors, setErrors] = useState<ContentFormErrors>({});
  const status = useAdminStatus();
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const editingFixed = editingId != null && FIXED_SLUGS.has(form.slug);

  const load = async () => {
    if (!user) return;
    try {
      const data = await apiFetch<PageItem[]>("/admin/pages", { token: user.token });
      setPages(data);
    } catch (error) {
      status.error(getErrorMessage(error, "Failed to load pages."));
    }
  };

  useEffect(() => {
    load();
  }, [user]);

  function resetForm() {
    setForm(empty);
    setEditingId(null);
    setErrors({});
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;

    const slug = (form.slug || slugify(form.title)).trim();
    const nextErrors = validateContentForm({
      title: form.title,
      slug,
      content: form.content,
      requireContent: true,
    });
    setErrors(nextErrors);
    if (hasFormErrors(nextErrors)) {
      status.error("Edit failed: please fix the highlighted fields before saving.");
      return;
    }

    const body = {
      ...form,
      title: form.title.trim(),
      slug,
      content: form.content.trim(),
      metaTitle: form.metaTitle.trim() || null,
      metaDescription: form.metaDescription.trim() || null,
    };

    setSaving(true);
    try {
      if (editingId) {
        await apiFetch(`/admin/pages/${editingId}`, { method: "PUT", body, token: user.token });
        status.success(`Edited successfully: page “${body.title}” was updated.`);
      } else {
        await apiFetch("/admin/pages", { method: "POST", body, token: user.token });
        status.success(`Created successfully: page “${body.title}” was added.`);
      }
      resetForm();
      await load();
    } catch (error) {
      status.error(
        editingId
          ? `Edit failed: ${getErrorMessage(error, "Could not update page.")}`
          : `Create failed: ${getErrorMessage(error, "Could not create page.")}`
      );
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number, title: string, slug: string) {
    if (!user) return;
    if (FIXED_SLUGS.has(slug)) {
      status.error("Fixed pages (about, contact, services) cannot be deleted.");
      return;
    }
    if (!window.confirm(`Delete page “${title}”? This cannot be undone.`)) return;

    setDeletingId(id);
    try {
      await apiFetch(`/admin/pages/${id}`, { method: "DELETE", token: user.token });
      if (editingId === id) resetForm();
      status.success(`Deleted successfully: page “${title}” was removed.`);
      await load();
    } catch (error) {
      status.error(`Delete failed: ${getErrorMessage(error, "Could not delete page.")}`);
    } finally {
      setDeletingId(null);
    }
  }

  const fixedPages = pages.filter((p) => FIXED_SLUGS.has(p.slug));
  const otherPages = pages.filter((p) => !FIXED_SLUGS.has(p.slug));

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="font-display text-3xl text-ink">Pages</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Edit fixed site pages (About, Contact, Services). Routes stay fixed — only admins can change content.
        </p>
      </div>

      <AdminFeedback feedback={status.feedback} onDismiss={status.clear} />

      <form className="grid gap-3 rounded-lg border border-border bg-white p-4" onSubmit={onSubmit} noValidate>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="page-title">Title *</Label>
            <Input
              id="page-title"
              value={form.title}
              onChange={(e) => {
                const title = e.target.value;
                setForm((prev) => ({
                  ...prev,
                  title,
                  slug: editingId || editingFixed ? prev.slug : slugify(title),
                }));
              }}
              aria-invalid={!!errors.title}
            />
            <FieldError message={errors.title} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="page-slug">Slug *</Label>
            <Input
              id="page-slug"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              aria-invalid={!!errors.slug}
              disabled={editingFixed}
            />
            <FieldError message={errors.slug} />
            {editingFixed && (
              <p className="text-xs text-muted-foreground">Fixed page slug cannot be changed.</p>
            )}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="page-meta-title">Meta title</Label>
            <Input
              id="page-meta-title"
              value={form.metaTitle}
              onChange={(e) => setForm({ ...form, metaTitle: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="page-meta-description">Meta description</Label>
            <Input
              id="page-meta-description"
              value={form.metaDescription}
              onChange={(e) => setForm({ ...form, metaDescription: e.target.value })}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="page-content">Content *</Label>
          <Textarea
            id="page-content"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            className="min-h-40"
            aria-invalid={!!errors.content}
          />
          <FieldError message={errors.content} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.published}
            onChange={(e) => setForm({ ...form, published: e.target.checked })}
          />
          Published
        </label>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : editingId ? "Update page" : "Create page"}
          </Button>
          {editingId && (
            <Button type="button" variant="outline" onClick={resetForm} disabled={saving}>
              Cancel
            </Button>
          )}
        </div>
      </form>

      <PageGroup
        title="Fixed pages"
        hint="These power /about, /contact, and /services. They can be edited but not deleted."
        pages={fixedPages}
        deletingId={deletingId}
        onEdit={(page) => {
          setEditingId(page.id);
          setErrors({});
          setForm({
            title: page.title,
            slug: page.slug,
            content: page.content || "",
            metaTitle: page.metaTitle || "",
            metaDescription: page.metaDescription || "",
            published: page.published,
          });
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        onDelete={remove}
        allowDelete={false}
      />

      <PageGroup
        title="Other pages"
        hint="Optional extra CMS pages. Not linked to a fixed public route unless you add a menu link."
        pages={otherPages}
        deletingId={deletingId}
        onEdit={(page) => {
          setEditingId(page.id);
          setErrors({});
          setForm({
            title: page.title,
            slug: page.slug,
            content: page.content || "",
            metaTitle: page.metaTitle || "",
            metaDescription: page.metaDescription || "",
            published: page.published,
          });
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        onDelete={remove}
        allowDelete
      />
    </div>
  );
}

function PageGroup({
  title,
  hint,
  pages,
  deletingId,
  onEdit,
  onDelete,
  allowDelete,
}: {
  title: string;
  hint: string;
  pages: PageItem[];
  deletingId: number | null;
  onEdit: (page: PageItem) => void;
  onDelete: (id: number, title: string, slug: string) => void;
  allowDelete: boolean;
}) {
  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg font-medium text-ink">{title}</h2>
        <p className="text-sm text-muted-foreground">{hint}</p>
      </div>
      {pages.map((page) => (
        <div
          key={page.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-white p-4"
        >
          <div>
            <p className="font-medium text-ink">{page.title}</p>
            <p className="text-xs text-muted-foreground">
              /{page.slug} · {page.published ? "Published" : "Draft"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => onEdit(page)}>
              Edit
            </Button>
            {allowDelete && (
              <Button
                size="sm"
                variant="destructive"
                disabled={deletingId === page.id}
                onClick={() => onDelete(page.id, page.title, page.slug)}
              >
                {deletingId === page.id ? "Deleting..." : "Delete"}
              </Button>
            )}
          </div>
        </div>
      ))}
      {pages.length === 0 && (
        <p className="text-sm text-muted-foreground">No pages in this group yet.</p>
      )}
    </div>
  );
}
