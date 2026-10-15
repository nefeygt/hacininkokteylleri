import type { Metadata } from "next";
import Link from "next/link";
import DrinkLogEntry, { DRINK_LOG_COLUMNS, type DrinkLogRow } from "@/components/DrinkLogEntry";
import { requireMember } from "@/lib/account";

export const metadata: Metadata = {
  title: "İçki günlüğüm",
  robots: { index: false },
};

const SHOWN = 200;

/** The member's own drink logs, private and public, newest first (M5). */
export default async function LogsPage() {
  const { supabase, profile } = await requireMember();

  const { data, error } = await supabase
    .from("drink_logs")
    .select(DRINK_LOG_COLUMNS)
    .eq("user_id", profile.id)
    .order("drunk_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(SHOWN);
  if (error) throw new Error(error.message);
  const logs = data as DrinkLogRow[];

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.25em] text-crimson-glow">Rx · Günlük</div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">İçki günlüğüm</h1>
          <p className="mt-1 text-xs text-text-muted">
            Yaptığın ya da içtiğin her kokteyl, o akşamki hâliyle. Herkese açık olmayanları yalnızca sen görürsün.
          </p>
        </div>
        <Link href="/account" className="font-mono text-[11px] text-text-muted underline underline-offset-2 hover:text-text-primary">
          ← Hesabım
        </Link>
      </div>

      <Link
        href="/account/logs/new"
        className="mt-8 inline-flex items-center rounded bg-crimson px-4 py-2 text-xs text-white transition-opacity hover:opacity-90"
      >
        + Yeni kayıt
      </Link>

      <section className="mt-8">
        {logs.length === 0 ? (
          <p className="text-xs leading-relaxed text-text-muted">
            Henüz kayıt yok. Arşivde bir tarifi açıp &ldquo;Günlüğe ekle&rdquo;ye dokun ya da yukarıdan bir kokteyl seç.
          </p>
        ) : (
          <ul className="space-y-3">
            {logs.map((log) => (
              <li key={log.id}>
                <DrinkLogEntry log={log} mode="own" />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
