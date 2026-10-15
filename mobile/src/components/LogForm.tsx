import { LOG_LIMITS, LOG_NOTE_MAX_LENGTH, formatLogDate, type LogRecipe } from "@shared/drink-log";
import { router } from "expo-router";
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react-native";
import { useState } from "react";
import { Keyboard, Pressable, StyleSheet, TextInput, View } from "react-native";
import type { Writer } from "@/lib/community";
import type { IngredientIcon } from "@/lib/content";
import { deleteDrinkLog, saveDrinkLog, shiftDate } from "@/lib/drink-logs";
import { alpha, colors, fonts } from "@/lib/theme";
import { Button, Checkbox, Field, Message } from "./Form";
import Stars from "./Stars";
import { Label, Mono } from "./Type";

interface IngredientRow {
  key: number;
  name: string;
  amount: string; // as typed; "1,5" works too
  unit: string;
  icon: IngredientIcon;
}

export interface LogFormValues {
  cocktailId: string;
  drunkOn: string;
  recipe: LogRecipe;
  rating: number | null;
  note: string;
  isPublic: boolean;
}

const EARLIEST = "2000-01-01";

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
 * is saved with the log (ADR-014). `id` set = editing an existing log.
 * `onDone` runs after a save or delete.
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
  const [drunkOn, setDrunkOn] = useState(initial.drunkOn);
  const [rows, setRows] = useState<IngredientRow[]>(() => initial.recipe.ingredients.map(rowFrom));
  const [steps, setSteps] = useState(initial.recipe.instructions.join("\n"));
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

  return (
    <View style={styles.form}>
      <DateField value={drunkOn} today={today} onChange={setDrunkOn} />

      <View style={styles.group}>
        <Label style={styles.label}>Malzemeler — yaptığın gibi</Label>
        <Mono style={styles.hint}>Tarifi değiştirdiysen burada değiştir: votka yerine cin, daha az şurup…</Mono>
        {rows.map((row) => (
          <View key={row.key} style={styles.row}>
            <TextInput
              value={row.name}
              onChangeText={(name) => setRow(row.key, { name })}
              maxLength={LOG_LIMITS.ingredientName}
              placeholder="Malzeme"
              placeholderTextColor={colors.textMuted}
              accessibilityLabel="Malzeme"
              style={[styles.small, styles.grow]}
            />
            <TextInput
              value={row.amount}
              onChangeText={(amount) => setRow(row.key, { amount })}
              keyboardType="decimal-pad"
              placeholder="4"
              placeholderTextColor={colors.textMuted}
              accessibilityLabel="Miktar"
              style={[styles.small, styles.amount]}
            />
            <TextInput
              value={row.unit}
              onChangeText={(unit) => setRow(row.key, { unit })}
              maxLength={LOG_LIMITS.unit}
              placeholder="cl"
              placeholderTextColor={colors.textMuted}
              accessibilityLabel="Birim"
              autoCapitalize="none"
              style={[styles.small, styles.unit]}
            />
            <Pressable
              onPress={() => setRows((prev) => prev.filter((r) => r.key !== row.key))}
              disabled={rows.length === 1}
              hitSlop={6}
              style={[styles.remove, rows.length === 1 && styles.off]}
              accessibilityRole="button"
              accessibilityLabel="Malzemeyi çıkar"
            >
              <X size={16} color={colors.textMuted} />
            </Pressable>
          </View>
        ))}
        {rows.length < LOG_LIMITS.ingredients && (
          <Pressable
            onPress={() => setRows((prev) => [...prev, { key: nextKey++, name: "", amount: "", unit: "cl", icon: "shot" }])}
            hitSlop={6}
            style={styles.add}
            accessibilityRole="button"
            accessibilityLabel="Malzeme ekle"
          >
            <Plus size={14} color={colors.textMuted} />
            <Mono style={styles.addText}>Malzeme ekle</Mono>
          </Pressable>
        )}
      </View>

      <Field label="Hazırlanışı — her satır bir adım" value={steps} onChangeText={setSteps} multiline style={styles.textarea} />
      <Field label="Süsleme" value={garnish} onChangeText={setGarnish} maxLength={LOG_LIMITS.garnish} />
      <Field label="Bardak" value={glass} onChangeText={setGlass} maxLength={LOG_LIMITS.glass} />

      <View style={styles.group}>
        <Label style={styles.label}>O akşamın puanı (isteğe bağlı)</Label>
        <View style={styles.ratingRow}>
          <Stars value={rating ?? 0} size={22} onChange={setRating} />
          {rating !== null && (
            <Pressable onPress={() => setRating(null)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Puanı kaldır">
              <Mono style={styles.link}>Puanı kaldır</Mono>
            </Pressable>
          )}
        </View>
        <Mono style={styles.hint}>Bu puan yalnızca bu kayda ait; kokteylin ortalamasına sayılmaz.</Mono>
      </View>

      <Field
        label="Not (isteğe bağlı)"
        value={note}
        onChangeText={setNote}
        maxLength={LOG_NOTE_MAX_LENGTH}
        multiline
        placeholder="Nerede, kiminle, nasıldı?"
        style={styles.textarea}
      />

      <Checkbox checked={isPublic} onChange={setIsPublic} label="Herkese açık">
        <Mono style={styles.checkText}>Herkese açık — profilinde görünsün. İşaretlemezsen yalnızca sen görürsün.</Mono>
      </Checkbox>

      {error && <Message error>{error}</Message>}

      <Button title={id ? "Kaydı güncelle" : "Günlüğe ekle"} onPress={save} pending={pending} />
      <View style={styles.footer}>
        <Pressable onPress={() => router.back()} disabled={pending} hitSlop={8} accessibilityRole="button" accessibilityLabel="Vazgeç">
          <Mono style={styles.muted}>Vazgeç</Mono>
        </Pressable>
        {id && (
          <Pressable
            onPress={remove}
            disabled={pending}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={confirmingDelete ? "Emin misin? Evet, sil" : "Kaydı sil"}
          >
            <Mono style={[styles.underline, confirmingDelete ? styles.danger : styles.muted]}>
              {confirmingDelete ? "Emin misin? Evet, sil" : "Kaydı sil"}
            </Mono>
          </Pressable>
        )}
      </View>
    </View>
  );
}

