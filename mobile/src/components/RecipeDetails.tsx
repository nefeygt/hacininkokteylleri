import AsyncStorage from "@react-native-async-storage/async-storage";
import { unitLabel } from "@shared/drink-log";
import { format } from "@shared/i18n/format";
import { SERVINGS_MAX, VOLUME_UNITS, VOLUME_UNIT_KEY, convertAmount, formatOunces, isConvertibleUnit, scaleAmount, type VolumeUnit } from "@shared/recipe";
import { Minus, Plus, Wine } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import type { Cocktail, Ingredient } from "@/lib/content";
import { alpha, type Theme } from "@/lib/theme";
import { useStyles, useTheme } from "@/lib/theme-context";
import GlossaryText from "./GlossaryText";
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
  const [servings, setServings] = useState(1);
  const [volumeUnit, setVolumeUnit] = useVolumeUnit();
  const hasVolumes = cocktail.ingredients.some((ing) => isConvertibleUnit(ing.unit));
  return (
    <View>
      <View style={styles.divider}>
        <Mono style={styles.rx}>℞</Mono>
        <View style={styles.rule} />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <Label style={styles.sectionTitle}>{t.cocktails.ingredients}</Label>
          <View style={styles.controls}>
            {hasVolumes && (
              <View accessibilityRole="radiogroup" accessibilityLabel={t.cocktails.volumeUnit} style={styles.segmented}>
                {VOLUME_UNITS.map((unit) => (
                  <Pressable
                    key={unit}
                    onPress={() => setVolumeUnit(unit)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: volumeUnit === unit }}
                    style={[styles.segment, volumeUnit === unit && styles.segmentOn]}
                  >
                    <Mono style={[styles.segmentText, volumeUnit === unit && styles.segmentTextOn]}>{unit}</Mono>
                  </Pressable>
                ))}
              </View>
            )}
            <View style={styles.servings}>
              <Mono style={styles.servingsLabel}>{t.cocktails.servings}</Mono>
              <Pressable
                onPress={() => setServings(servings - 1)}
                disabled={servings <= 1}
                accessibilityRole="button"
                accessibilityLabel={t.cocktails.servingsLess}
                hitSlop={6}
                style={[styles.stepper, servings <= 1 && styles.off]}
              >
                <Minus size={12} color={theme.colors.textSecondary} />
              </Pressable>
              <Mono style={styles.servingsCount} accessibilityLiveRegion="polite">
                {servings}
              </Mono>
              <Pressable
                onPress={() => setServings(servings + 1)}
                disabled={servings >= SERVINGS_MAX}
                accessibilityRole="button"
                accessibilityLabel={t.cocktails.servingsMore}
                hitSlop={6}
                style={[styles.stepper, servings >= SERVINGS_MAX && styles.off]}
              >
                <Plus size={12} color={theme.colors.textSecondary} />
              </Pressable>
            </View>
          </View>
        </View>
        {cocktail.ingredients.map((ing, i) => (
          <View key={i} style={[styles.ingredient, i < cocktail.ingredients.length - 1 && styles.ingredientRule]}>
            <View style={styles.ingredientName}>
              <Mono style={styles.index}>{String(i + 1).padStart(2, "0")}</Mono>
              <GlossaryText text={ing.name} style={styles.prescription} />
            </View>
            <Quantity ingredient={ing} servings={servings} volumeUnit={volumeUnit} />
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

/** One amount, scaled for the glasses and shown in the chosen volume unit; ounces read "1½ oz" (as on the site). */
function Quantity({ ingredient, servings, volumeUnit }: { ingredient: Ingredient; servings: number; volumeUnit: VolumeUnit }) {
  const { t } = useLocale();
  const shown = convertAmount(scaleAmount(ingredient.amount, servings), ingredient.unit, volumeUnit);
  const translated = unitLabel(shown.unit, shown.amount, t);
  const label = shown.unit !== ingredient.unit ? `${formatOunces(shown.amount)} oz` : `${shown.amount} ${translated}`;
  return <VisualQuantity ingredient={{ ...ingredient, ...shown }} label={label} />;
}

/** The cl/oz choice, remembered on the phone under the site's key; "cl" until it is read. */
function useVolumeUnit(): [VolumeUnit, (unit: VolumeUnit) => void] {
  const [unit, setUnit] = useState<VolumeUnit>("cl");
  useEffect(() => {
    AsyncStorage.getItem(VOLUME_UNIT_KEY)
      .then((stored) => {
        if (stored === "oz") setUnit("oz");
      })
      .catch(() => {});
  }, []);
  const choose = (next: VolumeUnit) => {
    setUnit(next);
    AsyncStorage.setItem(VOLUME_UNIT_KEY, next).catch(() => {});
  };
  return [unit, choose];
}

const makeStyles = (t: Theme) => StyleSheet.create({
  divider: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 24 },
  rx: { fontSize: 22, color: t.colors.crimsonGlow },
  rule: { flex: 1, height: 1, backgroundColor: t.colors.border },
  section: { marginBottom: 32 },
  sectionHead: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16 },
  sectionTitle: { fontSize: 12, letterSpacing: 1.8 },
  controls: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 12 },
  segmented: { flexDirection: "row", borderRadius: 999, backgroundColor: t.colors.bgElevated, padding: 2 },
  segment: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  segmentOn: { backgroundColor: alpha(t.colors.crimson, 0.2) },
  segmentText: { fontSize: 11, color: t.colors.textSecondary },
  segmentTextOn: { color: t.colors.crimsonGlow },
  servings: { flexDirection: "row", alignItems: "center", gap: 8 },
  servingsLabel: { fontSize: 11, color: t.colors.textMuted },
  servingsCount: { width: 16, textAlign: "center", fontSize: 14, color: t.colors.textPrimary },
  stepper: { width: 24, height: 24, borderRadius: 12, backgroundColor: t.colors.bgElevated, alignItems: "center", justifyContent: "center" },
  off: { opacity: 0.3 },
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
