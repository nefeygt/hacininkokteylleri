import { Wine } from "lucide-react-native";
import { StyleSheet, View } from "react-native";
import type { Cocktail } from "@/lib/content";
import { alpha, type Theme } from "@/lib/theme";
import { useStyles, useTheme } from "@/lib/theme-context";
import GlossaryText from "./GlossaryText";
import { formatAmount } from "@shared/drink-log";
import { Body, Label, Mono, upperCase } from "./Type";
import VisualQuantity from "./VisualQuantity";
import { useLocale } from "@/lib/i18n";

/**
 * The prescription itself: ingredients, steps, garnish and note — one renderer
 * for house and members' recipes, as on the site (ADR-014).
 */
export default function RecipeDetails({ cocktail }: { cocktail: Cocktail }) {
  const { t, locale } = useLocale();
  const styles = useStyles(makeStyles);
  const theme = useTheme();
  return (
    <View>
      <View style={styles.divider}>
        <Mono style={styles.rx}>℞</Mono>
        <View style={styles.rule} />
      </View>

      <View style={styles.section}>
        <Label style={styles.sectionTitle}>{t.cocktails.ingredients}</Label>
        {cocktail.ingredients.map((ing, i) => (
          <View key={i} style={[styles.ingredient, i < cocktail.ingredients.length - 1 && styles.ingredientRule]}>
            <View style={styles.ingredientName}>
              <Mono style={styles.index}>{String(i + 1).padStart(2, "0")}</Mono>
              <GlossaryText text={ing.name} style={styles.prescription} />
            </View>
            <VisualQuantity ingredient={ing} label={formatAmount(ing, locale, t)} />
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Label style={styles.sectionTitle}>{t.cocktails.preparation}</Label>
        {cocktail.instructions.map((step, i) => (
          <View key={i} style={styles.step}>
            <View style={styles.stepNumber}>
              <Mono style={styles.stepNumberText}>{i + 1}</Mono>
            </View>
            <GlossaryText text={step} style={[styles.prescription, styles.stepText]} />
          </View>
        ))}
      </View>

      {cocktail.garnish ? (
        <View style={styles.garnish}>
          <Body style={styles.prescription}>
            <Mono style={styles.garnishLabel}>{upperCase(t.cocktails.garnish, locale)} </Mono>
            <Body style={styles.stepText}>{cocktail.garnish}</Body>
          </Body>
        </View>
      ) : null}

      {cocktail.note ? (
        <View style={styles.note}>
          <Wine size={16} strokeWidth={1.5} color={alpha(theme.colors.crimsonGlow, 0.6)} />
          <Body style={styles.noteText}>{cocktail.note}</Body>
        </View>
      ) : null}
    </View>
  );
}

const makeStyles = (t: Theme) => StyleSheet.create({
  divider: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 24 },
  rx: { fontSize: 22, color: t.colors.crimsonGlow },
  rule: { flex: 1, height: 1, backgroundColor: t.colors.border },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 12, letterSpacing: 1.8, marginBottom: 16 },
  ingredient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingBottom: 12,
    marginBottom: 12,
  },
  ingredientRule: { borderBottomWidth: 1, borderBottomColor: alpha(t.colors.border, 0.5) },
  ingredientName: { flexDirection: "row", alignItems: "center", gap: 12, flexShrink: 1 },
  index: { fontSize: 10, color: t.colors.textMuted },
  prescription: { fontFamily: t.fonts.sans, fontSize: 15, lineHeight: 21, color: t.colors.textPrimary },
  step: { flexDirection: "row", gap: 12, marginBottom: 12 },
  stepNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: alpha(t.colors.crimson, 0.15),
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  stepNumberText: { fontSize: 10, color: t.colors.crimsonGlow },
  stepText: { color: t.colors.textSecondary },
  garnish: { marginBottom: 24, borderRadius: 4, backgroundColor: alpha(t.colors.bgElevated, 0.5), paddingHorizontal: 16, paddingVertical: 12 },
  garnishLabel: { fontSize: 10, letterSpacing: 1, color: t.colors.textMuted },
  note: { flexDirection: "row", gap: 12, borderTopWidth: 1, borderTopColor: t.colors.border, paddingTop: 24 },
  noteText: { flex: 1, fontFamily: t.fonts.sans, fontSize: 13, lineHeight: 20, color: t.colors.textMuted },
});
