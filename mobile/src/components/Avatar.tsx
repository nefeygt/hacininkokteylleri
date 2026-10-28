import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";
import { avatarUrl } from "@/lib/supabase";
import { type Theme } from "@/lib/theme";
import { useStyles } from "@/lib/theme-context";
import { useLocale } from "@/lib/i18n";
import { upperCase } from "./Type";

/** A member's picture, or the first letter of their name when they have none (the site's Avatar). */
export default function Avatar({ path, name, size }: { path: string | null | undefined; name: string; size: number }) {
  const styles = useStyles(makeStyles);
  const { locale } = useLocale();
  const url = avatarUrl(path);
  const shape = { width: size, height: size, borderRadius: size / 2 };

  if (url) return <Image source={url} style={[styles.frame, shape]} contentFit="cover" accessibilityIgnoresInvertColors />;

  return (
    <View style={[styles.frame, styles.initial, shape]}>
      <Text style={[styles.letter, { fontSize: size * 0.4 }]}>{upperCase(name.trim().charAt(0), locale) || "?"}</Text>
    </View>
  );
}

const makeStyles = (t: Theme) => StyleSheet.create({
  frame: { borderWidth: 1, borderColor: t.colors.border, backgroundColor: t.colors.bgElevated },
  initial: { alignItems: "center", justifyContent: "center" },
  letter: { fontFamily: t.fonts.mono, color: t.colors.textMuted },
});
