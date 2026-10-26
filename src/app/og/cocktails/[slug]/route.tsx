import { getCocktail } from "@/lib/content";
import { ogCard } from "@/lib/og-card";

// The share card of a house recipe without a photo (/cocktails/{slug} points here).
export const revalidate = 3600;

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const cocktail = await getCocktail((await params).slug);
  if (!cocktail) return new Response("Not found", { status: 404 });
  return ogCard({ label: cocktail.baseAlcohol || "Kokteyl", title: cocktail.name, subtitle: cocktail.subtitle });
}
