import { ApiError, softMessage } from "@/lib/api";

export type FeedbackTone = "success" | "error" | "info";

export type FeedbackState = {
  tone: FeedbackTone;
  text: string;
} | null;

/** User-facing error text for admin and public forms. */
export function getErrorMessage(error: unknown, fallback = "Something went wrong. Please try again.") {
  if (error instanceof ApiError) {
    return softMessage(error.message) || error.message || fallback;
  }
  if (error instanceof TypeError) {
    return "We couldn’t reach the server. Check your internet connection and try again.";
  }
  if (error instanceof Error && error.message) {
    return softMessage(error.message) || error.message;
  }
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

  if (!title) errors.title = "Please enter a title.";
  else if (title.length < 3) errors.title = "Title must be at least 3 characters.";
  else if (title.length > 160) errors.title = "Title must be 160 characters or less.";

  if (!slug) errors.slug = "Please enter a web address (slug), for example my-post.";
  else if (!SLUG_PATTERN.test(slug)) {
    errors.slug = "Use only lowercase letters, numbers, and hyphens (example: my-post).";
  } else if (slug.length > 120) {
    errors.slug = "Web address must be 120 characters or less.";
  }

  if (input.requireContent !== false && !content) {
    errors.content = "Please add some content before saving.";
  }

  if (featuredImage && !URL_PATTERN.test(featuredImage)) {
    errors.featuredImage = "Featured image must be a full web link starting with http:// or https://.";
  }

  return errors;
}

export function hasFormErrors(errors: ContentFormErrors) {
  return Object.keys(errors).length > 0;
}
