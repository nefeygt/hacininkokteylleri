import type { Metadata } from "next";
import Link from "@/components/LocaleLink";
import AccountCard from "@/components/AccountCard";
import { requireMember } from "@/lib/account";
import { todayInTurkey, type LogRecipe } from "@/lib/drink-log";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { asLocale, DEFAULT_LOCALE } from "@/lib/i18n/locales";
import LogForm from "../LogForm";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const t = getDictionary(asLocale((await params).lang)).logsPage;
  return { title: t.newTitle, robots: { index: false } };
}

/**
 * A new drink log, started from a recipe (`?cocktail={slug}`) — a house recipe
 * or a member's (M6). Without a cocktail, the member picks a house recipe first.
 * A house recipe starts in the page's language (the snapshot is saved as shown).
 */
export default async function NewLogPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ cocktail?: string }>;
}) {
  const lang = asLocale((await params).lang);
  const t = getDictionary(lang).logsPage;
  const { supabase, user } = await requireMember(lang);
  const slug = (await searchParams).cocktail;

  if (!slug) {
    const { data: cocktails } = await supabase
      .from("cocktails")
      .select("id, slug, name, subtitle, color")
      .eq("is_published", true)
      .is("author_id", null)
      .order("sort_order");
    // The subtitle in the page's language, where it is translated.
    const subtitles = new Map<string, string>();
    if (lang !== DEFAULT_LOCALE) {
      const { data: translations } = await supabase.from("cocktail_translations").select("cocktail_id, subtitle").eq("locale", lang);
      for (const row of translations ?? []) if (row.subtitle) subtitles.set(row.cocktail_id, row.subtitle);
    }
    return (
      <AccountCard title={t.newTitle} subtitle={t.newPickSubtitle} wide>
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
                  <span className="block truncate font-mono text-[11px] text-text-muted">{subtitles.get(c.id) ?? c.subtitle}</span>
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
      .select("id, name, author_id, instructions, garnish, glass, cocktail_ingredients(position, name, amount, unit, icon)")
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle(),
    supabase.from("account_settings").select("logs_public_default").eq("user_id", user.id).maybeSingle(),
  ]);

  if (!cocktail) {
    return (
      <AccountCard title={t.newTitle} subtitle={t.notFoundSubtitle}>
        <Link href="/account/logs/new" className="text-xs text-crimson-glow underline underline-offset-2">
          {t.pickAnother}
        </Link>
      </AccountCard>
    );
  }

  const ingredients = [...cocktail.cocktail_ingredients]
    .sort((a, b) => a.position - b.position)
    .map((i) => ({ name: i.name, amount: Number(i.amount), unit: i.unit, icon: i.icon }));
  let instructions = cocktail.instructions;
  let garnish: string = cocktail.garnish;
  let glass: string = cocktail.glass;

  // A house recipe starts in the page's language; a member's recipe stays as written.
  if (lang !== DEFAULT_LOCALE && !cocktail.author_id) {
    const { data: tx } = await supabase
      .from("cocktail_translations")
      .select("instructions, garnish, glass, ingredient_names")
      .eq("cocktail_id", cocktail.id)
      .eq("locale", lang)
      .maybeSingle();
    if (tx) {
      if (tx.instructions.length > 0) instructions = tx.instructions;
      garnish = tx.garnish || garnish;
      glass = tx.glass || glass;
      ingredients.forEach((ingredient, i) => {
        ingredient.name = tx.ingredient_names[i] || ingredient.name;
      });
    }
  }

  const recipe: LogRecipe = {
    name: cocktail.name,
    ingredients,
    instructions,
    garnish: garnish || null,
    glass: glass || null,
  };
  const today = todayInTurkey();

  return (
    <AccountCard title={cocktail.name} subtitle={t.formSubtitle} wide>
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
