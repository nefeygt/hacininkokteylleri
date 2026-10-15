import { router, useFocusEffect } from "expo-router";
import { Globe, Lock } from "lucide-react-native";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { Button } from "@/components/Form";
import MemberGate from "@/components/MemberGate";
import { Body, Heading, Label, Mono } from "@/components/Type";
import type { Writer } from "@/lib/community";
import { fetchMyRecipes, type OwnRecipe } from "@/lib/recipes";
import { colors, fonts, readable } from "@/lib/theme";

/** The member's own recipes, drafts and published, newest first (the site's /account/recipes). */
export default function MyRecipesScreen() {
  return (
    <MemberGate from="/my-recipes" feature="Tarif yazmak">
      {(writer) => <MyRecipes writer={writer} />}
    </MemberGate>
  );
}

function MyRecipes({ writer }: { writer: Writer }) {
  const [recipes, setRecipes] = useState<OwnRecipe[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setRecipes(await fetchMyRecipes(writer.id));
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, [writer.id]);

  // Again whenever the screen comes back: a recipe was added, edited or deleted.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            await load();
            setRefreshing(false);
          }}
          tintColor={colors.crimsonGlow}
        />
      }
    >
      <View style={readable}>
        <Label style={styles.eyebrow}>Rx · Tarifler</Label>
        <Heading style={styles.title}>Tariflerim</Heading>
        <Mono style={styles.subtitle}>Yazdığın tarifler. Yayındakiler profilinde ve akışta görünür; taslakları yalnızca sen görürsün.</Mono>
        <View style={styles.new}>
          <Button title="+ Yeni tarif" onPress={() => router.push("/my-recipes/new")} />
        </View>

        {failed ? (
          <Pressable onPress={load}>
            <Mono style={styles.link}>Tarifler yüklenemedi. Tekrar dene</Mono>
          </Pressable>
        ) : recipes === null ? (
          <ActivityIndicator color={colors.crimsonGlow} />
        ) : recipes.length === 0 ? (
          <Mono style={styles.empty}>Henüz tarif yok. İlk tarifini yaz.</Mono>
        ) : (
          <View style={styles.list}>
            {recipes.map((r) => {
              const visible = r.is_published && !r.hidden_at;
              return (
                <View key={r.id} style={[styles.item, r.hidden_at ? styles.hidden : null]}>
                  <View style={[styles.swatch, { backgroundColor: r.color }]} />
                  <Pressable
                    onPress={() =>
                      visible
                        ? router.push({ pathname: "/recipes/[slug]", params: { slug: r.slug } })
                        : router.push({ pathname: "/my-recipes/[id]", params: { id: r.id } })
                    }
                    style={styles.itemText}
                    accessibilityRole="link"
                    accessibilityLabel={r.name}
                  >
                    <Body numberOfLines={1} style={styles.name}>
                      {r.name}
                    </Body>
                    <Mono numberOfLines={1} style={styles.small}>
                      {r.hidden_at ? "Yöneticiler tarafından gizlendi; yalnızca sen görüyorsun." : r.subtitle}
                    </Mono>
                  </Pressable>
                  <View style={styles.badge}>
                    {r.is_published ? <Globe size={11} color={colors.textMuted} /> : <Lock size={11} color={colors.textMuted} />}
                    <Mono style={styles.small}>{r.is_published ? "Yayında" : "Taslak"}</Mono>
                  </View>
                  <Pressable
                    onPress={() => router.push({ pathname: "/my-recipes/[id]", params: { id: r.id } })}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={`${r.name} tarifini düzenle`}
                  >
                    <Mono style={styles.edit}>Düzenle</Mono>
                  </Pressable>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgPrimary },
  content: { padding: 24, paddingBottom: 48 },
  eyebrow: { color: colors.crimsonGlow, letterSpacing: 2.5, marginBottom: 8 },
  title: { fontSize: 26 },
  subtitle: { marginTop: 6, fontSize: 12, lineHeight: 18, color: colors.textMuted },
  new: { marginVertical: 24, alignSelf: "flex-start" },
  link: { fontSize: 12, color: colors.crimsonGlow, textDecorationLine: "underline" },
  empty: { fontSize: 12, lineHeight: 18, color: colors.textMuted },
  list: { gap: 8 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  hidden: { opacity: 0.7 },
  swatch: { width: 4, height: 32, borderRadius: 2 },
  itemText: { flex: 1, minWidth: 0 },
  name: { fontFamily: fonts.sansBold, fontSize: 14 },
  small: { fontSize: 10, color: colors.textMuted },
  badge: { flexDirection: "row", alignItems: "center", gap: 4 },
  edit: { fontSize: 11, color: colors.crimsonGlow, textDecorationLine: "underline" },
});
