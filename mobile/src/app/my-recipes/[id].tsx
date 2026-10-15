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
import { colors, readable } from "@/lib/theme";

/** Edit or delete one of the member's own recipes (the site's /account/recipes/{id}). */
export default function EditRecipeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <MemberGate from={{ pathname: "/my-recipes/[id]", params: { id } }} feature="Tarif yazmak">
      {(writer) => <EditRecipe writer={writer} id={id} />}
    </MemberGate>
  );
}

function EditRecipe({ writer, id }: { writer: Writer; id: string }) {
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
            <Mono style={styles.link}>Tarif yüklenemedi. Tekrar dene</Mono>
          </Pressable>
        ) : (
          <ActivityIndicator color={colors.crimsonGlow} />
        )}
      </View>
    );
  }

  if (recipe === null) {
    return (
      <View style={styles.center}>
        <Body style={styles.muted}>Bu tarif bulunamadı.</Body>
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
            <Mono style={styles.pageText}>Tarif sayfası →</Mono>
          </Pressable>
        )}
        {recipe.hidden && (
          <View style={styles.notice}>
            <Notice>Bu tarif bir yönetici tarafından gizlendi; yalnızca sen görüyorsun.</Notice>
          </View>
        )}
        <RecipeForm writer={writer} initial={recipe.input} id={recipe.id} slug={recipe.slug} />
      </View>
    </KeyboardScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgPrimary },
  content: { padding: 16, paddingBottom: 48 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, backgroundColor: colors.bgPrimary },
  muted: { color: colors.textSecondary },
  link: { fontSize: 12, color: colors.crimsonGlow, textDecorationLine: "underline" },
  page: { alignSelf: "flex-end", marginBottom: 12 },
  pageText: { fontSize: 11, color: colors.textMuted, textDecorationLine: "underline" },
  notice: { marginBottom: 16 },
});
