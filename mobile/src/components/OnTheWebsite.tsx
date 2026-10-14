import * as WebBrowser from "expo-web-browser";
import { Pressable, StyleSheet, View } from "react-native";
import { SITE_URL } from "@/lib/supabase";
import { colors } from "@/lib/theme";
import { Body, Heading, Label, Mono } from "./Type";

/**
 * A tab whose screens are still being built in M8: says so and opens the
 * same page on the website. Never shipped to the stores (ADR-020: full
 * parity before the first release).
 */
export default function OnTheWebsite({ eyebrow, title, text, path }: { eyebrow: string; title: string; text: string; path: string }) {
  return (
    <View style={styles.screen}>
      <Label style={styles.eyebrow}>{eyebrow}</Label>
      <Heading style={styles.title}>{title}</Heading>
      <Body style={styles.text}>{text}</Body>
      <Pressable onPress={() => WebBrowser.openBrowserAsync(`${SITE_URL}${path}`)} style={styles.button} accessibilityRole="link">
        <Mono style={styles.buttonText}>Sitede aç</Mono>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 24, justifyContent: "center", backgroundColor: colors.bgPrimary },
  eyebrow: { color: colors.crimsonGlow, letterSpacing: 2.5, marginBottom: 6 },
  title: { fontSize: 26, marginBottom: 12 },
  text: { color: colors.textSecondary, lineHeight: 22, marginBottom: 24 },
  button: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: colors.crimson,
    borderRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  buttonText: { color: colors.crimsonGlow },
});
