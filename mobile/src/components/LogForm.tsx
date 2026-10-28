import { LOG_LIMITS, LOG_NOTE_MAX_LENGTH, unitChoices, unitLabel, type LogRecipe } from "@shared/drink-log";
import type { Dictionary } from "@shared/i18n/dictionaries";
import { ChevronDown, Lock, Pencil, Plus, X } from "lucide-react-native";
import { useState } from "react";
import { Keyboard, Pressable, StyleSheet, TextInput, View } from "react-native";
import type { Writer } from "@/lib/community";
import type { IngredientIcon } from "@/lib/content";
import { deleteDrinkLog, leave, saveDrinkLog } from "@/lib/drink-logs";
import { alpha, type Theme } from "@/lib/theme";
import { useStyles, useTheme } from "@/lib/theme-context";
import DateField from "./DateField";
import GlassPicker from "./GlassPicker";
import { Button, Checkbox, Field, Message } from "./Form";
import OptionSheet from "./OptionSheet";
import Stars from "./Stars";
import { Body, Label, Mono } from "./Type";
import { useLocale } from "@/lib/i18n";
import { format } from "@shared/i18n/format";

interface IngredientRow {
  key: number;
  name: string;
  amount: string; // as typed; "1,5" works too
  unit: string;
  icon: IngredientIcon;
}

/** The shared unit list (ADR-023); an older or house unit outside it is offered first. */
export function unitOptions(current: string, t: Dictionary) {
  return unitChoices(current).map((unit) => ({ value: unit, label: unitLabel(unit, 1, t) }));
}

export interface LogFormValues {
  cocktailId: string;
  drunkOn: string;
  recipe: LogRecipe;
  rating: number | null;
  note: string;
  isPublic: boolean;
}

let nextKey = 0;
const rowFrom = (i: LogRecipe["ingredients"][number]): IngredientRow => ({
  key: nextKey++,
  name: i.name,
  amount: String(i.amount).replace(".", ","),
  unit: i.unit,
  icon: i.icon,
});

/**
 * A drink log (the site's LogForm): starts from the recipe and lets the member
 * change it to what they actually made ("gin instead of vodka"). The snapshot
 * is saved with the log (ADR-014). Units come from a list; the steps stay as
 * they were unless the member unlocks them. `id` set = editing an existing
 * log. `onDone` runs after a save or delete.
 */
