import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AccountCard from "@/components/AccountCard";
import { requireMember } from "@/lib/account";
import { formatLogDate, readRecipe, todayInTurkey } from "@/lib/drink-log";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { format } from "@/lib/i18n/format";
import { asLocale } from "@/lib/i18n/locales";
import LogForm from "../LogForm";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const t = getDictionary(asLocale((await params).lang)).logsPage;
  return { title: t.editMeta, robots: { index: false } };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** Edit or delete one of the member's own drink logs. */
export default async function EditLogPage({ params }: { params: Promise<{ lang: string; id: string }> }) {
  const { id, lang: rawLang } = await params;
  const lang = asLocale(rawLang);
  const t = getDictionary(lang).logsPage;
  if (!UUID.test(id)) notFound();
  const { supabase, profile } = await requireMember(lang);

  const { data: log } = await supabase
    .from("drink_logs")
    .select("id, cocktail_id, drunk_on, recipe, rating, note, is_public, hidden_at")
    .eq("id", id)
    .eq("user_id", profile.id)
    .maybeSingle();
  if (!log) notFound();

  const recipe = readRecipe(log.recipe);

  return (
    <AccountCard title={recipe.name} subtitle={format(t.editSubtitle, { date: formatLogDate(log.drunk_on, lang) })} wide>
      {log.hidden_at && (
        <p className="mb-6 rounded border border-crimson/40 bg-crimson/10 p-3 text-xs text-text-secondary">
          {t.hidden}
        </p>
      )}
      <LogForm
        id={log.id}
        today={todayInTurkey()}
        initial={{
          cocktailId: log.cocktail_id ?? "",
          drunkOn: log.drunk_on,
          recipe,
          rating: log.rating,
          note: log.note ?? "",
          isPublic: log.is_public,
        }}
      />
    </AccountCard>
  );
}
