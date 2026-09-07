"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PageBanner, PageCta } from "@/components/layout/page-banner";
import { PostEngagement } from "@/components/post-engagement";
import { apiFetch } from "@/lib/api";
import { sanitizeRichText } from "@/lib/sanitize";
import type { PostItem } from "@/lib/types";

export default function PostDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const [post, setPost] = useState<PostItem | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!slug) return;
    apiFetch<PostItem>(`/posts/${slug}`)
      .then(setPost)
      .catch(() => setError(true));
  }, [slug]);

  if (error) {
    return (
      <div className="page-fill">
        <PageBanner title="Post not found" description="This article may have been moved or unpublished." />
        <div className="page-shell page-pad">
          <Link href="/posts" className="font-semibold text-primary">
            ← Back to posts
          </Link>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="page-fill">
        <PageBanner title="Loading…" description="Fetching the latest article." />
      </div>
    );
  }

  return (
    <div className="page-fill">
      <PageBanner
        title={post.title}
        description="Tips and updates from the STATIONZ team."
        imageUrl={post.featuredImage || undefined}
      />

      <article className="page-shell page-pad flex-1">
        <p className="text-muted-foreground">
          {post.authorName ? `By ${post.authorName}` : "STATIONZ"}
          {post.createdAt ? ` · ${new Date(post.createdAt).toLocaleDateString()}` : ""}
        </p>

        {post.excerpt ? (
          <p className="page-lead mt-6 max-w-3xl">{post.excerpt}</p>
        ) : null}

        {post.featuredImage && (
          <div className="relative mt-8 aspect-[16/9] w-full overflow-hidden">
            <Image
              src={post.featuredImage}
              alt={post.title}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        )}

        <div
          className="prose prose-neutral mt-10 max-w-none text-[1.1rem] leading-relaxed text-foreground/85"
          dangerouslySetInnerHTML={{ __html: sanitizeRichText(post.content || "") }}
        />

        <PostEngagement post={post} />

        <div className="mt-16">
          <PageCta
            title="Ready for a fresher space?"
            description="Request a booking online in a few minutes."
            primaryHref="/book"
            primaryLabel="Book now"
            secondaryHref="/posts"
            secondaryLabel="More posts"
          />
        </div>
      </article>
    </div>
  );
}
