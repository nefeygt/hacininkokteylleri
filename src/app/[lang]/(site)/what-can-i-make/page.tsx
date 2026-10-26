import type { Metadata } from "next";
import WhatCanIMake from "@/components/WhatCanIMake";
import { getIngredientCatalogue, getMatchableRecipes, getPublishedCocktails } from "@/lib/content";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { asLocale } from "@/lib/i18n/locales";
import { alternatesFor } from "@/lib/seo";

// Static like the archive; an edit in the panel or a member's recipe save rebuilds it at once (ADR-005).
export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const lang = asLocale((await params).lang);
  const t = getDictionary(lang).pageMeta;
  return {
    title: t.whatCanIMakeTitle,
    description: t.whatCanIMakeDescription,
    alternates: alternatesFor(lang, "/what-can-i-make"),
  };
}

export default async function WhatCanIMakePage({ params }: { params: Promise<{ lang: string }> }) {
  const lang = asLocale((await params).lang);
  // House recipes first, then members' fully linked ones (ADR-029).
  const [house, members, catalogue] = await Promise.all([
    getPublishedCocktails(lang),
    getMatchableRecipes(),
    getIngredientCatalogue(lang),
  ]);
  return <WhatCanIMake cocktails={[...house, ...members]} catalogue={catalogue} />;
}
