import { Analytics } from "@vercel/analytics/next";
import LocaleProvider from "@/components/LocaleProvider";
import Navbar from "@/components/Navbar";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n/locales";

// The public site's frame. The admin panel (src/app/admin) has its own.
// Analytics is Vercel's cookieless page-view count, public site only (/privacy names it).
// LocaleProvider gives every client component the page's language (ADR-032).
export default async function SiteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  return (
    <LocaleProvider locale={isLocale(lang) ? lang : DEFAULT_LOCALE}>
      <Navbar />
      <main>{children}</main>
      <Analytics />
    </LocaleProvider>
  );
}
