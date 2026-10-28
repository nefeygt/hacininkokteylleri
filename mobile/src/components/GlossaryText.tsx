import { Info } from "lucide-react-native";
import { useState } from "react";
import { StyleSheet, Text, View, type StyleProp, type TextStyle } from "react-native";
import { useArchive } from "@/lib/archive";
import { alpha, type Theme } from "@/lib/theme";
import { useStyles, useTheme } from "@/lib/theme-context";
import { useLocale } from "@/lib/i18n";

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Text with glossary terms ("Top up", "Şeker Şurubu") underlined. Tapping a
 * term opens its explanation under the line — the site's tooltip, in a form a
 * phone can show without a hover.
 */
export default function GlossaryText({ text, style }: { text: string; style?: StyleProp<TextStyle> }) {
  const { a } = useLocale();
  const styles = useStyles(makeStyles);
  const theme = useTheme();
  const glossary = useArchive().archive?.glossary ?? {};
  const [open, setOpen] = useState<string | null>(null);
  const terms = Object.keys(glossary);

  if (terms.length === 0) return <Text style={style}>{text}</Text>;

  const parts = text.split(new RegExp(`(${terms.map(escapeRegex).join("|")})`, "g"));
  return (
    <View style={styles.wrap}>
      <Text style={style}>
        {parts.map((part, i) =>
          terms.includes(part) ? (
            <Text
              key={i}
              style={styles.term}
              onPress={() => setOpen(open === part ? null : part)}
              accessibilityRole="button"
              accessibilityHint={a.glossary.showDefinition}
            >
              {part}
            </Text>
          ) : (
            part
          )
        )}
      </Text>
      {open && (
        <View style={styles.box}>
          <Info size={12} color={alpha(theme.colors.crimsonGlow, 0.6)} style={styles.icon} />
          <Text style={styles.definition}>
            <Text style={styles.definitionTerm}>{open}: </Text>
            {glossary[open]}
          </Text>
        </View>
      )}
    </View>
  );
}

const makeStyles = (t: Theme) => StyleSheet.create({
  wrap: { flexShrink: 1 },
  term: {
    color: t.colors.crimsonGlow,
    textDecorationLine: "underline",
    textDecorationStyle: "dashed",
    textDecorationColor: alpha(t.colors.crimsonGlow, 0.5),
  },
  box: {
    marginTop: 8,
    flexDirection: "row",
    gap: 6,
    borderWidth: 1,
    borderColor: t.colors.borderLight,
    backgroundColor: t.colors.bgElevated,
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  icon: { marginTop: 2 },
  definition: { flex: 1, fontFamily: t.fonts.sans, fontSize: 12, lineHeight: 18, color: t.colors.textSecondary },
  definitionTerm: { color: t.colors.crimsonGlow },
});
