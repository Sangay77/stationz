const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";

type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string | null;
};

export class ApiError extends Error {
  status: number;
  fieldErrors?: Record<string, string>;

  constructor(status: number, message: string, fieldErrors?: Record<string, string>) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

const FIELD_LABELS: Record<string, string> = {
  customerName: "Full name",
  customerEmail: "Email",
  customerPhone: "Phone",
  preferredDate: "Preferred date",
  preferredTime: "Preferred time",
  serviceId: "Service",
  propertyType: "Property type",
  squareFootage: "Square footage",
  authorName: "Name",
  authorEmail: "Email",
  firstName: "First name",
  lastName: "Last name",
  settingKey: "Setting",
  settingValue: "Value",
  groupName: "Section",
  imageUrl: "Image",
  featuredImage: "Featured image",
  shortDescription: "Short description",
  sortOrder: "Sort order",
  durationMinutes: "Duration",
  priceFrom: "Starting price",
  fromName: "From name",
  visitorKey: "Visitor",
  href: "Link URL",
  metaTitle: "Meta title",
  metaDescription: "Meta description",
};

function humanizeField(field: string): string {
  if (FIELD_LABELS[field]) return FIELD_LABELS[field];
  const leaf = field.includes(".") ? field.split(".").pop()! : field;
  if (FIELD_LABELS[leaf]) return FIELD_LABELS[leaf];
  return leaf
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (c) => c.toUpperCase());
}

function friendlyStatusMessage(status: number, fallback: string): string {
  switch (status) {
    case 400:
      return fallback || "Please check the form and try again.";
    case 401:
      return "Your email or password is incorrect, or your session has expired. Please sign in again.";
    case 403:
      return "You don’t have permission to do that. Ask an administrator if you need access.";
    case 404:
      return "We couldn’t find what you were looking for. It may have been removed.";
    case 409:
      return "That conflicts with something already saved. Please change it and try again.";
    case 413:
      return "That file is too large. Please choose a smaller image (under 10MB).";
    case 415:
      return "That file type isn’t supported. Please use JPG, PNG, WEBP, or GIF.";
    case 422:
      return fallback || "Some details look incorrect. Please review the form and try again.";
    case 429:
      return "Too many requests right now. Please wait a moment and try again.";
    case 500:
    case 502:
    case 503:
    case 504:
      return "Something went wrong on our side. Please try again in a moment.";
    default:
      return fallback || "Something went wrong. Please try again.";
  }
}

function softMessage(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const text = raw.trim();
  if (!text) return null;

  const lower = text.toLowerCase();
  const map: Array<[RegExp | string, string]> = [
    ["validation failed", "Please check the highlighted fields and try again."],
    ["unexpected error", "Something went wrong on our side. Please try again in a moment."],
    ["access denied", "You don’t have permission to do that."],
    ["invalid email or password", "That email or password doesn’t match our records."],
    ["request failed", "We couldn’t complete that request. Please try again."],
    ["upload failed", "We couldn’t upload that file. Please try again."],
    ["slug already exists", "That web address (slug) is already in use. Please choose a different one."],
    ["email already registered", "That email is already registered. Use a different email address."],
    ["service is not available for booking", "That service isn’t available for booking right now. Please choose another."],
    ["invalid booking status", "That booking status isn’t valid. Please choose a different status."],
    ["service not found", "That service couldn’t be found. It may have been removed."],
    ["setting not found", "That setting couldn’t be found."],
    ["menu item not found", "That menu item couldn’t be found."],
    ["post not found", "That post couldn’t be found."],
    ["comment not found", "That comment couldn’t be found."],
    ["user not found", "That user couldn’t be found."],
    ["no file uploaded", "Please choose a file to upload."],
    ["file must be 10mb or smaller", "That image is too large. Please choose a file under 10MB."],
    ["only jpg, png, webp, or gif images are allowed", "Please upload a JPG, PNG, WEBP, or GIF image."],
    ["could not store uploaded file", "We couldn’t save that upload. Please try a different image."],
    ["invalid upload path", "We couldn’t save that upload. Please try again."],
    ["link url is required", "Please enter a link URL for this menu item."],
    ["already liked", "You’ve already liked this post."],
    ["content is required", "Please enter some text before submitting."],
    ["content is too long", "That text is too long. Please shorten it and try again."],
    ["authentication required", "Please sign in to continue."],
    [
      "public registration is disabled",
      "New accounts can’t be created here. Ask an administrator to create one for you.",
    ],
    [
      "fixed pages (about, contact, services) cannot be deleted",
      "The About, Contact, and Services pages can’t be deleted. You can edit or unpublish them instead.",
    ],
    ["fixed page slugs cannot be changed", "The web address for this built-in page can’t be changed."],
    [
      "use /api/admin/mail-settings",
      "Email settings must be updated from Settings → Email (SMTP).",
    ],
    ["smtp port must be between", "Port must be a number between 1 and 65535."],
    [
      "host, username, and from address are required",
      "Please fill in SMTP host, username, and from address before turning email on.",
    ],
    [
      "smtp password is required before enabling",
      "Please enter an email password (or app password) before turning email on.",
    ],
    ["your current password is incorrect", "Your current password is incorrect."],
    ["new password must be different", "New password must be different from your current password."],
    ["you can’t delete your own account", "You can’t delete your own account while signed in."],
    ["you can’t disable your own account", "You can’t disable your own account while signed in."],
    ["you can’t remove your own admin role", "You can’t remove your own admin role while signed in."],
    ["failed to fetch", "We couldn’t reach the server. Check your internet connection and try again."],
    ["networkerror", "We couldn’t reach the server. Check your internet connection and try again."],
    ["load failed", "We couldn’t reach the server. Check your internet connection and try again."],
  ];

  for (const [needle, friendly] of map) {
    if (typeof needle === "string") {
      if (lower.includes(needle)) return friendly;
    } else if (needle.test(text)) {
      return friendly;
    }
  }

  // Drop raw Java/stack-ish noise
  if (/exception|stacktrace|nullpointer|sql|jdbc|hibernate/i.test(text)) {
    return "Something went wrong on our side. Please try again in a moment.";
  }

  return text;
}

