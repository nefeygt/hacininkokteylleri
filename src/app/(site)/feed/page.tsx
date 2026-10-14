import type { Metadata } from "next";
import Link from "next/link";
import CocktailCard from "@/components/CocktailCard";
import FollowingLogs from "@/components/FollowingLogs";
import { getNewRecipes, getPopularRecipes, type Cocktail } from "@/lib/content";

// The community feed (M6, ADR-018): members' popular and new recipes, built
// statically and refreshed every few minutes (a recipe, review or favourite
// revalidates it at once), and the logs of the people you follow, read in the
// browser. The home page and the archive stay Hacı's (ADR-014).
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Akış",
  description: "Üyelerin en sevilen ve en yeni kokteyl tarifleri, takip ettiklerinin içki günlükleri.",
};

const SHOWN = 12;

export default async function FeedPage() {
  const [popular, latest] = await Promise.all([getPopularRecipes(SHOWN), getNewRecipes(SHOWN)]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.25em] text-crimson-glow">Rx · Akış</div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Akış</h1>
          <p className="mt-1 font-mono text-xs text-text-muted">Üyelerin tarifleri ve takip ettiklerinin günlükleri.</p>
        </div>
        <Link
          href="/account/recipes/new"
          className="inline-flex items-center rounded bg-crimson px-4 py-2 font-mono text-xs text-white transition-opacity hover:opacity-90"
        >
          + Tarif yaz
        </Link>
      </div>

      {popular.length > 0 && (
        <RecipeRow title="Bu ay popüler" hint="Son 30 günün en çok değerlendirilen ve favorilenen tarifleri" recipes={popular} />
      )}

      <RecipeRow
        title="Yeni tarifler"
        recipes={latest}
        empty="Henüz üye tarifi yok. İlk tarifi sen yaz."
      />

      <section className="mt-14 max-w-3xl">
        <h2 className="mb-4 font-mono text-xs uppercase tracking-[0.15em] text-text-muted">Takip ettiklerinden</h2>
        <FollowingLogs />
      </section>
    </div>
  );
}

function RecipeRow({
  title,
  hint,
  recipes,
  empty,
}: {
  title: string;
  hint?: string;
  recipes: Cocktail[];
  empty?: string;
}) {
  return (
    <section className="mt-12">
      <div className="mb-4 flex flex-wrap items-baseline gap-x-3">
        <h2 className="font-mono text-xs uppercase tracking-[0.15em] text-text-muted">{title}</h2>
        {hint && <span className="font-mono text-[10px] text-text-muted/70">{hint}</span>}
      </div>
      {recipes.length === 0 ? (
        <p className="font-mono text-xs text-text-muted">{empty}</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe) => (
            <CocktailCard key={recipe.id} cocktail={recipe} href={`/recipes/${recipe.slug}`} />
          ))}
        </div>
      )}
    </section>
  );
}
