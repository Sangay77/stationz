import { ApiError } from "@/lib/api";

export type FeedbackTone = "success" | "error" | "info";

export type FeedbackState = {
  tone: FeedbackTone;
  text: string;
} | null;

export function getErrorMessage(error: unknown, fallback = "Something went wrong") {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const URL_PATTERN = /^https?:\/\/.+/i;

export type ContentFormErrors = Partial<Record<"title" | "slug" | "content" | "featuredImage", string>>;

export function validateContentForm(input: {
  title: string;
  slug: string;
  content: string;
  featuredImage?: string;
  requireContent?: boolean;
}): ContentFormErrors {
  const errors: ContentFormErrors = {};
  const title = input.title.trim();
  const slug = input.slug.trim();
  const content = input.content.trim();
  const featuredImage = input.featuredImage?.trim() || "";

  if (!title) errors.title = "Title is required.";
  else if (title.length < 3) errors.title = "Title must be at least 3 characters.";
  else if (title.length > 160) errors.title = "Title must be 160 characters or less.";

  if (!slug) errors.slug = "Slug is required.";
  else if (!SLUG_PATTERN.test(slug)) {
    errors.slug = "Use lowercase letters, numbers, and hyphens only (e.g. my-post).";
  } else if (slug.length > 120) {
    errors.slug = "Slug must be 120 characters or less.";
  }

  if (input.requireContent !== false && !content) {
    errors.content = "Content is required.";
  }

  if (featuredImage && !URL_PATTERN.test(featuredImage)) {
    errors.featuredImage = "Featured image must be a valid http(s) URL.";
  }

  return errors;
}

export function hasFormErrors(errors: ContentFormErrors) {
  return Object.keys(errors).length > 0;
}
