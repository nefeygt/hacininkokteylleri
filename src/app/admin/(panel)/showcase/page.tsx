import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import { formatPeriod, periodState, STATUS_LABELS, type PeriodState } from "@/lib/showcase";
import type { Database } from "@/lib/supabase/database.types";
import { DeletePeriodButton, EntryStatusButtons, ShowcasePeriodForm } from "../../ShowcaseControls";

export const metadata: Metadata = { title: "Vitrin" };

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "";

type EntryRow = {
  id: string;
  period_id: string;
  pitch: string;
  status: Database["public"]["Enums"]["showcase_status"];
  vote_count: number;
  hidden_at: string | null;
  created_at: string;
  profiles: { username: string };
  cocktails: { name: string; slug: string; is_published: boolean; hidden_at: string | null };
};

const STATE_LABELS: Record<PeriodState, string> = { open: "Açık", upcoming: "Yakında", ended: "Bitti" };

/** "YYYY-MM-DD" of a moment in Turkey. */
function turkeyDate(date: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(date);
}

/**
 * The showcase (M7, ADR-019): open periods (a week or a month), approve or
 * reject applications, see the votes and the derived winner. Hiding a reported
 * application is on the moderation page.
 */
export default async function ShowcaseAdminPage() {
  const { supabase } = await requireAdmin();

  const { data: periods, error } = await supabase
    .from("showcase_periods")
    .select("id, starts_at, ends_at")
    .order("starts_at", { ascending: false })
    .limit(12);
  if (error) throw new Error(error.message);

  const { data: entries, error: entriesError } = periods.length
    ? await supabase
        .from("showcase_entries")
        .select(
          "id, period_id, pitch, status, vote_count, hidden_at, created_at, profiles!showcase_entries_user_id_fkey(username), cocktails(name, slug, is_published, hidden_at)"
        )
        .in("period_id", periods.map((p) => p.id))
        .order("vote_count", { ascending: false })
        .order("created_at")
    : { data: [], error: null };
  if (entriesError) throw new Error(entriesError.message);

  const byPeriod = new Map<string, EntryRow[]>();
  for (const entry of (entries ?? []) as unknown as EntryRow[]) {
    byPeriod.set(entry.period_id, [...(byPeriod.get(entry.period_id) ?? []), entry]);
  }

  // The next period naturally starts where the latest one ends.
  const today = turkeyDate(new Date());
  const latestEnd = periods[0] ? turkeyDate(new Date(periods[0].ends_at)) : today;
  const defaultStart = latestEnd > today ? latestEnd : today;
  const pendingCount = (entries ?? []).filter((e) => e.status === "pending").length;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Vitrin</h1>
        <p className="mt-1 font-mono text-xs text-text-muted">
          {pendingCount} başvuru onay bekliyor · kazanan, biten son dönemin en çok oy alan onaylı başvurusudur ve ana
          sayfada gösterilir
        </p>
      </div>

      <section>
        <h2 className="mb-3 font-mono text-xs uppercase tracking-[0.15em] text-text-muted">Yeni dönem</h2>
        <ShowcasePeriodForm defaultStart={defaultStart} />
      </section>

      {periods.length === 0 ? (
        <p className="font-mono text-xs text-text-muted">Henüz dönem yok.</p>
      ) : (
        periods.map((period) => {
          const state = periodState({ startsAt: period.starts_at, endsAt: period.ends_at });
          const list = byPeriod.get(period.id) ?? [];
          const winner =
            state === "ended"
              ? list.find((e) => e.status === "approved" && !e.hidden_at && e.cocktails.is_published && !e.cocktails.hidden_at)
              : undefined;
          return (
            <section key={period.id}>
              <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h2 className="font-mono text-xs uppercase tracking-[0.15em] text-text-secondary">
                  {formatPeriod({ startsAt: period.starts_at, endsAt: period.ends_at })}
                </h2>
                <span
                  className={`rounded px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
                    state === "open" ? "bg-green-900/40 text-green-400" : "bg-bg-elevated text-text-muted"
                  }`}
                >
                  {STATE_LABELS[state]}
                </span>
                <span className="font-mono text-[11px] text-text-muted">{list.length} başvuru</span>
                <span className="ml-auto">
                  <DeletePeriodButton id={period.id} entryCount={list.length} />
                </span>
              </div>
              {list.length === 0 ? (
                <p className="font-mono text-xs text-text-muted">Başvuru yok.</p>
              ) : (
                <ul className="divide-y divide-border overflow-hidden rounded-sm border border-border bg-bg-card">
                  {list.map((entry) => (
                    <li key={entry.id} className={`flex items-start gap-3 px-4 py-3 ${entry.hidden_at ? "opacity-60" : ""}`}>
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
                          <a
                            href={`${SITE_URL}/u/${entry.profiles.username}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-text-primary"
                          >
                            @{entry.profiles.username}
                          </a>
                          <span
                            className={
                              entry.status === "approved"
                                ? "text-green-400"
                                : entry.status === "rejected"
                                  ? "text-crimson-glow"
                                  : "text-text-secondary"
                            }
                          >
                            {STATUS_LABELS[entry.status]}
                          </span>
                          <span>{entry.vote_count} oy</span>
                          {winner?.id === entry.id && <span className="text-crimson-glow">★ kazanan</span>}
                          {(!entry.cocktails.is_published || entry.cocktails.hidden_at) && <span>tarif yayında değil</span>}
                          {entry.hidden_at && <span className="text-crimson-glow">gizli</span>}
                        </div>
                        <p className="mt-1 whitespace-pre-line break-words text-sm text-text-secondary">“{entry.pitch}”</p>
                      </div>
                      <EntryStatusButtons id={entry.id} status={entry.status} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })
      )}
    </div>
  );
}
