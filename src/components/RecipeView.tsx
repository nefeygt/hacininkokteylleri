"use client";

import Image from "next/image";
import Link from "@/components/LocaleLink";
import { Leaf, Pencil } from "lucide-react";
import { setFavorite } from "@/app/[lang]/(site)/cocktails/actions";
import type { Cocktail } from "@/lib/content";
import Avatar from "./Avatar";
import CocktailReviews from "./CocktailReviews";
import RecipeActions from "./RecipeActions";
import RecipeDetails from "./RecipeDetails";
import ReportButton from "./ReportButton";
import ShareButton from "./ShareButton";
import { useMember } from "./useMember";
import GlassIcon from "@/components/GlassIcon";
import { glassKind } from "@/lib/glasses";

/**
 * A recipe on its own page: a member's (M6, ADR-018) or a house recipe
 * (ADR-025). The page is static; who is looking — the author, another member,
 * a guest — is read in the browser (ADR-016), like the archive's card.
 */
export default function RecipeView({ cocktail, similar }: { cocktail: Cocktail; similar?: React.ReactNode }) {
  const { member, favorites, markFavorite } = useMember();
  const author = cocktail.author;
  const isAuthor = member.state === "ok" && author?.id === member.id;
  const favorite = favorites.has(cocktail.id);

  async function toggleFavorite() {
    const on = !favorite;
    markFavorite(cocktail.id, on);
    const result = await setFavorite(cocktail.id, on);
    if (result.error) markFavorite(cocktail.id, !on);
  }

  return (
    <article className="mx-auto max-w-2xl px-6 py-12">
      {author ? (
        <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.25em] text-crimson-glow">Rx · Üye tarifi</div>
      ) : (
        <Link href="/cocktails" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.25em] text-crimson-glow hover:underline">
          ← Rx · Arşiv
        </Link>
      )}

      {cocktail.imageUrl && (
        <div className="relative mb-8 aspect-video w-full overflow-hidden rounded-sm border border-border bg-bg-elevated">
          <Image src={cocktail.imageUrl} alt={cocktail.name} fill priority className="object-cover" sizes="(max-width: 768px) 100vw, 672px" />
          <div className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: cocktail.color }} />
        </div>
      )}

      <div className="mb-8">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {glassKind(cocktail.glass) && (
            <GlassIcon id={glassKind(cocktail.glass)!.id} className="h-4 w-4 text-text-muted" />
          )}
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-muted">
            {[cocktail.baseAlcohol, cocktail.flavor, cocktail.glass].filter(Boolean).join(" · ")}
          </span>
          {cocktail.vegan && (
            <span className="flex items-center gap-1 rounded bg-vegan-bg/30 px-1.5 py-0.5 font-mono text-[9px] uppercase text-vegan">
              <Leaf className="h-2.5 w-2.5" />
              Vegan
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">{cocktail.name}</h1>
          <RecipeActions cocktail={cocktail} member={member} favorite={favorite} onToggleFavorite={toggleFavorite} />
          <ShareButton title={cocktail.name} text={cocktail.subtitle || undefined} />
        </div>
        {cocktail.subtitle && <p className="mt-1 text-sm text-text-secondary">{cocktail.subtitle}</p>}

        {author && (
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link href={`/u/${author.username}`} className="flex items-center gap-2.5 hover:text-crimson-glow">
              <Avatar path={author.avatarPath} name={author.displayName} size={28} />
              <span className="text-sm">
                <span className="text-text-muted">tarif: </span>
                <span className="font-semibold text-text-primary">{author.displayName}</span>
                <span className="ml-1 font-mono text-[11px] text-text-muted">@{author.username}</span>
              </span>
            </Link>
            {isAuthor && (
              <Link
                href={`/account/recipes/${cocktail.id}`}
                className="ml-auto flex items-center gap-1.5 font-mono text-[11px] text-crimson-glow underline underline-offset-2"
              >
                <Pencil className="h-3 w-3" /> Düzenle
              </Link>
            )}
            {member.state === "ok" && !isAuthor && (
              <span className="ml-auto flex">
                <ReportButton targetType="cocktail" targetId={cocktail.id} label="Tarifi bildir" />
              </span>
            )}
          </div>
        )}
      </div>

      <RecipeDetails cocktail={cocktail} />

      <div className="mt-10">
        <CocktailReviews cocktail={cocktail} member={member} />
      </div>

      {similar}
    </article>
  );
}
