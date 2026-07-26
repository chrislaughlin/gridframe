import type { Metadata } from "next";
import localFont from "next/font/local";
import { SiteHeader } from "./components/site-header";
import { SiteFooter } from "./components/site-footer";
import { LegacyServiceWorkerCleanup } from "./legacy-service-worker-cleanup";
import "@gridframe/react/styles.css";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Gridframe: Dashboard infrastructure for product teams",
  description:
    "A toolkit for building complex, customisable dashboards without rebuilding the same dashboard plumbing every time.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <LegacyServiceWorkerCleanup />
        <div className="flex min-h-svh flex-col">
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
