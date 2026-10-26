import type { Metadata } from "next";
import Link from "@/components/LocaleLink";
import CocktailCard from "@/components/CocktailCard";
import FollowingLogs from "@/components/FollowingLogs";
import ShowcaseApply from "@/components/ShowcaseApply";
import ShowcaseEntries from "@/components/ShowcaseEntries";
import { sortCocktails } from "@/lib/archive-filter";
import {
  getNewRecipes,
  getPopularRecipes,
  getPublishedCocktails,
  getShowcase,
  getShowcaseWinner,
  recipeHref,
  type Cocktail,
  type Showcase,
  type ShowcaseEntry,
} from "@/lib/content";
import { formatFirstDay, formatLastDay, formatPeriod, periodState } from "@/lib/showcase";

// The community feed (M6, ADR-018): the showcase (M7, ADR-019), members'
// popular and new recipes, built statically and refreshed every few minutes (a
// recipe, review, favourite or vote revalidates it at once), and the logs of the
// people you follow, read in the browser. The home page and the archive stay
// Hacı's (ADR-014); only the showcase's winner reaches the home page.
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Akış",
  description: "Üyelerin en sevilen ve en yeni kokteyl tarifleri, takip ettiklerinin içki günlükleri.",
};

const SHOWN = 12;
/** House picks fill the feed until members have published this many recipes. */
const PICKS_UNTIL = 3;

export default async function FeedPage() {
  const [popular, latest, showcase, winner, archive] = await Promise.all([
    getPopularRecipes(SHOWN),
    getNewRecipes(SHOWN),
    getShowcase(),
    getShowcaseWinner(),
    getPublishedCocktails(),
  ]);
  // While members' recipes are few, the feed is not left empty (M9 package D): Hacı's best rated.
  const housePicks = latest.length < PICKS_UNTIL ? sortCocktails(archive, "rating").slice(0, 3) : [];

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.25em] text-crimson-glow">Rx · Akış</div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Akış</h1>
          <p className="mt-1 text-xs text-text-muted">Üyelerin tarifleri ve takip ettiklerinin günlükleri.</p>
        </div>
        <Link
          href="/account/recipes/new"
          className="inline-flex items-center rounded bg-crimson px-4 py-2 text-xs text-white transition-opacity hover:opacity-90"
        >
          + Tarif yaz
        </Link>
      </div>

      <ShowcaseSection showcase={showcase} winner={winner} />

      {popular.length > 0 && (
        <RecipeRow title="Bu ay popüler" hint="Son 30 günün en çok değerlendirilen ve favorilenen tarifleri" recipes={popular} />
      )}

      <RecipeRow
        title="Yeni tarifler"
        recipes={latest}
        empty="Henüz üye tarifi yok. İlk tarifi sen yaz; yayınladığın an burada görünür."
      />

      {housePicks.length > 0 && (
        <section className="mt-12">
          <div className="mb-4 flex flex-wrap items-baseline gap-x-3">
            <h2 className="font-mono text-xs uppercase tracking-[0.15em] text-text-muted">Hacı&apos;nın seçtikleri</h2>
            <Link href="/cocktails" className="font-mono text-[10px] text-text-muted hover:text-text-primary">
              Arşivin tamamı →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {housePicks.map((c) => (
              <CocktailCard key={c.id} cocktail={c} href={recipeHref(c.slug, false)} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-14 max-w-3xl">
        <h2 className="mb-4 font-mono text-xs uppercase tracking-[0.15em] text-text-muted">Takip ettiklerinden</h2>
        <FollowingLogs />
      </section>
    </div>
  );
}

/** "Vitrin": apply, vote, and the last winner (M7). Hidden until the first period is planned. */
function ShowcaseSection({ showcase, winner }: { showcase: Showcase; winner: ShowcaseEntry | null }) {
  const { period, entries } = showcase;
  if (!period && !winner) return null;
  const state = period ? periodState(period) : null;

  return (
    <section id="showcase" className="mt-12 scroll-mt-24 rounded-sm border border-crimson/30 bg-crimson/[0.03] p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="font-mono text-xs uppercase tracking-[0.15em] text-crimson-glow">Vitrin</h2>
        {period && <span className="font-mono text-[11px] text-text-secondary">{formatPeriod(period)}</span>}
        {period && (
          <span className="font-mono text-[10px] text-text-muted">
            {state === "open"
              ? `Oylama ${formatLastDay(period)} günü sonunda bitiyor · en çok oyu alan tarif ana sayfada`
              : `Başvurular açık · oylama ${formatFirstDay(period)} tarihinde başlıyor`}
          </span>
        )}
      </div>

      {period ? (
        <>
          <div className="mb-6">
            <ShowcaseApply period={period} />
          </div>
          <ShowcaseEntries period={period} entries={entries} />
        </>
      ) : (
        <p className="text-xs text-text-muted">Şu an açık bir vitrin dönemi yok.</p>
      )}

      {winner && (
        <p className="mt-6 font-mono text-[11px] text-text-muted">
          Son kazanan:{" "}
          <Link href={`/recipes/${winner.recipe.slug}`} className="text-text-secondary hover:text-crimson-glow">
            {winner.recipe.name}
          </Link>
          {winner.recipe.author && <> · @{winner.recipe.author.username}</>} · {winner.voteCount} oy
        </p>
      )}
    </section>
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
        {hint && <span className="font-mono text-[10px] text-text-muted">{hint}</span>}
      </div>
      {recipes.length === 0 ? (
        <p className="text-xs text-text-muted">{empty}</p>
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
