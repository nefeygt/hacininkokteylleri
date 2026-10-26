import { getRecipe } from "@/lib/content";
import { ogCard } from "@/lib/og-card";

// The share card of a member's recipe without a photo (/recipes/{slug} points here).
export const revalidate = 3600;

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const recipe = await getRecipe((await params).slug);
  if (!recipe) return new Response("Not found", { status: 404 });
  const by = recipe.author ? `@${recipe.author.username}` : "Üye tarifi";
  return ogCard({ label: by, title: recipe.name, subtitle: recipe.subtitle });
}
