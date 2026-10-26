import { BRAND } from "@/lib/brand";
import type { Cocktail } from "@/lib/content";
import { formatAmount } from "@/lib/drink-log";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { format } from "@/lib/i18n/format";
import { DEFAULT_LOCALE, localePath, type Locale } from "@/lib/i18n/locales";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hacininkokteylleri.tech";

/**
 * schema.org Recipe data for Google's recipe rich results (photo, rating and
 * ingredients in search). Rendered with the static page, so it carries the
 * rating of the last rebuild.
 */
export default function RecipeJsonLd({
  cocktail,
  path,
  lang = DEFAULT_LOCALE,
}: {
  cocktail: Cocktail;
  /** The visible path, with its language prefix. */
  path: string;
  lang?: Locale;
}) {
  const t = getDictionary(lang);
  const data = {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: cocktail.name,
    url: `${SITE_URL}${path}`,
    image: cocktail.imageUrl ? [cocktail.imageUrl] : undefined,
    description: cocktail.subtitle || format(t.jsonLd.description, { base: cocktail.baseAlcohol }),
    inLanguage: lang,
    recipeCategory: t.jsonLd.category,
    recipeYield: t.jsonLd.yield,
    keywords: [cocktail.baseAlcohol, cocktail.flavor, ...cocktail.tags].filter(Boolean).join(", "),
    author: cocktail.author
      ? { "@type": "Person", name: cocktail.author.displayName, url: `${SITE_URL}${localePath(lang, `/u/${cocktail.author.username}`)}` }
      : { "@type": "Organization", name: BRAND, url: SITE_URL },
    recipeIngredient: cocktail.ingredients.map((ing) => `${formatAmount(ing, lang, t)} ${ing.name}`),
    recipeInstructions: cocktail.instructions.map((text) => ({ "@type": "HowToStep", text })),
    suitableForDiet: cocktail.vegan ? "https://schema.org/VeganDiet" : undefined,
    aggregateRating:
      cocktail.rating && cocktail.rating.count > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: Number(cocktail.rating.average.toFixed(1)),
            ratingCount: cocktail.rating.count,
            bestRating: 5,
            worstRating: 0.5,
          }
        : undefined,
  };

  // "<" escaped so a recipe's text can never close the script tag.
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
