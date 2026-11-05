"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { ConfirmDialog, type ConfirmOptions } from "@/components/admin/confirm-dialog";
import { AdminFeedback, useAdminStatus } from "@/components/admin/feedback";
import { apiFetch, apiUpload } from "@/lib/api";
import { getErrorMessage } from "@/lib/admin-form";
import { useAuth } from "@/context/auth-context";
import { useSiteSettings } from "@/context/site-settings-context";
import type { SiteSetting } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BODY_FONTS,
  DISPLAY_FONTS,
  normalizeHex,
  parseBorderRadius,
  parseFontSize,
  parseHeadingScale,
} from "@/lib/theme";
import { RELEVANT_SETTING_KEYS, SETTING_SECTIONS } from "@/lib/site-settings";
import { cn } from "@/lib/utils";
import { MailSettingsForm } from "@/components/admin/mail-settings-form";

const IMAGE_KEYS = new Set(["logo_url", "banner_url", "about_image_url"]);
const COLOR_KEYS = new Set(["color_primary", "color_accent", "color_background", "color_ink"]);
const RELEVANT = new Set<string>(RELEVANT_SETTING_KEYS);

function isHeroHeight(key: string) {
  return key === "hero_height";
}
function isFontBody(key: string) {
  return key === "font_body";
}
function isFontDisplay(key: string) {
  return key === "font_display";
}
function isColor(key: string) {
  return COLOR_KEYS.has(key);
}
function isFontSize(key: string) {
  return key === "font_size_base";
}
function isHeadingScale(key: string) {
  return key === "heading_scale";
}
function isBorderRadius(key: string) {
  return key === "border_radius";
}
function isMultiline(key: string) {
  return key === "address" || key === "tagline";
}

function validateThemeValue(key: string, value: string): string | null {
  if (isColor(key)) {
    return normalizeHex(value, "") ? null : "Color must be a valid hex like #0B5F6B.";
  }
  if (isFontSize(key)) {
    const n = Number.parseFloat(value);
    return Number.isFinite(n) && n >= 15 && n <= 22 ? null : "Base font size must be 15–22.";
  }
  if (isHeadingScale(key)) {
    const n = Number.parseFloat(value);
    return Number.isFinite(n) && n >= 0.9 && n <= 1.3 ? null : "Heading scale must be 0.9–1.3.";
  }
  if (isBorderRadius(key)) {
    const n = Number.parseFloat(value);
    return Number.isFinite(n) && n >= 0 && n <= 1.5 ? null : "Corner radius must be 0–1.5.";
  }
  if (isFontBody(key) && !BODY_FONTS.some((f) => f.id === value)) return "Choose a valid body font.";
  if (isFontDisplay(key) && !DISPLAY_FONTS.some((f) => f.id === value)) return "Choose a valid display font.";
  return null;
}

type PendingAction =
  | { type: "save"; setting: SiteSetting }
  | { type: "upload"; setting: SiteSetting; file: File };

