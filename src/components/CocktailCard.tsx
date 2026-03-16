"use client";

import { Wine, Leaf, Star } from "lucide-react";
import type { Cocktail } from "@/data/cocktails";

export default function CocktailCard({
  cocktail,
  onClick,
}: {
  cocktail: Cocktail;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group relative flex h-80 w-full flex-col justify-end overflow-hidden rounded-sm border border-border bg-bg-card text-left transition-all duration-300 hover:border-border-light hover:shadow-lg hover:shadow-crimson/5"
    >
      {/* Colored accent strip at top */}
      <div
        className="absolute inset-x-0 top-0 h-1 transition-all duration-300 group-hover:h-1.5"
        style={{ backgroundColor: cocktail.color }}
      />

      {/* Background gradient */}
      <div
        className="absolute inset-0 opacity-10 transition-opacity duration-300 group-hover:opacity-15"
        style={{
          background: `radial-gradient(ellipse at 50% 0%, ${cocktail.color}40, transparent 70%)`,
        }}
      />

      {/* Film grain overlay */}
      <div className="film-grain absolute inset-0" />

      {/* Top right badges */}
      <div className="absolute right-3 top-4 flex flex-col gap-1.5">
        {cocktail.vegan && (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-900/40 text-green-400">
            <Leaf className="h-3 w-3" />
          </div>
        )}
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-bg-elevated/80 text-text-muted">
          <Star className="h-3 w-3" />
        </div>
      </div>

      {/* Center icon */}
      <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2">
        <Wine
          className="h-12 w-12 text-text-muted/20 transition-all duration-300 group-hover:scale-110 group-hover:text-text-muted/30"
          strokeWidth={1}
        />
      </div>

      {/* Content at bottom */}
      <div className="relative z-10 p-5">
        <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-text-muted">
          {cocktail.baseAlcohol} · {cocktail.flavor}
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
