import { GLASSES, glassKind } from "@shared/glasses";
import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { useLocale } from "@/lib/i18n";
import { alpha, type Theme } from "@/lib/theme";
import { useStyles, useTheme } from "@/lib/theme-context";
import GlassIcon from "./GlassIcon";
import { Mono } from "./Type";

/**
 * The glass as a grid of drawings (the site's GlassPicker). The value stays free text: a drawing writes the glass's
 * name in the language; "Other" opens a text field for a glass the list does not have (or an older "A / B").
 */
export default function GlassPicker({ value, onChange, maxLength }: { value: string; onChange: (value: string) => void; maxLength: number }) {
  const { t } = useLocale();
  const styles = useStyles(makeStyles);
  const theme = useTheme();
  const names = t.glasses as Record<string, string>;
  const kind = glassKind(value);
  // A value the drawings would rewrite ("Martini / Coupe", "Tiki") keeps its own words in the field.
  const [custom, setCustom] = useState(Boolean(value) && (!kind || (kind.name !== value && names[kind.id] !== value)));

  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={t.glassPicker.group}>
      <View style={styles.grid}>
        {GLASSES.map((g) => {
          const active = !custom && kind?.id === g.id;
          return (
            <Pressable
              key={g.id}
              onPress={() => {
                setCustom(false);
                onChange(active ? "" : names[g.id] ?? g.name);
              }}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              accessibilityLabel={names[g.id] ?? g.name}
              style={[styles.tile, active && styles.tileOn]}
            >
              <GlassIcon id={g.id} color={active ? theme.colors.crimsonGlow : theme.colors.textSecondary} />
              <Mono numberOfLines={2} style={[styles.name, active && styles.nameOn]}>
                {names[g.id] ?? g.name}
              </Mono>
            </Pressable>
          );
        })}
        <Pressable
          onPress={() => setCustom(true)}
          accessibilityRole="radio"
          accessibilityState={{ selected: custom }}
          accessibilityLabel={t.glassPicker.other}
          style={[styles.tile, styles.other, custom && styles.tileOn]}
        >
          <Mono style={[styles.dots, custom && styles.nameOn]}>…</Mono>
          <Mono style={[styles.name, custom && styles.nameOn]}>{t.glassPicker.other}</Mono>
        </Pressable>
      </View>
      {custom && (
        <TextInput
          value={value}
          onChangeText={onChange}
          maxLength={maxLength}
          placeholder={t.glassPicker.namePlaceholder}
          placeholderTextColor={theme.colors.textMuted}
          accessibilityLabel={t.glassPicker.namePlaceholder}
          autoFocus
          style={styles.input}
        />
      )}
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    grid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
    tile: {
      width: "23.5%",
      flexGrow: 1,
      minWidth: 70,
      alignItems: "center",
      gap: 4,
      borderWidth: 1,
      borderColor: t.colors.border,
      borderRadius: 4,
      paddingHorizontal: 4,
      paddingVertical: 8,
    },
    tileOn: { borderColor: t.colors.crimson, backgroundColor: alpha(t.colors.crimson, 0.15) },
    other: { justifyContent: "center" },
    name: { fontSize: 10, lineHeight: 13, textAlign: "center", color: t.colors.textSecondary },
    nameOn: { color: t.colors.crimsonGlow },
    dots: { fontSize: 20, lineHeight: 24, color: t.colors.textSecondary },
    input: {
      marginTop: 8,
      borderWidth: 1,
      borderColor: t.colors.border,
      backgroundColor: t.colors.bgPrimary,
      borderRadius: 4,
      paddingHorizontal: 12,
      paddingVertical: 10,
      color: t.colors.textPrimary,
      fontFamily: t.fonts.sans,
      fontSize: 15,
    },
  });
