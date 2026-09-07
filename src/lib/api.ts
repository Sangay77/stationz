const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081/api";

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

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  if (!response.ok) {
    let message = "Request failed";
    let fieldErrors: Record<string, string> | undefined;
    try {
      const data = await response.json();
      message = data.message || message;
      if (data.errors && typeof data.errors === "object") {
        fieldErrors = data.errors as Record<string, string>;
        const details = Object.entries(fieldErrors)
          .map(([field, msg]) => `${field}: ${msg}`)
          .join("; ");
        if (details) message = `${message} (${details})`;
      }
    } catch {
      // ignore parse errors
    }
    throw new ApiError(response.status, message, fieldErrors);
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

  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers,
    body: form,
    cache: "no-store",
  });

  if (!response.ok) {
    let message = "Upload failed";
    try {
      const data = await response.json();
      message = data.message || message;
    } catch {
      // ignore
    }
    throw new ApiError(response.status, message);
  }

  return response.json() as Promise<{ url: string }>;
}

export { API_BASE };
