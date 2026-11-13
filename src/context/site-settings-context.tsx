"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { SiteSetting } from "@/lib/types";
import {
  defaultSiteSettings,
  mapSettings,
  type ResolvedSiteSettings,
} from "@/lib/site-settings";
import { googleFontsHref, themeCssVars } from "@/lib/theme";

type SiteSettingsContextValue = ResolvedSiteSettings & {
  refreshSettings: () => Promise<void>;
};

const SiteSettingsContext = createContext<SiteSettingsContextValue>({
  ...defaultSiteSettings,
  refreshSettings: async () => undefined,
});

const FONT_LINK_ID = "stationz-theme-fonts";

function applyThemeToDocument(settings: ResolvedSiteSettings) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  const vars = themeCssVars(settings.theme);
  Object.entries(vars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });

  const bodyFont = vars["--font-sans"];
  const displayFont = vars["--font-display"];
  document.body.style.fontFamily = bodyFont;
  document.body.style.fontSize = `${settings.theme.fontSizeBase}px`;
  root.style.setProperty("--font-sans", bodyFont);
  root.style.setProperty("--font-display", displayFont);

  const href = googleFontsHref(settings.theme.fontBody, settings.theme.fontDisplay);
  let link = document.getElementById(FONT_LINK_ID) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.id = FONT_LINK_ID;
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }
  if (link.getAttribute("href") !== href) {
    link.setAttribute("href", href);
  }
}

export function SiteSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<ResolvedSiteSettings>(defaultSiteSettings);

  const refreshSettings = useCallback(async () => {
    try {
      const data = await apiFetch<SiteSetting[]>("/api/settings/public");
      const next = mapSettings(data);
      setSettings(next);
      applyThemeToDocument(next);
    } catch {
      // keep current defaults / last known values
    }
  }, []);

  useEffect(() => {
    applyThemeToDocument(settings);
    refreshSettings();
  }, [refreshSettings]);

  useEffect(() => {
    applyThemeToDocument(settings);
  }, [settings]);

  return (
    <SiteSettingsContext.Provider value={{ ...settings, refreshSettings }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}
