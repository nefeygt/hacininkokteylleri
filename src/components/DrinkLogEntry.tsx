import Link from "next/link";
import { Lock, Globe } from "lucide-react";
import Stars from "@/components/Stars";
import { ReportIfSignedIn } from "@/components/ReportProfileButton";
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
  cocktails: { slug: string; is_published: boolean } | null;
}

export const DRINK_LOG_COLUMNS = "id, user_id, drunk_on, recipe, rating, note, is_public, hidden_at, cocktails(slug, is_published)";

/**
 * One drink log: the cocktail as made, the date, that evening's rating and
 * the note. "own" adds the privacy badge and an edit link; "public" adds a
 * report button for other signed-in visitors.
 */
export default function DrinkLogEntry({ log, mode }: { log: DrinkLogRow; mode: "own" | "public" }) {
  const recipe = readRecipe(log.recipe);
  const cocktail = log.cocktails?.is_published ? log.cocktails : null;

  return (
    <article className={`rounded border border-border bg-bg-card px-4 py-3 ${log.hidden_at ? "opacity-70" : ""}`}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {cocktail ? (
          <Link
            href={`/cocktails?cocktail=${encodeURIComponent(cocktail.slug)}`}
            className="font-semibold text-text-primary hover:text-crimson-glow"
          >
            {recipe.name}
          </Link>
        ) : (
          <span className="font-semibold text-text-primary">{recipe.name}</span>
        )}
        {log.rating !== null && <Stars value={log.rating} size={12} />}
        <span className="font-mono text-[10px] text-text-muted">{formatLogDate(log.drunk_on)}</span>
        {mode === "own" && (
          <span className="ml-auto flex items-center gap-3">
            <span className="flex items-center gap-1 font-mono text-[10px] text-text-muted">
              {log.is_public ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
              {log.is_public ? "Herkese açık" : "Yalnızca sen"}
            </span>
            <Link
              href={`/account/logs/${log.id}`}
              className="font-mono text-[11px] text-crimson-glow underline underline-offset-2"
            >
              Düzenle
            </Link>
          </span>
        )}
      </div>

      <p className="mt-1.5 font-mono text-[11px] leading-relaxed text-text-secondary">
        {recipe.ingredients.map((i) => `${i.name} ${formatAmount(i)}`).join(" · ")}
      </p>

      {log.note && <p className="mt-2 whitespace-pre-line break-words text-sm text-text-secondary">{log.note}</p>}

      {mode === "own" && log.hidden_at && (
        <p className="mt-2 font-mono text-[11px] text-crimson-glow">
          Bu kayıt yöneticiler tarafından gizlendi; yalnızca sen görüyorsun.
        </p>
      )}
      {mode === "public" && (
        <div className="mt-1.5 flex">
          <ReportIfSignedIn ownerId={log.user_id} targetType="drink_log" targetId={log.id} />
        </div>
      )}
    </article>
  );
}
