"use client";

import { useEffect, useState } from "react";
import { AdminFeedback, useAdminStatus } from "@/components/admin/feedback";
import { apiFetch } from "@/lib/api";
import { getErrorMessage } from "@/lib/admin-form";
import { useAuth } from "@/context/auth-context";
import type { PostComment, PostEngagement } from "@/lib/types";
import { Button } from "@/components/ui/button";

export default function AdminCommentsPage() {
  const { user } = useAuth();
  const status = useAdminStatus();
  const [comments, setComments] = useState<PostComment[]>([]);
  const [engagement, setEngagement] = useState<PostEngagement[]>([]);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = async () => {
    if (!user) return;
    try {
      const [commentData, engagementData] = await Promise.all([
        apiFetch<PostComment[]>("/admin/comments", { token: user.token }),
        apiFetch<PostEngagement[]>("/admin/engagement", { token: user.token }),
      ]);
      setComments(commentData);
      setEngagement(engagementData);
    } catch (error) {
      status.error(getErrorMessage(error, "Failed to load comments."));
    }
  };

  useEffect(() => {
    load();
  }, [user]);

  async function setApproved(id: number, approved: boolean, authorName: string) {
    if (!user) return;
    setBusyId(id);
    try {
      await apiFetch(`/admin/comments/${id}/approval`, {
        method: "PATCH",
        body: { approved },
        token: user.token,
      });
      status.success(
        approved
          ? `Approved comment by “${authorName}”.`
          : `Unapproved comment by “${authorName}”.`
      );
      await load();
    } catch (error) {
      status.error(getErrorMessage(error, "Could not update comment."));
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: number, authorName: string) {
    if (!user) return;
    if (!window.confirm(`Delete comment by “${authorName}”?`)) return;
    setBusyId(id);
    try {
      await apiFetch(`/admin/comments/${id}`, { method: "DELETE", token: user.token });
      status.success(`Deleted successfully: comment by “${authorName}” was removed.`);
      await load();
    } catch (error) {
      status.error(`Delete failed: ${getErrorMessage(error, "Could not delete comment.")}`);
    } finally {
      setBusyId(null);
    }
  }

  const pending = comments.filter((c) => !c.approved);
  const approved = comments.filter((c) => c.approved);

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="font-display text-3xl text-ink">Comments & likes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Approve comments before they appear on the public site. Delete spam anytime.
        </p>
      </div>

      <AdminFeedback feedback={status.feedback} onDismiss={status.clear} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {engagement.map((item) => (
          <div key={item.postId} className="rounded-lg border border-border bg-white px-4 py-3">
            <p className="text-sm font-medium text-ink">{item.postTitle}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {item.likeCount} likes · {item.commentCount} comments
            </p>
          </div>
        ))}
        {engagement.length === 0 && (
          <p className="text-sm text-muted-foreground">No posts yet.</p>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-medium text-ink">Pending approval ({pending.length})</h2>
        {pending.map((comment) => (
          <div
            key={comment.id}
            className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50/40 p-4"
          >
            <div>
              <p className="text-sm font-medium text-ink">
                {comment.authorName}{" "}
                <span className="font-normal text-muted-foreground">on {comment.postTitle}</span>
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/80">{comment.content}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {comment.authorEmail}
                {comment.createdAt ? ` · ${new Date(comment.createdAt).toLocaleString()}` : ""}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                disabled={busyId === comment.id}
                onClick={() => setApproved(comment.id, true, comment.authorName)}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={busyId === comment.id}
                onClick={() => remove(comment.id, comment.authorName)}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
        {pending.length === 0 && (
          <p className="text-sm text-muted-foreground">No comments waiting for approval.</p>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-medium text-ink">Approved ({approved.length})</h2>
        {approved.map((comment) => (
          <div
            key={comment.id}
            className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-border bg-white p-4"
          >
            <div>
              <p className="text-sm font-medium text-ink">
                {comment.authorName}{" "}
                <span className="font-normal text-muted-foreground">on {comment.postTitle}</span>
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/80">{comment.content}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {comment.authorEmail}
                {comment.createdAt ? ` · ${new Date(comment.createdAt).toLocaleString()}` : ""}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={busyId === comment.id}
                onClick={() => setApproved(comment.id, false, comment.authorName)}
              >
                Unapprove
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={busyId === comment.id}
                onClick={() => remove(comment.id, comment.authorName)}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
        {approved.length === 0 && (
          <p className="text-sm text-muted-foreground">No approved comments yet.</p>
        )}
      </div>
    </div>
  );
}
