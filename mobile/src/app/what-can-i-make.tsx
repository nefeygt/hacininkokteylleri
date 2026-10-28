import AsyncStorage from "@react-native-async-storage/async-storage";
import { format } from "@shared/i18n/format";
import { PANTRY_KEY, groupByCategory, matchCocktails, type CatalogueIngredient } from "@shared/ingredients";
import { router } from "expo-router";
import { Check, X } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";
import CocktailCard from "@/components/CocktailCard";
import { Body, Heading, Label, Mono } from "@/components/Type";
import { useArchive } from "@/lib/archive";
import { fetchIngredientCatalogue, fetchMatchableRecipes, type Cocktail } from "@/lib/content";
import { useFavorites } from "@/lib/favorites";
import { useLocale } from "@/lib/i18n";
import { alpha, readable, type Theme } from "@/lib/theme";
import { useStyles, useTheme } from "@/lib/theme-context";

/** "Elimde ne var?" (ADR-029): pick what you have, see the house and members' recipes you can make (the site's WhatCanIMake). */
export default function WhatCanIMakeScreen() {
  const { t, locale } = useLocale();
  const tw = t.whatCanIMake;
  const styles = useStyles(makeStyles);
  const theme = useTheme();
  const { archive } = useArchive();
  const { favorites } = useFavorites();
  const [catalogue, setCatalogue] = useState<CatalogueIngredient[] | null>(null);
  const [members, setMembers] = useState<Cocktail[]>([]);
  const [failed, setFailed] = useState(false);
  const [have, setHave] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    setFailed(false);
    Promise.all([fetchIngredientCatalogue(locale), fetchMatchableRecipes()])
      .then(([items, recipes]) => {
        setCatalogue(items);
        setMembers(recipes);
      })
      .catch(() => setFailed(true));
  }, [locale]);

  const cocktails = useMemo(() => [...(archive?.cocktails ?? []), ...members], [archive, members]);

  // Only what some recipe uses, and never what is always at hand (water).
  const pickable = useMemo(() => {
    const used = new Set(cocktails.flatMap((c) => c.ingredients.map((i) => i.ingredientId)));
    return (catalogue ?? []).filter((i) => used.has(i.id) && !i.alwaysAtHand);
  }, [cocktails, catalogue]);

  // The picks come back from the phone once the catalogue is known (an id that no longer exists is dropped).
  const [restored, setRestored] = useState(false);
  useEffect(() => {
    if (restored || pickable.length === 0) return;
    const known = new Set(pickable.map((i) => i.id));
    AsyncStorage.getItem(PANTRY_KEY)
      .then((stored) => {
        const ids = JSON.parse(stored ?? "[]");
        if (Array.isArray(ids)) setHave(new Set(ids.filter((id): id is string => typeof id === "string" && known.has(id))));
      })
      .catch(() => {})
      .finally(() => setRestored(true));
  }, [pickable, restored]);

  const change = (next: Set<string>) => {
    setHave(next);
    AsyncStorage.setItem(PANTRY_KEY, JSON.stringify([...next])).catch(() => {});
  };
  const toggle = (id: string) => {
    const next = new Set(have);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    change(next);
  };

  const { ready, oneShort } = useMemo(() => matchCocktails(cocktails, catalogue ?? [], have), [cocktails, catalogue, have]);
  const open = (c: Cocktail) =>
    router.push(c.author ? { pathname: "/recipes/[slug]", params: { slug: c.slug } } : { pathname: "/cocktail/[slug]", params: { slug: c.slug } });
  const card = (c: Cocktail) => <CocktailCard cocktail={c} favorite={favorites.has(c.id)} onPress={() => open(c)} />;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={readable}>
        <Label style={styles.eyebrow}>{tw.eyebrow}</Label>
        <Heading style={styles.title}>{tw.title}</Heading>
        <Body style={styles.intro}>{tw.intro}</Body>

        {failed ? (
          <Mono style={styles.muted}>{t.status.errorBody}</Mono>
        ) : catalogue === null || !archive ? (
          <ActivityIndicator color={theme.colors.crimsonGlow} style={styles.loading} />
        ) : (
          <>
            <View style={styles.selectedRow}>
              <Label style={styles.selected}>{format(tw.selected, { n: have.size })}</Label>
              {have.size > 0 && (
                <Pressable onPress={() => change(new Set())} hitSlop={8} style={styles.clear} accessibilityRole="button">
                  <X size={13} color={theme.colors.textMuted} />
                  <Mono style={styles.clearText}>{tw.clear}</Mono>
                </Pressable>
              )}
            </View>

            {groupByCategory(pickable, t, locale).map((group) => (
              <View key={group.value} style={styles.group}>
                <Label style={styles.groupTitle}>{group.label}</Label>
                <View style={styles.chips}>
                  {group.items.map((item) => {
                    const on = have.has(item.id);
                    return (
                      <Pressable
                        key={item.id}
                        onPress={() => toggle(item.id)}
                        accessibilityRole="button"
                        accessibilityState={{ selected: on }}
                        style={[styles.chip, on && styles.chipOn]}
                      >
                        {on && <Check size={12} color={theme.colors.crimsonGlow} />}
                        <Body style={[styles.chipText, on && styles.chipTextOn]}>{item.name}</Body>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}

            {have.size === 0 ? (
              <View style={styles.empty}>
                <Mono style={styles.muted}>{tw.empty}</Mono>
              </View>
            ) : (
              <View style={styles.results}>
                <Label style={styles.resultsTitle}>{format(tw.canMake, { n: ready.length })}</Label>
                {ready.length === 0 ? (
                  <Mono style={styles.muted}>{tw.noneReady}</Mono>
                ) : (
                  <View style={styles.cards}>
                    {ready.map((c) => (
                      <View key={c.id}>{card(c)}</View>
                    ))}
                  </View>
                )}

                {oneShort.length > 0 && (
                  <>
                    <Label style={[styles.resultsTitle, styles.resultsGap]}>{format(tw.oneMissing, { n: oneShort.length })}</Label>
                    <View style={styles.cards}>
                      {oneShort.map(({ cocktail, missing }) => (
                        <View key={cocktail.id}>
                          {card(cocktail)}
                          <Mono style={styles.missing}>
                            {tw.missing}
                            <Mono style={styles.missingName}>{missing.name}</Mono>
                          </Mono>
                        </View>
                      ))}
                    </View>
                  </>
                )}
              </View>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: t.colors.bgPrimary },
    content: { padding: 16, paddingTop: 24, paddingBottom: 48 },
    eyebrow: { color: t.colors.crimsonGlow, letterSpacing: 2.5, marginBottom: 8 },
    title: { fontSize: 26 },
    intro: { marginTop: 8, marginBottom: 24, fontSize: 13, lineHeight: 20, color: t.colors.textMuted },
    loading: { marginTop: 32 },
    muted: { fontSize: 12, lineHeight: 19, color: t.colors.textMuted },
    selectedRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
    selected: { letterSpacing: 1.5 },
    clear: { flexDirection: "row", alignItems: "center", gap: 4 },
    clearText: { fontSize: 12, color: t.colors.textMuted },
    group: { marginBottom: 20 },
    groupTitle: { fontSize: 10, letterSpacing: 1.5, marginBottom: 8 },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 4, backgroundColor: t.colors.bgElevated, paddingHorizontal: 12, paddingVertical: 7 },
    chipOn: { backgroundColor: alpha(t.colors.crimson, 0.2) },
    chipText: { fontSize: 13, color: t.colors.textSecondary },
    chipTextOn: { color: t.colors.crimsonGlow },
    empty: { marginTop: 12, borderWidth: 1, borderStyle: "dashed", borderColor: t.colors.border, borderRadius: 4, padding: 20 },
    results: { marginTop: 12 },
    resultsTitle: { fontSize: 11, letterSpacing: 1.5, color: t.colors.textSecondary, marginBottom: 12 },
    resultsGap: { marginTop: 32 },
    cards: { gap: 16 },
    missing: { marginTop: 8, fontSize: 12, color: t.colors.textMuted },
    missingName: { fontSize: 12, color: t.colors.textSecondary },
  });
