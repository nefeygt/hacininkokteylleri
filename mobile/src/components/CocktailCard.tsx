import { formatAverage } from "@shared/community";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Heart, Leaf, Star, Wine } from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";
import type { Cocktail } from "@/lib/content";
import { alpha, colors } from "@/lib/theme";
import { Heading, Label, Mono } from "./Type";

/** A recipe's poster, as in the site's archive grid. */
export default function CocktailCard({
  cocktail,
  favorite = false,
  onPress,
}: {
  cocktail: Cocktail;
  favorite?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={cocktail.name}
    >
      <View style={styles.poster}>
        {cocktail.imageUrl ? (
          <Image source={cocktail.imageUrl} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.placeholder, { backgroundColor: alpha(cocktail.color, 0.12) }]}>
            <Wine size={40} strokeWidth={1} color={alpha(colors.textMuted, 0.3)} />
          </View>
        )}
        <View style={[styles.strip, { backgroundColor: cocktail.color }]} />
        <LinearGradient colors={["transparent", colors.bgCard]} style={styles.vignette} />
        <View style={styles.badges}>
          {cocktail.vegan && (
            <View style={[styles.badge, { backgroundColor: colors.veganBg }]}>
              <Leaf size={12} color={colors.vegan} />
            </View>
          )}
          {favorite && (
            <View style={[styles.badge, { backgroundColor: "rgba(0,0,0,0.4)" }]}>
              <Heart size={12} color={colors.crimsonGlow} fill={colors.crimsonGlow} />
            </View>
          )}
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.meta}>
          <Label numberOfLines={1} style={styles.metaText}>
            {cocktail.baseAlcohol} · {cocktail.flavor}
          </Label>
          {cocktail.rating && (
            <View style={styles.rating} accessibilityLabel={`${cocktail.rating.count} değerlendirme`}>
              <Star size={12} color={colors.crimsonGlow} fill={colors.crimsonGlow} />
              <Mono style={styles.ratingText}>{formatAverage(cocktail.rating.average)}</Mono>
              <Mono style={styles.ratingCount}>({cocktail.rating.count})</Mono>
            </View>
          )}
        </View>
        <Heading style={styles.name}>{cocktail.name}</Heading>
        <Mono numberOfLines={2} style={styles.subtitle}>
          {cocktail.subtitle}
        </Mono>
        {cocktail.author && (
          <Mono numberOfLines={1} style={styles.author}>
            @{cocktail.author.username}
          </Mono>
        )}
        <View style={styles.tags}>
          {cocktail.tags.slice(0, 3).map((tag) => (
            <Label key={tag} style={styles.tag}>
              {tag}
            </Label>
          ))}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
    borderRadius: 2,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
  },
  pressed: { borderColor: colors.borderLight, opacity: 0.85 },
  poster: { aspectRatio: 16 / 9, width: "100%", backgroundColor: colors.bgElevated },
  placeholder: { alignItems: "center", justifyContent: "center" },
  strip: { position: "absolute", top: 0, left: 0, right: 0, height: 2 },
  vignette: { position: "absolute", left: 0, right: 0, bottom: 0, height: 64 },
  badges: { position: "absolute", top: 10, right: 10, gap: 6 },
  badge: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  body: { padding: 20 },
  meta: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 4 },
  metaText: { flexShrink: 1 },
  rating: { flexDirection: "row", alignItems: "center", gap: 4 },
  ratingText: { fontSize: 10, color: colors.textSecondary },
  ratingCount: { fontSize: 10, color: colors.textMuted },
  name: { marginBottom: 4 },
  subtitle: { fontSize: 12, color: colors.textMuted },
  author: { marginTop: 6, fontSize: 11 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 12 },
  tag: {
    fontSize: 9,
    letterSpacing: 1,
    backgroundColor: colors.bgElevated,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 2,
    overflow: "hidden",
  },
});
