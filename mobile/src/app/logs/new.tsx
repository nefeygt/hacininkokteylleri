import { todayInTurkey } from "@shared/drink-log";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";
import KeyboardScrollView from "@/components/KeyboardScrollView";
import LogForm from "@/components/LogForm";
import MemberGate from "@/components/MemberGate";
import { Body, Heading, Mono } from "@/components/Type";
import { useArchive } from "@/lib/archive";
import type { Writer } from "@/lib/community";
import { fetchRecipe, type Cocktail } from "@/lib/content";
import { leave, recipeOf } from "@/lib/drink-logs";
import type { Settings } from "@/lib/session";
import { colors, fonts, readable } from "@/lib/theme";

/**
 * A new drink log (the site's /account/logs/new). Opened from a recipe with
 * `?cocktail={slug}` (a house recipe or a member's); from the log list without
 * one, the member picks a house recipe first.
 */
export default function NewLogScreen() {
  const { cocktail: fromRecipe } = useLocalSearchParams<{ cocktail?: string }>();
  const [picked, setPicked] = useState<string | null>(null);
  const slug = fromRecipe ?? picked;
  const { archive } = useArchive();

  return (
    <MemberGate from={fromRecipe ? { pathname: "/logs/new", params: { cocktail: fromRecipe } } : "/logs/new"}>
      {(writer, settings) => {
        if (!archive) {
          return (
            <View style={styles.center}>
              <ActivityIndicator color={colors.crimsonGlow} />
            </View>
          );
        }

        if (!slug) {
          return (
            <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
              <View style={readable}>
                <Mono style={styles.subtitle}>Hangi kokteyli yaptın ya da içtin?</Mono>
                <View style={styles.picker}>
                  {archive.cocktails.map((c) => (
                    <Pressable
                      key={c.slug}
                      onPress={() => setPicked(c.slug)}
                      style={({ pressed }) => [styles.option, pressed && styles.pressed]}
                      accessibilityRole="button"
                      accessibilityLabel={c.name}
                    >
                      <View style={[styles.swatch, { backgroundColor: c.color }]} />
                      <View style={styles.optionText}>
                        <Body numberOfLines={1} style={styles.optionName}>
                          {c.name}
                        </Body>
                        <Mono numberOfLines={1} style={styles.optionSubtitle}>
                          {c.subtitle}
                        </Mono>
                      </View>
                    </Pressable>
                  ))}
                </View>
              </View>
            </ScrollView>
          );
        }

        return (
          <NewLog
            writer={writer}
            settings={settings}
            house={archive.cocktails.find((c) => c.slug === slug)}
            slug={slug}
            fromRecipe={Boolean(fromRecipe)}
            onPickAnother={() => (fromRecipe ? router.back() : setPicked(null))}
          />
        );
      }}
    </MemberGate>
  );
}

/**
 * The form for one cocktail: a house recipe from the archive, or a member's
 * recipe read by its slug (logs can start from either, as on the site).
 */
function NewLog({
  writer,
  settings,
  house,
  slug,
  fromRecipe,
  onPickAnother,
}: {
  writer: Writer;
  settings: Settings;
  house: Cocktail | undefined;
  slug: string;
  fromRecipe: boolean;
  onPickAnother: () => void;
}) {
  const [member, setMember] = useState<Cocktail | null | undefined>(house ? null : undefined);

  useEffect(() => {
    if (house) return;
    let cancelled = false;
    fetchRecipe(slug)
      .then((recipe) => !cancelled && setMember(recipe))
      .catch(() => !cancelled && setMember(null));
    return () => {
      cancelled = true;
    };
  }, [house, slug]);

  const cocktail = house ?? member;
  if (cocktail === undefined) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.crimsonGlow} />
      </View>
    );
  }
  if (cocktail === null) {
    return (
      <View style={styles.center}>
        <Body style={styles.muted}>Bu kokteyl bulunamadı.</Body>
        <Pressable onPress={onPickAnother}>
          <Mono style={styles.link}>Başka bir kokteyl seç</Mono>
        </Pressable>
      </View>
    );
  }

  const today = todayInTurkey();
  return (
    <KeyboardScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: cocktail.name }} />
      <View style={readable}>
        <Heading style={styles.title}>{cocktail.name}</Heading>
        <Mono style={styles.subtitle}>Günlüğe ekle — tarifi yaptığın gibi düzenle.</Mono>
        <View style={styles.form}>
          <LogForm
            writer={writer}
            today={today}
            initial={{
              cocktailId: cocktail.id,
              drunkOn: today,
              recipe: recipeOf(cocktail),
              rating: null,
              note: "",
              isPublic: settings.logs_public_default,
            }}
            // From a recipe: the list replaces the form, so going back lands on the recipe.
            // From the list: back to it (it reloads when it comes back).
            onDone={() => (fromRecipe ? router.replace("/logs") : leave())}
          />
        </View>
      </View>
    </KeyboardScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgPrimary },
  content: { padding: 24, paddingBottom: 48 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, backgroundColor: colors.bgPrimary },
  muted: { color: colors.textSecondary },
  link: { fontSize: 12, color: colors.crimsonGlow, textDecorationLine: "underline" },
  title: { fontSize: 24 },
  subtitle: { marginTop: 4, fontSize: 12, color: colors.textMuted },
  form: { marginTop: 24 },
  picker: { marginTop: 16, gap: 6 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pressed: { borderColor: colors.borderLight },
  swatch: { width: 4, height: 24, borderRadius: 2 },
  optionText: { flex: 1, minWidth: 0 },
  optionName: { fontFamily: fonts.sansBold, fontSize: 14 },
  optionSubtitle: { fontSize: 11, color: colors.textMuted },
});
