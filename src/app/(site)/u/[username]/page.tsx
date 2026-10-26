import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { cache } from "react";
import Avatar from "@/components/Avatar";
import CocktailCard from "@/components/CocktailCard";
import DrinkLogEntry, { DRINK_LOG_COLUMNS, type DrinkLogRow } from "@/components/DrinkLogEntry";
import FollowButton from "@/components/FollowButton";
import ReportProfileButton from "@/components/ReportProfileButton";
import Stars from "@/components/Stars";
import { getNewRecipes, recipeHref } from "@/lib/content";
import { createPublicClient } from "@/lib/supabase/public";

// Public profiles, rendered on first visit and kept for a few minutes; a
// profile edit, a review, a favourite, a drink log, a recipe or a follow
// revalidates the page at once (account/actions.ts, cocktails/actions.ts,
// account/logs/actions.ts, account/recipes/actions.ts, u/actions.ts).
export const revalidate = 300;

// No profile is built ahead of time; each is rendered on its first visit and cached.
export async function generateStaticParams() {
  return [];
}

const getProfile = cache(async (username: string) => {
  const { data } = await createPublicClient()
    .from("profiles")
    .select("id, username, display_name, avatar_path, bio, created_at")
    .eq("username", username.toLowerCase())
    .maybeSingle();
  return data;
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const profile = await getProfile((await params).username);
  if (!profile) return { title: "Bulunamadı" };
  return {
    title: `${profile.display_name} (@${profile.username})`,
    description: profile.bio ?? undefined,
  };
}

/**
 * Visible reviews and favourites of published cocktails, public drink logs,
 * the member's published recipes and follow counts, newest first.
 */
async function getActivity(profileId: string) {
  const supabase = createPublicClient();
  const [reviews, favorites, logs, recipes, followers, following] = await Promise.all([
    supabase
      .from("reviews")
      .select("id, rating, body, updated_at, cocktails!inner(slug, name, author_id)")
      .eq("user_id", profileId)
      .order("updated_at", { ascending: false })
      .limit(100),
    supabase
      .from("favorites")
      .select("created_at, cocktails!inner(id, slug, name, subtitle, color, author_id)")
      .eq("user_id", profileId)
      .order("created_at", { ascending: false })
      .limit(200),
    // Only public, visible logs reach an anonymous reader (RLS, ADR-014).
    supabase
      .from("drink_logs")
      .select(DRINK_LOG_COLUMNS)
      .eq("user_id", profileId)
      .order("drunk_on", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(50),
    getNewRecipes(60, profileId),
    supabase.from("follows").select("follower_id", { count: "exact", head: true }).eq("followee_id", profileId),
    supabase.from("follows").select("followee_id", { count: "exact", head: true }).eq("follower_id", profileId),
  ]);
  return {
    reviews: reviews.data ?? [],
    favorites: favorites.data ?? [],
    logs: (logs.data ?? []) as DrinkLogRow[],
    recipes,
    followers: followers.count ?? 0,
    following: following.count ?? 0,
  };
}

function cocktailHref(c: { slug: string; author_id: string | null }) {
  return recipeHref(c.slug, Boolean(c.author_id));
}

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const profile = await getProfile((await params).username);
  if (!profile) notFound();
  const { reviews, favorites, logs, recipes, followers, following } = await getActivity(profile.id);

  const joined = new Date(profile.created_at).toLocaleDateString("tr-TR", { month: "long", year: "numeric" });

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.25em] text-crimson-glow">Rx · Profil</div>
      <div className="flex items-center gap-5">
        <Avatar path={profile.avatar_path} name={profile.display_name} size={88} />
        <div>
          <h1 className="text-3xl font-bold">{profile.display_name}</h1>
          <p className="mt-1 text-sm text-text-muted">@{profile.username}</p>
        </div>
      </div>
      {profile.bio && <p className="mt-6 max-w-xl whitespace-pre-line leading-relaxed text-text-secondary">{profile.bio}</p>}
      <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
        <p className="font-mono text-[11px] text-text-secondary">
          <strong className="text-text-primary">{followers}</strong> takipçi ·{" "}
          <strong className="text-text-primary">{following}</strong> takip
        </p>
        <FollowButton profileId={profile.id} username={profile.username} />
      </div>
      <div className="mt-4 flex items-center justify-between gap-4">
        <p className="font-mono text-[11px] text-text-muted">{joined} tarihinden beri üye</p>
        <ReportProfileButton profileId={profile.id} />
      </div>

      {recipes.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 font-mono text-xs uppercase tracking-[0.15em] text-text-muted">
            Tarifler <span className="text-text-muted">({recipes.length})</span>
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {recipes.map((recipe) => (
              <CocktailCard key={recipe.id} cocktail={recipe} href={`/recipes/${recipe.slug}`} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-12">
        <h2 className="mb-4 font-mono text-xs uppercase tracking-[0.15em] text-text-muted">
          Favoriler <span className="text-text-muted">({favorites.length})</span>
        </h2>
        {favorites.length === 0 ? (
          <p className="text-xs text-text-muted">Henüz favori yok.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {favorites.map(({ cocktails: c }) => (
              <li key={c.id}>
                <Link
                  href={cocktailHref(c)}
                  className="flex items-center gap-3 rounded border border-border bg-bg-card px-3 py-2 transition-colors hover:border-border-light"
                >
                  <span className="h-6 w-1 shrink-0 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-text-primary">{c.name}</span>
                    <span className="block truncate font-mono text-[11px] text-text-muted">{c.subtitle}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {logs.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 font-mono text-xs uppercase tracking-[0.15em] text-text-muted">
            İçki günlüğü <span className="text-text-muted">({logs.length})</span>
          </h2>
          <ul className="space-y-3">
            {logs.map((log) => (
              <li key={log.id}>
                <DrinkLogEntry log={log} mode="public" />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-12">
        <h2 className="mb-4 font-mono text-xs uppercase tracking-[0.15em] text-text-muted">
          Değerlendirmeler <span className="text-text-muted">({reviews.length})</span>
        </h2>
        {reviews.length === 0 ? (
          <p className="text-xs text-text-muted">Henüz değerlendirme yok.</p>
        ) : (
          <ul className="space-y-5">
            {reviews.map((review) => (
              <li key={review.id} className="border-b border-border/50 pb-5 last:border-0">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <Link href={cocktailHref(review.cocktails)} className="font-semibold text-text-primary hover:text-crimson-glow">
                    {review.cocktails.name}
                  </Link>
                  <Stars value={review.rating} size={12} />
                  <span className="font-mono text-[10px] text-text-muted">
                    {new Date(review.updated_at).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                </div>
                {review.body && (
                  <p className="mt-1.5 whitespace-pre-line break-words text-sm text-text-secondary">{review.body}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
