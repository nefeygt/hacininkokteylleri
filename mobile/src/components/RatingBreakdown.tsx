import { formatRating, ratingBreakdown } from "@shared/community";
import { format } from "@shared/i18n/format";
import { Star } from "lucide-react-native";
import { StyleSheet, View } from "react-native";
import type { Rating } from "@/lib/content";
import { useLocale } from "@/lib/i18n";
import { type Theme } from "@/lib/theme";
import { useStyles, useTheme } from "@/lib/theme-context";

/** How the reviews spread over the half stars, Letterboxd-style: ten bars from ½ to 5 (the site's RatingBreakdown). */
export default function RatingBreakdown({ rating }: { rating: Rating }) {
  const { t, locale } = useLocale();
  const styles = useStyles(makeStyles);
  const theme = useTheme();
  if (!rating.halfStars || rating.count === 0) return null;
  const bars = ratingBreakdown(rating.halfStars);
  const summary = bars
    .filter((b) => b.count > 0)
    .map((b) => format(t.cocktails.starsCount, { rating: formatRating(b.rating, locale), n: b.count }))
    .join(", ");

  return (
    <View accessible accessibilityRole="image" accessibilityLabel={format(t.cocktails.breakdown, { summary })} style={styles.figure}>
      <Star size={12} color={theme.colors.crimsonGlow} fill={theme.colors.crimsonGlow} />
      <View style={styles.bars}>
        {bars.map((b) => (
          <View key={b.rating} style={styles.slot}>
            <View style={[styles.bar, b.count > 0 ? styles.barOn : styles.barOff, { height: b.count > 0 ? `${Math.max(b.share * 100, 6)}%` : 2 }]} />
          </View>
        ))}
      </View>
      <View style={styles.five}>
        {[0, 1, 2, 3, 4].map((i) => (
          <Star key={i} size={10} color={theme.colors.crimsonGlow} fill={theme.colors.crimsonGlow} />
        ))}
      </View>
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    figure: { flexDirection: "row", alignItems: "flex-end", gap: 12, marginBottom: 20 },
    bars: { flex: 1, height: 48, flexDirection: "row", alignItems: "flex-end", gap: 2 },
    slot: { flex: 1, height: "100%", justifyContent: "flex-end" },
    bar: { width: "100%", borderTopLeftRadius: 2, borderTopRightRadius: 2 },
    barOn: { backgroundColor: t.colors.textMuted },
    barOff: { backgroundColor: t.colors.border },
    five: { flexDirection: "row", gap: 1, marginBottom: 2 },
  });
