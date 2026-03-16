import { GlassWater, Droplets, Pipette, Citrus, CookingPot, Beer } from "lucide-react";
import type { Ingredient } from "@/data/cocktails";

const iconMap = {
  shot: GlassWater,
  dash: Pipette,
  drop: Droplets,
  slice: Citrus,
  spoon: CookingPot,
  topup: Beer,
} as const;

export default function VisualQuantity({
  ingredient,
}: {
  ingredient: Ingredient;
}) {
  const Icon = iconMap[ingredient.iconType];
  const fullCount = Math.floor(ingredient.amount);
  const hasFraction = ingredient.amount % 1 !== 0;

  // For large amounts (like top-up), just show text
  if (ingredient.amount > 8) {
    return (
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-crimson-glow" />
        <span className="font-mono text-xs text-text-secondary">
          {ingredient.amount} {ingredient.unit}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: fullCount }).map((_, i) => (
          <Icon key={i} className="h-3.5 w-3.5 text-crimson-glow" />
        ))}
        {hasFraction && (
          <Icon className="h-3.5 w-3.5 text-crimson-glow/40" />
        )}
      </div>
      <span className="font-mono text-[10px] text-text-muted">
        {ingredient.amount}{ingredient.unit}
      </span>
    </div>
  );
}
