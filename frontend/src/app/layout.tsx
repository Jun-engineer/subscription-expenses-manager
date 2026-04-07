import type { Metadata, Viewport } from "next";
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
  title: {
    default: "SubManager",
    template: "%s | SubManager",
  },
  description: "Track recurring subscriptions, one-off expenses, and securely store credentials — all in one place.",
  manifest: "/manifest.json",
  openGraph: {
    title: "SubManager",
    description: "Track subscriptions, expenses & passwords in one place.",
    siteName: "SubManager",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
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
