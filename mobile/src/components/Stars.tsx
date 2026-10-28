import { RATING_STEP, formatRating } from "@shared/community";
import { Star } from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";
import { alpha, type Theme } from "@/lib/theme";
import { useStyles, useTheme } from "@/lib/theme-context";

/** How much of star `n` (1–5) is filled for `value`: 1, 0.5 or 0, to the nearest half. */
function fill(n: number, value: number): number {
  const half = Math.round(value * 2) / 2;
  return half >= n ? 1 : half >= n - 0.5 ? 0.5 : 0;
}

function StarIcon({ amount, size, muted }: { amount: number; size: number; muted: string }) {
  const styles = useStyles(makeStyles);
  const theme = useTheme();
  return (
    <View style={{ width: size, height: size }}>
      <Star size={size} color={muted} fill="transparent" style={StyleSheet.absoluteFill} />
      {amount > 0 && (
        <View style={[styles.clip, { width: amount === 1 ? size : size / 2, height: size }]}>
          <Star size={size} color={theme.colors.crimsonGlow} fill={theme.colors.crimsonGlow} />
        </View>
      )}
    </View>
  );
}

/**
 * Five stars filled to `value`, in half stars (the site's Stars; an average
 * shows to the nearest half). Read-only unless `onChange` is given: then the
 * left half of a star picks n − 0.5 and the right half n, and screen readers
 * get one adjustable control that moves by half a star.
 */
export default function Stars({ value, size, onChange }: { value: number; size?: number; onChange?: (value: number) => void }) {
  const styles = useStyles(makeStyles);
  const theme = useTheme();
  if (!onChange) {
    const shown = size ?? 14;
    return (
      <View style={styles.row} accessibilityRole="image" accessibilityLabel={`5 üzerinden ${formatRating(value)}`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <StarIcon key={n} amount={fill(n, value)} size={shown} muted={alpha(theme.colors.textMuted, 0.4)} />
        ))}
      </View>
    );
  }

  const shown = size ?? 32;
  const change = (next: number) => onChange(Math.min(5, Math.max(RATING_STEP, next)));

  return (
    <View
      style={[styles.row, styles.input]}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel="Puan"
      accessibilityValue={{ text: value ? `${formatRating(value)} yıldız` : "Puan yok" }}
      accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
      onAccessibilityAction={(event) => change(value + (event.nativeEvent.actionName === "increment" ? RATING_STEP : -RATING_STEP))}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <View key={n} style={styles.star}>
          <StarIcon amount={fill(n, value)} size={shown} muted={alpha(theme.colors.textMuted, 0.5)} />
          <Pressable onPress={() => change(n - 0.5)} style={[styles.half, styles.left]} hitSlop={{ top: 6, bottom: 6 }} />
          <Pressable onPress={() => change(n)} style={[styles.half, styles.right]} hitSlop={{ top: 6, bottom: 6 }} />
        </View>
      ))}
    </View>
  );
}

const makeStyles = (t: Theme) => StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 2 },
  input: { gap: 6 },
  clip: { position: "absolute", left: 0, top: 0, overflow: "hidden" },
  star: { padding: 2 },
  half: { position: "absolute", top: 0, bottom: 0, width: "50%" },
  left: { left: 0 },
  right: { right: 0 },
});
