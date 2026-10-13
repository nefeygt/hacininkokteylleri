import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { BRAND } from "@/lib/brand";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin", "latin-ext"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://hacininkokteylleri.tech"),
  title: { default: BRAND, template: `%s · ${BRAND}` },
  applicationName: BRAND,
  description: "Sinematik bir kokteyl arşivi: her biri özenle formüle edilmiş kokteyl reçeteleri.",
  openGraph: { siteName: BRAND, locale: "tr_TR", type: "website" },
  verification: {
    google: "ZfTQJ4AR0Rq0iytJ0JXhQZgXCSoCOTTWhQB6PvYMLyY",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      {/* Browser extensions add attributes to <body> before React loads. */}
      <body className="min-h-screen bg-bg-primary text-text-primary antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
