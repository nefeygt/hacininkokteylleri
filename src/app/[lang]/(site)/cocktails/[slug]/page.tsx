import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import GlossaryProvider from "@/components/GlossaryProvider";
import RecipeJsonLd from "@/components/RecipeJsonLd";
import RecipeView from "@/components/RecipeView";
import SimilarCocktails from "@/components/SimilarCocktails";
import { similarCocktails } from "@/lib/archive-filter";
import { getCocktail, getGlossary, getPublishedCocktails } from "@/lib/content";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { format } from "@/lib/i18n/format";
import { asLocale, localePath } from "@/lib/i18n/locales";
import { alternatesFor, recipeOpenGraph } from "@/lib/seo";

// A house recipe's own page (ADR-025), rebuilt hourly like the archive; panel
// edits and reviews revalidate it at once.
export const revalidate = 3600;

// Every house recipe is built ahead of time in every language; one published later renders on
// its first visit.
export async function generateStaticParams({ params }: { params: { lang: string } }) {
  const cocktails = await loadArchive(asLocale(params.lang));
  return cocktails.map((c) => ({ slug: c.slug }));
}

const loadCocktail = cache(getCocktail);
const loadArchive = cache(getPublishedCocktails);

type Params = Promise<{ lang: string; slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { lang: rawLang, slug } = await params;
  const lang = asLocale(rawLang);
  const t = getDictionary(lang);
  const cocktail = await loadCocktail(slug, lang);
  if (!cocktail) return { title: t.status.notFoundMeta };
  const path = `/cocktails/${cocktail.slug}`;
  return {
    title: cocktail.name,
    description: cocktail.subtitle || format(t.jsonLd.description, { base: cocktail.baseAlcohol }),
    alternates: alternatesFor(lang, path),
    openGraph: recipeOpenGraph(path, cocktail.imageUrl, lang),
  };
}

export default async function CocktailPage({ params }: { params: Params }) {
  const { lang: rawLang, slug } = await params;
  const lang = asLocale(rawLang);
  const [cocktail, glossary, archive] = await Promise.all([loadCocktail(slug, lang), getGlossary(lang), loadArchive(lang)]);
  if (!cocktail) notFound();
  // Two cards fill a row on the page's width.
  const similar = similarCocktails(cocktail, archive, 4);

  return (
    <GlossaryProvider glossary={glossary}>
      <RecipeJsonLd cocktail={cocktail} path={localePath(lang, `/cocktails/${cocktail.slug}`)} lang={lang} />
      <RecipeView cocktail={cocktail} similar={<SimilarCocktails cocktails={similar} />} />
    </GlossaryProvider>
  );
}
