import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { BRAND } from "@/lib/brand";
import { DEFAULT_LOCALE, INTL_LOCALES, type Locale } from "@/lib/i18n/locales";

// The share card (Open Graph image) for pages without a photo: WhatsApp, Instagram and X show it
// when a link is shared. Rx's colours (src/app/globals.css), drawn by Satori, which needs real font
// files for Turkish letters (src/assets/fonts, OFL).

export const OG_SIZE = { width: 1200, height: 630 };

const FONT_DIR = join(process.cwd(), "src/assets/fonts");

async function fonts() {
  const [bold, regular, mono] = await Promise.all([
    readFile(join(FONT_DIR, "IBMPlexSans-Bold.ttf")),
    readFile(join(FONT_DIR, "IBMPlexSans-Regular.ttf")),
    readFile(join(FONT_DIR, "JetBrainsMono-Medium.ttf")),
  ]);
  return [
    { name: "Plex", data: bold, weight: 700 as const, style: "normal" as const },
    { name: "Plex", data: regular, weight: 400 as const, style: "normal" as const },
    { name: "Mono", data: mono, weight: 500 as const, style: "normal" as const },
  ];
}

export async function ogCard({
  label,
  title,
  subtitle,
  locale = DEFAULT_LOCALE,
}: {
  label: string;
  title: string;
  subtitle?: string;
  locale?: Locale;
}) {
  const titleSize = title.length > 28 ? 72 : title.length > 16 ? 92 : 112;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "radial-gradient(circle at 70% 30%, #2a0f0f 0%, #0d0d0d 60%)",
          color: "#e8e6e3",
          fontFamily: "Plex",
        }}
      >
        <div style={{ display: "flex", fontFamily: "Mono", fontSize: 26, letterSpacing: 6, color: "#d0453a" }}>
          {`RX · ${label.toLocaleUpperCase(INTL_LOCALES[locale])}`}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: titleSize, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2 }}>
            {title}
          </div>
          {subtitle && (
            <div style={{ display: "flex", marginTop: 24, fontSize: 36, color: "#b4b1ae", lineHeight: 1.3 }}>
              {subtitle.length > 90 ? `${subtitle.slice(0, 89)}…` : subtitle}
            </div>
          )}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ display: "flex", fontSize: 64, fontWeight: 700, color: "#d0453a", letterSpacing: -1 }}>{BRAND}</div>
          <div style={{ display: "flex", fontFamily: "Mono", fontSize: 24, color: "#7d7a78" }}>hacininkokteylleri.tech</div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: await fonts() },
  );
}