export default function LogForm({
  writer,
  initial,
  id,
  today,
  onDone,
}: {
  writer: Writer;
  initial: LogFormValues;
  id?: string;
  today: string;
  onDone: () => void;
}) {
  const { t, a } = useLocale();
  const styles = useStyles(makeStyles);
  const theme = useTheme();
  const originalSteps = initial.recipe.instructions.join("\n");
  const [drunkOn, setDrunkOn] = useState(initial.drunkOn);
  const [rows, setRows] = useState<IngredientRow[]>(() => initial.recipe.ingredients.map(rowFrom));
  const [steps, setSteps] = useState(originalSteps);
  const [editingSteps, setEditingSteps] = useState(false);
  const [unitFor, setUnitFor] = useState<number | null>(null);
  const [garnish, setGarnish] = useState(initial.recipe.garnish ?? "");
  const [glass, setGlass] = useState(initial.recipe.glass ?? "");
  const [rating, setRating] = useState<number | null>(initial.rating);
  const [note, setNote] = useState(initial.note);
  const [isPublic, setIsPublic] = useState(initial.isPublic);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [pending, setPending] = useState(false);

  function setRow(key: number, patch: Partial<IngredientRow>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  async function save() {
    Keyboard.dismiss();
    setError(null);
    const recipe = {
      name: initial.recipe.name,
      ingredients: rows.map((r) => ({
        name: r.name,
        amount: r.amount.trim() ? Number(r.amount.replace(",", ".")) : NaN,
        unit: r.unit,
        icon: r.icon,
      })),
      instructions: steps.split("\n"),
      garnish,
      glass,
    };
    setPending(true);
    const result = await saveDrinkLog(writer, { cocktailId: initial.cocktailId, drunkOn, recipe, rating, note, isPublic }, id);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    onDone();
  }

  async function remove() {
    if (!id) return;
    Keyboard.dismiss();
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    setError(null);
    setPending(true);
    const result = await deleteDrinkLog(writer, id);
    setPending(false);
    if (result.error) {
      setError(result.error);
      setConfirmingDelete(false);
      return;
    }
    onDone();
  }

  const stepLines = steps.split("\n").filter((line) => line.trim());

  return (
    <View style={styles.form}>
      <DateField value={drunkOn} today={today} onChange={setDrunkOn} />

      <View style={styles.group}>
        <Label style={styles.label}>{t.logForm.ingredientsLegend}</Label>
        <Mono style={styles.hint}>{t.logForm.ingredientsHint}</Mono>
        {rows.map((row) => (
          <View key={row.key} style={styles.row}>
            <TextInput
              value={row.name}
              onChangeText={(name) => setRow(row.key, { name })}
              maxLength={LOG_LIMITS.ingredientName}
              placeholder={t.logForm.ingredient}
              placeholderTextColor={theme.colors.textMuted}
              accessibilityLabel={t.logForm.ingredient}
              style={[styles.small, styles.grow]}
            />
            <TextInput
              value={row.amount}
              onChangeText={(amount) => setRow(row.key, { amount })}
              keyboardType="decimal-pad"
              placeholder="4"
              placeholderTextColor={theme.colors.textMuted}
              accessibilityLabel={t.logForm.amount}
              style={[styles.small, styles.amount]}
            />
            <Pressable
              onPress={() => {
                Keyboard.dismiss();
                setUnitFor(row.key);
              }}
              style={[styles.small, styles.unit]}
              accessibilityRole="button"
              accessibilityLabel={`${t.logForm.unit}: ${row.unit ? unitLabel(row.unit, Number(row.amount.replace(",", ".")) || 1, t) : a.logForm.unitNone}`}
            >
              <Mono numberOfLines={1} style={[styles.unitText, !row.unit && styles.placeholder]}>
                {row.unit ? unitLabel(row.unit, Number(row.amount.replace(",", ".")) || 1, t) : a.logForm.unitShort}
              </Mono>
              <ChevronDown size={12} color={theme.colors.textMuted} />
            </Pressable>
            <Pressable
              onPress={() => setRows((prev) => prev.filter((r) => r.key !== row.key))}
              disabled={rows.length === 1}
              hitSlop={6}
              style={[styles.remove, rows.length === 1 && styles.off]}
              accessibilityRole="button"
              accessibilityLabel={t.logForm.removeIngredient}
            >
              <X size={16} color={theme.colors.textMuted} />
            </Pressable>
          </View>
        ))}
        {rows.length < LOG_LIMITS.ingredients && (
          <Pressable
            onPress={() => setRows((prev) => [...prev, { key: nextKey++, name: "", amount: "", unit: "cl", icon: "shot" }])}
            hitSlop={6}
            style={styles.add}
            accessibilityRole="button"
            accessibilityLabel={t.logForm.addIngredient}
          >
            <Plus size={14} color={theme.colors.textMuted} />
            <Mono style={styles.addText}>{t.logForm.addIngredient}</Mono>
          </Pressable>
        )}
      </View>

      <View style={styles.group}>
        <View style={styles.stepsHead}>
          <Label style={styles.label}>{t.logForm.preparation}</Label>
          {editingSteps ? (
            <Pressable
              onPress={() => {
                setSteps(originalSteps);
                setEditingSteps(false);
              }}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={t.logForm.backToOriginal}
            >
              <Mono style={styles.link}>{t.logForm.backToOriginal}</Mono>
            </Pressable>
          ) : (
            <Pressable onPress={() => setEditingSteps(true)} hitSlop={8} style={styles.inline} accessibilityRole="button" accessibilityLabel={t.logForm.change}>
              <Pencil size={11} color={theme.colors.textMuted} />
              <Mono style={styles.link}>{t.logForm.change}</Mono>
            </Pressable>
          )}
        </View>
        {editingSteps ? (
          <>
            <TextInput
              value={steps}
              onChangeText={setSteps}
              multiline
              autoFocus
              accessibilityLabel={t.logForm.stepsLabel}
              style={[styles.stepsInput, styles.textarea]}
            />
            <Mono style={styles.hint}>{t.logForm.stepsHint}</Mono>
          </>
        ) : (
          <View style={styles.locked} accessible accessibilityLabel={format(a.logForm.stepsLocked, { steps: stepLines.join(". ") })}>
            <Lock size={12} color={theme.colors.textMuted} style={styles.lockIcon} />
            {stepLines.length ? (
              stepLines.map((line, i) => (
                <Body key={i} style={styles.lockedStep}>
                  {i + 1}. {line.trim()}
                </Body>
              ))
            ) : (
              <Mono style={styles.hint}>{t.logForm.noSteps}</Mono>
            )}
          </View>
        )}
      </View>

      <Field label={t.logForm.garnish} value={garnish} onChangeText={setGarnish} maxLength={LOG_LIMITS.garnish} />
      <View style={styles.group}>
        <Label style={styles.label}>{t.logForm.glass}</Label>
        <GlassPicker value={glass} onChange={setGlass} maxLength={LOG_LIMITS.glass} />
      </View>

      <View style={styles.group}>
        <Label style={styles.label}>{t.logForm.eveningRating}</Label>
        <View style={styles.ratingRow}>
          <Stars value={rating ?? 0} onChange={setRating} />
          {rating !== null && (
            <Pressable onPress={() => setRating(null)} hitSlop={8} accessibilityRole="button" accessibilityLabel={t.logForm.removeRating}>
              <Mono style={styles.link}>{t.imageField.remove}</Mono>
            </Pressable>
          )}
        </View>
        <Mono style={styles.hint}>{a.logForm.halfStarTip} {t.logForm.ratingHint}</Mono>
      </View>

      <Field
        label={t.logForm.note}
        value={note}
        onChangeText={setNote}
        maxLength={LOG_NOTE_MAX_LENGTH}
        multiline
        placeholder={t.logForm.notePlaceholder}
        style={styles.textarea}
      />

      <Checkbox checked={isPublic} onChange={setIsPublic} label={t.drinkLog.public}>
        <Mono style={styles.checkText}>{t.logForm.publicCheck}</Mono>
      </Checkbox>

      <OptionSheet
        title={t.logForm.unit}
        options={unitOptions(rows.find((r) => r.key === unitFor)?.unit ?? "", t)}
        current={rows.find((r) => r.key === unitFor)?.unit ?? null}
        onPick={(unit) => {
          if (unitFor !== null) setRow(unitFor, { unit });
          setUnitFor(null);
        }}
        onClose={() => setUnitFor(null)}
      />

      {error && <Message error>{error}</Message>}

      <Button title={id ? t.logForm.update : t.logForm.add} onPress={save} pending={pending} />
      <View style={styles.footer}>
        <Pressable onPress={leave} disabled={pending} hitSlop={8} accessibilityRole="button" accessibilityLabel={t.common.cancel}>
          <Mono style={styles.muted}>{t.common.cancel}</Mono>
        </Pressable>
        {id && (
          <Pressable
            onPress={remove}
            disabled={pending}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={confirmingDelete ? t.common.confirmDelete : t.logForm.deleteEntry}
          >
            <Mono style={[styles.underline, confirmingDelete ? styles.danger : styles.muted]}>
              {confirmingDelete ? t.common.confirmDelete : t.logForm.deleteEntry}
            </Mono>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const makeStyles = (t: Theme) => StyleSheet.create({
  form: { gap: 22 },
  group: { gap: 8 },
  label: { color: t.colors.textSecondary, fontSize: 11, letterSpacing: 1.5 },
  hint: { fontSize: 11, lineHeight: 16, color: t.colors.textMuted },
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
  small: {
    borderWidth: 1,
    borderColor: t.colors.border,
    backgroundColor: t.colors.bgPrimary,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 8,
    color: t.colors.textPrimary,
    fontFamily: t.fonts.mono,
    fontSize: 13,
  },
  grow: { flex: 1, minWidth: 0 },
  amount: { width: 52, textAlign: "right" },
  unit: { width: 116, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 4 },
  unitText: { flexShrink: 1, fontSize: 13, color: t.colors.textPrimary },
  placeholder: { color: t.colors.textMuted },
  remove: { width: 28, height: 32, alignItems: "center", justifyContent: "center" },
  add: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", marginTop: 4 },
  addText: { fontSize: 12, color: t.colors.textMuted },
  stepsHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  inline: { flexDirection: "row", alignItems: "center", gap: 4 },
  stepsInput: {
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
  locked: {
    gap: 6,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: t.colors.border,
    backgroundColor: alpha(t.colors.bgElevated, 0.35),
    borderRadius: 4,
    paddingLeft: 12,
    paddingRight: 30,
    paddingVertical: 10,
  },
  lockIcon: { position: "absolute", top: 10, right: 10 },
  lockedStep: { fontSize: 14, lineHeight: 20, color: t.colors.textMuted },
  textarea: { minHeight: 96, textAlignVertical: "top" },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  link: { fontSize: 11, color: t.colors.textMuted, textDecorationLine: "underline" },
  checkText: { fontSize: 12, lineHeight: 18 },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  muted: { fontSize: 12, color: t.colors.textMuted },
  underline: { textDecorationLine: "underline" },
  danger: { fontSize: 12, color: t.colors.crimsonGlow },
  off: { opacity: 0.3 },
});
