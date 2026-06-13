import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import Script from "next/script";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import NextTopLoader from "nextjs-toploader";
import { Toaster } from "sonner";
import { Analytics } from "@/components/analytics/Analytics";
import { AppSplash } from "@/components/layout/AppSplash";
import { BottomNav } from "@/components/layout/BottomNav";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { AppleSplashLinks } from "@/components/pwa/AppleSplashLinks";
import { WhatsNew } from "@/components/pwa/WhatsNew";
import { routing } from "@/i18n/routing";
import { flags } from "@/lib/config/flags";
import { siteConfig } from "@/lib/config/site";
import { buildMetadata } from "@/lib/seo/metadata";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  applicationName: siteConfig.name,
  ...buildMetadata(),
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: siteConfig.name,
  },
  ...(flags.gscVerification ? { verification: { google: flags.gscVerification } } : {}),
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFF9F5" },
    { media: "(prefers-color-scheme: dark)", color: "#15100F" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{ children: React.ReactNode; params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <AppleSplashLinks />
      </head>
      <body className="flex min-h-full flex-col pb-16 sm:pb-0">
        <NextIntlClientProvider>
          <ThemeProvider>
            <NextTopLoader
              color="#FF5E78"
              shadow="0 0 10px #FF5E78,0 0 5px #FF2E93"
              height={3}
              showSpinner={false}
            />
            <AppSplash />
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <BottomNav />
            <Toaster position="top-center" richColors closeButton />
            <WhatsNew />
          </ThemeProvider>
        </NextIntlClientProvider>

        <Analytics />

        {/* AdSense loader — only when ads are enabled. */}
        {flags.adsEnabled && (
          <Script
            id="adsbygoogle-init"
            async
            strategy="afterInteractive"
            crossOrigin="anonymous"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${flags.adsClientId}`}
          />
        )}
      </body>
    </html>
  );
}
