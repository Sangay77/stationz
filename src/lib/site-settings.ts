import { brand } from "@/lib/brand";
import type { SiteSetting } from "@/lib/types";
import {
  defaultTheme,
  normalizeHex,
  parseBorderRadius,
  parseFontId,
  parseFontSize,
  parseHeadingScale,
  BODY_FONTS,
  DISPLAY_FONTS,
  type ThemeSettings,
} from "@/lib/theme";

export type ResolvedSiteSettings = {
  siteName: string;
  tagline: string;
  logoUrl: string;
  bannerUrl: string;
  heroHeight: number;
  aboutImageUrl: string;
  phone: string;
  email: string;
  address: string;
  hours: string;
  theme: ThemeSettings;
};

/** Keys the public site and admin settings UI actually use. */
export const RELEVANT_SETTING_KEYS = [
  "site_name",
  "tagline",
  "logo_url",
  "banner_url",
  "hero_height",
  "about_image_url",
  "phone",
  "email",
  "address",
  "business_hours",
  "font_body",
  "font_display",
  "color_primary",
  "color_accent",
  "color_background",
  "color_ink",
  "font_size_base",
  "heading_scale",
  "border_radius",
] as const;

export const SETTING_SECTIONS = [
  {
    id: "layout",
    label: "Layout & media",
    description: "Homepage banner size, hero image, and about photo — shared across pages.",
    keys: ["banner_url", "hero_height", "about_image_url"],
  },
  {
    id: "appearance",
    label: "Appearance",
    description: "Fonts, colors, and text size used on every public page.",
    keys: [
      "font_body",
      "font_display",
      "color_primary",
      "color_accent",
      "color_background",
      "color_ink",
      "font_size_base",
      "heading_scale",
      "border_radius",
    ],
  },
  {
    id: "branding",
    label: "Branding",
    description: "Site name, logo, and homepage headline visitors see first.",
    keys: ["site_name", "tagline", "logo_url"],
  },
  {
    id: "contact",
    label: "Contact",
    description: "Phone, email, address, and hours shown on the site.",
    keys: ["phone", "email", "address", "business_hours"],
  },
  {
    id: "email",
    label: "Email (SMTP)",
    description: "Outbound mail for booking acknowledgements. Changes apply immediately.",
    keys: [],
  },
] as const;

export const defaultSiteSettings: ResolvedSiteSettings = {
  siteName: brand.name,
  tagline: "Professional cleaning for homes and workplaces — booked in minutes.",
  logoUrl: brand.logo,
  bannerUrl: brand.heroImage,
  heroHeight: 48,
  aboutImageUrl: brand.aboutImage,
  phone: brand.phone,
  email: brand.email,
  address: brand.address,
  hours: brand.hours,
  theme: defaultTheme,
};

/** Compact homepage banner height (viewport %). */
export function parseHeroHeight(value: string | undefined | null, fallback = 48) {
  const n = Number.parseInt(String(value ?? "").trim(), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(65, Math.max(36, n));
}

export function mapSettings(list: SiteSetting[]): ResolvedSiteSettings {
  const get = (key: string, fallback: string) =>
    list.find((s) => s.settingKey === key)?.settingValue?.trim() || fallback;

  return {
    siteName: get("site_name", defaultSiteSettings.siteName),
    tagline: get("tagline", defaultSiteSettings.tagline),
    logoUrl: resolveMediaUrl(get("logo_url", defaultSiteSettings.logoUrl), defaultSiteSettings.logoUrl),
    bannerUrl: resolveMediaUrl(get("banner_url", defaultSiteSettings.bannerUrl), defaultSiteSettings.bannerUrl),
    heroHeight: parseHeroHeight(get("hero_height", String(defaultSiteSettings.heroHeight))),
    aboutImageUrl: resolveMediaUrl(
      get("about_image_url", defaultSiteSettings.aboutImageUrl),
      defaultSiteSettings.aboutImageUrl
    ),
    phone: get("phone", defaultSiteSettings.phone),
    email: get("email", defaultSiteSettings.email),
    address: get("address", defaultSiteSettings.address),
    hours: get("business_hours", defaultSiteSettings.hours),
    theme: {
      fontBody: parseFontId(get("font_body", defaultTheme.fontBody), BODY_FONTS, defaultTheme.fontBody),
      fontDisplay: parseFontId(
        get("font_display", defaultTheme.fontDisplay),
        DISPLAY_FONTS,
        defaultTheme.fontDisplay
      ),
      colorPrimary: normalizeHex(get("color_primary", defaultTheme.colorPrimary), defaultTheme.colorPrimary),
      colorAccent: normalizeHex(get("color_accent", defaultTheme.colorAccent), defaultTheme.colorAccent),
      colorBackground: normalizeHex(
        get("color_background", defaultTheme.colorBackground),
        defaultTheme.colorBackground
      ),
      colorInk: normalizeHex(get("color_ink", defaultTheme.colorInk), defaultTheme.colorInk),
      fontSizeBase: parseFontSize(get("font_size_base", String(defaultTheme.fontSizeBase))),
      headingScale: parseHeadingScale(get("heading_scale", String(defaultTheme.headingScale))),
      borderRadius: parseBorderRadius(get("border_radius", String(defaultTheme.borderRadius))),
    },
  };
}

export function phoneHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export function emailHref(email: string) {
  return `mailto:${email}`;
}

/** Accept http(s), protocol-relative, or local upload/path URLs; otherwise use fallback. */
export function resolveMediaUrl(value: string | undefined | null, fallback: string) {
  const raw = String(value ?? "").trim();
  if (!raw) return fallback;
  if (/^(https?:\/\/|\/\/|\/|data:image\/)/i.test(raw)) return raw;
  return fallback;
}
