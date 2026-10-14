import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import DrinkLogEntry, { DRINK_LOG_WITH_AUTHOR_COLUMNS, type DrinkLogRow } from "@/components/DrinkLogEntry";
import LogComments from "@/components/LogComments";
import { readRecipe } from "@/lib/drink-log";
import { createPublicClient } from "@/lib/supabase/public";

// One public drink log and its comments (M6, ADR-018). Rendered on first
// visit and kept for a few minutes; editing, deleting or hiding the log
// revalidates it. Only public, visible logs exist here (RLS); comments are
// read in the browser.
export const revalidate = 300;

export async function generateStaticParams() {
  return [];
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const getLog = cache(async (id: string) => {
  if (!UUID.test(id)) return null;
  const { data } = await createPublicClient()
    .from("drink_logs")
    .select(DRINK_LOG_WITH_AUTHOR_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  return data as DrinkLogRow | null;
});

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const log = await getLog((await params).id);
  if (!log?.profiles) return { title: "Bulunamadı" };
  return {
    title: `${readRecipe(log.recipe).name} — @${log.profiles.username}`,
    // Drinking history is personal: shared by link, kept out of search engines.
    robots: { index: false },
  };
}

export default async function LogPage({ params }: { params: Promise<{ id: string }> }) {
  const log = await getLog((await params).id);
  if (!log?.profiles) notFound();

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.25em] text-crimson-glow">Rx · Günlük kaydı</div>
      <div className="mb-6 flex items-baseline justify-between gap-4">
        <h1 className="text-2xl font-bold">{log.profiles.display_name} günlüğünden</h1>
        <Link href={`/u/${log.profiles.username}`} className="font-mono text-[11px] text-text-muted underline underline-offset-2 hover:text-text-primary">
          Profil →
        </Link>
      </div>
      <DrinkLogEntry log={log} mode="public" showCommentsLink={false} />
      <LogComments logId={log.id} ownerId={log.user_id} />
    </div>
  );
}
