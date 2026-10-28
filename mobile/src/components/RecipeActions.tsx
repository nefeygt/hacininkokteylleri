import { router, type Href } from "expo-router";
import { localePath } from "@shared/i18n/locales";
import { Heart, NotebookPen, Share2 } from "lucide-react-native";
import { Platform, Pressable, Share, StyleSheet, View } from "react-native";
import { askToSignIn } from "@/lib/after-sign-in";
import { useSession } from "@/lib/session";
import { SITE_URL } from "@/lib/supabase";
import { alpha, type Theme } from "@/lib/theme";
import { useStyles, useTheme } from "@/lib/theme-context";
import { Mono } from "./Type";
import { useLocale } from "@/lib/i18n";

/** The heart next to a recipe's name (the site's RecipeActions); a visitor without a profile goes to the Hesap tab. */
export function FavoriteButton({ on, onPress }: { on: boolean; onPress: () => void }) {
  const { t } = useLocale();
  const styles = useStyles(makeStyles);
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={[styles.heart, on && styles.heartOn]}
      accessibilityRole="button"
      accessibilityLabel={on ? t.cocktails.removeFromFavorites : t.cocktails.addToFavorites}
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
  const { t } = useLocale();
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
      accessibilityLabel={t.cocktails.addToLog}
    >
      <NotebookPen size={13} color={theme.colors.textMuted} />
      <Mono style={styles.logText}>{t.cocktails.addToLog}</Mono>
    </Pressable>
  );
}

/**
 * "Share": the phone's share sheet with the recipe's page on the site (`/cocktails/{slug}` for a house recipe,
 * `/recipes/{slug}` for a member's), in the language shown. Where there is no share sheet (the web preview) it does nothing.
 */
export function ShareButton({ name, path }: { name: string; path: string }) {
  const { t, locale } = useLocale();
  const styles = useStyles(makeStyles);
  const theme = useTheme();
  const share = async () => {
    const url = `${SITE_URL}${localePath(locale, path)}`;
    try {
      // iOS shows the message and the link as two items; Android only has the message.
      await Share.share(Platform.OS === "ios" ? { message: name, url } : { message: `${name}
${url}` });
    } catch {
      // A cancelled or unsupported share sheet is not an error worth showing.
    }
  };
  return (
    <Pressable onPress={share} hitSlop={6} style={styles.log} accessibilityRole="button" accessibilityLabel={t.cocktails.shareTitle}>
      <Share2 size={13} color={theme.colors.textMuted} />
      <Mono style={styles.logText}>{t.cocktails.share}</Mono>
    </Pressable>
  );
}

/** The recipe's two pills side by side: the drink log and share. */
export function RecipeButtons({ children }: { children: React.ReactNode }) {
  const styles = useStyles(makeStyles);
  return <View style={styles.pills}>{children}</View>;
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
  pills: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 },
});
