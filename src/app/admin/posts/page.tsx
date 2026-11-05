"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { AdminFeedback, FieldError, useAdminStatus } from "@/components/admin/feedback";
import { apiFetch, apiUpload } from "@/lib/api";
import {
  getErrorMessage,
  hasFormErrors,
  validateContentForm,
  type ContentFormErrors,
} from "@/lib/admin-form";
import { useAuth } from "@/context/auth-context";
import type { PostItem } from "@/lib/types";
import { slugify } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const empty = {
  title: "",
  slug: "",
  content: "",
  excerpt: "",
  featuredImage: "",
  metaTitle: "",
  metaDescription: "",
  published: true,
};

export default function AdminPostsPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [errors, setErrors] = useState<ContentFormErrors>({});
  const status = useAdminStatus();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const load = async () => {
    if (!user) return;
    try {
      const data = await apiFetch<PostItem[]>("/admin/posts", { token: user.token });
      setPosts(data);
    } catch (error) {
      status.error(getErrorMessage(error, "We couldn’t load posts. Please refresh and try again."));
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
      featuredImage: form.featuredImage,
      requireContent: true,
    });
    setErrors(nextErrors);
    if (hasFormErrors(nextErrors)) {
      status.error("Please fix the highlighted fields before saving.");
      return;
    }

    const body = {
      ...form,
      title: form.title.trim(),
      slug,
      content: form.content.trim(),
      excerpt: form.excerpt.trim(),
      featuredImage: form.featuredImage.trim() || null,
      metaTitle: form.metaTitle.trim() || null,
      metaDescription: form.metaDescription.trim() || null,
    };

    setSaving(true);
    try {
      if (editingId) {
        await apiFetch(`/admin/posts/${editingId}`, { method: "PUT", body, token: user.token });
        status.success(`Edited successfully: post “${body.title}” was updated.`);
      } else {
        await apiFetch("/admin/posts", { method: "POST", body, token: user.token });
        status.success(`Created successfully: post “${body.title}” was added.`);
      }
      resetForm();
      await load();
    } catch (error) {
      status.error(
        editingId
          ? getErrorMessage(error, "We couldn’t update that post. Please check the form and try again.")
          : getErrorMessage(error, "We couldn’t create that post. Please check the form and try again.")
      );
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number, title: string) {
    if (!user) return;
    if (!window.confirm(`Delete post “${title}”? This cannot be undone.`)) return;

    setDeletingId(id);
    try {
      await apiFetch(`/admin/posts/${id}`, { method: "DELETE", token: user.token });
      if (editingId === id) resetForm();
      status.success(`Deleted successfully: post “${title}” was removed.`);
      await load();
    } catch (error) {
      status.error(getErrorMessage(error, "We couldn’t delete that post. Please try again."));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Posts</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create, edit, and delete posts. Published posts accept public likes and comments.
        </p>
      </div>

      <AdminFeedback feedback={status.feedback} onDismiss={status.clear} />

      <form className="grid gap-3 rounded-lg border border-border bg-white p-4" onSubmit={onSubmit} noValidate>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="post-title">Title *</Label>
            <Input
              id="post-title"
              value={form.title}
              onChange={(e) => {
                const title = e.target.value;
                setForm((prev) => ({
                  ...prev,
                  title,
                  slug: editingId ? prev.slug : slugify(title),
                }));
              }}
              aria-invalid={!!errors.title}
            />
            <FieldError message={errors.title} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="post-slug">Slug *</Label>
            <Input
              id="post-slug"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              aria-invalid={!!errors.slug}
            />
            <FieldError message={errors.slug} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="post-excerpt">Excerpt</Label>
          <Input
            id="post-excerpt"
            value={form.excerpt}
            onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="post-image">Featured image URL</Label>
          <Input
            id="post-image"
            value={form.featuredImage}
            onChange={(e) => setForm({ ...form, featuredImage: e.target.value })}
            placeholder="https://... or upload"
            aria-invalid={!!errors.featuredImage}
          />
          <FieldError message={errors.featuredImage} />
          <div>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file || !user) return;
                setUploading(true);
                try {
                  const { url } = await apiUpload("/admin/upload", file, user.token);
                  setForm((prev) => ({ ...prev, featuredImage: url }));
                  status.success("Upload successful: image ready. Save the post to keep it.");
                } catch (error) {
                  status.error(getErrorMessage(error, "We couldn’t upload that image. Please try a different file."));
                } finally {
                  setUploading(false);
                }
              }}
            />
            <Button type="button" size="sm" variant="outline" disabled={uploading} onClick={() => imageInputRef.current?.click()}>
              {uploading ? "Uploading..." : "Upload image"}
            </Button>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="post-meta-title">Meta title</Label>
            <Input
              id="post-meta-title"
              value={form.metaTitle}
              onChange={(e) => setForm({ ...form, metaTitle: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="post-meta-description">Meta description</Label>
            <Input
              id="post-meta-description"
              value={form.metaDescription}
              onChange={(e) => setForm({ ...form, metaDescription: e.target.value })}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="post-content">Content *</Label>
          <Textarea
            id="post-content"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            className="min-h-36"
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
          Published (visible + open to comments/likes)
        </label>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : editingId ? "Update post" : "Create post"}
          </Button>
          {editingId && (
            <Button type="button" variant="outline" onClick={resetForm} disabled={saving}>
              Cancel
            </Button>
          )}
        </div>
      </form>

      <div className="space-y-3">
        {posts.map((post) => (
          <div
            key={post.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-white p-4"
          >
            <div>
              <p className="font-medium text-ink">{post.title}</p>
              <p className="text-xs text-muted-foreground">
                /posts/{post.slug} · {post.published ? "Published" : "Draft"} · {post.likeCount ?? 0} likes ·{" "}
                {post.commentCount ?? 0} comments
              </p>
            </div>
            <div className="flex gap-2">
              <Button asChild size="sm" variant="ghost">
                <Link href={`/posts/${post.slug}`} target="_blank">
                  View
                </Link>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditingId(post.id);
                  setErrors({});
                  setForm({
                    title: post.title,
                    slug: post.slug,
                    content: post.content || "",
                    excerpt: post.excerpt || "",
                    featuredImage: post.featuredImage || "",
                    metaTitle: post.metaTitle || "",
                    metaDescription: post.metaDescription || "",
                    published: post.published,
                  });
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                Edit
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={deletingId === post.id}
                onClick={() => remove(post.id, post.title)}
              >
                {deletingId === post.id ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        ))}
        {posts.length === 0 && (
          <p className="text-sm text-muted-foreground">No posts yet. Create your first post above.</p>
        )}
      </div>
    </div>
  );
}
