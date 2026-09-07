"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageBanner } from "@/components/layout/page-banner";
import { apiFetch } from "@/lib/api";
import type { PostItem } from "@/lib/types";

export default function PostsPage() {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<PostItem[]>("/posts")
      .then(setPosts)
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-fill bg-atmosphere">
      <PageBanner
        title="Cleaning tips from our team"
        description="Practical advice and updates from STATIONZ."
      />

      <div className="page-shell page-pad flex-1">
        <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
          {loading && <p className="text-muted-foreground">Loading posts...</p>}
          {!loading && posts.length === 0 && (
            <p className="text-muted-foreground">No published posts yet.</p>
          )}
          {posts.map((post) => (
            <article key={post.id} className="flex flex-col border-b border-border/70 pb-8">
              <h2 className="font-display text-xl text-ink sm:text-[1.45rem]">
                <Link href={`/posts/${post.slug}`} className="transition hover:text-primary">
                  {post.title}
                </Link>
              </h2>
              {post.excerpt && (
                <p className="mt-3 flex-1 text-[1.02rem] leading-relaxed text-muted-foreground">
                  {post.excerpt}
                </p>
              )}
              <Link
                href={`/posts/${post.slug}`}
                className="mt-5 text-sm font-semibold text-primary hover:underline"
              >
                Read more
              </Link>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
