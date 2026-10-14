import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import { formatAmount, formatLogDate, readRecipe } from "@/lib/drink-log";
import { STATUS_LABELS } from "@/lib/showcase";
import type { Json } from "@/lib/supabase/database.types";
import ModerationButton from "../../ModerationButton";

export const metadata: Metadata = { title: "Moderasyon" };

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "";

function date(value: string) {
  return new Date(value).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

type ProfileRef = { id: string; username: string; display_name: string; hidden_at: string | null };
type ReviewRef = {
  id: string;
  rating: number;
  body: string | null;
  hidden_at: string | null;
  updated_at: string;
  profiles: { username: string; display_name: string };
  cocktails: { name: string };
};

const REVIEW_COLUMNS = "id, rating, body, hidden_at, updated_at, profiles(username, display_name), cocktails(name)";

type LogRef = {
  id: string;
  drunk_on: string;
  recipe: Json;
  rating: number | null;
  note: string | null;
  is_public: boolean;
  hidden_at: string | null;
  profiles: { username: string; display_name: string };
};

const LOG_COLUMNS = "id, drunk_on, recipe, rating, note, is_public, hidden_at, profiles(username, display_name)";

type RecipeRef = {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  is_published: boolean;
  hidden_at: string | null;
  created_at: string;
  profiles: { username: string; display_name: string } | null;
};

const RECIPE_COLUMNS = "id, slug, name, subtitle, is_published, hidden_at, created_at, profiles!cocktails_author_id_fkey(username, display_name)";

type CommentRef = {
  id: string;
  log_id: string;
  body: string;
  hidden_at: string | null;
  created_at: string;
  profiles: { username: string; display_name: string };
};

const COMMENT_COLUMNS = "id, log_id, body, hidden_at, created_at, profiles(username, display_name)";

type EntryRef = {
  id: string;
  pitch: string;
  status: string;
  hidden_at: string | null;
  created_at: string;
  profiles: { username: string; display_name: string };
  cocktails: { name: string; slug: string };
};

const ENTRY_COLUMNS = "id, pitch, status, hidden_at, created_at, profiles!showcase_entries_user_id_fkey(username, display_name), cocktails(name, slug)";

/**
 * Open reports, the latest reviews (M4), public drink logs (M5), members'
 * recipes and log comments (M6), reported showcase entries (M7). Private logs and drafts are listed only when
 * reported. Admins read everything here through their own 2FA session; hiding
 * goes through the moderation guard.
 */
export default async function ModerationPage() {
  const { supabase } = await requireAdmin();

  const [{ data: reports, error }, { data: recent }, { data: recentLogs }, { data: recentRecipes }, { data: recentComments }] =
    await Promise.all([
    supabase
      .from("reports")
      .select("id, target_type, target_id, reason, created_at, profiles(username)")
      .is("resolved_at", null)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.from("reviews").select(REVIEW_COLUMNS).order("updated_at", { ascending: false }).limit(50),
    supabase
      .from("drink_logs")
      .select(LOG_COLUMNS)
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("cocktails")
      .select(RECIPE_COLUMNS)
      .not("author_id", "is", null)
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase.from("log_comments").select(COMMENT_COLUMNS).order("created_at", { ascending: false }).limit(50),
  ]);
  if (error) throw new Error(error.message);

  const reviewIds = reports.filter((r) => r.target_type === "review").map((r) => r.target_id);
  const profileIds = reports.filter((r) => r.target_type === "profile").map((r) => r.target_id);
  const logIds = reports.filter((r) => r.target_type === "drink_log").map((r) => r.target_id);
  const recipeIds = reports.filter((r) => r.target_type === "cocktail").map((r) => r.target_id);
  const commentIds = reports.filter((r) => r.target_type === "log_comment").map((r) => r.target_id);
  const entryIds = reports.filter((r) => r.target_type === "showcase_entry").map((r) => r.target_id);
  const [
    { data: reportedReviews },
    { data: reportedProfiles },
    { data: reportedLogs },
    { data: reportedRecipes },
    { data: reportedComments },
    { data: reportedEntries },
  ] = await Promise.all([
    reviewIds.length
      ? supabase.from("reviews").select(REVIEW_COLUMNS).in("id", reviewIds)
      : Promise.resolve({ data: [] }),
    profileIds.length
      ? supabase.from("profiles").select("id, username, display_name, hidden_at").in("id", profileIds)
      : Promise.resolve({ data: [] }),
    logIds.length ? supabase.from("drink_logs").select(LOG_COLUMNS).in("id", logIds) : Promise.resolve({ data: [] }),
    recipeIds.length ? supabase.from("cocktails").select(RECIPE_COLUMNS).in("id", recipeIds) : Promise.resolve({ data: [] }),
    commentIds.length
      ? supabase.from("log_comments").select(COMMENT_COLUMNS).in("id", commentIds)
      : Promise.resolve({ data: [] }),
    entryIds.length
      ? supabase.from("showcase_entries").select(ENTRY_COLUMNS).in("id", entryIds)
      : Promise.resolve({ data: [] }),
  ]);
  const entriesById = new Map(((reportedEntries ?? []) as unknown as EntryRef[]).map((e) => [e.id, e]));
  const recipesById = new Map(((reportedRecipes ?? []) as RecipeRef[]).map((r) => [r.id, r]));
  const commentsById = new Map(((reportedComments ?? []) as CommentRef[]).map((c) => [c.id, c]));
  const logsById = new Map(((reportedLogs ?? []) as LogRef[]).map((l) => [l.id, l]));
  const reviewsById = new Map(((reportedReviews ?? []) as ReviewRef[]).map((r) => [r.id, r]));
  const profilesById = new Map(((reportedProfiles ?? []) as ProfileRef[]).map((p) => [p.id, p]));

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Moderasyon</h1>
        <p className="mt-1 font-mono text-xs text-text-muted">
          {reports.length} açık bildirim · gizlenen içerik yalnızca sahibine ve yöneticilere görünür
        </p>
      </div>

      <section>
        <h2 className="mb-3 font-mono text-xs uppercase tracking-[0.15em] text-text-muted">Açık bildirimler</h2>
        {reports.length === 0 ? (
          <p className="font-mono text-xs text-text-muted">Bildirim yok.</p>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-sm border border-border bg-bg-card">
            {reports.map((report) => {
              const review = report.target_type === "review" ? reviewsById.get(report.target_id) : undefined;
              const profile = report.target_type === "profile" ? profilesById.get(report.target_id) : undefined;
              const log = report.target_type === "drink_log" ? logsById.get(report.target_id) : undefined;
              const recipe = report.target_type === "cocktail" ? recipesById.get(report.target_id) : undefined;
              const comment = report.target_type === "log_comment" ? commentsById.get(report.target_id) : undefined;
              const entry = report.target_type === "showcase_entry" ? entriesById.get(report.target_id) : undefined;
              return (
                <li key={report.id} className="space-y-2 px-4 py-3">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-text-muted">
                    <span className="rounded bg-bg-elevated px-1.5 py-0.5 uppercase tracking-wider">
                      {TARGET_LABELS[report.target_type] ?? report.target_type}
                    </span>
                    <span>@{report.profiles?.username ?? "silinmiş"} bildirdi · {date(report.created_at)}</span>
                    <span className="ml-auto">
                      <ModerationButton action={{ kind: "resolve", id: report.id }} />
                    </span>
                  </div>
                  {report.reason && <p className="text-sm text-text-secondary">“{report.reason}”</p>}
                  {review && <ReviewRow review={review} />}
                  {profile && <ProfileRow profile={profile} />}
                  {log && <LogRow log={log} />}
                  {recipe && <RecipeRow recipe={recipe} />}
                  {comment && <CommentRow comment={comment} />}
                  {entry && <EntryRow entry={entry} />}
                  {!review && !profile && !log && !recipe && !comment && !entry && (
                    <p className="font-mono text-[11px] text-text-muted">İçerik artık yok (silinmiş).</p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-mono text-xs uppercase tracking-[0.15em] text-text-muted">Son değerlendirmeler</h2>
        {!recent?.length ? (
          <p className="font-mono text-xs text-text-muted">Henüz değerlendirme yok.</p>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-sm border border-border bg-bg-card">
            {(recent as ReviewRef[]).map((review) => (
              <li key={review.id} className="px-4 py-3">
                <ReviewRow review={review} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-mono text-xs uppercase tracking-[0.15em] text-text-muted">Son üye tarifleri</h2>
        {!recentRecipes?.length ? (
          <p className="font-mono text-xs text-text-muted">Henüz üye tarifi yok.</p>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-sm border border-border bg-bg-card">
            {(recentRecipes as RecipeRef[]).map((recipe) => (
              <li key={recipe.id} className="px-4 py-3">
                <RecipeRow recipe={recipe} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-mono text-xs uppercase tracking-[0.15em] text-text-muted">Son günlük yorumları</h2>
        {!recentComments?.length ? (
          <p className="font-mono text-xs text-text-muted">Henüz yorum yok.</p>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-sm border border-border bg-bg-card">
            {(recentComments as CommentRef[]).map((comment) => (
              <li key={comment.id} className="px-4 py-3">
                <CommentRow comment={comment} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-mono text-xs uppercase tracking-[0.15em] text-text-muted">Son herkese açık günlük kayıtları</h2>
        {!recentLogs?.length ? (
          <p className="font-mono text-xs text-text-muted">Henüz herkese açık kayıt yok.</p>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-sm border border-border bg-bg-card">
            {(recentLogs as LogRef[]).map((log) => (
              <li key={log.id} className="px-4 py-3">
                <LogRow log={log} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

const TARGET_LABELS: Record<string, string> = {
  review: "değerlendirme",
  profile: "profil",
  drink_log: "günlük kaydı",
  cocktail: "üye tarifi",
  log_comment: "yorum",
  showcase_entry: "vitrin başvurusu",
};

function EntryRow({ entry }: { entry: EntryRef }) {
  return (
    <div className={`flex items-start gap-3 ${entry.hidden_at ? "opacity-60" : ""}`}>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 font-mono text-[11px] text-text-muted">
          <a
            href={`${SITE_URL}/recipes/${entry.cocktails.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-sans text-sm font-semibold text-text-primary hover:text-crimson-glow"
          >
            {entry.cocktails.name}
          </a>
          <a href={`${SITE_URL}/u/${entry.profiles.username}`} target="_blank" rel="noopener noreferrer" className="hover:text-text-primary">
            @{entry.profiles.username}
          </a>
          <span>{date(entry.created_at)}</span>
          <span>{STATUS_LABELS[entry.status as keyof typeof STATUS_LABELS] ?? entry.status}</span>
          {entry.hidden_at && <span className="text-crimson-glow">gizli</span>}
        </div>
        <p className="mt-1 whitespace-pre-line break-words text-sm text-text-secondary">“{entry.pitch}”</p>
      </div>
      <ModerationButton action={{ kind: "showcase_entry", id: entry.id, hide: !entry.hidden_at }} />
    </div>
  );
}

function RecipeRow({ recipe }: { recipe: RecipeRef }) {
  return (
    <div className={`flex items-start gap-3 ${recipe.hidden_at ? "opacity-60" : ""}`}>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 font-mono text-[11px] text-text-muted">
          {recipe.is_published && !recipe.hidden_at ? (
            <a
              href={`${SITE_URL}/recipes/${recipe.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-sans text-sm font-semibold text-text-primary hover:text-crimson-glow"
            >
              {recipe.name}
            </a>
          ) : (
            <span className="font-sans text-sm font-semibold text-text-primary">{recipe.name}</span>
          )}
          {recipe.profiles && (
            <a href={`${SITE_URL}/u/${recipe.profiles.username}`} target="_blank" rel="noopener noreferrer" className="hover:text-text-primary">
              @{recipe.profiles.username}
            </a>
          )}
          <span>{date(recipe.created_at)}</span>
          {!recipe.is_published && <span>taslak</span>}
          {recipe.hidden_at && <span className="text-crimson-glow">gizli</span>}
        </div>
        {recipe.subtitle && <p className="mt-1 text-sm text-text-secondary">{recipe.subtitle}</p>}
      </div>
      <ModerationButton action={{ kind: "recipe", id: recipe.id, hide: !recipe.hidden_at }} />
    </div>
  );
}

function CommentRow({ comment }: { comment: CommentRef }) {
  return (
    <div className={`flex items-start gap-3 ${comment.hidden_at ? "opacity-60" : ""}`}>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 font-mono text-[11px] text-text-muted">
          <a href={`${SITE_URL}/u/${comment.profiles.username}`} target="_blank" rel="noopener noreferrer" className="hover:text-text-primary">
            @{comment.profiles.username}
          </a>
          <a href={`${SITE_URL}/logs/${comment.log_id}`} target="_blank" rel="noopener noreferrer" className="hover:text-text-primary">
            kayda git
          </a>
          <span>{date(comment.created_at)}</span>
          {comment.hidden_at && <span className="text-crimson-glow">gizli</span>}
        </div>
        <p className="mt-1 whitespace-pre-line break-words text-sm text-text-secondary">{comment.body}</p>
      </div>
      <ModerationButton action={{ kind: "log_comment", id: comment.id, hide: !comment.hidden_at }} />
    </div>
  );
}

function LogRow({ log }: { log: LogRef }) {
  const recipe = readRecipe(log.recipe);
  return (
    <div className={`flex items-start gap-3 ${log.hidden_at ? "opacity-60" : ""}`}>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 font-mono text-[11px] text-text-muted">
          <span className="font-sans text-sm font-semibold text-text-primary">{recipe.name}</span>
          {log.rating !== null && (
            <span className="text-crimson-glow">{"★".repeat(log.rating)}{"☆".repeat(5 - log.rating)}</span>
          )}
          <a href={`${SITE_URL}/u/${log.profiles.username}`} target="_blank" rel="noopener noreferrer" className="hover:text-text-primary">
            @{log.profiles.username}
          </a>
          <span>{formatLogDate(log.drunk_on)}</span>
          {!log.is_public && <span>özel</span>}
          {log.hidden_at && <span className="text-crimson-glow">gizli</span>}
        </div>
        <p className="mt-1 font-mono text-[11px] text-text-secondary">
          {recipe.ingredients.map((i) => `${i.name} ${formatAmount(i)}`).join(" · ")}
        </p>
        {log.note && <p className="mt-1 whitespace-pre-line break-words text-sm text-text-secondary">{log.note}</p>}
      </div>
      <ModerationButton action={{ kind: "drink_log", id: log.id, hide: !log.hidden_at }} />
    </div>
  );
}

function ReviewRow({ review }: { review: ReviewRef }) {
  return (
    <div className={`flex items-start gap-3 ${review.hidden_at ? "opacity-60" : ""}`}>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 font-mono text-[11px] text-text-muted">
          <span className="font-sans text-sm font-semibold text-text-primary">{review.cocktails.name}</span>
          <span className="text-crimson-glow">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span>
          <a href={`${SITE_URL}/u/${review.profiles.username}`} target="_blank" rel="noopener noreferrer" className="hover:text-text-primary">
            @{review.profiles.username}
          </a>
          <span>{date(review.updated_at)}</span>
          {review.hidden_at && <span className="text-crimson-glow">gizli</span>}
        </div>
        {review.body && <p className="mt-1 whitespace-pre-line break-words text-sm text-text-secondary">{review.body}</p>}
      </div>
      <ModerationButton action={{ kind: "review", id: review.id, hide: !review.hidden_at }} />
    </div>
  );
}

function ProfileRow({ profile }: { profile: ProfileRef }) {
  return (
    <div className={`flex items-center gap-3 ${profile.hidden_at ? "opacity-60" : ""}`}>
      <div className="min-w-0 flex-1 font-mono text-[11px] text-text-muted">
        <span className="font-sans text-sm font-semibold text-text-primary">{profile.display_name}</span>{" "}
        <a href={`${SITE_URL}/u/${profile.username}`} target="_blank" rel="noopener noreferrer" className="hover:text-text-primary">
          @{profile.username}
        </a>
        {profile.hidden_at && <span className="ml-2 text-crimson-glow">gizli</span>}
      </div>
      <ModerationButton action={{ kind: "profile", id: profile.id, hide: !profile.hidden_at }} />
    </div>
  );
}
