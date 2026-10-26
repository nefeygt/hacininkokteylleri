import type { Metadata } from "next";
import CocktailBrowser from "@/components/CocktailBrowser";
import GlossaryProvider from "@/components/GlossaryProvider";
import { getGlossary, getPublishedCocktails } from "@/lib/content";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { asLocale } from "@/lib/i18n/locales";
import { alternatesFor } from "@/lib/seo";

// Built once, then rebuilt at most hourly. An edit in the admin panel rebuilds
// it at once through revalidatePath (ADR-005).
export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const lang = asLocale((await params).lang);
  const t = getDictionary(lang).pageMeta;
  return {
    title: t.cocktailsTitle,
    description: t.cocktailsDescription,
    alternates: alternatesFor(lang, "/cocktails"),
  };
}

export default async function KokteyllerPage({ params }: { params: Promise<{ lang: string }> }) {
  const lang = asLocale((await params).lang);
  const [cocktails, glossary] = await Promise.all([getPublishedCocktails(lang), getGlossary(lang)]);

  return (
    <GlossaryProvider glossary={glossary}>
      <CocktailBrowser cocktails={cocktails} />
    </GlossaryProvider>
  );
}
