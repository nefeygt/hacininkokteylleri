import { getRecipe } from "@/lib/content";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { asLocale } from "@/lib/i18n/locales";
import { ogCard } from "@/lib/og-card";

// The share card of a member's recipe without a photo (/recipes/{slug} points here; ?lang=en from English pages).
// The recipe stays in the language it was written in; only the label follows the page.
export const revalidate = 3600;

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const locale = asLocale(new URL(request.url).searchParams.get("lang") ?? "");
  const recipe = await getRecipe((await params).slug);
  if (!recipe) return new Response("Not found", { status: 404 });
  const by = recipe.author ? `@${recipe.author.username}` : getDictionary(locale).og.memberRecipe;
  return ogCard({ label: by, title: recipe.name, subtitle: recipe.subtitle, locale });
}
