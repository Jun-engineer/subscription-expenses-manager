import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "Subscription & Expense Manager",
  description: "Track subscriptions, expenses, and passwords in one place",
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
