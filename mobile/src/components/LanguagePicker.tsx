import { LOCALE_NAMES, PUBLISHED_LOCALES } from "@shared/i18n/locales";
import { Check } from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";
import { useLocale } from "@/lib/i18n";
import { type Theme } from "@/lib/theme";
import { useStyles, useTheme } from "@/lib/theme-context";
import { Body, Label } from "./Type";

/** The site's language switcher as rows, each language in its own words; the choice is kept on the phone and, signed in, in the account. */
export default function LanguagePicker() {
  const { t, locale, setLocale } = useLocale();
  const styles = useStyles(makeStyles);
  const theme = useTheme();
  return (
    <View style={styles.section}>
      <Label style={styles.title}>{t.nav.language}</Label>
      <View accessibilityRole="radiogroup" style={styles.list}>
        {PUBLISHED_LOCALES.map((option) => {
          const current = option === locale;
          return (
            <Pressable
              key={option}
              onPress={() => setLocale(option)}
              accessibilityRole="radio"
              accessibilityState={{ selected: current }}
              style={[styles.row, current && styles.rowOn]}
            >
              <Body style={styles.name}>{LOCALE_NAMES[option]}</Body>
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
      justifyContent: "space-between",
      borderWidth: 1,
      borderColor: t.colors.border,
      backgroundColor: t.colors.bgCard,
      borderRadius: 4,
      paddingHorizontal: 12,
      paddingVertical: 12,
    },
    rowOn: { borderColor: t.colors.crimsonGlow },
    name: { fontSize: 15 },
  });