function confirmCopy(action: PendingAction): ConfirmOptions {
  const label = action.setting.label || action.setting.settingKey;
  if (action.type === "upload") {
    return {
      title: `Upload image for “${label}”?`,
      description: `Selected file: ${action.file.name}. It will replace the current image and save right away.`,
      confirmLabel: "Upload & save",
    };
  }
  return {
    title: `Save “${label}”?`,
    description: "This will update the live site immediately.",
    confirmLabel: "Save changes",
  };
}

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const { refreshSettings } = useSiteSettings();
  const status = useAdminStatus();
  const [settings, setSettings] = useState<SiteSetting[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [section, setSection] = useState<(typeof SETTING_SECTIONS)[number]["id"]>("appearance");
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [fieldStatus, setFieldStatus] = useState<Record<string, "saved" | "uploaded" | "failed" | null>>({});
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [confirming, setConfirming] = useState(false);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    const applyHash = () => {
      const hash = window.location.hash.replace(/^#/, "");
      if (SETTING_SECTIONS.some((s) => s.id === hash)) {
        setSection(hash as (typeof SETTING_SECTIONS)[number]["id"]);
      }
    };
    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, []);

  function selectSection(id: (typeof SETTING_SECTIONS)[number]["id"]) {
    setSection(id);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `#${id}`);
    }
  }

  useEffect(() => {
    const families = Array.from(new Set([...BODY_FONTS, ...DISPLAY_FONTS].map((f) => f.google)))
      .map((f) => `family=${f}`)
      .join("&");
    const id = "stationz-admin-fonts";
    let link = document.getElementById(id) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    link.href = `https://fonts.googleapis.com/css2?${families}&display=swap`;
  }, []);

  const load = async () => {
    if (!user) return;
    try {
      const data = await apiFetch<SiteSetting[]>("/admin/settings", { token: user.token });
      const relevant = data.filter((s) => RELEVANT.has(s.settingKey));
      setSettings(relevant);
      const map: Record<string, string> = {};
      relevant.forEach((item) => {
        map[item.settingKey] = item.settingValue || "";
      });
      setDrafts(map);
    } catch (error) {
      status.error(getErrorMessage(error, "We couldn’t load settings. Please refresh and try again."));
    }
  };

  useEffect(() => {
    load();
  }, [user]);

  const activeSection = SETTING_SECTIONS.find((s) => s.id === section) || SETTING_SECTIONS[0];

  const sectionSettings = useMemo(() => {
    const byKey = new Map(settings.map((s) => [s.settingKey, s]));
    return activeSection.keys
      .map((key) => byKey.get(key))
      .filter((s): s is SiteSetting => Boolean(s));
  }, [settings, activeSection]);

  function markField(key: string, state: "saved" | "uploaded" | "failed" | null) {
    setFieldStatus((prev) => ({ ...prev, [key]: state }));
    if (state) {
      setTimeout(() => {
        setFieldStatus((prev) => (prev[key] === state ? { ...prev, [key]: null } : prev));
      }, 4000);
    }
  }

  async function runSave(setting: SiteSetting) {
    if (!user) return;
    const label = setting.label || setting.settingKey;
    let value = (drafts[setting.settingKey] ?? "").trim();
    if (!value) {
      markField(setting.settingKey, "failed");
      status.error(`Please enter a value for “${label}”.`);
      return;
    }

    if (isHeroHeight(setting.settingKey)) {
      const n = Number.parseInt(value, 10);
      if (!Number.isFinite(n) || n < 36 || n > 65) {
        markField(setting.settingKey, "failed");
        status.error("Banner height must be between 36% and 65%.");
        return;
      }
      value = String(n);
    }

    const themeError = validateThemeValue(setting.settingKey, value);
    if (themeError) {
      markField(setting.settingKey, "failed");
      status.error(themeError);
      return;
    }

    if (isColor(setting.settingKey)) value = normalizeHex(value, value);
    if (isFontSize(setting.settingKey)) value = String(parseFontSize(value));
    if (isHeadingScale(setting.settingKey)) value = String(parseHeadingScale(value));
    if (isBorderRadius(setting.settingKey)) value = String(parseBorderRadius(value));

    setSavingKey(setting.settingKey);
    try {
      await apiFetch("/admin/settings", {
        method: "PUT",
        token: user.token,
        body: {
          settingKey: setting.settingKey,
          settingValue: value,
          label: setting.label,
          groupName: activeSection.id,
        },
      });
      markField(setting.settingKey, "saved");
      status.success(`Saved “${label}”.`);
      await load();
      await refreshSettings();
    } catch (error) {
      markField(setting.settingKey, "failed");
      status.error(getErrorMessage(error, `We couldn’t save “${label}”. Please try again.`));
    } finally {
      setSavingKey(null);
    }
  }

  async function runUpload(setting: SiteSetting, file: File) {
    if (!user) return;
    const label = setting.label || setting.settingKey;
    setUploadingKey(setting.settingKey);
    try {
      const { url } = await apiUpload("/admin/upload", file, user.token);
      setDrafts((prev) => ({ ...prev, [setting.settingKey]: url }));
      await apiFetch("/admin/settings", {
        method: "PUT",
        token: user.token,
        body: {
          settingKey: setting.settingKey,
          settingValue: url,
          label: setting.label,
          groupName: activeSection.id,
        },
      });
      markField(setting.settingKey, "uploaded");
      status.success(`Uploaded image for “${label}”.`);
      await load();
      await refreshSettings();
    } catch (error) {
      markField(setting.settingKey, "failed");
      status.error(getErrorMessage(error, `We couldn’t upload the image for “${label}”. Please try a different file.`));
    } finally {
      setUploadingKey(null);
    }
  }

  function requestSave(setting: SiteSetting) {
    const label = setting.label || setting.settingKey;
    const value = (drafts[setting.settingKey] ?? "").trim();
    if (!value) {
      markField(setting.settingKey, "failed");
      status.error(`Please enter a value for “${label}”.`);
      return;
    }
    if (isHeroHeight(setting.settingKey)) {
      const n = Number.parseInt(value, 10);
      if (!Number.isFinite(n) || n < 36 || n > 65) {
        markField(setting.settingKey, "failed");
        status.error("Banner height must be between 36% and 65%.");
        return;
      }
    }
    const themeError = validateThemeValue(setting.settingKey, value);
    if (themeError) {
      markField(setting.settingKey, "failed");
      status.error(themeError);
      return;
    }
    setPending({ type: "save", setting });
  }

  async function handleConfirm() {
    if (!pending) return;
    const action = pending;
    setConfirming(true);
    try {
      if (action.type === "save") await runSave(action.setting);
      else await runUpload(action.setting, action.file);
    } finally {
      setConfirming(false);
      setPending(null);
    }
  }

  const dialog = pending ? confirmCopy(pending) : null;
  const dialogBusy = confirming || savingKey !== null || uploadingKey !== null;

  return (
    <div className="w-full space-y-6">
      <div>
        <p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">Admin</p>
        <h1 className="mt-1 font-display text-3xl text-ink">Settings</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Branding, layout, contact details, and outbound email (SMTP) for booking acknowledgements.
        </p>
      </div>

      <AdminFeedback feedback={status.feedback} onDismiss={status.clear} />

      <div className="flex flex-wrap gap-2 rounded-2xl border border-border/70 bg-white p-2">
        {SETTING_SECTIONS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => selectSection(item.id)}
            className={cn(
              "rounded-xl px-4 py-2.5 text-sm font-semibold transition",
              section === item.id
                ? "bg-primary text-primary-foreground"
                : "text-ink/70 hover:bg-mist hover:text-ink"
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="font-display text-xl text-ink">{activeSection.label}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{activeSection.description}</p>
        </div>

        {section === "email" ? (
          <MailSettingsForm />
        ) : (
          <>
            {sectionSettings.length === 0 && (
              <p className="rounded-2xl border border-dashed border-border bg-white px-5 py-8 text-sm text-muted-foreground">
                No settings in this section yet. Restart the backend to seed defaults.
              </p>
            )}

            <div className="grid gap-4">
              {sectionSettings.map((setting) => {
            const isImage = IMAGE_KEYS.has(setting.settingKey);
            const value = drafts[setting.settingKey] || "";
            const local = fieldStatus[setting.settingKey];
            const busy =
              savingKey === setting.settingKey || uploadingKey === setting.settingKey;

            return (
              <div
                key={setting.id}
                className="rounded-2xl border border-border/70 bg-white p-5 sm:p-6"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1 space-y-4">
                    <div>
                      <Label className="text-base font-semibold text-ink">
                        {setting.label || setting.settingKey}
                      </Label>
                      {local === "saved" && (
                        <p className="mt-1 text-xs font-medium text-emerald-700">Saved</p>
                      )}
                      {local === "uploaded" && (
                        <p className="mt-1 text-xs font-medium text-emerald-700">Uploaded</p>
                      )}
                      {local === "failed" && (
                        <p className="mt-1 text-xs font-medium text-red-700">Failed</p>
                      )}
                    </div>

                    {isImage && value && (
                      <div className="overflow-hidden rounded-xl border border-border bg-mist/40 p-2">
                        {setting.settingKey === "logo_url" ? (
                          <Image
                            src={value}
                            alt="Logo"
                            width={72}
                            height={72}
                            className="size-[72px] rounded-full object-cover"
                            unoptimized
                          />
                        ) : (
                          <div
                            className="h-32 w-full rounded-lg bg-cover bg-center"
                            style={{ backgroundImage: `url('${value}')` }}
                          />
                        )}
                      </div>
                    )}

                    {isHeroHeight(setting.settingKey) ? (
                      <div className="max-w-md space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Hero height</span>
                          <span className="font-semibold tabular-nums text-ink">{value || "48"}%</span>
                        </div>
                        <input
                          type="range"
                          min={36}
                          max={65}
                          step={1}
                          value={Number.parseInt(value || "48", 10) || 48}
                          onChange={(e) =>
                            setDrafts({ ...drafts, [setting.settingKey]: e.target.value })
                          }
                          className="w-full accent-primary"
                        />
                      </div>
                    ) : isFontBody(setting.settingKey) || isFontDisplay(setting.settingKey) ? (
                      <div className="max-w-md space-y-2">
                        <Select
                          value={
                            value ||
                            (isFontBody(setting.settingKey) ? "dm-sans" : "dm-sans")
                          }
                          onValueChange={(next) =>
                            setDrafts({ ...drafts, [setting.settingKey]: next })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a font" />
                          </SelectTrigger>
                          <SelectContent>
                            {(isFontBody(setting.settingKey) ? BODY_FONTS : DISPLAY_FONTS).map(
                              (font) => (
                                <SelectItem key={font.id} value={font.id}>
                                  <span style={{ fontFamily: font.family }}>{font.label}</span>
                                </SelectItem>
                              )
                            )}
                          </SelectContent>
                        </Select>
                        <p
                          className="rounded-xl bg-mist/70 px-3 py-2.5 text-sm text-ink"
                          style={{
                            fontFamily: (
                              (isFontBody(setting.settingKey) ? BODY_FONTS : DISPLAY_FONTS).find(
                                (f) => f.id === value
                              ) ||
                              (isFontBody(setting.settingKey) ? BODY_FONTS[0] : DISPLAY_FONTS[0])
                            ).family,
                          }}
                        >
                          The quick brown fox jumps over the lazy dog.
                        </p>
                      </div>
                    ) : isColor(setting.settingKey) ? (
                      <div className="flex flex-wrap items-center gap-3">
                        <input
                          type="color"
                          value={normalizeHex(value, "#0B5F6B")}
                          onChange={(e) =>
                            setDrafts({
                              ...drafts,
                              [setting.settingKey]: e.target.value.toUpperCase(),
                            })
                          }
                          className="size-11 cursor-pointer rounded-xl border border-border bg-white p-1"
                          aria-label={setting.label || setting.settingKey}
                        />
                        <Input
                          value={value}
                          onChange={(e) =>
                            setDrafts({ ...drafts, [setting.settingKey]: e.target.value })
                          }
                          placeholder="#0B5F6B"
                          className="max-w-[10rem] font-mono uppercase"
                        />
                      </div>
                    ) : isFontSize(setting.settingKey) ? (
                      <div className="max-w-md space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Base size</span>
                          <span className="font-semibold tabular-nums text-ink">{value || "18"}px</span>
                        </div>
                        <input
                          type="range"
                          min={15}
                          max={22}
                          step={1}
                          value={Number.parseInt(value || "18", 10) || 18}
                          onChange={(e) =>
                            setDrafts({ ...drafts, [setting.settingKey]: e.target.value })
                          }
                          className="w-full accent-primary"
                        />
                      </div>
                    ) : isHeadingScale(setting.settingKey) ? (
                      <div className="max-w-md space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Heading scale</span>
                          <span className="font-semibold tabular-nums text-ink">
                            {Number.parseFloat(value || "1").toFixed(2)}×
                          </span>
                        </div>
                        <input
                          type="range"
                          min={0.9}
                          max={1.3}
                          step={0.05}
                          value={Number.parseFloat(value || "1.1") || 1.1}
                          onChange={(e) =>
                            setDrafts({ ...drafts, [setting.settingKey]: e.target.value })
                          }
                          className="w-full accent-primary"
                        />
                      </div>
                    ) : isBorderRadius(setting.settingKey) ? (
                      <div className="max-w-md space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Corners</span>
                          <span className="font-semibold tabular-nums text-ink">
                            {value || "0.875"}rem
                          </span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={1.5}
                          step={0.05}
                          value={Number.parseFloat(value || "0.875") || 0.875}
                          onChange={(e) =>
                            setDrafts({ ...drafts, [setting.settingKey]: e.target.value })
                          }
                          className="w-full accent-primary"
                        />
                        <div
                          className="h-12 w-24 border border-border bg-mist"
                          style={{ borderRadius: `${value || "0.875"}rem` }}
                        />
                      </div>
                    ) : isMultiline(setting.settingKey) ? (
                      <Textarea
                        value={value}
                        onChange={(e) =>
                          setDrafts({ ...drafts, [setting.settingKey]: e.target.value })
                        }
                        className="min-h-24 max-w-xl"
                      />
                    ) : (
                      <Input
                        value={value}
                        onChange={(e) =>
                          setDrafts({ ...drafts, [setting.settingKey]: e.target.value })
                        }
                        placeholder={isImage ? "https://... or upload" : undefined}
                        className="max-w-xl"
                      />
                    )}
                  </div>

                  <div className="flex shrink-0 flex-row gap-2 lg:flex-col">
                    <Button
                      type="button"
                      size="sm"
                      disabled={busy || !!pending}
                      onClick={() => requestSave(setting)}
                    >
                      {savingKey === setting.settingKey ? "Saving..." : "Save"}
                    </Button>
                    {isImage && (
                      <>
                        <input
                          ref={(el) => {
                            fileRefs.current[setting.settingKey] = el;
                          }}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            e.target.value = "";
                            if (file) setPending({ type: "upload", setting, file });
                          }}
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={busy || !!pending}
                          onClick={() => fileRefs.current[setting.settingKey]?.click()}
                        >
                          {uploadingKey === setting.settingKey ? "Uploading..." : "Upload"}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
            </div>
          </>
        )}
      </section>

      {dialog && (
        <ConfirmDialog
          open={!!pending}
          title={dialog.title}
          description={dialog.description}
          confirmLabel={dialog.confirmLabel}
          destructive={dialog.destructive}
          busy={dialogBusy}
          onCancel={() => {
            if (!dialogBusy) setPending(null);
          }}
          onConfirm={handleConfirm}
        />
      )}
    </div>
  );
}
