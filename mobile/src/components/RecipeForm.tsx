import { unitLabel } from "@shared/drink-log";
import { groupByCategory, type CatalogueIngredient } from "@shared/ingredients";
import { INGREDIENT_ICONS, RECIPE_LIMITS, type RecipeInput } from "@shared/recipe";
import { Image } from "expo-image";
import { router } from "expo-router";
import { ArrowDown, ArrowUp, ChevronDown, ImagePlus, Plus, X } from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Keyboard, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useArchive } from "@/lib/archive";
import type { Writer } from "@/lib/community";
import { fetchIngredientCatalogue, type IngredientIcon } from "@/lib/content";
import { deleteRecipe, discardRecipePhoto, leaveRecipeForm, pickRecipePhoto, saveRecipe } from "@/lib/recipes";
import { recipeImageUrl } from "@/lib/supabase";
import { alpha, type Theme } from "@/lib/theme";
import { useStyles, useTheme } from "@/lib/theme-context";
import GlassPicker from "./GlassPicker";
import { Button, Checkbox, Field, Message } from "./Form";
import { unitOptions } from "./LogForm";
import OptionSheet from "./OptionSheet";
import { Label, Mono } from "./Type";
import { useLocale } from "@/lib/i18n";
import { format } from "@shared/i18n/format";

interface IngredientRow {
  key: number;
  name: string;
  amount: string; // as typed; "1,5" works too
  unit: string;
  icon: IngredientIcon;
  /** The catalogue ingredient this line names (ADR-029); a recipe takes part in "what can I make" when every line has one. */
  ingredientId?: string;
}

interface StepRow {
  key: number;
  text: string;
}

let nextKey = 0;

/** Accent colours to tap instead of typing a hex code (the site has a colour input). */
const SWATCHES = ["#8b1a1a", "#c0392b", "#e67e22", "#d4a017", "#27ae60", "#16a085", "#2e86c1", "#8e44ad", "#c2185b", "#5d4037"];


