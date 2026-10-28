import { THEMES } from "@shared/themes";
import { Check } from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";
import { type Theme } from "@/lib/theme";
import { useStyles, useTheme } from "@/lib/theme-context";
import { Body, Label, Mono } from "./Type";

/** The six themes as rows (the site's theme switcher): two swatch colours, the name, a hint, the current one marked. */
export default function ThemePicker() {
  const styles = useStyles(makeStyles);
  const theme = useTheme();
  return (
    <View style={styles.section}>
      <Label style={styles.title}>Görünüm</Label>
      <View accessibilityRole="radiogroup" style={styles.list}>
        {THEMES.map((option) => {
          const current = option.id === theme.id;
          return (
            <Pressable
              key={option.id}
              onPress={() => theme.setTheme(option.id)}
              accessibilityRole="radio"
              accessibilityState={{ selected: current }}
              accessibilityLabel={`${option.name}. ${option.hint}`}
              style={[styles.row, current && styles.rowOn]}
            >
              <View style={styles.swatch}>
                <View style={[styles.half, { backgroundColor: option.swatch[0] }]} />
                <View style={[styles.half, { backgroundColor: option.swatch[1] }]} />
              </View>
              <View style={styles.text}>
                <Body style={styles.name}>{option.name}</Body>
                <Mono style={styles.hint}>{option.hint}</Mono>
              </View>
              {current && <Check size={16} color={theme.colors.crimsonGlow} strokeWidth={2.5} />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    section: { gap: 12 },
    title: { color: t.colors.textMuted },
    list: { gap: 8 },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      borderWidth: 1,
      borderColor: t.colors.border,
      backgroundColor: t.colors.bgCard,
      borderRadius: 4,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    rowOn: { borderColor: t.colors.crimsonGlow },
    swatch: {
      flexDirection: "row",
      width: 36,
      height: 24,
      borderRadius: 4,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: t.colors.borderLight,
    },
    half: { flex: 1 },
    text: { flex: 1, gap: 2 },
    name: { fontSize: 15 },
    hint: { fontSize: 11, color: t.colors.textMuted },
  });
