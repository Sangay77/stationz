/** Theme options controllable from the admin dashboard. */

export type FontOption = {
  id: string;
  label: string;
  family: string;
  /** Google Fonts family query segment, e.g. "Outfit:wght@300;400;500;600;700;800" */
  google: string;
};

export const BODY_FONTS: FontOption[] = [
  { id: "outfit", label: "Outfit", family: '"Outfit", "Segoe UI", sans-serif', google: "Outfit:wght@300;400;500;600;700;800" },
  { id: "figtree", label: "Figtree", family: '"Figtree", "Segoe UI", sans-serif', google: "Figtree:wght@300;400;500;600;700" },
  { id: "dm-sans", label: "DM Sans", family: '"DM Sans", "Segoe UI", sans-serif', google: "DM+Sans:wght@300;400;500;600;700" },
  { id: "manrope", label: "Manrope", family: '"Manrope", "Segoe UI", sans-serif', google: "Manrope:wght@300;400;500;600;700;800" },
  { id: "plus-jakarta", label: "Plus Jakarta Sans", family: '"Plus Jakarta Sans", "Segoe UI", sans-serif', google: "Plus+Jakarta+Sans:wght@300;400;500;600;700;800" },
  { id: "source-sans", label: "Source Sans 3", family: '"Source Sans 3", "Segoe UI", sans-serif', google: "Source+Sans+3:wght@300;400;500;600;700" },
  { id: "inter", label: "Inter", family: '"Inter", "Segoe UI", sans-serif', google: "Inter:wght@300;400;500;600;700" },
];

export const DISPLAY_FONTS: FontOption[] = [
  { id: "dm-sans", label: "DM Sans", family: '"DM Sans", "Segoe UI", sans-serif', google: "DM+Sans:wght@500;600;700" },
  { id: "outfit", label: "Outfit", family: '"Outfit", "Segoe UI", sans-serif', google: "Outfit:wght@500;600;700;800" },
  { id: "manrope", label: "Manrope", family: '"Manrope", "Segoe UI", sans-serif', google: "Manrope:wght@500;600;700;800" },
  { id: "plus-jakarta", label: "Plus Jakarta Sans", family: '"Plus Jakarta Sans", "Segoe UI", sans-serif', google: "Plus+Jakarta+Sans:wght@500;600;700;800" },
  { id: "sora", label: "Sora", family: '"Sora", "Segoe UI", sans-serif', google: "Sora:wght@400;500;600;700;800" },
  { id: "space-grotesk", label: "Space Grotesk", family: '"Space Grotesk", "Segoe UI", sans-serif', google: "Space+Grotesk:wght@400;500;600;700" },
  { id: "source-sans", label: "Source Sans 3", family: '"Source Sans 3", "Segoe UI", sans-serif', google: "Source+Sans+3:wght@400;500;600;700" },
];

export type ThemeSettings = {
  fontBody: string;
  fontDisplay: string;
  colorPrimary: string;
  colorAccent: string;
  colorBackground: string;
  colorInk: string;
  fontSizeBase: number;
  headingScale: number;
  borderRadius: number;
};

export const defaultTheme: ThemeSettings = {
  fontBody: "plus-jakarta",
  fontDisplay: "plus-jakarta",
  colorPrimary: "#0A5F6B",
  colorAccent: "#E85D04",
  colorBackground: "#F4F9FA",
  colorInk: "#132228",
  fontSizeBase: 17,
  headingScale: 1.08,
  borderRadius: 0.625,
};

const HEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function normalizeHex(value: string | undefined | null, fallback: string) {
  const v = String(value ?? "").trim();
  if (!HEX.test(v)) return fallback;
  if (v.length === 4) {
    const [, r, g, b] = v;
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  return v.toUpperCase();
}

export function findBodyFont(id: string) {
  return BODY_FONTS.find((f) => f.id === id) || BODY_FONTS[0];
}

export function findDisplayFont(id: string) {
  return DISPLAY_FONTS.find((f) => f.id === id) || DISPLAY_FONTS[0];
}

export function parseFontId(value: string | undefined | null, allowed: FontOption[], fallback: string) {
  const id = String(value ?? "").trim().toLowerCase();
  return allowed.some((f) => f.id === id) ? id : fallback;
}

export function parseFontSize(value: string | undefined | null, fallback = 18) {
  const n = Number.parseFloat(String(value ?? "").trim());
  if (!Number.isFinite(n)) return fallback;
  return Math.min(22, Math.max(15, Math.round(n)));
}

export function parseHeadingScale(value: string | undefined | null, fallback = 1.1) {
  const n = Number.parseFloat(String(value ?? "").trim());
  if (!Number.isFinite(n)) return fallback;
  return Math.min(1.3, Math.max(0.9, Math.round(n * 100) / 100));
}

export function parseBorderRadius(value: string | undefined | null, fallback = 0.75) {
  const n = Number.parseFloat(String(value ?? "").trim());
  if (!Number.isFinite(n)) return fallback;
  return Math.min(1.5, Math.max(0, Math.round(n * 100) / 100));
}

/** Build Google Fonts CSS2 URL for the selected body + display fonts. */
export function googleFontsHref(bodyId: string, displayId: string) {
  const families = new Set<string>();
  families.add(findBodyFont(bodyId).google);
  families.add(findDisplayFont(displayId).google);
  const query = Array.from(families)
    .map((f) => `family=${f}`)
    .join("&");
  return `https://fonts.googleapis.com/css2?${query}&display=swap`;
}

/** CSS custom properties applied to the document root. */
export function themeCssVars(theme: ThemeSettings): Record<string, string> {
  const body = findBodyFont(theme.fontBody);
  const display = findDisplayFont(theme.fontDisplay);
  const scale = theme.headingScale;

  return {
    "--font-sans": body.family,
    "--font-display": display.family,
    "--primary": theme.colorPrimary,
    "--accent": theme.colorAccent,
    "--background": theme.colorBackground,
    "--ink": theme.colorInk,
    "--foreground": theme.colorInk,
    "--card-foreground": theme.colorInk,
    "--popover-foreground": theme.colorInk,
    "--secondary-foreground": theme.colorInk,
    "--primary-foreground": `color-mix(in oklab, ${theme.colorBackground} 92%, white)`,
    "--accent-foreground": "#FFFAF7",
    "--muted-foreground": `color-mix(in oklab, ${theme.colorInk} 58%, white)`,
    "--secondary": `color-mix(in oklab, ${theme.colorPrimary} 8%, ${theme.colorBackground})`,
    "--muted": `color-mix(in oklab, ${theme.colorPrimary} 7%, ${theme.colorBackground})`,
    "--mist": `color-mix(in oklab, ${theme.colorPrimary} 8%, ${theme.colorBackground})`,
    "--surface": `color-mix(in oklab, ${theme.colorPrimary} 5%, ${theme.colorBackground})`,
    "--border": `color-mix(in oklab, ${theme.colorPrimary} 16%, white)`,
    "--input": `color-mix(in oklab, ${theme.colorPrimary} 16%, white)`,
    "--ring": theme.colorPrimary,
    "--sea": theme.colorPrimary,
    "--leaf": theme.colorAccent,
    "--admin-sidebar": `color-mix(in oklab, ${theme.colorPrimary} 88%, black)`,
    "--admin-canvas": `color-mix(in oklab, ${theme.colorPrimary} 6%, ${theme.colorBackground})`,
    "--font-size-base": `${theme.fontSizeBase}px`,
    "--heading-scale": String(scale),
    "--radius": `${theme.borderRadius}rem`,
    "--page-banner-height": "13.5rem",
  };
}
