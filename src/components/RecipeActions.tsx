"use client";

import Link from "next/link";
import { Heart, NotebookPen } from "lucide-react";
import type { Cocktail } from "@/lib/content";
import type { Member } from "./useMember";

/** The favourite heart and "Günlüğe ekle" next to a recipe's name, for members. */
export default function RecipeActions({
  cocktail,
  member,
  favorite,
  onToggleFavorite,
}: {
  cocktail: Cocktail;
  member: Member;
  favorite: boolean;
  onToggleFavorite: () => void;
}) {
  if (member.state !== "ok") return null;

  return (
    <>
      <button
        type="button"
        onClick={onToggleFavorite}
        aria-pressed={favorite}
        title={favorite ? "Favorilerden çıkar" : "Favorilere ekle"}
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${
          favorite
            ? "bg-crimson/20 text-crimson-glow"
            : "bg-bg-elevated text-text-muted hover:text-crimson-glow"
        }`}
      >
        <Heart className={`h-4 w-4 ${favorite ? "fill-crimson-glow" : ""}`} />
      </button>
      <Link
        href={`/account/logs/new?cocktail=${encodeURIComponent(cocktail.slug)}`}
        title="Bu kokteyli yaptım ya da içtim"
        className="flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-bg-elevated px-3 font-mono text-[11px] text-text-muted transition-colors hover:text-crimson-glow"
      >
        <NotebookPen className="h-3.5 w-3.5" />
        Günlüğe ekle
      </Link>
    </>
  );
}
