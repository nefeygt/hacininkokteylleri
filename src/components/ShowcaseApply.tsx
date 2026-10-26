"use client";

import Link from "@/components/LocaleLink";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { applyToShowcase, withdrawShowcaseEntry } from "@/app/[lang]/(site)/feed/actions";
import { useMember } from "@/components/useMember";
import { PITCH_MAX_LENGTH, type ShowcasePeriod } from "@/lib/showcase";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/browser";
import { useLocale } from "@/components/LocaleProvider";

type Status = Database["public"]["Enums"]["showcase_status"];
type MyEntry = { id: string; status: Status; pitch: string; cocktails: { name: string; slug: string } | null };
type Eligible = { id: string; name: string };

const field =
  "w-full rounded border border-border bg-bg-card px-3 py-2 text-sm text-text-primary placeholder-text-muted outline-none focus:border-crimson-glow/40";

/**
 * "Vitrine başvur" on the feed (M7): one application per member per period,
 * with one of their own published recipes that has a photo, and a pitch (the
 * user's rule, ADR-019). Read and written from the browser so the feed stays
 * static (ADR-016); pending and rejected applications are seen only by their
 * applicant (RLS).
 */
export default function ShowcaseApply({ period }: { period: ShowcasePeriod }) {
  const router = useRouter();
  const { t, href } = useLocale();
  const ts = t.showcase;
  const { member } = useMember();
  const memberId = member.state === "ok" ? member.id : null;
  const [mine, setMine] = useState<MyEntry | null | undefined>(undefined);
  const [eligible, setEligible] = useState<Eligible[]>([]);
  const [open, setOpen] = useState(false);
  const [cocktailId, setCocktailId] = useState("");
  const [pitch, setPitch] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const load = useCallback(async () => {
    if (!memberId) return;
    const supabase = createClient();
    const [{ data: entry }, { data: recipes }] = await Promise.all([
      supabase
        .from("showcase_entries")
        .select("id, status, pitch, cocktails(name, slug)")
        .eq("period_id", period.id)
        .eq("user_id", memberId)
        .maybeSingle(),
      supabase
        .from("cocktails")
        .select("id, name")
        .eq("author_id", memberId)
        .eq("is_published", true)
        .is("hidden_at", null)
        .not("image_path", "is", null)
        .order("created_at", { ascending: false }),
    ]);
    setMine((entry as MyEntry | null) ?? null);
    setEligible(recipes ?? []);
    setCocktailId((current) => current || recipes?.[0]?.id || "");
  }, [memberId, period.id]);

  useEffect(() => {
    load();
  }, [load]);

  if (member.state === "loading") return null;

  if (member.state === "signed-out") {
    return (
      <Link
        href={`/login?next=${encodeURIComponent(href("/feed#showcase"))}`}
        className="inline-flex rounded border border-border px-4 py-2 text-xs text-text-secondary hover:border-crimson-glow/50 hover:text-text-primary"
      >
        {ts.signInToApply}
      </Link>
    );
  }
  if (member.state === "onboarding" || mine === undefined) return null;

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await applyToShowcase(period.id, cocktailId, pitch);
      if (result.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      setPitch("");
      await load();
    });
  }

  function withdraw() {
    if (!mine) return;
    setError(null);
    startTransition(async () => {
      const result = await withdrawShowcaseEntry(mine.id);
      if (result.error) {
        setError(result.error);
        return;
      }
      setConfirming(false);
      await load();
      router.refresh();
    });
  }

  if (mine) {
    return (
      <div className="rounded border border-border bg-bg-card/60 p-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-text-muted">
          <span className="uppercase tracking-[0.15em]">{ts.yourEntry}</span>
          <span
            className={`rounded px-1.5 py-0.5 ${
              mine.status === "approved"
                ? "bg-vegan-bg/40 text-vegan"
                : mine.status === "rejected"
                  ? "bg-crimson/15 text-crimson-glow"
                  : "bg-bg-elevated text-text-secondary"
            }`}
          >
            {t.showcaseStatus[mine.status]}
          </span>
          {mine.cocktails && (
            <Link href={`/recipes/${mine.cocktails.slug}`} className="text-text-secondary hover:text-text-primary">
              {mine.cocktails.name}
            </Link>
          )}
        </div>
        <p className="mt-2 whitespace-pre-line break-words text-sm text-text-secondary">“{mine.pitch}”</p>
        {error && <p className="mt-2 font-mono text-[11px] text-crimson-glow">{error}</p>}
        <div className="mt-3 flex items-center gap-3 font-mono text-[11px]">
          {confirming ? (
            <>
              <span className="text-text-muted">{ts.withdrawWarning}</span>
              <button type="button" onClick={withdraw} disabled={pending} className="text-crimson-glow hover:underline disabled:opacity-50">
                {pending ? t.common.deleting : ts.yesWithdraw}
              </button>
              <button type="button" onClick={() => setConfirming(false)} disabled={pending} className="text-text-muted hover:text-text-primary">
                {t.common.cancel}
              </button>
            </>
          ) : (
            <button type="button" onClick={() => setConfirming(true)} className="text-text-muted hover:text-crimson-glow">
              {ts.withdraw}
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex rounded bg-crimson px-4 py-2 text-xs text-white transition-opacity hover:opacity-90"
      >
        {ts.apply}
      </button>
    );
  }

  return (
    <div className="max-w-xl rounded border border-border bg-bg-card/60 p-4">
      {eligible.length === 0 ? (
        <p className="text-xs leading-relaxed text-text-muted">
          {ts.needRecipe}          <Link href="/account/recipes" className="text-text-secondary underline hover:text-text-primary">
            {ts.toRecipes}
          </Link>
        </p>
      ) : (
        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.15em] text-text-muted">{ts.recipe}</span>
            <select value={cocktailId} onChange={(e) => setCocktailId(e.target.value)} className={field}>
              {eligible.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.15em] text-text-muted">
              {ts.whyTitle}
            </span>
            <textarea
              value={pitch}
              onChange={(e) => setPitch(e.target.value)}
              maxLength={PITCH_MAX_LENGTH}
              rows={3}
              placeholder={ts.pitchPlaceholder}
              className={field}
            />
            <span className="mt-1 block text-right font-mono text-[10px] text-text-muted">
              {pitch.length}/{PITCH_MAX_LENGTH}
            </span>
          </label>
          <p className="font-mono text-[10px] leading-relaxed text-text-muted">
            {ts.rules}
          </p>
        </div>
      )}
      {error && <p className="mt-2 font-mono text-[11px] text-crimson-glow">{error}</p>}
      <div className="mt-3 flex items-center gap-3">
        {eligible.length > 0 && (
          <button
            type="button"
            onClick={submit}
            disabled={pending || !pitch.trim() || !cocktailId}
            className="rounded bg-crimson px-4 py-1.5 text-xs text-white hover:opacity-90 disabled:opacity-50"
          >
            {pending ? t.common.sending : ts.submit}
          </button>
        )}
        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={pending}
          className="text-xs text-text-muted hover:text-text-primary"
        >
          {t.common.cancel}
        </button>
      </div>
    </div>
  );
}
