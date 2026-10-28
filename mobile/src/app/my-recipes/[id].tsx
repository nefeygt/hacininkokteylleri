import { Stack, router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { Notice } from "@/components/Form";
import KeyboardScrollView from "@/components/KeyboardScrollView";
import MemberGate from "@/components/MemberGate";
import RecipeForm from "@/components/RecipeForm";
import { Body, Mono } from "@/components/Type";
import type { Writer } from "@/lib/community";
import { fetchMyRecipe, type EditableRecipe } from "@/lib/recipes";
import { readable, type Theme } from "@/lib/theme";
import { useStyles, useTheme } from "@/lib/theme-context";
import { useLocale } from "@/lib/i18n";

/** Edit or delete one of the member's own recipes (the site's /account/recipes/{id}). */
export default function EditRecipeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <MemberGate from={{ pathname: "/my-recipes/[id]", params: { id } }} feature="recipes">
      {(writer) => <EditRecipe writer={writer} id={id} />}
    </MemberGate>
  );
}

function EditRecipe({ writer, id }: { writer: Writer; id: string }) {
  const { t, a } = useLocale();
  const styles = useStyles(makeStyles);
  const theme = useTheme();
  const [recipe, setRecipe] = useState<EditableRecipe | null | undefined>(undefined);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    try {
      setRecipe(await fetchMyRecipe(writer.id, id));
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, [writer.id, id]);

  useEffect(() => {
    load();
  }, [load]);

  if (recipe === undefined) {
    return (
      <View style={styles.center}>
        {failed ? (
          <Pressable onPress={load}>
            <Mono style={styles.link}>{a.load.recipe}</Mono>
          </Pressable>
        ) : (
          <ActivityIndicator color={theme.colors.crimsonGlow} />
        )}
      </View>
    );
  }

  if (recipe === null) {
    return (
      <View style={styles.center}>
        <Body style={styles.muted}>{a.notFound.recipe}</Body>
        <Pressable onPress={() => router.replace("/my-recipes")}>
          <Mono style={styles.link}>Tariflerim</Mono>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: recipe.input.name }} />
      <View style={readable}>
        {recipe.input.isPublished && !recipe.hidden && (
          <Pressable
            onPress={() => router.push({ pathname: "/recipes/[slug]", params: { slug: recipe.slug } })}
            style={styles.page}
            accessibilityRole="link"
          >
            <Mono style={styles.pageText}>{t.recipesPage.recipePage}</Mono>
          </Pressable>
        )}
        {recipe.hidden && (
          <View style={styles.notice}>
            <Notice>{t.recipesPage.hiddenBanner}</Notice>
          </View>
        )}
        <RecipeForm writer={writer} initial={recipe.input} id={recipe.id} slug={recipe.slug} />
      </View>
    </KeyboardScrollView>
  );
}

const makeStyles = (t: Theme) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: t.colors.bgPrimary },
  content: { padding: 16, paddingBottom: 48 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, backgroundColor: t.colors.bgPrimary },
  muted: { color: t.colors.textSecondary },
  link: { fontSize: 12, color: t.colors.crimsonGlow, textDecorationLine: "underline" },
  page: { alignSelf: "flex-end", marginBottom: 12 },
  pageText: { fontSize: 11, color: t.colors.textMuted, textDecorationLine: "underline" },
  notice: { marginBottom: 16 },
});
