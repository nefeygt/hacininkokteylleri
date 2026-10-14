import { Wine } from "lucide-react-native";
import { StyleSheet, View } from "react-native";
import type { Cocktail } from "@/lib/content";
import { alpha, colors, fonts } from "@/lib/theme";
import GlossaryText from "./GlossaryText";
import { Label, Mono } from "./Type";
import VisualQuantity from "./VisualQuantity";

/**
 * The prescription itself: ingredients, steps, garnish and note — one renderer
 * for house and members' recipes, as on the site (ADR-014).
 */
export default function RecipeDetails({ cocktail }: { cocktail: Cocktail }) {
  return (
    <View>
      <View style={styles.divider}>
        <Mono style={styles.rx}>℞</Mono>
        <View style={styles.rule} />
      </View>

      <View style={styles.section}>
        <Label style={styles.sectionTitle}>Malzemeler</Label>
        {cocktail.ingredients.map((ing, i) => (
          <View key={i} style={[styles.ingredient, i < cocktail.ingredients.length - 1 && styles.ingredientRule]}>
            <View style={styles.ingredientName}>
              <Mono style={styles.index}>{String(i + 1).padStart(2, "0")}</Mono>
              <GlossaryText text={ing.name} style={styles.prescription} />
            </View>
            <VisualQuantity ingredient={ing} />
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Label style={styles.sectionTitle}>Hazırlanışı</Label>
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
          <Mono style={styles.prescription}>
            <Mono style={styles.garnishLabel}>SÜSLEME: </Mono>
            <Mono style={styles.stepText}>{cocktail.garnish}</Mono>
          </Mono>
        </View>
      ) : null}

      {cocktail.note ? (
        <View style={styles.note}>
          <Wine size={16} strokeWidth={1.5} color={alpha(colors.crimsonGlow, 0.6)} />
          <Mono style={styles.noteText}>{cocktail.note}</Mono>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  divider: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 24 },
  rx: { fontSize: 22, color: colors.crimsonGlow },
  rule: { flex: 1, height: 1, backgroundColor: colors.border },
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
  ingredientRule: { borderBottomWidth: 1, borderBottomColor: alpha("#2a2a2a", 0.5) },
  ingredientName: { flexDirection: "row", alignItems: "center", gap: 12, flexShrink: 1 },
  index: { fontSize: 10, color: colors.textMuted },
  prescription: { fontFamily: fonts.mono, fontSize: 14, lineHeight: 21, color: colors.textPrimary },
  step: { flexDirection: "row", gap: 12, marginBottom: 12 },
  stepNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: alpha(colors.crimson, 0.15),
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  stepNumberText: { fontSize: 10, color: colors.crimsonGlow },
  stepText: { color: colors.textSecondary },
  garnish: { marginBottom: 24, borderRadius: 4, backgroundColor: alpha(colors.bgElevated, 0.5), paddingHorizontal: 16, paddingVertical: 12 },
  garnishLabel: { fontSize: 10, letterSpacing: 1, color: colors.textMuted },
  note: { flexDirection: "row", gap: 12, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 24 },
  noteText: { flex: 1, fontFamily: fonts.monoItalic, fontSize: 12, lineHeight: 19, color: colors.textMuted },
});
