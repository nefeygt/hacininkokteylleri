import Image from "next/image";
import Link from "@/components/LocaleLink";
import { ArrowBigUp, ArrowRight, Wine } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { cocktailOfTheDay } from "@/lib/collections";
import { getPublishedCocktails, getShowcaseWinner, recipeHref } from "@/lib/content";
import { todayInTurkey } from "@/lib/drink-log";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { format } from "@/lib/i18n/format";
import { asLocale } from "@/lib/i18n/locales";
import { formatPeriod } from "@/lib/showcase";

// Static, refreshed hourly so the showcase's winner changes soon after a period
// ends (ADR-005, ADR-019); panel actions revalidate it at once.
export const revalidate = 3600;

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const lang = asLocale((await params).lang);
  const t = getDictionary(lang).home;
  const [winner, archive] = await Promise.all([getShowcaseWinner(), getPublishedCocktails(lang)]);
  // The page is rebuilt hourly, so the pick changes within an hour of midnight in Turkey.
  const pick = cocktailOfTheDay(archive, todayInTurkey());

  return (
    <div>
      {/* Hero Section */}
      <section className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-6 text-center">
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-crimson/5 blur-[120px]" />
        </div>

        <div className="relative z-10">
          {/* Mono subtitle */}
          <div className="mb-6 inline-flex items-center gap-2 rounded bg-bg-elevated/60 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.25em] text-text-muted">
            <Wine className="h-3 w-3 text-crimson-glow" />
            {t.heroTag}
          </div>

          {/* Title */}
          <h1 className="mb-4 text-7xl font-bold tracking-tight text-crimson-glow md:text-9xl">{BRAND}</h1>

          {/* Subtitle */}
          <p className="mx-auto mb-10 max-w-md text-sm leading-relaxed text-text-secondary">
            {t.heroSub}
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/cocktails"
              className="group inline-flex items-center gap-2 rounded bg-crimson px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-crimson-light"
            >
              {t.cta}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* "Günün kokteyli" (M9 package D): a reason to come back tomorrow */}
      {pick && (
        <section className="mx-auto max-w-4xl px-6 pb-16">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-crimson-glow">{t.dayLabel}</div>
            <Link href="/cocktails" className="font-mono text-[11px] text-text-muted hover:text-text-primary">
              {t.allRecipes}
            </Link>
          </div>
          <Link
            href={recipeHref(pick.slug, false)}
            className="group grid overflow-hidden rounded-sm border border-border bg-bg-card transition-colors hover:border-border-light sm:grid-cols-2"
          >
            <div className="relative aspect-video bg-bg-elevated sm:aspect-auto sm:min-h-56">
              {pick.imageUrl ? (
                <Image
                  src={pick.imageUrl}
                  alt={pick.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, 448px"
                />
              ) : (
                <div
                  className="absolute inset-0 opacity-20"
                  style={{ background: `radial-gradient(ellipse at 50% 40%, ${pick.color}, transparent 70%)` }}
                />
              )}
              <div className="film-grain absolute inset-0" />
              <div className="absolute inset-x-0 top-0 h-0.5" style={{ backgroundColor: pick.color }} />
            </div>
            <div className="flex flex-col justify-center gap-3 p-6 sm:p-8">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-muted">
                {pick.baseAlcohol} · {pick.flavor}
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-text-primary transition-colors group-hover:text-crimson-glow">
                {pick.name}
              </h2>
              {pick.subtitle && <p className="text-sm text-text-secondary">{pick.subtitle}</p>}
              <p className="font-mono text-[11px] text-text-muted">
                {pick.ingredients.map((i) => i.name).join(" · ")}
              </p>
              <span className="mt-1 inline-flex items-center gap-1.5 text-xs text-crimson-glow">
                {t.goToRecipe} <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          </Link>
        </section>
      )}

      {/* The showcase's winner (M7): the only member's recipe on the home page (ADR-014) */}
      {winner && (
        <section className="mx-auto max-w-4xl px-6 pb-20">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-crimson-glow">
              {format(t.showcaseLabel, { period: formatPeriod(winner.period, lang) })}
            </div>
            <Link href="/feed#showcase" className="font-mono text-[11px] text-text-muted hover:text-text-primary">
              {t.browseShowcase}
            </Link>
          </div>
          <Link
            href={`/recipes/${winner.recipe.slug}`}
            className="group grid overflow-hidden rounded-sm border border-border bg-bg-card transition-colors hover:border-border-light sm:grid-cols-2"
          >
            <div className="relative aspect-video bg-bg-elevated sm:aspect-auto sm:min-h-64">
              {winner.recipe.imageUrl ? (
                <Image
                  src={winner.recipe.imageUrl}
                  alt={winner.recipe.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, 448px"
                />
              ) : (
                <div
                  className="absolute inset-0 opacity-20"
                  style={{ background: `radial-gradient(ellipse at 50% 40%, ${winner.recipe.color}, transparent 70%)` }}
                />
              )}
              <div className="film-grain absolute inset-0" />
              <div className="absolute inset-x-0 top-0 h-0.5" style={{ backgroundColor: winner.recipe.color }} />
            </div>
            <div className="flex flex-col justify-center gap-3 p-6 sm:p-8">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-muted">{t.winner}</div>
              <h2 className="text-3xl font-bold tracking-tight text-text-primary transition-colors group-hover:text-crimson-glow">
                {winner.recipe.name}
              </h2>
              {winner.recipe.subtitle && <p className="text-xs text-text-muted">{winner.recipe.subtitle}</p>}
              <p className="whitespace-pre-line break-words text-sm leading-relaxed text-text-secondary">“{winner.pitch}”</p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-text-secondary">
                {winner.recipe.author && <span>@{winner.recipe.author.username}</span>}
                <span className="flex items-center gap-1 text-crimson-glow">
                  <ArrowBigUp className="h-3.5 w-3.5" />
                  {format(t.votes, { n: winner.voteCount })}
                </span>
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-border px-6 py-8 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-muted">
          {BRAND} &mdash; {getDictionary(lang).common.brandFooter}
        </p>
      </footer>
    </div>
  );
}
