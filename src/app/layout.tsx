import type { Metadata } from "next";
import { AuthProvider } from "@/context/auth-context";
import { SiteSettingsProvider } from "@/context/site-settings-context";
import { AppShell } from "@/components/layout/app-shell";
import { brand } from "@/lib/brand";
import "./globals.css";

export const metadata: Metadata = {
  title: `${brand.name} | ${brand.tagline}`,
  description: brand.support,
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/logo.png", type: "image/png", sizes: "256x256" },
    ],
    apple: [{ url: "/logo.png", type: "image/png", sizes: "256x256" }],
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-AU">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen font-sans antialiased">
        <AuthProvider>
          <SiteSettingsProvider>
            <AppShell>{children}</AppShell>
          </SiteSettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
