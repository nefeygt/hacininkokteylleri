import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";
import { avatarUrl } from "@/lib/supabase";
import { colors, fonts } from "@/lib/theme";
import { upperTr } from "./Type";

/** A member's picture, or the first letter of their name when they have none (the site's Avatar). */
export default function Avatar({ path, name, size }: { path: string | null | undefined; name: string; size: number }) {
  const url = avatarUrl(path);
  const shape = { width: size, height: size, borderRadius: size / 2 };

  if (url) return <Image source={url} style={[styles.frame, shape]} contentFit="cover" accessibilityIgnoresInvertColors />;

  return (
    <View style={[styles.frame, styles.initial, shape]}>
      <Text style={[styles.letter, { fontSize: size * 0.4 }]}>{upperTr(name.trim().charAt(0)) || "?"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bgElevated },
  initial: { alignItems: "center", justifyContent: "center" },
  letter: { fontFamily: fonts.mono, color: colors.textMuted },
});
