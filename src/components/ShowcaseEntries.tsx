"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { ArrowBigUp } from "lucide-react";
import { setShowcaseVote } from "@/app/(site)/feed/actions";
import CocktailCard from "@/components/CocktailCard";
import { ReportIfSignedIn } from "@/components/ReportProfileButton";
import { useMember } from "@/components/useMember";
import type { ShowcaseEntry } from "@/lib/content";
import { periodState, type ShowcasePeriod } from "@/lib/showcase";
import { createClient } from "@/lib/supabase/browser";

/**
 * The approved entries of a showcase period with their upvotes (M7). The
 * counts come with the static page; which entries the visitor voted for is
 * read in the browser (ADR-016) — votes are private, a voter sees only theirs.
 */
export default function ShowcaseEntries({ period, entries }: { period: ShowcasePeriod; entries: ShowcaseEntry[] }) {
  const router = useRouter();
  const { member } = useMember();
  const memberId = member.state === "ok" ? member.id : null;
  const [voted, setVoted] = useState<Set<string>>(new Set());
  const [counts, setCounts] = useState<Map<string, number>>(() => new Map(entries.map((e) => [e.id, e.voteCount])));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const open = periodState(period) === "open";

  // A refreshed page brings new totals.
  useEffect(() => {
    setCounts(new Map(entries.map((e) => [e.id, e.voteCount])));
  }, [entries]);

  useEffect(() => {
    if (!memberId || entries.length === 0) return;
    let cancelled = false;
    createClient()
      .from("showcase_votes")
      .select("entry_id")
      .eq("user_id", memberId)
      .in("entry_id", entries.map((e) => e.id))
      .then(({ data }) => {
        if (!cancelled) setVoted(new Set((data ?? []).map((v) => v.entry_id)));
      });
    return () => {
      cancelled = true;
    };
  }, [memberId, entries]);

  function toggle(entryId: string) {
    const on = !voted.has(entryId);
    setError(null);
    // Optimistic; put back if the database refuses.
    const apply = (vote: boolean) => {
      setVoted((prev) => {
        const next = new Set(prev);
        if (vote) next.add(entryId);
        else next.delete(entryId);
        return next;
      });
      setCounts((prev) => new Map(prev).set(entryId, Math.max(0, (prev.get(entryId) ?? 0) + (vote ? 1 : -1))));
    };
    apply(on);
    startTransition(async () => {
      const result = await setShowcaseVote(entryId, on);
      if (result.error) {
        apply(!on);
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  if (entries.length === 0) {
    return <p className="text-xs text-text-muted">Henüz onaylanmış başvuru yok.</p>;
  }

  return (
    <>
      {error && <p className="mb-3 font-mono text-[11px] text-crimson-glow">{error}</p>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {entries.map((entry) => {
          const count = counts.get(entry.id) ?? 0;
          const mine = voted.has(entry.id);
          return (
            <div key={entry.id} className="flex flex-col">
              <CocktailCard cocktail={entry.recipe} href={`/recipes/${entry.recipe.slug}`} />
              <div className="flex flex-1 flex-col gap-3 rounded-b-sm border border-t-0 border-border bg-bg-card/60 px-5 py-3">
                <p className="whitespace-pre-line break-words text-sm text-text-secondary">“{entry.pitch}”</p>
                <div className="mt-auto flex flex-wrap items-center gap-3">
                  {open && member.state === "ok" ? (
                    <button
                      type="button"
                      onClick={() => toggle(entry.id)}
                      disabled={pending}
                      aria-pressed={mine}
                      title={mine ? "Oyunu geri al" : "Oy ver"}
                      className={`flex items-center gap-1.5 rounded px-3 py-1 text-xs transition-colors disabled:opacity-60 ${
                        mine
                          ? "bg-crimson text-white hover:bg-crimson-light"
                          : "border border-border text-text-secondary hover:border-crimson-glow/50 hover:text-text-primary"
                      }`}
                    >
                      <ArrowBigUp className={`h-4 w-4 ${mine ? "fill-white" : ""}`} />
                      {count}
                    </button>
                  ) : open && member.state === "signed-out" ? (
                    <Link
                      href={`/login?next=${encodeURIComponent("/feed#showcase")}`}
                      className="flex items-center gap-1.5 rounded border border-border px-3 py-1 text-xs text-text-secondary hover:border-crimson-glow/50 hover:text-text-primary"
                    >
                      <ArrowBigUp className="h-4 w-4" />
                      {count}
                    </Link>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs text-text-muted">
                      <ArrowBigUp className="h-4 w-4" />
                      {count} oy
                    </span>
                  )}
                  <span className="ml-auto">
                    {entry.recipe.author && (
                      <ReportIfSignedIn ownerId={entry.recipe.author.id} targetType="showcase_entry" targetId={entry.id} />
                    )}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
