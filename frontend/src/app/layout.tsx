import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/Toast";
import ClientProviders from "@/components/ClientProviders";
import Nav from "@/components/Nav";
import StartupOverlay from "@/components/StartupOverlay";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#030712" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL("https://subscription-expenses-manager.vercel.app"),
  title: {
    default: "SubManager — Subscription & Expense Tracker",
    template: "%s | SubManager",
  },
  description:
    "Free subscription tracker and expense manager. Monitor recurring payments, log one-off expenses across 20+ currencies, and store passwords securely — all in one app.",
  keywords: [
    "subscription tracker",
    "expense manager",
    "recurring payments",
    "budget tracker",
    "password vault",
    "multi-currency expenses",
    "subscription management",
    "personal finance",
  ],
  manifest: "/manifest.json",
  alternates: {
    canonical: "https://subscription-expenses-manager.vercel.app",
  },
  verification: {
    google: "DwcnOpKrTSiqtD-2Qrpb6NoDDp0FLHuxeq1i7vfuCfo",
  },
  openGraph: {
    title: "SubManager — Subscription & Expense Tracker",
    description:
      "Track subscriptions, expenses & passwords in one place. Supports 20+ currencies.",
    siteName: "SubManager",
    type: "website",
    url: "https://subscription-expenses-manager.vercel.app",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "SubManager — Subscription & Expense Tracker",
    description:
      "Track subscriptions, expenses & passwords in one place. Supports 20+ currencies.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <Script
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5434162081070782"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "SubManager",
              url: "https://subscription-expenses-manager.vercel.app",
              description:
                "Free subscription tracker and expense manager. Monitor recurring payments, log expenses across 20+ currencies, and store passwords securely.",
              applicationCategory: "FinanceApplication",
              operatingSystem: "Web, iOS, Android",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
            }),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ClientProviders>
          <ToastProvider>
            <StartupOverlay />
            <Nav />
            {children}
          </ToastProvider>
        </ClientProviders>
      </body>
    </html>
  );
}
