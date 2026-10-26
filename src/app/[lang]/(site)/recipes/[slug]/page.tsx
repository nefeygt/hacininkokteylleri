import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import GlossaryProvider from "@/components/GlossaryProvider";
import RecipeJsonLd from "@/components/RecipeJsonLd";
import RecipeView from "@/components/RecipeView";
import { getGlossary, getRecipe } from "@/lib/content";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { format } from "@/lib/i18n/format";
import { asLocale, localePath } from "@/lib/i18n/locales";
import { alternatesFor, recipeOpenGraph } from "@/lib/seo";

// Members' recipes (M6, ADR-018), rendered on first visit and kept for a few
// minutes; the author's edits, reviews and moderation revalidate at once.
export const revalidate = 300;

// No recipe is built ahead of time; each is rendered on its first visit and cached.
export async function generateStaticParams() {
  return [];
}

const loadRecipe = cache(getRecipe);

type Params = Promise<{ lang: string; slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { lang: rawLang, slug } = await params;
  const lang = asLocale(rawLang);
  const t = getDictionary(lang);
  const recipe = await loadRecipe(slug);
  if (!recipe) return { title: t.status.notFoundMeta };
  const by = recipe.author ? ` — @${recipe.author.username}` : "";
  const path = `/recipes/${recipe.slug}`;
  return {
    title: recipe.name,
    description: `${recipe.subtitle || format(t.jsonLd.description, { base: recipe.baseAlcohol })}${by}`,
    alternates: alternatesFor(lang, path),
    openGraph: recipeOpenGraph(path, recipe.imageUrl, lang),
  };
}

export default async function RecipePage({ params }: { params: Params }) {
  const { lang: rawLang, slug } = await params;
  const lang = asLocale(rawLang);
  // A member's recipe stays in the language it was written in: the Turkish terms keep their tooltips.
  const [recipe, glossary] = await Promise.all([loadRecipe(slug), getGlossary(lang, true)]);
  if (!recipe) notFound();

  return (
    <GlossaryProvider glossary={glossary}>
      <RecipeJsonLd cocktail={recipe} path={localePath(lang, `/recipes/${recipe.slug}`)} lang={lang} />
      <RecipeView cocktail={recipe} />
    </GlossaryProvider>
  );
}
