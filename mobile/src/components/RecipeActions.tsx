import { router, type Href } from "expo-router";
import { Heart, NotebookPen } from "lucide-react-native";
import { Pressable, StyleSheet } from "react-native";
import { askToSignIn } from "@/lib/after-sign-in";
import { useSession } from "@/lib/session";
import { alpha, type Theme } from "@/lib/theme";
import { useStyles, useTheme } from "@/lib/theme-context";
import { Mono } from "./Type";

/** The heart next to a recipe's name (the site's RecipeActions); a visitor without a profile goes to the Hesap tab. */
export function FavoriteButton({ on, onPress }: { on: boolean; onPress: () => void }) {
  const styles = useStyles(makeStyles);
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={[styles.heart, on && styles.heartOn]}
      accessibilityRole="button"
      accessibilityLabel={on ? "Favorilerden çıkar" : "Favorilere ekle"}
      accessibilityState={{ selected: on }}
    >
      <Heart size={16} color={on ? theme.colors.crimsonGlow : theme.colors.textMuted} fill={on ? theme.colors.crimsonGlow : "transparent"} />
    </Pressable>
  );
}

/**
 * "Günlüğe ekle": the drink log form, started from this recipe. A visitor signs
 * in first and comes back to `from` (ADR-022), then taps again.
 */
export function LogButton({ slug, from }: { slug: string; from: Href }) {
  const styles = useStyles(makeStyles);
  const theme = useTheme();
  const session = useSession();
  return (
    <Pressable
      onPress={() => {
        if (session.state === "ok") router.push({ pathname: "/logs/new", params: { cocktail: slug } });
        else askToSignIn(from);
      }}
      hitSlop={6}
      style={styles.log}
      accessibilityRole="button"
      accessibilityLabel="Günlüğe ekle"
    >
      <NotebookPen size={13} color={theme.colors.textMuted} />
      <Mono style={styles.logText}>Günlüğe ekle</Mono>
    </Pressable>
  );
}

const makeStyles = (t: Theme) => StyleSheet.create({
  heart: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: t.colors.bgElevated },
  heartOn: { backgroundColor: alpha(t.colors.crimson, 0.2) },
  log: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    marginTop: 10,
    height: 30,
    borderRadius: 15,
    paddingHorizontal: 12,
    backgroundColor: t.colors.bgElevated,
  },
  logText: { fontSize: 11, color: t.colors.textMuted },
});
