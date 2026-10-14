"use client";

import Image from "next/image";
import { Wine, Leaf, Star, Heart } from "lucide-react";
import { formatAverage } from "@/lib/community";
import type { Cocktail } from "@/lib/content";

export default function CocktailCard({
  cocktail,
  favorite = false,
  onClick,
}: {
  cocktail: Cocktail;
  favorite?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group relative flex w-full flex-col overflow-hidden rounded-sm border border-border bg-bg-card text-left transition-all duration-300 hover:border-border-light hover:shadow-lg hover:shadow-crimson/5"
    >
      {/* Image / Poster Frame */}
      <div className="relative aspect-video w-full overflow-hidden rounded-t-sm bg-bg-elevated">
        {cocktail.imageUrl ? (
          <Image
            src={cocktail.imageUrl}
            alt={cocktail.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          /* Dark placeholder with subtle gradient and centered icon */
          <>
            <div
              className="absolute inset-0 opacity-15"
              style={{
                background: `radial-gradient(ellipse at 50% 40%, ${cocktail.color}50, transparent 70%)`,
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Wine
                className="h-10 w-10 text-text-muted/15 transition-all duration-300 group-hover:scale-110 group-hover:text-text-muted/25"
                strokeWidth={1}
              />
            </div>
          </>
        )}

        {/* Film grain on poster frame */}
        <div className="film-grain absolute inset-0" />

        {/* Colored accent strip at very top */}
        <div
          className="absolute inset-x-0 top-0 h-0.5 transition-all duration-300 group-hover:h-1"
          style={{ backgroundColor: cocktail.color }}
        />

        {/* Letterboxd-style vignette on image bottom for text readability */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-bg-card to-transparent" />

        {/* Top right badges */}
        <div className="absolute right-2.5 top-2.5 flex flex-col gap-1.5">
          {cocktail.vegan && (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-900/60 text-green-400 backdrop-blur-sm">
              <Leaf className="h-3 w-3" />
            </div>
          )}
          {favorite && (
            <div
              title="Favorilerinde"
              className="flex h-6 w-6 items-center justify-center rounded-full bg-black/40 text-crimson-glow backdrop-blur-sm"
            >
              <Heart className="h-3 w-3 fill-crimson-glow" />
            </div>
          )}
        </div>
      </div>

      {/* Content below image */}
      <div className="flex flex-1 flex-col justify-end p-5">
        <div className="mb-1 flex items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-text-muted">
          <span>
            {cocktail.baseAlcohol} · {cocktail.flavor}
          </span>
          {cocktail.rating && (
            <span
              className="flex shrink-0 items-center gap-1 normal-case tracking-normal text-text-secondary"
              title={`${cocktail.rating.count} değerlendirme`}
            >
              <Star className="h-3 w-3 fill-crimson-glow text-crimson-glow" />
              {formatAverage(cocktail.rating.average)}
              <span className="text-text-muted">({cocktail.rating.count})</span>
            </span>
          )}
        </div>
        <h3 className="mb-1 text-lg font-bold tracking-tight text-text-primary transition-colors group-hover:text-crimson-glow">
          {cocktail.name}
        </h3>
        <p className="font-mono text-xs text-text-muted line-clamp-2">
          {cocktail.subtitle}
        </p>

        {/* Tags */}
        <div className="mt-3 flex flex-wrap gap-1">
          {cocktail.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-sm bg-bg-elevated px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-text-muted"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </button>
  );
}