/**
 * The date, a day at a time: a log is nearly always today or a few days back,
 * and a native date picker would need a new development build. Never after
 * today in Turkey (the database allows one day ahead, ADR-017).
 */
function DateField({ value, today, onChange }: { value: string; today: string; onChange: (date: string) => void }) {
  const yesterday = shiftDate(today, -1);
  const atEarliest = value <= EARLIEST;
  const atToday = value >= today;

  return (
    <View style={styles.group}>
      <Label style={styles.label}>Tarih</Label>
      <View style={styles.dateRow}>
        <Pressable
          onPress={() => onChange(shiftDate(value, -1))}
          disabled={atEarliest}
          hitSlop={6}
          style={[styles.step, atEarliest && styles.off]}
          accessibilityRole="button"
          accessibilityLabel="Önceki gün"
        >
          <ChevronLeft size={18} color={colors.textSecondary} />
        </Pressable>
        <Mono style={styles.date} accessibilityLiveRegion="polite">
          {formatLogDate(value)}
        </Mono>
        <Pressable
          onPress={() => onChange(shiftDate(value, 1))}
          disabled={atToday}
          hitSlop={6}
          style={[styles.step, atToday && styles.off]}
          accessibilityRole="button"
          accessibilityLabel="Sonraki gün"
        >
          <ChevronRight size={18} color={colors.textSecondary} />
        </Pressable>
      </View>
      <View style={styles.chips}>
        {[
          { label: "Bugün", date: today },
          { label: "Dün", date: yesterday },
          { label: "1 hafta önce", date: shiftDate(today, -7) },
        ].map((chip) => (
          <Pressable
            key={chip.label}
            onPress={() => onChange(chip.date)}
            style={[styles.chip, value === chip.date && styles.chipOn]}
            accessibilityRole="button"
            accessibilityLabel={chip.label}
            accessibilityState={{ selected: value === chip.date }}
          >
            <Mono style={[styles.chipText, value === chip.date && styles.chipTextOn]}>{chip.label}</Mono>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: 22 },
  group: { gap: 8 },
  label: { color: colors.textSecondary, fontSize: 11, letterSpacing: 1.5 },
  hint: { fontSize: 11, lineHeight: 16, color: colors.textMuted },
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
  small: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgPrimary,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 8,
    color: colors.textPrimary,
    fontFamily: fonts.mono,
    fontSize: 13,
  },
  grow: { flex: 1, minWidth: 0 },
  amount: { width: 56, textAlign: "right" },
  unit: { width: 64 },
  remove: { width: 28, height: 32, alignItems: "center", justifyContent: "center" },
  add: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", marginTop: 4 },
  addText: { fontSize: 12, color: colors.textMuted },
  textarea: { minHeight: 96, textAlignVertical: "top" },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  link: { fontSize: 11, color: colors.textMuted, textDecorationLine: "underline" },
  checkText: { fontSize: 12, lineHeight: 18 },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  muted: { fontSize: 12, color: colors.textMuted },
  underline: { textDecorationLine: "underline" },
  danger: { fontSize: 12, color: colors.crimsonGlow },
  off: { opacity: 0.3 },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgPrimary,
    borderRadius: 4,
  },
  step: { paddingHorizontal: 12, paddingVertical: 10 },
  date: { flex: 1, textAlign: "center", fontSize: 14, color: colors.textPrimary },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderRadius: 999, backgroundColor: colors.bgElevated, paddingHorizontal: 12, paddingVertical: 5 },
  chipOn: { backgroundColor: alpha(colors.crimson, 0.3) },
  chipText: { fontSize: 11, color: colors.textMuted },
  chipTextOn: { color: colors.textPrimary },
});
