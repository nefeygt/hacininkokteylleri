"use client";

import Link from "@/components/LocaleLink";
import { useCallback, useEffect, useState, useTransition } from "react";
import { deleteReview, saveReview } from "@/app/[lang]/(site)/cocktails/actions";
import Avatar from "@/components/Avatar";
import ReportButton from "@/components/ReportButton";
import Stars from "@/components/Stars";
import type { Member } from "@/components/useMember";
import { REVIEW_MAX_LENGTH, formatAverage } from "@/lib/community";
import { recipeHref, type Cocktail } from "@/lib/content";
import { createClient } from "@/lib/supabase/browser";
import RatingBreakdown from "@/components/RatingBreakdown";
import { useLocale } from "@/components/LocaleProvider";
import { INTL_LOCALES } from "@/lib/i18n/locales";

interface Review {
  id: string;
  rating: number;
  body: string | null;
  updated_at: string;
  hidden_at: string | null;
  user_id: string;
  profiles: { username: string; display_name: string; avatar_path: string | null };
}

const REVIEW_COLUMNS = "id, rating, body, updated_at, hidden_at, user_id, profiles!inner(username, display_name, avatar_path)";
const SHOWN = 50;

/**
 * The reviews under a recipe, loaded in the browser when the card opens, so
 * the archive page itself stays static (ADR-005). A member writes one review
 * per cocktail; writing again edits it (ADR-012).
 */
