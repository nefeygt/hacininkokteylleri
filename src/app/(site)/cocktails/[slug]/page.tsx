import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import GlossaryProvider from "@/components/GlossaryProvider";
import RecipeView from "@/components/RecipeView";
import { getCocktail, getGlossary, getPublishedCocktails } from "@/lib/content";

// A house recipe's own page (ADR-025), rebuilt hourly like the archive; panel
// edits and reviews revalidate it at once.
export const revalidate = 3600;

// Every house recipe is built ahead of time; one published later renders on
// its first visit.
export async function generateStaticParams() {
  const cocktails = await getPublishedCocktails();
  return cocktails.map((c) => ({ slug: c.slug }));
}

const loadCocktail = cache(getCocktail);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const cocktail = await loadCocktail((await params).slug);
  if (!cocktail) return { title: "Bulunamadı" };
  return {
    title: cocktail.name,
    description: cocktail.subtitle || `${cocktail.baseAlcohol} bazlı bir kokteyl tarifi`,
    alternates: { canonical: `/cocktails/${cocktail.slug}` },
    openGraph: cocktail.imageUrl ? { images: [cocktail.imageUrl] } : undefined,
  };
}

export default async function CocktailPage({ params }: { params: Promise<{ slug: string }> }) {
  const [cocktail, glossary] = await Promise.all([loadCocktail((await params).slug), getGlossary()]);
  if (!cocktail) notFound();

  return (
    <GlossaryProvider glossary={glossary}>
      <RecipeView cocktail={cocktail} />
    </GlossaryProvider>
  );
}
