import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AccountCard from "@/components/AccountCard";
import { requireMember } from "@/lib/account";
import { formatLogDate, readRecipe, todayInTurkey } from "@/lib/drink-log";
import LogForm from "../LogForm";

export const metadata: Metadata = {
  title: "Kaydı düzenle",
  robots: { index: false },
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** Edit or delete one of the member's own drink logs. */
export default async function EditLogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const { supabase, profile } = await requireMember();

  const { data: log } = await supabase
    .from("drink_logs")
    .select("id, cocktail_id, drunk_on, recipe, rating, note, is_public, hidden_at")
    .eq("id", id)
    .eq("user_id", profile.id)
    .maybeSingle();
  if (!log) notFound();

  const recipe = readRecipe(log.recipe);

  return (
    <AccountCard title={recipe.name} subtitle={`${formatLogDate(log.drunk_on)} kaydını düzenle.`} wide>
      {log.hidden_at && (
        <p className="mb-6 rounded border border-crimson/40 bg-crimson/10 p-3 text-xs text-text-secondary">
          Bu kayıt bir yönetici tarafından gizlendi; yalnızca sen görüyorsun.
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
