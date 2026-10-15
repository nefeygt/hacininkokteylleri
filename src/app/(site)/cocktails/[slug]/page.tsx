import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import GlossaryProvider from "@/components/GlossaryProvider";
import RecipeJsonLd from "@/components/RecipeJsonLd";
import RecipeView from "@/components/RecipeView";
import SimilarCocktails from "@/components/SimilarCocktails";
import { similarCocktails } from "@/lib/archive-filter";
import { getCocktail, getGlossary, getPublishedCocktails } from "@/lib/content";

// A house recipe's own page (ADR-025), rebuilt hourly like the archive; panel
// edits and reviews revalidate it at once.
export const revalidate = 3600;

// Every house recipe is built ahead of time; one published later renders on
// its first visit.
export async function generateStaticParams() {
  const cocktails = await loadArchive();
  return cocktails.map((c) => ({ slug: c.slug }));
}

const loadCocktail = cache(getCocktail);
const loadArchive = cache(getPublishedCocktails);

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
  const [cocktail, glossary, archive] = await Promise.all([
    loadCocktail((await params).slug),
    getGlossary(),
    loadArchive(),
  ]);
  if (!cocktail) notFound();
  // Two cards fill a row on the page's width.
  const similar = similarCocktails(cocktail, archive, 4);

  return (
    <GlossaryProvider glossary={glossary}>
      <RecipeJsonLd cocktail={cocktail} path={`/cocktails/${cocktail.slug}`} />
      <RecipeView cocktail={cocktail} similar={<SimilarCocktails cocktails={similar} />} />
    </GlossaryProvider>
  );
}
