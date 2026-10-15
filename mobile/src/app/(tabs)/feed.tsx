import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import CocktailCard from "@/components/CocktailCard";
import DrinkLogEntry from "@/components/DrinkLogEntry";
import { Button } from "@/components/Form";
import { Heading, Label, Mono } from "@/components/Type";
import { askToSignIn } from "@/lib/after-sign-in";
import { fetchNewRecipes, fetchPopularRecipes, type Cocktail } from "@/lib/content";
import { useFavorites } from "@/lib/favorites";
import { useSession } from "@/lib/session";
import { fetchFollowingLogs, type AuthoredLog } from "@/lib/social";
import { alpha, colors, readable } from "@/lib/theme";

// The community feed — the site's /feed (ADR-018): members' popular and new
// recipes and the latest public logs of the people you follow. The showcase
// ("Vitrin") arrives with M8 step 6.

const SHOWN = 12;

interface Recipes {
  popular: Cocktail[];
  latest: Cocktail[];
}

export default function FeedScreen() {
  const session = useSession();
  const memberId = session.state === "ok" ? session.profile.id : null;
  const [recipes, setRecipes] = useState<Recipes | null>(null);
  const [failed, setFailed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [following, setFollowing] = useState<{ followsNobody: boolean; logs: AuthoredLog[]; counts: Map<string, number> } | null>(null);

  const loadRecipes = useCallback(async () => {
    try {
      const [popular, latest] = await Promise.all([fetchPopularRecipes(SHOWN), fetchNewRecipes(SHOWN)]);
      setRecipes({ popular, latest });
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, []);

  const loadFollowing = useCallback(async () => {
    if (!memberId) {
      setFollowing(null);
      return;
    }
    try {
      setFollowing(await fetchFollowingLogs(memberId));
    } catch {
      setFollowing({ followsNobody: false, logs: [], counts: new Map() });
    }
  }, [memberId]);

  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);

  // The followed people's logs again whenever the tab comes back: a follow may have changed.
  useFocusEffect(
    useCallback(() => {
      loadFollowing();
    }, [loadFollowing])
  );

  const write = () => {
    if (session.state === "ok") router.push("/my-recipes/new");
    else askToSignIn("/feed");
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            await Promise.all([loadRecipes(), loadFollowing()]);
            setRefreshing(false);
          }}
          tintColor={colors.crimsonGlow}
        />
      }
    >
      <View style={readable}>
        <Label style={styles.eyebrow}>Rx · Akış</Label>
        <View style={styles.head}>
          <View style={styles.headText}>
            <Heading style={styles.title}>Akış</Heading>
            <Mono style={styles.subtitle}>Üyelerin tarifleri ve takip ettiklerinin günlükleri.</Mono>
          </View>
          <Button title="+ Tarif yaz" onPress={write} />
        </View>

        {failed ? (
          <Pressable onPress={loadRecipes} style={styles.section}>
            <Mono style={styles.link}>Tarifler yüklenemedi. Tekrar dene</Mono>
          </Pressable>
        ) : recipes === null ? (
          <ActivityIndicator style={styles.section} color={colors.crimsonGlow} />
        ) : (
          <>
            {recipes.popular.length > 0 && (
              <RecipeRow title="Bu ay popüler" hint="Son 30 günün en çok değerlendirilen ve favorilenen tarifleri" recipes={recipes.popular} />
            )}
            <RecipeRow title="Yeni tarifler" recipes={recipes.latest} empty="Henüz üye tarifi yok. İlk tarifi sen yaz." />
          </>
        )}

        <View style={styles.section}>
          <Label style={styles.sectionTitle}>Takip ettiklerinden</Label>
          {session.state === "loading" ? (
            <Mono style={styles.muted}>Yükleniyor…</Mono>
          ) : session.state !== "ok" ? (
            <View style={styles.prompt}>
              <Mono style={styles.promptText}>
                {session.state === "onboarding"
                  ? "Takip ettiğin kişilerin günlükleri için önce profilini tamamla."
                  : "Takip ettiğin kişilerin içki günlüklerini burada görmek için giriş yap."}
              </Mono>
              <Button
                kind="secondary"
                title={session.state === "onboarding" ? "Profilini tamamla" : "Giriş yap"}
                onPress={() => askToSignIn("/feed")}
              />
            </View>
          ) : following === null ? (
            <Mono style={styles.muted}>Yükleniyor…</Mono>
          ) : following.logs.length === 0 ? (
            <Mono style={styles.muted}>
              {following.followsNobody
                ? "Henüz kimseyi takip etmiyorsun. Bir tarifin sahibinin ya da bir yorumcunun profiline gidip “Takip et”e dokun."
                : "Takip ettiklerin henüz herkese açık bir kayıt paylaşmadı."}
            </Mono>
          ) : (
            <View style={styles.logs}>
              {following.logs.map((log) => (
                <DrinkLogEntry key={log.id} log={log} mode="public" commentCount={following.counts.get(log.id)} />
              ))}
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

function RecipeRow({ title, hint, recipes, empty }: { title: string; hint?: string; recipes: Cocktail[]; empty?: string }) {
  const { favorites } = useFavorites();
  return (
    <View style={styles.section}>
      <Label style={styles.sectionTitle}>{title}</Label>
      {hint && <Mono style={styles.hint}>{hint}</Mono>}
      {recipes.length === 0 ? (
        <Mono style={styles.muted}>{empty}</Mono>
      ) : (
        <View style={styles.cards}>
          {recipes.map((recipe) => (
            <CocktailCard
              key={recipe.id}
              cocktail={recipe}
              favorite={favorites.has(recipe.id)}
              onPress={() => router.push({ pathname: "/recipes/[slug]", params: { slug: recipe.slug } })}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgPrimary },
  content: { padding: 16, paddingTop: 24, paddingBottom: 48 },
  eyebrow: { color: colors.crimsonGlow, letterSpacing: 2.5, marginBottom: 8 },
  head: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12 },
  headText: { flexShrink: 1 },
  title: { fontSize: 26 },
  subtitle: { marginTop: 4, fontSize: 12, lineHeight: 18, color: colors.textMuted },
  section: { marginTop: 36 },
  sectionTitle: { fontSize: 11, letterSpacing: 1.5, marginBottom: 6 },
  hint: { fontSize: 10, color: alpha(colors.textMuted, 0.8), marginBottom: 8 },
  cards: { marginTop: 8, gap: 16 },
  logs: { marginTop: 8, gap: 12 },
  muted: { marginTop: 8, fontSize: 12, lineHeight: 18, color: colors.textMuted },
  link: { fontSize: 12, color: colors.crimsonGlow, textDecorationLine: "underline" },
  prompt: { marginTop: 8, gap: 12, alignItems: "flex-start", backgroundColor: alpha(colors.bgElevated, 0.5), borderRadius: 4, padding: 14 },
  promptText: { fontSize: 12, lineHeight: 18, color: colors.textSecondary },
});