function formatFieldErrors(fieldErrors: Record<string, string>): string {
  const parts = Object.entries(fieldErrors)
    .map(([field, msg]) => {
      const label = humanizeField(field);
      const cleaned = softMessage(msg) || msg;
      // Avoid "Email: Email is required." duplication style when message already starts with label
      if (cleaned.toLowerCase().startsWith(label.toLowerCase())) return cleaned;
      return `${label}: ${cleaned}`;
    })
    .filter(Boolean);
  if (parts.length === 1) return parts[0];
  if (parts.length > 1) return `Please fix these fields — ${parts.join("; ")}`;
  return "";
}

async function readErrorPayload(response: Response): Promise<{
  message?: string;
  fieldErrors?: Record<string, string>;
}> {
  try {
    const data = await response.json();
    const fieldErrors =
      data.errors && typeof data.errors === "object"
        ? (data.errors as Record<string, string>)
        : undefined;
    return {
      message: typeof data.message === "string" ? data.message : undefined,
      fieldErrors,
    };
  } catch {
    return {};
  }
}

function toApiError(
  status: number,
  payload: { message?: string; fieldErrors?: Record<string, string> },
  defaultFallback: string
): ApiError {
  const fieldText = payload.fieldErrors ? formatFieldErrors(payload.fieldErrors) : "";
  const softened = softMessage(payload.message);
  const statusFallback = friendlyStatusMessage(status, defaultFallback);

  let message = fieldText || softened || statusFallback;
  // If backend sent a vague "Validation failed" but we have field details, prefer fields.
  if (fieldText && softened && /please check the highlighted/i.test(softened)) {
    message = fieldText;
  } else if (fieldText && softened && softened !== fieldText && !fieldText.includes(softened)) {
    // Keep field details primary for validation
    message = fieldText;
  }

  return new ApiError(status, message, payload.fieldErrors);
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method: options.method || "GET",
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      cache: "no-store",
    });
  } catch (error) {
    const raw = error instanceof Error ? error.message : "";
    throw new ApiError(
      0,
      softMessage(raw) ||
        "We couldn’t reach the server. Check your internet connection and try again."
    );
  }

  if (!response.ok) {
    const payload = await readErrorPayload(response);
    throw toApiError(response.status, payload, "We couldn’t complete that request. Please try again.");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function apiUpload(
  path: string,
  file: File,
  token?: string | null
): Promise<{ url: string }> {
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const form = new FormData();
  form.append("file", file);

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers,
      body: form,
      cache: "no-store",
    });
  } catch (error) {
    const raw = error instanceof Error ? error.message : "";
    throw new ApiError(
      0,
      softMessage(raw) ||
        "We couldn’t upload that file. Check your internet connection and try again."
    );
  }

  if (!response.ok) {
    const payload = await readErrorPayload(response);
    throw toApiError(
      response.status,
      payload,
      "We couldn’t upload that file. Please try a different image."
    );
  }

  return response.json() as Promise<{ url: string }>;
}

export { API_BASE, softMessage, humanizeField };