export default function CocktailReviews({ cocktail, member }: { cocktail: Cocktail; member: Member }) {
  const { t, locale } = useLocale();
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [own, setOwn] = useState<Review | null>(null);
  const memberId = member.state === "ok" ? member.id : null;

  const load = useCallback(async () => {
    const supabase = createClient();
    const [{ data: list }, { data: mine }] = await Promise.all([
      supabase
        .from("reviews")
        .select(REVIEW_COLUMNS)
        .eq("cocktail_id", cocktail.id)
        .is("hidden_at", null)
        .order("updated_at", { ascending: false })
        .limit(SHOWN),
      memberId
        ? supabase.from("reviews").select(REVIEW_COLUMNS).eq("cocktail_id", cocktail.id).eq("user_id", memberId).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);
    setReviews((list as Review[] | null) ?? []);
    setOwn((mine as Review | null) ?? null);
  }, [cocktail.id, memberId]);

  useEffect(() => {
    load();
  }, [load]);

  const others = (reviews ?? []).filter((r) => r.user_id !== memberId);

  return (
    <section className="border-t border-border pt-6">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h3 className="font-mono text-xs uppercase tracking-[0.15em] text-text-muted">{t.reviews.heading}</h3>
        {cocktail.rating && (
          <span className="flex items-center gap-2 text-xs text-text-secondary">
            <Stars value={cocktail.rating.average} size={12} />
            {formatAverage(cocktail.rating.average, locale)} · {cocktail.rating.count}
          </span>
        )}
      </div>

      {cocktail.rating && <RatingBreakdown rating={cocktail.rating} />}

      <OwnReview cocktail={cocktail} member={member} own={own} onSaved={load} />

      {reviews === null ? (
        <p className="mt-4 text-xs text-text-muted">{t.common.loading}</p>
      ) : others.length === 0 ? (
        <p className="mt-4 text-xs text-text-muted">
          {own ? t.reviews.none : t.reviews.noneYet}
        </p>
      ) : (
        <ul className="mt-5 space-y-5">
          {others.map((review) => (
            <ReviewItem key={review.id} review={review} canReport={member.state === "ok"} />
          ))}
        </ul>
      )}
    </section>
  );
}

function OwnReview({
  cocktail,
  member,
  own,
  onSaved,
}: {
  cocktail: Cocktail;
  member: Member;
  own: Review | null;
  onSaved: () => Promise<void>;
}) {
  const { t } = useLocale();
  const [editing, setEditing] = useState(false);
  const { href } = useLocale();
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setRating(own?.rating ?? 0);
    setBody(own?.body ?? "");
  }, [own]);

  if (member.state === "loading") return null;

  if (member.state === "signed-out") {
    const next = recipeHref(cocktail.slug, Boolean(cocktail.author));
    return (
      <p className="rounded bg-bg-elevated/50 px-4 py-3 text-xs text-text-secondary">
        {t.reviews.signInPrefix}
        <Link href={`/login?next=${encodeURIComponent(href(next))}`} className="text-crimson-glow underline underline-offset-2">
          {t.common.signIn}
        </Link>
        .
      </p>
    );
  }

  if (member.state === "onboarding") {
    return (
      <p className="rounded bg-bg-elevated/50 px-4 py-3 text-xs text-text-secondary">
        {t.reviews.finishPrefix}
        <Link href="/welcome" className="text-crimson-glow underline underline-offset-2">
          {t.common.completeProfile}
        </Link>
        .
      </p>
    );
  }

  if (own && !editing) {
    return (
      <div className="rounded border border-border bg-bg-elevated/40 px-4 py-3">
        <div className="mb-1 flex items-center justify-between gap-3">
          <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">{t.reviews.yours}</span>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="font-mono text-[11px] text-crimson-glow underline underline-offset-2"
          >
            {t.common.edit}
          </button>
        </div>
        <Stars value={own.rating} />
        {own.body && <p className="mt-2 whitespace-pre-line text-sm text-text-secondary">{own.body}</p>}
        {own.hidden_at && (
          <p className="mt-2 font-mono text-[11px] text-crimson-glow">
            {t.reviews.hiddenOwn}
          </p>
        )}
      </div>
    );
  }

  function save() {
    setError(null);
    if (rating < 0.5) {
      setError(t.reviews.pickRating);
      return;
    }
    startTransition(async () => {
      const result = await saveReview(cocktail.id, rating, body);
      if (result.error) {
        setError(result.error);
        return;
      }
      await onSaved();
      setEditing(false);
    });
  }

  function remove() {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    setConfirmingDelete(false);
    setError(null);
    startTransition(async () => {
      const result = await deleteReview(cocktail.id);
      if (result.error) {
        setError(result.error);
        return;
      }
      await onSaved();
      setEditing(false);
    });
  }

  return (
    <div className="rounded border border-border bg-bg-elevated/40 px-4 py-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
          {own ? t.reviews.editTitle : t.reviews.rate}
        </span>
        <Stars value={rating} size={24} onChange={setRating} />
      </div>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={REVIEW_MAX_LENGTH}
        rows={3}
        placeholder={t.reviews.placeholder}
        className="w-full resize-y rounded border border-border bg-bg-card px-3 py-2 text-sm text-text-primary placeholder-text-muted outline-none focus:border-crimson-glow/40"
      />
      {error && <p className="mt-2 text-xs text-crimson-glow">{error}</p>}
      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="rounded bg-crimson px-4 py-1.5 text-xs text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending ? t.common.saving : t.common.save}
        </button>
        {own && (
          <>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setError(null);
                setConfirmingDelete(false);
                setRating(own.rating);
                setBody(own.body ?? "");
              }}
              disabled={pending}
              className="text-xs text-text-muted hover:text-text-primary"
            >
              {t.common.cancel}
            </button>
            <button
              type="button"
              onClick={remove}
              disabled={pending}
              className={`ml-auto text-xs underline underline-offset-2 hover:text-crimson-glow ${
                confirmingDelete ? "text-crimson-glow" : "text-text-muted"
              }`}
            >
              {confirmingDelete ? t.common.confirmDelete : t.common.delete}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function ReviewItem({ review, canReport }: { review: Review; canReport: boolean }) {
  const { locale } = useLocale();
  const date = new Date(review.updated_at).toLocaleDateString(INTL_LOCALES[locale], { day: "numeric", month: "long", year: "numeric" });

  return (
    <li className="flex gap-3">
      <Link href={`/u/${review.profiles.username}`} className="shrink-0">
        <Avatar path={review.profiles.avatar_path} name={review.profiles.display_name} size={32} />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Link href={`/u/${review.profiles.username}`} className="text-sm font-semibold text-text-primary hover:text-crimson-glow">
            {review.profiles.display_name}
          </Link>
          <Stars value={review.rating} size={12} />
          <span className="font-mono text-[10px] text-text-muted">{date}</span>
        </div>
        {review.body && <p className="mt-1 whitespace-pre-line break-words text-sm text-text-secondary">{review.body}</p>}
        {canReport && (
          <div className="mt-1.5 flex">
            <ReportButton targetType="review" targetId={review.id} />
          </div>
        )}
      </div>
    </li>
  );
}
