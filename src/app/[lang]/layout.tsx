import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { BRAND } from "@/lib/brand";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { INTL_LOCALES, isLocale, LOCALES, OG_LOCALES } from "@/lib/i18n/locales";
import { OPEN_GRAPH_BASE } from "@/lib/seo";
import RootDocument from "../root-document";

// The public site's root layout, one tree per language (ADR-032). Turkish is served at the root through a
// rewrite in src/proxy.ts; only languages in PUBLISHED_LOCALES are reachable from outside. No
// `dynamicParams = false` here: children inherit it, and profiles or members' recipes are rendered on demand.

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = getDictionary(lang);
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://hacininkokteylleri.tech"),
    title: { default: BRAND, template: `%s · ${BRAND}` },
    applicationName: BRAND,
    description: t.meta.siteDescription,
    openGraph: { ...OPEN_GRAPH_BASE, locale: OG_LOCALES[lang] },
    twitter: { card: "summary_large_image" },
    verification: {
      google: "ZfTQJ4AR0Rq0iytJ0JXhQZgXCSoCOTTWhQB6PvYMLyY",
    },
  };
}

// The browser bar in Rx's background; the other themes keep it (a per-theme colour is not worth a script).
export const viewport: Viewport = { themeColor: "#0d0d0d" };

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return <RootDocument lang={INTL_LOCALES[lang].slice(0, 2)}>{children}</RootDocument>;
}
