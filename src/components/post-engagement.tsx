"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { getVisitorKey } from "@/lib/visitor";
import type { PostComment, PostItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function PostEngagement({ post }: { post: PostItem }) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likeCount ?? 0);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [content, setContent] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const loadComments = () => {
    apiFetch<PostComment[]>(`/posts/${post.slug}/comments`).then(setComments).catch(() => setComments([]));
  };

  useEffect(() => {
    const key = getVisitorKey();
    apiFetch<{ liked: boolean; likeCount: number }>(
      `/posts/${post.slug}/liked?visitorKey=${encodeURIComponent(key)}`
    )
      .then((data) => {
        setLiked(data.liked);
        setLikeCount(data.likeCount);
      })
      .catch(() => undefined);
    loadComments();
  }, [post.slug]);

  async function toggleLike() {
    const key = getVisitorKey();
    setBusy(true);
    try {
      if (liked) {
        await apiFetch(`/posts/${post.slug}/like?visitorKey=${encodeURIComponent(key)}`, {
          method: "DELETE",
        });
        setLiked(false);
        setLikeCount((n) => Math.max(0, n - 1));
      } else {
        await apiFetch(`/posts/${post.slug}/like`, { method: "POST", body: { visitorKey: key } });
        setLiked(true);
        setLikeCount((n) => n + 1);
      }
    } catch {
      setMessage("Could not update like.");
    } finally {
      setBusy(false);
    }
  }

  async function submitComment(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      await apiFetch(`/posts/${post.slug}/comments`, {
        method: "POST",
        body: { authorName: name, authorEmail: email, content },
      });
      setName("");
      setEmail("");
      setContent("");
      setMessage("Thanks — your comment was submitted for review.");
      loadComments();
    } catch {
      setMessage("Could not post comment.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-12 space-y-10 border-t border-border pt-10">
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant={liked ? "default" : "outline"}
          size="sm"
          disabled={busy}
          onClick={toggleLike}
          className="gap-2"
        >
          <Heart className={`size-4 ${liked ? "fill-current" : ""}`} />
          {likeCount} {likeCount === 1 ? "like" : "likes"}
        </Button>
        <Link href="/posts" className="text-sm text-muted-foreground hover:text-foreground">
          All posts
        </Link>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-ink">Comments</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Comments are moderated before they appear publicly.
        </p>

        <form className="mt-6 grid gap-3 rounded-2xl border border-border p-4 sm:p-5" onSubmit={submitComment}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={80}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                maxLength={180}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Comment</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-24"
              required
              maxLength={2000}
            />
          </div>
          <Button type="submit" className="w-fit" disabled={busy}>
            Submit comment
          </Button>
          {message && <p className="text-sm text-muted-foreground">{message}</p>}
        </form>

        <div className="mt-6 space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="border-b border-border pb-4">
              <p className="text-sm font-medium text-ink">{comment.authorName}</p>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">
                {comment.content}
              </p>
              {comment.createdAt && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(comment.createdAt).toLocaleString()}
                </p>
              )}
            </div>
          ))}
          {comments.length === 0 && (
            <p className="text-sm text-muted-foreground">No comments yet. Be the first.</p>
          )}
        </div>
      </div>
    </div>
  );
}
