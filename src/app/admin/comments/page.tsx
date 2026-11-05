"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminFeedback, useAdminStatus } from "@/components/admin/feedback";
import { apiFetch } from "@/lib/api";
import { getErrorMessage } from "@/lib/admin-form";
import { useAuth } from "@/context/auth-context";
import type { PostComment, PostEngagement } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function AdminCommentsPage() {
  const { user } = useAuth();
  const status = useAdminStatus();
  const [comments, setComments] = useState<PostComment[]>([]);
  const [engagement, setEngagement] = useState<PostEngagement[]>([]);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [replyOpenId, setReplyOpenId] = useState<number | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<number, string>>({});
  const [tab, setTab] = useState<"pending" | "approved" | "all">("pending");

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
      status.error(getErrorMessage(error, "We couldn’t load comments. Please refresh and try again."));
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
      status.error(getErrorMessage(error, "We couldn’t update that comment. Please try again."));
    } finally {
      setBusyId(null);
    }
  }

  async function reply(comment: PostComment) {
    if (!user) return;
    const text = (replyDrafts[comment.id] || "").trim();
    if (!text) {
      status.error("Please enter a reply before sending.");
      return;
    }
    setBusyId(comment.id);
    try {
      await apiFetch(`/admin/comments/${comment.id}/reply`, {
        method: "POST",
        body: { reply: text },
        token: user.token,
      });
      status.success(`Replied to “${comment.authorName}” (comment also approved).`);
      setReplyOpenId(null);
      setReplyDrafts((prev) => ({ ...prev, [comment.id]: "" }));
      await load();
    } catch (error) {
      status.error(getErrorMessage(error, "We couldn’t send that reply. Please try again."));
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
      status.success(`Deleted comment by “${authorName}”.`);
      await load();
    } catch (error) {
      status.error(getErrorMessage(error, "We couldn’t delete that comment. Please try again."));
    } finally {
      setBusyId(null);
    }
  }

  const pending = comments.filter((c) => !c.approved);
  const approved = comments.filter((c) => c.approved);
  const list = tab === "pending" ? pending : tab === "approved" ? approved : comments;
  const pendingTotal = engagement.reduce((n, e) => n + (e.pendingCommentCount || 0), 0);

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="font-display text-3xl text-ink">Comments</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review, approve, reply, or delete comments. Only approved comments (and replies) show on the site.
        </p>
      </div>

      <AdminFeedback feedback={status.feedback} onDismiss={status.clear} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {engagement.map((item) => (
          <div key={item.postId} className="rounded-lg border border-border bg-white px-4 py-3">
            <p className="text-sm font-medium text-ink">{item.postTitle}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {item.likeCount} likes · {item.commentCount} approved
              {(item.pendingCommentCount || 0) > 0
                ? ` · ${item.pendingCommentCount} pending`
                : ""}
            </p>
            {item.postSlug && (
              <Link
                href={`/posts/${item.postSlug}`}
                className="mt-2 inline-block text-xs font-medium text-primary hover:underline"
                target="_blank"
              >
                View post
              </Link>
            )}
          </div>
        ))}
        {engagement.length === 0 && (
          <p className="text-sm text-muted-foreground">No posts yet.</p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["pending", `Pending (${pending.length || pendingTotal})`],
            ["approved", `Approved (${approved.length})`],
            ["all", `All (${comments.length})`],
          ] as const
        ).map(([key, label]) => (
          <Button
            key={key}
            size="sm"
            variant={tab === key ? "default" : "outline"}
            onClick={() => setTab(key)}
          >
            {label}
          </Button>
        ))}
      </div>

      <div className="space-y-3">
        {list.map((comment) => {
          const replyOpen = replyOpenId === comment.id;
          return (
            <div
              key={comment.id}
              className={`rounded-lg border p-4 ${
                comment.approved
                  ? "border-border bg-white"
                  : "border-amber-200 bg-amber-50/40"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink">
                    {comment.authorName}{" "}
                    <span className="font-normal text-muted-foreground">
                      on {comment.postTitle || "post"}
                      {!comment.approved ? " · pending" : ""}
                    </span>
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/80">{comment.content}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {comment.authorEmail}
                    {comment.createdAt ? ` · ${new Date(comment.createdAt).toLocaleString()}` : ""}
                  </p>
                  {comment.adminReply && (
                    <div className="mt-3 rounded-md border border-border bg-muted/40 px-3 py-2">
                      <p className="text-xs font-semibold text-ink">
                        Reply from {comment.repliedBy || "STATIONZ"}
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/80">
                        {comment.adminReply}
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {!comment.approved && (
                    <Button
                      size="sm"
                      disabled={busyId === comment.id}
                      onClick={() => setApproved(comment.id, true, comment.authorName)}
                    >
                      Approve
                    </Button>
                  )}
                  {comment.approved && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === comment.id}
                      onClick={() => setApproved(comment.id, false, comment.authorName)}
                    >
                      Unapprove
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busyId === comment.id}
                    onClick={() => {
                      setReplyOpenId(replyOpen ? null : comment.id);
                      if (!replyDrafts[comment.id] && comment.adminReply) {
                        setReplyDrafts((prev) => ({ ...prev, [comment.id]: comment.adminReply || "" }));
                      }
                    }}
                  >
                    {replyOpen ? "Cancel" : comment.adminReply ? "Edit reply" : "Reply"}
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

              {replyOpen && (
                <div className="mt-4 space-y-2 border-t border-border pt-3">
                  <Label>Public reply</Label>
                  <Textarea
                    className="min-h-20"
                    value={replyDrafts[comment.id] ?? ""}
                    onChange={(e) =>
                      setReplyDrafts((prev) => ({ ...prev, [comment.id]: e.target.value }))
                    }
                    maxLength={2000}
                    placeholder="Write a reply visible under this comment on the public post."
                  />
                  <Button size="sm" disabled={busyId === comment.id} onClick={() => reply(comment)}>
                    {busyId === comment.id ? "Saving…" : "Save reply & approve"}
                  </Button>
                </div>
              )}
            </div>
          );
        })}
        {list.length === 0 && (
          <p className="text-sm text-muted-foreground">No comments in this view.</p>
        )}
      </div>
    </div>
  );
}
