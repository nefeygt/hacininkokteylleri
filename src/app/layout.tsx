import type { Metadata, Viewport } from "next";
import {
  Atkinson_Hyperlegible_Next,
  Bricolage_Grotesque,
  IBM_Plex_Mono,
  IBM_Plex_Sans,
  Instrument_Serif,
  JetBrains_Mono,
  Source_Sans_3,
} from "next/font/google";
import "./globals.css";
import { BRAND } from "@/lib/brand";
import { THEME_BOOT_SCRIPT } from "@/lib/themes";
import { OPEN_GRAPH_BASE } from "@/lib/seo";

// Every theme's fonts (ADR-028). Only the default theme's two are preloaded; the others
// download when a theme that uses them is picked.
const plexSans = IBM_Plex_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--ff-plex-sans",
  display: "swap",
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin", "latin-ext"],
  variable: "--ff-jetbrains-mono",
  display: "swap",
});
const bricolage = Bricolage_Grotesque({
  subsets: ["latin", "latin-ext"],
  variable: "--ff-bricolage",
  display: "swap",
  preload: false,
});
const sourceSans = Source_Sans_3({
  subsets: ["latin", "latin-ext"],
  variable: "--ff-source-sans",
  display: "swap",
  preload: false,
});
const instrumentSerif = Instrument_Serif({
  subsets: ["latin", "latin-ext"],
  weight: "400",
  variable: "--ff-instrument-serif",
  display: "swap",
  preload: false,
});
const atkinson = Atkinson_Hyperlegible_Next({
  subsets: ["latin", "latin-ext"],
  variable: "--ff-atkinson",
  display: "swap",
  preload: false,
});
const plexMono = IBM_Plex_Mono({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  variable: "--ff-plex-mono",
  display: "swap",
  preload: false,
});

const fontVariables = [plexSans, jetbrainsMono, bricolage, sourceSans, instrumentSerif, atkinson, plexMono]
  .map((font) => font.variable)
  .join(" ");

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://hacininkokteylleri.tech"),
  title: { default: BRAND, template: `%s · ${BRAND}` },
  applicationName: BRAND,
  description: "Sinematik bir kokteyl arşivi: her biri özenle formüle edilmiş kokteyl reçeteleri.",
  openGraph: OPEN_GRAPH_BASE,
  twitter: { card: "summary_large_image" },
  verification: {
    google: "ZfTQJ4AR0Rq0iytJ0JXhQZgXCSoCOTTWhQB6PvYMLyY",
  },
};

// The browser bar in Rx's background; the other themes keep it (a per-theme colour is not worth a script).
export const viewport: Viewport = { themeColor: "#0d0d0d" };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // The boot script sets data-theme before React loads, hence the suppressed warning.
    <html lang="tr" className={fontVariables} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      {/* Browser extensions add attributes to <body> before React loads. */}
      <body className="min-h-screen bg-bg-primary text-text-primary antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
