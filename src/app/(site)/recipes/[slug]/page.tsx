import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import GlossaryProvider from "@/components/GlossaryProvider";
import RecipeJsonLd from "@/components/RecipeJsonLd";
import RecipeView from "@/components/RecipeView";
import { getGlossary, getRecipe } from "@/lib/content";

// Members' recipes (M6, ADR-018), rendered on first visit and kept for a few
// minutes; the author's edits, reviews and moderation revalidate at once.
export const revalidate = 300;

// No recipe is built ahead of time; each is rendered on its first visit and cached.
export async function generateStaticParams() {
  return [];
}

const loadRecipe = cache(getRecipe);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const recipe = await loadRecipe((await params).slug);
  if (!recipe) return { title: "Bulunamadı" };
  const by = recipe.author ? ` — @${recipe.author.username}` : "";
  return {
    title: recipe.name,
    description: `${recipe.subtitle || `${recipe.baseAlcohol} bazlı bir kokteyl tarifi`}${by}`,
    alternates: { canonical: `/recipes/${recipe.slug}` },
    openGraph: recipe.imageUrl ? { images: [recipe.imageUrl] } : undefined,
  };
}

export default async function RecipePage({ params }: { params: Promise<{ slug: string }> }) {
  const [recipe, glossary] = await Promise.all([loadRecipe((await params).slug), getGlossary()]);
  if (!recipe) notFound();

  return (
    <GlossaryProvider glossary={glossary}>
      <RecipeJsonLd cocktail={recipe} path={`/recipes/${recipe.slug}`} />
      <RecipeView cocktail={recipe} />
    </GlossaryProvider>
  );
}
