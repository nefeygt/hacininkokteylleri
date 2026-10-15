import { formatAmount, formatLogDate, readRecipe } from "@shared/drink-log";
import { router } from "expo-router";
import { Globe, Lock, MessageCircle } from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";
import type { DrinkLog } from "@/lib/drink-logs";
import { colors, fonts } from "@/lib/theme";
import Avatar from "./Avatar";
import ReportButton from "./ReportButton";
import Stars from "./Stars";
import { Body, Mono } from "./Type";

/**
 * One drink log (the site's DrinkLogEntry): the cocktail as made, the date,
 * that evening's rating and the note. "own" adds the privacy badge and an edit
 * link; "public" adds "Bildir" for other members and a link to the log's
 * comments. The author is shown when the row carries one (the feed).
 */
export default function DrinkLogEntry({
  log,
  mode,
  commentCount,
  showCommentsLink = true,
}: {
  log: DrinkLog & { profiles?: { username: string; display_name: string; avatar_path: string | null } };
  mode: "own" | "public";
  commentCount?: number;
  showCommentsLink?: boolean;
}) {
  const recipe = readRecipe(log.recipe);
  const cocktail = log.cocktails?.is_published ? log.cocktails : null;
  const author = log.profiles;

  function openCocktail() {
    if (!cocktail) return;
    if (cocktail.author_id) router.push({ pathname: "/recipes/[slug]", params: { slug: cocktail.slug } });
    else router.push({ pathname: "/cocktail/[slug]", params: { slug: cocktail.slug } });
  }

  const commentsLabel = commentCount ? `${commentCount} yorum` : "Yorumlar";
  const comments = (
    <Pressable
      onPress={() => router.push({ pathname: "/log/[id]", params: { id: log.id } })}
      hitSlop={6}
      style={styles.comments}
      accessibilityRole="link"
      accessibilityLabel={commentsLabel}
    >
      <MessageCircle size={11} color={colors.textMuted} />
      <Mono style={styles.small}>{commentsLabel}</Mono>
    </Pressable>
  );

  return (
    <View style={[styles.card, log.hidden_at ? styles.hidden : null]}>
      {author && (
        <Pressable
          onPress={() => router.push({ pathname: "/u/[username]", params: { username: author.username } })}
          style={styles.author}
          accessibilityRole="link"
          accessibilityLabel={`${author.display_name} profili`}
        >
          <Avatar path={author.avatar_path} name={author.display_name} size={22} />
          <Body style={styles.authorName}>{author.display_name}</Body>
          <Mono style={styles.small}>@{author.username}</Mono>
        </Pressable>
      )}
      <View style={styles.head}>
        <Pressable onPress={openCocktail} disabled={!cocktail} accessibilityRole={cocktail ? "link" : undefined}>
          <Body style={styles.name}>{recipe.name}</Body>
        </Pressable>
        {log.rating !== null && <Stars value={log.rating} size={12} />}
        <Mono style={styles.date}>{formatLogDate(log.drunk_on)}</Mono>
      </View>

      {mode === "own" && (
        <View style={styles.ownRow}>
          <View style={styles.badge}>
            {log.is_public ? <Globe size={11} color={colors.textMuted} /> : <Lock size={11} color={colors.textMuted} />}
            <Mono style={styles.small}>{log.is_public ? "Herkese açık" : "Yalnızca sen"}</Mono>
          </View>
          <Pressable
            onPress={() => router.push({ pathname: "/logs/[id]", params: { id: log.id } })}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`${recipe.name} kaydını düzenle`}
          >
            <Mono style={styles.edit}>Düzenle</Mono>
          </Pressable>
        </View>
      )}

      <Mono style={styles.ingredients}>{recipe.ingredients.map((i) => `${i.name} ${formatAmount(i)}`).join(" · ")}</Mono>

      {log.note && <Body style={styles.note}>{log.note}</Body>}

      {mode === "own" && log.hidden_at && (
        <Mono style={styles.hiddenNote}>Bu kayıt yöneticiler tarafından gizlendi; yalnızca sen görüyorsun.</Mono>
      )}
      {mode === "own" && log.is_public && !log.hidden_at && <View style={styles.footer}>{comments}</View>}
      {mode === "public" && (
        <View style={styles.footer}>
          {showCommentsLink && comments}
          <ReportButton targetType="drink_log" targetId={log.id} ownerId={log.user_id} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
    borderRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  hidden: { opacity: 0.7 },
  author: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8, alignSelf: "flex-start" },
  authorName: { fontFamily: fonts.sansBold, fontSize: 12 },
  head: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", columnGap: 10, rowGap: 4 },
  name: { fontFamily: fonts.sansBold, fontSize: 15 },
  date: { fontSize: 10, color: colors.textMuted },
  ownRow: { marginTop: 6, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  badge: { flexDirection: "row", alignItems: "center", gap: 4 },
  small: { fontSize: 10, color: colors.textMuted },
  edit: { fontSize: 11, color: colors.crimsonGlow, textDecorationLine: "underline" },
  ingredients: { marginTop: 6, fontSize: 11, lineHeight: 17 },
  note: { marginTop: 8, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  hiddenNote: { marginTop: 8, fontSize: 11, color: colors.crimsonGlow },
  footer: { marginTop: 8, flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 16 },
  comments: { flexDirection: "row", alignItems: "center", gap: 4 },
});
