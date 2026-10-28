import { Beer, Citrus, CookingPot, Droplets, GlassWater, Pipette } from "lucide-react-native";
import { StyleSheet, View } from "react-native";
import type { Ingredient } from "@/lib/content";
import { alpha, type Theme } from "@/lib/theme";
import { useStyles, useTheme } from "@/lib/theme-context";
import { Mono } from "./Type";

const iconMap = {
  shot: GlassWater,
  dash: Pipette,
  drop: Droplets,
  slice: Citrus,
  spoon: CookingPot,
  topup: Beer,
} as const;

/** An amount drawn as icons — two shots are two glasses (the site's VisualQuantity); `label` is the amount as text in the language. */
export default function VisualQuantity({ ingredient, label }: { ingredient: Ingredient; label?: string }) {
  const styles = useStyles(makeStyles);
  const theme = useTheme();
  const Icon = iconMap[ingredient.iconType];
  const fullCount = Math.floor(ingredient.amount);
  const hasFraction = ingredient.amount % 1 !== 0;

  // Large amounts (a top-up of 100 ml) are written, not drawn.
  if (ingredient.amount > 8) {
    return (
      <View style={styles.row}>
        <Icon size={16} color={theme.colors.crimsonGlow} />
        <Mono style={styles.big}>
          {label ?? `${ingredient.amount} ${ingredient.unit}`}
        </Mono>
      </View>
    );
  }

  return (
    <View style={styles.row}>
      <View style={styles.icons}>
        {Array.from({ length: fullCount }).map((_, i) => (
          <Icon key={i} size={14} color={theme.colors.crimsonGlow} />
        ))}
        {hasFraction && <Icon size={14} color={alpha(theme.colors.crimsonGlow, 0.4)} />}
      </View>
      <Mono style={styles.small}>
        {label ?? `${ingredient.amount}${ingredient.unit}`}
      </Mono>
    </View>
  );
}

const makeStyles = (t: Theme) => StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
  icons: { flexDirection: "row", alignItems: "center", gap: 2 },
  big: { fontSize: 12 },
  small: { fontSize: 10, color: t.colors.textMuted },
});
