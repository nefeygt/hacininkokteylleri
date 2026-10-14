import type { Metadata } from "next";
import Link from "next/link";
import AccountCard from "@/components/AccountCard";
import { requireMember } from "@/lib/account";
import { todayInTurkey, type LogRecipe } from "@/lib/drink-log";
import LogForm from "../LogForm";

export const metadata: Metadata = {
  title: "Günlüğe ekle",
  robots: { index: false },
};

/**
 * A new drink log, started from a recipe (`?cocktail={slug}`) — a house recipe
 * or a member's (M6). Without a cocktail, the member picks a house recipe first.
 */
export default async function NewLogPage({ searchParams }: { searchParams: Promise<{ cocktail?: string }> }) {
  const { supabase, user } = await requireMember();
  const slug = (await searchParams).cocktail;

  if (!slug) {
    const { data: cocktails } = await supabase
      .from("cocktails")
      .select("slug, name, subtitle, color")
      .eq("is_published", true)
      .is("author_id", null)
      .order("sort_order");
    return (
      <AccountCard title="Günlüğe ekle" subtitle="Hangi kokteyli yaptın ya da içtin?" wide>
        <ul className="max-h-[60vh] space-y-1.5 overflow-y-auto">
          {(cocktails ?? []).map((c) => (
            <li key={c.slug}>
              <Link
                href={`/account/logs/new?cocktail=${encodeURIComponent(c.slug)}`}
                className="flex items-center gap-3 rounded border border-border bg-bg-primary px-3 py-2 transition-colors hover:border-border-light"
              >
                <span className="h-6 w-1 shrink-0 rounded-full" style={{ backgroundColor: c.color }} />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-text-primary">{c.name}</span>
                  <span className="block truncate font-mono text-[11px] text-text-muted">{c.subtitle}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </AccountCard>
    );
  }

  const [{ data: cocktail }, { data: settings }] = await Promise.all([
    supabase
      .from("cocktails")
      .select("id, name, instructions, garnish, glass, cocktail_ingredients(position, name, amount, unit, icon)")
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle(),
    supabase.from("account_settings").select("logs_public_default").eq("user_id", user.id).maybeSingle(),
  ]);

  if (!cocktail) {
    return (
      <AccountCard title="Günlüğe ekle" subtitle="Bu kokteyl bulunamadı.">
        <Link href="/account/logs/new" className="font-mono text-xs text-crimson-glow underline underline-offset-2">
          Başka bir kokteyl seç
        </Link>
      </AccountCard>
    );
  }

  const recipe: LogRecipe = {
    name: cocktail.name,
    ingredients: [...cocktail.cocktail_ingredients]
      .sort((a, b) => a.position - b.position)
      .map((i) => ({ name: i.name, amount: Number(i.amount), unit: i.unit, icon: i.icon })),
    instructions: cocktail.instructions,
    garnish: cocktail.garnish || null,
    glass: cocktail.glass || null,
  };
  const today = todayInTurkey();

  return (
    <AccountCard title={cocktail.name} subtitle="Günlüğe ekle — tarifi yaptığın gibi düzenle." wide>
      <LogForm
        today={today}
        initial={{
          cocktailId: cocktail.id,
          drunkOn: today,
          recipe,
          rating: null,
          note: "",
          isPublic: settings?.logs_public_default ?? false,
        }}
      />
    </AccountCard>
  );
}
