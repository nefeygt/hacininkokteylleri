import { getCocktail } from "@/lib/content";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { asLocale } from "@/lib/i18n/locales";
import { ogCard } from "@/lib/og-card";

// The share card of a house recipe without a photo (/cocktails/{slug} points here; ?lang=en from English pages).
export const revalidate = 3600;

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const locale = asLocale(new URL(request.url).searchParams.get("lang") ?? "");
  const cocktail = await getCocktail((await params).slug, locale);
  if (!cocktail) return new Response("Not found", { status: 404 });
  return ogCard({
    label: cocktail.baseAlcohol || getDictionary(locale).og.cocktail,
    title: cocktail.name,
    subtitle: cocktail.subtitle,
    locale,
  });
}
