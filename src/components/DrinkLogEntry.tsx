"use client";

import Link from "@/components/LocaleLink";
import { useLocale } from "@/components/LocaleProvider";
import { format } from "@/lib/i18n/format";
import { Lock, Globe, MessageCircle } from "lucide-react";
import Avatar from "@/components/Avatar";
import Stars from "@/components/Stars";
import { ReportIfSignedIn } from "@/components/ReportProfileButton";
import { recipeHref } from "@/lib/content";
import { formatAmount, formatLogDate, readRecipe } from "@/lib/drink-log";
import type { Json } from "@/lib/supabase/database.types";

export interface DrinkLogRow {
  id: string;
  user_id: string;
  drunk_on: string;
  recipe: Json;
  rating: number | null;
  note: string | null;
  is_public: boolean;
  hidden_at: string | null;
  cocktails: { slug: string; is_published: boolean; author_id: string | null } | null;
  /** Present when the list mixes people (the feed, a log page). */
  profiles?: { username: string; display_name: string; avatar_path: string | null } | null;
}

export const DRINK_LOG_COLUMNS =
  "id, user_id, drunk_on, recipe, rating, note, is_public, hidden_at, cocktails(slug, is_published, author_id)";

/** With the author, for lists that mix people; !inner leaves out hidden profiles. */
export const DRINK_LOG_WITH_AUTHOR_COLUMNS = `${DRINK_LOG_COLUMNS}, profiles!inner(username, display_name, avatar_path)`;

/**
 * One drink log: the cocktail as made, the date, that evening's rating and
 * the note. "own" adds the privacy badge and an edit link; "public" adds a
 * report button for other signed-in visitors and a link to the log's comments
 * (M6). The author is shown when the row carries one.
 */
export default function DrinkLogEntry({
  log,
  mode,
  commentCount,
  showCommentsLink = true,
}: {
  log: DrinkLogRow;
  mode: "own" | "public";
  commentCount?: number;
  showCommentsLink?: boolean;
}) {
  const { t, locale } = useLocale();
  const recipe = readRecipe(log.recipe);
  const cocktail = log.cocktails?.is_published ? log.cocktails : null;
  const author = log.profiles;

  return (
    <article className={`rounded border border-border bg-bg-card px-4 py-3 ${log.hidden_at ? "opacity-70" : ""}`}>
      {author && (
        <Link href={`/u/${author.username}`} className="mb-2 flex items-center gap-2 hover:text-crimson-glow">
          <Avatar path={author.avatar_path} name={author.display_name} size={22} />
          <span className="text-xs font-semibold text-text-primary">{author.display_name}</span>
          <span className="font-mono text-[10px] text-text-muted">@{author.username}</span>
        </Link>
      )}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {cocktail ? (
          <Link
            href={recipeHref(cocktail.slug, Boolean(cocktail.author_id))}
            className="font-semibold text-text-primary hover:text-crimson-glow"
          >
            {recipe.name}
          </Link>
        ) : (
          <span className="font-semibold text-text-primary">{recipe.name}</span>
        )}
        {log.rating !== null && <Stars value={log.rating} size={12} />}
        <span className="font-mono text-[10px] text-text-muted">{formatLogDate(log.drunk_on, locale)}</span>
        {mode === "own" && (
          <span className="ml-auto flex items-center gap-3">
            <span className="flex items-center gap-1 font-mono text-[10px] text-text-muted">
              {log.is_public ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
              {log.is_public ? t.drinkLog.public : t.drinkLog.onlyYou}
            </span>
            <Link
              href={`/account/logs/${log.id}`}
              className="font-mono text-[11px] text-crimson-glow underline underline-offset-2"
            >
              {t.common.edit}
            </Link>
          </span>
        )}
      </div>

      <p className="mt-1.5 font-mono text-[11px] leading-relaxed text-text-secondary">
        {recipe.ingredients.map((i) => `${i.name} ${formatAmount(i, locale, t)}`).join(" · ")}
      </p>

      {log.note && <p className="mt-2 whitespace-pre-line break-words text-sm text-text-secondary">{log.note}</p>}

      {mode === "own" && log.hidden_at && (
        <p className="mt-2 font-mono text-[11px] text-crimson-glow">
          {t.drinkLog.hiddenOwn}
        </p>
      )}
      {mode === "own" && log.is_public && !log.hidden_at && (
        <div className="mt-1.5 flex">
          <CommentsLink id={log.id} count={commentCount} />
        </div>
      )}
      {mode === "public" && (
        <div className="mt-1.5 flex flex-wrap items-center gap-4">
          {showCommentsLink && <CommentsLink id={log.id} count={commentCount} />}
          <ReportIfSignedIn ownerId={log.user_id} targetType="drink_log" targetId={log.id} />
        </div>
      )}
    </article>
  );
}

function CommentsLink({ id, count }: { id: string; count?: number }) {
  const { t } = useLocale();
  return (
    <Link href={`/logs/${id}`} className="flex items-center gap-1 font-mono text-[10px] text-text-muted hover:text-crimson-glow">
      <MessageCircle className="h-3 w-3" />
      {count ? format(t.drinkLog.commentCount, { n: count }) : t.drinkLog.comments}
    </Link>
  );
}
