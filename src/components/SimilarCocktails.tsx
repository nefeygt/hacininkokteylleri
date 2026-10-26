"use client";

import CocktailCard from "@/components/CocktailCard";
import { useLocale } from "@/components/LocaleProvider";
import { recipeHref, type Cocktail } from "@/lib/content";

/** "Benzer kokteyller" under a house recipe: the archive's closest recipes as cards. */
export default function SimilarCocktails({ cocktails }: { cocktails: Cocktail[] }) {
  const { t } = useLocale();
  if (cocktails.length === 0) return null;
  return (
    <section className="mt-12 border-t border-border pt-8">
      <h2 className="mb-5 font-mono text-xs uppercase tracking-[0.15em] text-text-muted">{t.cocktails.similar}</h2>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {cocktails.map((c) => (
          <CocktailCard key={c.id} cocktail={c} href={recipeHref(c.slug, false)} />
        ))}
      </div>
    </section>
  );
}
