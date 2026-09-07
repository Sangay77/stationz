/** Escape HTML and convert newlines to paragraphs for safe display of CMS/plain text. */
export function plainTextToSafeHtml(raw: string): string {
  const escaped = raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

  // Allow a minimal allowlist of tags if content already looks escaped as text blocks
  const paragraphs = escaped
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => `<p>${block.replace(/\n/g, "<br />")}</p>`);

  return paragraphs.join("") || `<p>${escaped}</p>`;
}

/** Strip tags from HTML-ish content, then re-escape for safe rendering. */
export function sanitizeRichText(raw: string): string {
  if (!raw) return "";
  // If it looks like HTML, strip tags first then escape remaining text structure lightly
  const stripped = raw
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/on\w+\s*=\s*(['"]).*?\1/gi, "")
    .replace(/javascript:/gi, "");

  // Keep only a small set of formatting tags
  const allowed = stripped.replace(
    /<(?!\/?(?:p|br|strong|b|em|i|ul|ol|li|h[1-6]|a|blockquote)\b)[^>]*>/gi,
    ""
  );

  // Neutralize dangerous hrefs on anchors
  return allowed.replace(
    /<a\b([^>]*)>/gi,
    (_match, attrs: string) => {
      const hrefMatch = attrs.match(/href\s*=\s*(['"])(.*?)\1/i);
      const href = hrefMatch?.[2] || "";
      const safe =
        href.startsWith("http://") ||
        href.startsWith("https://") ||
        href.startsWith("mailto:") ||
        href.startsWith("/");
      return safe ? `<a href="${href.replace(/"/g, "")}" rel="noopener noreferrer">` : "<a>";
    }
  );
}
