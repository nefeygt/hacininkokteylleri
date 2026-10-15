import { LOG_LIMITS, LOG_NOTE_MAX_LENGTH, unitChoices, type LogRecipe } from "@shared/drink-log";
import { ChevronDown, Lock, Pencil, Plus, X } from "lucide-react-native";
import { useState } from "react";
import { Keyboard, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import type { Writer } from "@/lib/community";
import type { IngredientIcon } from "@/lib/content";
import { deleteDrinkLog, leave, saveDrinkLog } from "@/lib/drink-logs";
import { alpha, colors, fonts } from "@/lib/theme";
import DateField from "./DateField";
import { Button, Checkbox, Field, Message } from "./Form";
import Stars from "./Stars";
import { Body, Label, Mono } from "./Type";

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
            <Pressable
              onPress={() => {
                Keyboard.dismiss();
                setUnitFor(row.key);
              }}
              style={[styles.small, styles.unit]}
              accessibilityRole="button"
              accessibilityLabel={`Birim: ${row.unit || "seçilmedi"}`}
            >
              <Mono numberOfLines={1} style={[styles.unitText, !row.unit && styles.placeholder]}>
                {row.unit || "birim"}
              </Mono>
              <ChevronDown size={12} color={colors.textMuted} />
            </Pressable>
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

      <View style={styles.group}>
        <View style={styles.stepsHead}>
          <Label style={styles.label}>Hazırlanışı</Label>
          {editingSteps ? (
            <Pressable
              onPress={() => {
                setSteps(originalSteps);
                setEditingSteps(false);
              }}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Orijinaline dön"
            >
              <Mono style={styles.link}>Orijinaline dön</Mono>
            </Pressable>
          ) : (
            <Pressable onPress={() => setEditingSteps(true)} hitSlop={8} style={styles.inline} accessibilityRole="button" accessibilityLabel="Hazırlanışı değiştir">
              <Pencil size={11} color={colors.textMuted} />
              <Mono style={styles.link}>Değiştir</Mono>
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
              accessibilityLabel="Hazırlanışı, her satır bir adım"
              style={[styles.stepsInput, styles.textarea]}
            />
            <Mono style={styles.hint}>Her satır bir adım. Farklı yaptıysan burada yaz.</Mono>
          </>
        ) : (
          <View style={styles.locked} accessible accessibilityLabel={`Hazırlanışı, değiştirilmedi: ${stepLines.join(". ")}`}>
            <Lock size={12} color={colors.textMuted} style={styles.lockIcon} />
            {stepLines.length ? (
              stepLines.map((line, i) => (
                <Body key={i} style={styles.lockedStep}>
                  {i + 1}. {line.trim()}
                </Body>
              ))
            ) : (
              <Mono style={styles.hint}>Adım yok.</Mono>
            )}
          </View>
        )}
      </View>

      <Field label="Süsleme" value={garnish} onChangeText={setGarnish} maxLength={LOG_LIMITS.garnish} />
      <Field label="Bardak" value={glass} onChangeText={setGlass} maxLength={LOG_LIMITS.glass} />

      <View style={styles.group}>
        <Label style={styles.label}>O akşamın puanı (isteğe bağlı)</Label>
        <View style={styles.ratingRow}>
          <Stars value={rating ?? 0} onChange={setRating} />
          {rating !== null && (
            <Pressable onPress={() => setRating(null)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Puanı kaldır">
              <Mono style={styles.link}>Kaldır</Mono>
            </Pressable>
          )}
        </View>
        <Mono style={styles.hint}>Yarım yıldız için yıldızın sol yarısına dokun. Bu puan yalnızca bu kayda ait; kokteylin ortalamasına sayılmaz.</Mono>
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

      <UnitPicker
        current={rows.find((r) => r.key === unitFor)?.unit ?? null}
        onPick={(unit) => {
          if (unitFor !== null) setRow(unitFor, { unit });
          setUnitFor(null);
        }}
        onClose={() => setUnitFor(null)}
      />

      {error && <Message error>{error}</Message>}

      <Button title={id ? "Kaydı güncelle" : "Günlüğe ekle"} onPress={save} pending={pending} />
      <View style={styles.footer}>
        <Pressable onPress={leave} disabled={pending} hitSlop={8} accessibilityRole="button" accessibilityLabel="Vazgeç">
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

/** The shared unit list as a sheet; an older or house unit outside the list is offered first. */
function UnitPicker({ current, onPick, onClose }: { current: string | null; onPick: (unit: string) => void; onClose: () => void }) {
  return (
    <Modal visible={current !== null} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Kapat">
        <Pressable style={styles.sheet} onPress={() => {}}>
          <Label style={[styles.label, styles.sheetTitle]}>Birim</Label>
          <ScrollView style={styles.sheetList}>
            {unitChoices(current ?? "").map((unit) => (
              <Pressable
                key={unit}
                onPress={() => onPick(unit)}
                style={({ pressed }) => [styles.option, unit === current && styles.optionOn, pressed && styles.optionPressed]}
                accessibilityRole="button"
                accessibilityLabel={unit}
                accessibilityState={{ selected: unit === current }}
              >
                <Mono style={[styles.optionText, unit === current && styles.optionTextOn]}>{unit}</Mono>
              </Pressable>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
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
  amount: { width: 52, textAlign: "right" },
  unit: { width: 116, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 4 },
  unitText: { flexShrink: 1, fontSize: 13, color: colors.textPrimary },
  placeholder: { color: colors.textMuted },
  remove: { width: 28, height: 32, alignItems: "center", justifyContent: "center" },
  add: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", marginTop: 4 },
  addText: { fontSize: 12, color: colors.textMuted },
  stepsHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  inline: { flexDirection: "row", alignItems: "center", gap: 4 },
  stepsInput: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgPrimary,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.textPrimary,
    fontFamily: fonts.sans,
    fontSize: 15,
  },
  locked: {
    gap: 6,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.border,
    backgroundColor: alpha(colors.bgElevated, 0.35),
    borderRadius: 4,
    paddingLeft: 12,
    paddingRight: 30,
    paddingVertical: 10,
  },
  lockIcon: { position: "absolute", top: 10, right: 10 },
  lockedStep: { fontSize: 14, lineHeight: 20, color: colors.textMuted },
  textarea: { minHeight: 96, textAlignVertical: "top" },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  link: { fontSize: 11, color: colors.textMuted, textDecorationLine: "underline" },
  checkText: { fontSize: 12, lineHeight: 18 },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  muted: { fontSize: 12, color: colors.textMuted },
  underline: { textDecorationLine: "underline" },
  danger: { fontSize: 12, color: colors.crimsonGlow },
  off: { opacity: 0.3 },
  backdrop: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "rgba(0, 0, 0, 0.6)" },
  sheet: {
    width: "100%",
    maxWidth: 320,
    maxHeight: "70%",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgSecondary,
    borderRadius: 8,
    paddingVertical: 12,
  },
  sheetTitle: { paddingHorizontal: 16, marginBottom: 6 },
  sheetList: { flexGrow: 0 },
  option: { paddingHorizontal: 16, paddingVertical: 11 },
  optionOn: { backgroundColor: alpha(colors.crimson, 0.25) },
  optionPressed: { backgroundColor: colors.bgElevated },
  optionText: { fontSize: 14, color: colors.textSecondary },
  optionTextOn: { color: colors.textPrimary },
});