function move<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/** Values Hacı's recipes already use, so the form suggests them (the site's datalists). */
function useSuggestions() {
  const { archive } = useArchive();
  return useMemo(() => {
    const distinct = (values: string[]) =>
      [...new Set(values.map((v) => v.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "tr"));
    const cocktails = archive?.cocktails ?? [];
    return {
      baseAlcohols: distinct(cocktails.map((c) => c.baseAlcohol)),
      flavors: distinct(cocktails.map((c) => c.flavor)),
      glasses: distinct(cocktails.map((c) => c.glass)),
    };
  }, [archive]);
}

/**
 * A member writes or edits their own recipe (the site's RecipeForm, M6): the
 * same shape as a house recipe, units from the shared list (ADR-023), a photo
 * in the member's own folder. `id` and `slug` set = editing.
 */
export default function RecipeForm({
  writer,
  initial,
  id,
  slug,
}: {
  writer: Writer;
  initial: RecipeInput;
  id?: string;
  slug?: string;
}) {
  const { t, a, locale } = useLocale();
  const styles = useStyles(makeStyles);
  const theme = useTheme();
  const suggestions = useSuggestions();
  const [form, setForm] = useState(initial);
  const [tagsText, setTagsText] = useState(initial.tags.join(", "));
  const [rows, setRows] = useState<IngredientRow[]>(() =>
    initial.ingredients.map((i) => ({
      key: nextKey++,
      name: i.name,
      amount: String(i.amount).replace(".", ","),
      unit: i.unit,
      icon: i.icon,
      ingredientId: i.ingredientId,
    }))
  );
  const [steps, setSteps] = useState<StepRow[]>(() => initial.instructions.map((text) => ({ key: nextKey++, text })));
  const [sheet, setSheet] = useState<{ key: number; kind: "unit" | "icon" | "catalogue" } | null>(null);
  const [catalogue, setCatalogue] = useState<CatalogueIngredient[]>([]);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [pending, setPending] = useState(false);
  // A photo uploaded here but not saved with the recipe yet: replaced or abandoned, it is deleted.
  const unsavedPhoto = useRef<string | null>(null);
  const L = RECIPE_LIMITS;

  useEffect(() => {
    fetchIngredientCatalogue(locale)
      .then(setCatalogue)
      .catch(() => {});
  }, [locale]);

  function set<K extends keyof RecipeInput>(key: K, value: RecipeInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  function setRow(key: number, patch: Partial<IngredientRow>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
    setSaved(false);
  }

  function setStep(key: number, text: string) {
    setSteps((prev) => prev.map((s) => (s.key === key ? { ...s, text } : s)));
    setSaved(false);
  }

  async function setPhoto(next: string | null) {
    const dropped = unsavedPhoto.current;
    unsavedPhoto.current = next;
    set("imagePath", next);
    if (dropped && dropped !== next) await discardRecipePhoto(dropped);
  }

  async function pickPhoto() {
    setError(null);
    setPhotoBusy(true);
    try {
      const path = await pickRecipePhoto(writer, slug);
      if (path) await setPhoto(path);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.imageField.uploadFailed);
    } finally {
      setPhotoBusy(false);
    }
  }

  async function save() {
    Keyboard.dismiss();
    setError(null);
    const input: RecipeInput = {
      ...form,
      tags: tagsText.split(",").map((t) => t.trim()).filter(Boolean),
      ingredients: rows.map((r) => ({
        name: r.name,
        amount: r.amount.trim() ? Number(r.amount.replace(",", ".")) : NaN,
        unit: r.unit,
        icon: r.icon,
        ingredientId: r.ingredientId,
      })),
      instructions: steps.map((s) => s.text),
    };
    setPending(true);
    const result = await saveRecipe(writer, input, id);
    setPending(false);
    if (result.error || !result.id || !result.slug) {
      setError(result.error ?? t.account.saveFallback);
      return;
    }
    unsavedPhoto.current = null;

    const page = { pathname: "/recipes/[slug]", params: { slug: result.slug } } as const;
    if (!id) {
      // A new recipe: its page when published, otherwise the draft's own form.
      router.replace(input.isPublished ? page : { pathname: "/my-recipes/[id]", params: { id: result.id } });
    } else if (input.isPublished) {
      if (router.canGoBack()) router.back();
      else router.replace(page);
    } else {
      setSaved(true);
    }
  }

  async function cancel() {
    if (unsavedPhoto.current) await discardRecipePhoto(unsavedPhoto.current);
    unsavedPhoto.current = null;
    leaveRecipeForm();
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
    const result = await deleteRecipe(writer, id);
    setPending(false);
    if (result.error) {
      setError(result.error);
      setConfirmingDelete(false);
      return;
    }
    if (unsavedPhoto.current) await discardRecipePhoto(unsavedPhoto.current);
    unsavedPhoto.current = null;
    router.dismissTo("/my-recipes");
  }

  const photoUrl = recipeImageUrl(form.imagePath);
  const sheetRow = sheet ? rows.find((r) => r.key === sheet.key) : undefined;

  return (
    <View style={styles.form}>
      <Section title={t.recipeForm.sectionRecipe}>
        <Field label={t.recipeForm.name} value={form.name} onChangeText={(v) => set("name", v)} maxLength={L.name} />
        <Field
          label={t.recipeForm.subtitle}
          value={form.subtitle}
          onChangeText={(v) => set("subtitle", v)}
          maxLength={L.subtitle}
          placeholder={t.recipeForm.subtitlePlaceholder}
        />
        <View style={styles.group}>
          <Field label={t.recipeForm.base} value={form.baseAlcohol} onChangeText={(v) => set("baseAlcohol", v)} maxLength={L.baseAlcohol} />
          <Chips values={suggestions.baseAlcohols} current={form.baseAlcohol} onPick={(v) => set("baseAlcohol", v)} />
        </View>
        <View style={styles.group}>
          <Field label={t.recipeForm.flavor} value={form.flavor} onChangeText={(v) => set("flavor", v)} maxLength={L.flavor} />
          <Chips values={suggestions.flavors} current={form.flavor} onPick={(v) => set("flavor", v)} />
        </View>
        <View style={styles.group}>
          <Label style={styles.label}>{t.recipeForm.glass}</Label>
          <GlassPicker value={form.glass} onChange={(v) => set("glass", v)} maxLength={L.glass} />
        </View>
        <View style={styles.group}>
          <Label style={styles.label}>{t.recipeForm.color}</Label>
          <View style={styles.swatches}>
            {SWATCHES.map((c) => (
              <Pressable
                key={c}
                onPress={() => set("color", c)}
                hitSlop={4}
                style={[styles.swatch, { backgroundColor: c }, form.color.toLowerCase() === c && styles.swatchOn]}
                accessibilityRole="button"
                accessibilityLabel={`Renk ${c}`}
                accessibilityState={{ selected: form.color.toLowerCase() === c }}
              />
            ))}
          </View>
          <View style={styles.hexRow}>
            <View style={[styles.preview, { backgroundColor: /^#[0-9a-fA-F]{6}$/.test(form.color) ? form.color : theme.colors.bgElevated }]} />
            <TextInput
              value={form.color}
              onChangeText={(v) => set("color", v)}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={7}
              accessibilityLabel={a.recipeForm.colorCode}
              style={[styles.small, styles.hex]}
            />
          </View>
        </View>
        <Field
          label={t.recipeForm.tags}
          value={tagsText}
          onChangeText={(v) => {
            setTagsText(v);
            setSaved(false);
          }}
          maxLength={L.tagsText}
          placeholder={t.recipeForm.tagsPlaceholder}
        />
      </Section>

      <Section title={t.recipeForm.sectionPhoto}>
        <View style={styles.photo}>
          {photoUrl ? (
            <Image source={photoUrl} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : (
            <Mono style={styles.hint}>{t.imageField.noPhoto}</Mono>
          )}
          {photoBusy && (
            <View style={styles.photoBusy}>
              <ActivityIndicator color={theme.colors.textPrimary} />
            </View>
          )}
        </View>
        <View style={styles.inlineRow}>
          <Button
            kind="secondary"
            title={photoUrl ? t.imageField.change : t.imageField.upload}
            onPress={pickPhoto}
            disabled={photoBusy || pending}
            icon={<ImagePlus size={14} color={theme.colors.textPrimary} />}
          />
          {photoUrl && <Button kind="link" title={t.imageField.remove} onPress={() => setPhoto(null)} disabled={photoBusy || pending} />}
        </View>
      </Section>

      <Section title={t.recipeForm.sectionIngredients}>
        <Mono style={styles.hint}>
          {t.recipeForm.catalogueIntro1}
          <Mono style={styles.linkText} onPress={() => router.push("/what-can-i-make")}>
            {t.recipeForm.linkText}
          </Mono>
          {t.recipeForm.catalogueIntro2}
        </Mono>
        {rows.map((row, i) => (
          <View key={row.key} style={styles.ingredient}>
            <View style={styles.row}>
              <TextInput
                value={row.name}
                onChangeText={(name) => setRow(row.key, { name })}
                maxLength={L.ingredientName}
                placeholder={t.recipeForm.ingredient}
                placeholderTextColor={theme.colors.textMuted}
                accessibilityLabel={format(a.recipeForm.ingredientN, { n: i + 1 })}
                style={[styles.small, styles.grow]}
              />
              <TextInput
                value={row.amount}
                onChangeText={(amount) => setRow(row.key, { amount })}
                keyboardType="decimal-pad"
                placeholder="4"
                placeholderTextColor={theme.colors.textMuted}
                accessibilityLabel={t.recipeForm.amount}
                style={[styles.small, styles.amount]}
              />
              <Pressable
                onPress={() => {
                  Keyboard.dismiss();
                  setSheet({ key: row.key, kind: "unit" });
                }}
                style={[styles.small, styles.select, styles.unit]}
                accessibilityRole="button"
                accessibilityLabel={`${t.recipeForm.unit}: ${row.unit ? unitLabel(row.unit, Number(row.amount.replace(",", ".")) || 1, t) : a.logForm.unitNone}`}
              >
                <Mono numberOfLines={1} style={[styles.selectText, !row.unit && styles.placeholder]}>
                  {row.unit ? unitLabel(row.unit, Number(row.amount.replace(",", ".")) || 1, t) : a.logForm.unitShort}
                </Mono>
                <ChevronDown size={12} color={theme.colors.textMuted} />
              </Pressable>
            </View>
            <Pressable
              onPress={() => {
                Keyboard.dismiss();
                setSheet({ key: row.key, kind: "catalogue" });
              }}
              style={[styles.small, styles.select]}
              accessibilityRole="button"
              accessibilityLabel={`${t.recipeForm.catalogueMatch}: ${catalogue.find((c) => c.id === row.ingredientId)?.name ?? t.recipeForm.notInCatalogue}`}
            >
              <Mono numberOfLines={1} style={[styles.selectText, !row.ingredientId && styles.placeholder]}>
                {catalogue.find((c) => c.id === row.ingredientId)?.name ?? t.recipeForm.notInCatalogue}
              </Mono>
              <ChevronDown size={12} color={theme.colors.textMuted} />
            </Pressable>
            <View style={styles.row}>
              <Pressable
                onPress={() => {
                  Keyboard.dismiss();
                  setSheet({ key: row.key, kind: "icon" });
                }}
                style={[styles.small, styles.select, styles.grow]}
                accessibilityRole="button"
                accessibilityLabel={`${t.recipeForm.icon}: ${t.recipeIcons[row.icon]}`}
              >
                <Mono numberOfLines={1} style={styles.selectText}>
                  {t.recipeIcons[row.icon]}
                </Mono>
                <ChevronDown size={12} color={theme.colors.textMuted} />
              </Pressable>
              <IconButton label={t.recipeForm.up} disabled={i === 0} onPress={() => setRows((prev) => move(prev, i, i - 1))}>
                <ArrowUp size={16} color={theme.colors.textMuted} />
              </IconButton>
              <IconButton label={t.recipeForm.down} disabled={i === rows.length - 1} onPress={() => setRows((prev) => move(prev, i, i + 1))}>
                <ArrowDown size={16} color={theme.colors.textMuted} />
              </IconButton>
              <IconButton label={t.logForm.removeIngredient} disabled={rows.length === 1} onPress={() => setRows((prev) => prev.filter((r) => r.key !== row.key))}>
                <X size={16} color={theme.colors.textMuted} />
              </IconButton>
            </View>
          </View>
        ))}
        <Mono style={styles.hint}>
          {rows.every((r) => r.ingredientId) ? t.recipeForm.allMatched : format(t.recipeForm.someUnmatched, { n: rows.filter((r) => !r.ingredientId).length })}
        </Mono>
        {rows.length < L.ingredients && (
          <AddButton
            label={t.recipeForm.addIngredient}
            onPress={() => setRows((prev) => [...prev, { key: nextKey++, name: "", amount: "1", unit: "cl", icon: "shot" }])}
          />
        )}
      </Section>

      <Section title={t.recipeForm.sectionSteps}>
        {steps.map((step, i) => (
          <View key={step.key} style={styles.stepRow}>
            <View style={styles.stepNumber}>
              <Mono style={styles.stepNumberText}>{i + 1}</Mono>
            </View>
            <TextInput
              value={step.text}
              onChangeText={(text) => setStep(step.key, text)}
              multiline
              maxLength={L.step}
              accessibilityLabel={format(a.recipeForm.stepLabel, { n: i + 1 })}
              style={[styles.stepInput, styles.grow]}
            />
            <View>
              <IconButton label={t.recipeForm.up} disabled={i === 0} onPress={() => setSteps((prev) => move(prev, i, i - 1))}>
                <ArrowUp size={16} color={theme.colors.textMuted} />
              </IconButton>
              <IconButton label={a.recipeForm.removeStep} disabled={steps.length === 1} onPress={() => setSteps((prev) => prev.filter((s) => s.key !== step.key))}>
                <X size={16} color={theme.colors.textMuted} />
              </IconButton>
            </View>
          </View>
        ))}
        {steps.length < L.instructions && (
          <AddButton label={t.recipeForm.addStep} onPress={() => setSteps((prev) => [...prev, { key: nextKey++, text: "" }])} />
        )}
      </Section>

      <Section title={t.recipeForm.sectionDetails}>
        <Field label={t.recipeForm.garnish} value={form.garnish} onChangeText={(v) => set("garnish", v)} maxLength={L.garnish} />
        <Field
          label={t.recipeForm.note}
          value={form.note}
          onChangeText={(v) => set("note", v)}
          maxLength={L.note}
          multiline
          style={styles.textarea}
        />
        <Checkbox checked={form.vegan} onChange={(v) => set("vegan", v)} label={t.recipeForm.vegan}>
          <Mono style={styles.checkText}>{t.recipeForm.vegan}</Mono>
        </Checkbox>
        <Checkbox checked={form.isPublished} onChange={(v) => set("isPublished", v)} label={t.recipeForm.published}>
          <Mono style={styles.checkText}>{t.recipeForm.published}</Mono>
          <Mono style={styles.hint}>
            {t.recipeForm.publishedHint}
          </Mono>
        </Checkbox>
      </Section>

      {error && <Message error>{error}</Message>}
      {saved && <Message>{t.recipeForm.saved}</Message>}

      <Button
        title={id ? t.recipeForm.save : form.isPublished ? t.recipeForm.publish : t.recipeForm.saveDraft}
        onPress={save}
        pending={pending}
        disabled={photoBusy}
      />
      <View style={styles.footer}>
        <Pressable onPress={cancel} disabled={pending} hitSlop={8} accessibilityRole="button" accessibilityLabel={t.common.cancel}>
          <Mono style={styles.muted}>{t.common.cancel}</Mono>
        </Pressable>
        {id && (
          <Pressable
            onPress={remove}
            disabled={pending}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={confirmingDelete ? t.common.confirmDelete : t.recipeForm.sectionDelete}
          >
            <Mono style={[styles.underline, confirmingDelete ? styles.danger : styles.muted]}>
              {confirmingDelete ? t.common.confirmDelete : t.recipeForm.sectionDelete}
            </Mono>
          </Pressable>
        )}
      </View>
      {id && confirmingDelete && (
        <Mono style={styles.hint}>{t.recipeForm.deleteWarning}</Mono>
      )}

      <OptionSheet
        title={sheet?.kind === "icon" ? t.recipeForm.icon : sheet?.kind === "catalogue" ? t.recipeForm.catalogueMatch : t.recipeForm.unit}
        options={
          sheet?.kind === "icon"
            ? INGREDIENT_ICONS.map((i) => ({ value: i.value, label: t.recipeIcons[i.value] }))
            : sheet?.kind === "catalogue"
              ? [
                  { value: "", label: t.recipeForm.notInCatalogue },
                  ...groupByCategory(catalogue, t, locale).flatMap((g) => g.items.map((i) => ({ value: i.id, label: i.name, group: g.label }))),
                ]
              : unitOptions(sheetRow?.unit ?? "", t)
        }
        current={sheetRow ? (sheet?.kind === "icon" ? sheetRow.icon : sheet?.kind === "catalogue" ? sheetRow.ingredientId ?? "" : sheetRow.unit) : null}
        onPick={(value) => {
          if (sheet?.kind === "catalogue") setRow(sheet.key, { ingredientId: value || undefined });
          else if (sheet) setRow(sheet.key, sheet.kind === "icon" ? { icon: value as IngredientIcon } : { unit: value });
          setSheet(null);
        }}
        onClose={() => setSheet(null)}
      />
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const styles = useStyles(makeStyles);
  return (
    <View style={styles.section}>
      <Label style={styles.sectionTitle}>{title}</Label>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

/** Values in use, tapped to fill the field above. */
function Chips({ values, current, onPick }: { values: string[]; current: string; onPick: (value: string) => void }) {
  const styles = useStyles(makeStyles);
  if (values.length === 0) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.chips}>
      {values.map((v) => {
        const on = v === current.trim();
        return (
          <Pressable
            key={v}
            onPress={() => onPick(v)}
            style={[styles.chip, on && styles.chipOn]}
            accessibilityRole="button"
            accessibilityLabel={v}
            accessibilityState={{ selected: on }}
          >
            <Mono style={[styles.chipText, on && styles.chipTextOn]}>{v}</Mono>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function IconButton({ label, disabled, onPress, children }: { label: string; disabled: boolean; onPress: () => void; children: React.ReactNode }) {
  const styles = useStyles(makeStyles);
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={4}
      style={[styles.iconButton, disabled && styles.off]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
    >
      {children}
    </Pressable>
  );
}

function AddButton({ label, onPress }: { label: string; onPress: () => void }) {
  const styles = useStyles(makeStyles);
  const theme = useTheme();
  return (
    <Pressable onPress={onPress} hitSlop={6} style={styles.add} accessibilityRole="button" accessibilityLabel={label}>
      <Plus size={14} color={theme.colors.textMuted} />
      <Mono style={styles.addText}>{label}</Mono>
    </Pressable>
  );
}

const makeStyles = (t: Theme) => StyleSheet.create({
  form: { gap: 20 },
  section: { borderWidth: 1, borderColor: t.colors.border, backgroundColor: t.colors.bgCard, borderRadius: 4, padding: 16 },
  sectionTitle: { color: t.colors.textSecondary, fontSize: 11, letterSpacing: 1.5, marginBottom: 14 },
  sectionBody: { gap: 16 },
  group: { gap: 8 },
  label: { color: t.colors.textSecondary, fontSize: 11, letterSpacing: 1.5 },
  hint: { fontSize: 11, lineHeight: 16, color: t.colors.textMuted },
  linkText: { fontSize: 11, color: t.colors.crimsonGlow, textDecorationLine: "underline" },
  chips: { gap: 6, paddingRight: 8 },
  chip: { borderWidth: 1, borderColor: t.colors.border, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  chipOn: { borderColor: t.colors.crimson, backgroundColor: alpha(t.colors.crimson, 0.2) },
  chipText: { fontSize: 11, color: t.colors.textMuted },
  chipTextOn: { color: t.colors.textPrimary },
  swatches: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  swatch: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: "transparent" },
  swatchOn: { borderColor: t.colors.textPrimary },
  hexRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  preview: { width: 36, height: 36, borderRadius: 4, borderWidth: 1, borderColor: t.colors.border },
  hex: { width: 110 },
  photo: {
    aspectRatio: 16 / 9,
    width: "100%",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: t.colors.border,
    backgroundColor: t.colors.bgElevated,
    borderRadius: 2,
  },
  photoBusy: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0, 0, 0, 0.6)" },
  inlineRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  ingredient: { gap: 6, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.colors.border },
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
  amount: { width: 56, textAlign: "right" },
  select: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 4 },
  unit: { width: 112 },
  selectText: { flexShrink: 1, fontSize: 13, color: t.colors.textPrimary },
  placeholder: { color: t.colors.textMuted },
  iconButton: { width: 30, height: 32, alignItems: "center", justifyContent: "center" },
  off: { opacity: 0.3 },
  add: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start" },
  addText: { fontSize: 12, color: t.colors.textMuted },
  stepRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  stepNumber: {
    marginTop: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: alpha(t.colors.crimson, 0.15),
  },
  stepNumberText: { fontSize: 10, color: t.colors.crimsonGlow },
  stepInput: {
    minHeight: 64,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: t.colors.border,
    backgroundColor: t.colors.bgPrimary,
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: t.colors.textPrimary,
    fontFamily: t.fonts.sans,
    fontSize: 14,
  },
  textarea: { minHeight: 96, textAlignVertical: "top" },
  checkText: { fontSize: 13, color: t.colors.textSecondary },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  muted: { fontSize: 12, color: t.colors.textMuted },
  underline: { textDecorationLine: "underline" },
  danger: { fontSize: 12, color: t.colors.crimsonGlow },
});
