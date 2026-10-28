import { Stack, router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import Avatar from "@/components/Avatar";
import CocktailCard from "@/components/CocktailCard";
import DrinkLogEntry from "@/components/DrinkLogEntry";
import FollowButton from "@/components/FollowButton";
import ReportButton from "@/components/ReportButton";
import Stars from "@/components/Stars";
import { Body, Heading, Label, Mono } from "@/components/Type";
import { formatDay } from "@/lib/community";
import { fetchNewRecipes, type Cocktail } from "@/lib/content";
import { fetchPublicLogs, type DrinkLog } from "@/lib/drink-logs";
import { useFavorites } from "@/lib/favorites";
import { countComments } from "@/lib/social";
import { supabase } from "@/lib/supabase";
import { readable, type Theme } from "@/lib/theme";
import { useStyles, useTheme } from "@/lib/theme-context";
import { useLocale } from "@/lib/i18n";
import { format } from "@shared/i18n/format";
import { INTL_LOCALES } from "@shared/i18n/locales";

// A member's public profile — the site's /u/{username}: avatar, bio, follow
// counts and "Takip et", the member's recipes, favourites, public drink logs
// (with comment counts) and reviews.

type CocktailLink = { id: string; slug: string; name: string; subtitle: string; color: string; author_id: string | null };

interface ProfileData {
  profile: { id: string; username: string; display_name: string; avatar_path: string | null; bio: string | null; created_at: string };
  favorites: CocktailLink[];
  reviews: { id: string; rating: number; body: string | null; updated_at: string; cocktails: CocktailLink }[];
  logs: DrinkLog[];
  commentCounts: Map<string, number>;
  recipes: Cocktail[];
  followers: number;
  following: number;
}

const LINK_COLUMNS = "id, slug, name, subtitle, color, author_id";

/** The profile and its activity; null when there is no such (visible) member. RLS hides what the site hides. */
async function fetchProfile(username: string): Promise<ProfileData | null> {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_path, bio, created_at")
    .eq("username", username.toLowerCase())
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!profile) return null;

  const [reviews, favorites, logs, recipes, followers, following] = await Promise.all([
    supabase
      .from("reviews")
      .select(`id, rating, body, updated_at, cocktails!inner(${LINK_COLUMNS})`)
      .eq("user_id", profile.id)
      .is("hidden_at", null)
      .order("updated_at", { ascending: false })
      .limit(100),
    supabase
      .from("favorites")
      .select(`created_at, cocktails!inner(${LINK_COLUMNS})`)
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(200),
    fetchPublicLogs(profile.id),
    fetchNewRecipes(60, profile.id),
    supabase.from("follows").select("follower_id", { count: "exact", head: true }).eq("followee_id", profile.id),
    supabase.from("follows").select("followee_id", { count: "exact", head: true }).eq("follower_id", profile.id),
  ]);
  if (reviews.error) throw new Error(reviews.error.message);
  if (favorites.error) throw new Error(favorites.error.message);

  return {
    profile,
    reviews: reviews.data as ProfileData["reviews"],
    favorites: (favorites.data ?? []).map((f) => f.cocktails as CocktailLink),
    logs,
    commentCounts: await countComments(logs.map((l) => l.id)),
    recipes,
    followers: followers.count ?? 0,
    following: following.count ?? 0,
  };
}

/** House recipes open as the archive's recipe, members' recipes on their own screen. */
function openCocktail(c: CocktailLink) {
  if (c.author_id) router.push({ pathname: "/recipes/[slug]", params: { slug: c.slug } });
  else router.push({ pathname: "/cocktail/[slug]", params: { slug: c.slug } });
}

export default function ProfileScreen() {
  const { t, a, locale } = useLocale();
  const styles = useStyles(makeStyles);
  const theme = useTheme();
  const { username } = useLocalSearchParams<{ username: string }>();
  const [data, setData] = useState<ProfileData | null | undefined>(undefined);
  const [failed, setFailed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { favorites: saved } = useFavorites();

  const load = useCallback(async () => {
    try {
      setData(await fetchProfile(username));
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, [username]);

  useEffect(() => {
    load();
  }, [load]);

  if (data === undefined) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: `@${username}` }} />
        {failed ? (
          <Pressable onPress={load}>
            <Mono style={styles.link}>{a.load.profile}</Mono>
          </Pressable>
        ) : (
          <ActivityIndicator color={theme.colors.crimsonGlow} />
        )}
      </View>
    );
  }

  if (data === null) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: `@${username}` }} />
        <Body style={styles.muted}>{a.notFound.profile}</Body>
      </View>
    );
  }

  const { profile, favorites, logs, commentCounts, recipes, reviews, followers, following } = data;
  const joined = new Date(profile.created_at).toLocaleDateString(INTL_LOCALES[locale], { month: "long", year: "numeric" });

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
          tintColor={theme.colors.crimsonGlow}
        />
      }
    >
      <Stack.Screen options={{ title: `@${profile.username}` }} />
      <View style={readable}>
        <Label style={styles.eyebrow}>{t.follow.profileEyebrow}</Label>
        <View style={styles.identity}>
          <Avatar path={profile.avatar_path} name={profile.display_name} size={72} />
          <View style={styles.names}>
            <Heading style={styles.displayName}>{profile.display_name}</Heading>
            <Mono style={styles.username}>@{profile.username}</Mono>
          </View>
        </View>
        {profile.bio && <Body style={styles.bio}>{profile.bio}</Body>}
        <View style={styles.followRow}>
          <Mono style={styles.counts}>
            <Mono style={styles.strong}>{followers}</Mono>{t.profilePage.followersSuffix} · <Mono style={styles.strong}>{following}</Mono>{t.profilePage.followingSuffix}
          </Mono>
          <FollowButton profile={profile} onChanged={load} />
        </View>
        <View style={styles.metaRow}>
          <Mono style={styles.joined}>{format(t.profilePage.memberSince, { date: joined })}</Mono>
          <ReportButton targetType="profile" targetId={profile.id} ownerId={profile.id} label={t.report.reportProfile} />
        </View>

        {recipes.length > 0 && (
          <View style={styles.section}>
            <Label style={styles.sectionTitle}>
              {t.profilePage.recipes} <Label style={styles.sectionCount}>({recipes.length})</Label>
            </Label>
            <View style={styles.recipes}>
              {recipes.map((recipe) => (
                <CocktailCard
                  key={recipe.id}
                  cocktail={recipe}
                  favorite={saved.has(recipe.id)}
                  onPress={() => router.push({ pathname: "/recipes/[slug]", params: { slug: recipe.slug } })}
                />
              ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Label style={styles.sectionTitle}>
            {t.profilePage.favorites} <Label style={styles.sectionCount}>({favorites.length})</Label>
          </Label>
          {favorites.length === 0 ? (
            <Mono style={styles.empty}>{t.profilePage.noFavorites}</Mono>
          ) : (
            <View style={styles.favorites}>
              {favorites.map((c) => (
                <Pressable
                  key={c.id}
                  onPress={() => openCocktail(c)}
                  style={({ pressed }) => [styles.favorite, pressed && styles.pressed]}
                  accessibilityRole="link"
                  accessibilityLabel={c.name}
                >
                  <View style={[styles.swatch, { backgroundColor: c.color }]} />
                  <View style={styles.favoriteText}>
                    <Body numberOfLines={1} style={styles.favoriteName}>
                      {c.name}
                    </Body>
                    <Mono numberOfLines={1} style={styles.favoriteSubtitle}>
                      {c.subtitle}
                    </Mono>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {logs.length > 0 && (
          <View style={styles.section}>
            <Label style={styles.sectionTitle}>
              {t.profilePage.drinkLog} <Label style={styles.sectionCount}>({logs.length})</Label>
            </Label>
            <View style={styles.logs}>
              {logs.map((log) => (
                <DrinkLogEntry key={log.id} log={log} mode="public" commentCount={commentCounts.get(log.id)} />
              ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Label style={styles.sectionTitle}>
            {t.reviews.heading} <Label style={styles.sectionCount}>({reviews.length})</Label>
          </Label>
          {reviews.length === 0 ? (
            <Mono style={styles.empty}>{t.profilePage.noReviews}</Mono>
          ) : (
            reviews.map((review, i) => (
              <View key={review.id} style={[styles.review, i < reviews.length - 1 && styles.reviewRule]}>
                <View style={styles.reviewHead}>
                  <Pressable onPress={() => openCocktail(review.cocktails)} accessibilityRole="link">
                    <Body style={styles.reviewName}>{review.cocktails.name}</Body>
                  </Pressable>
                  <Stars value={review.rating} size={12} />
                  <Mono style={styles.date}>{formatDay(review.updated_at)}</Mono>
                </View>
                {review.body && <Body style={styles.reviewBody}>{review.body}</Body>}
              </View>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const makeStyles = (t: Theme) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: t.colors.bgPrimary },
  content: { padding: 24, paddingBottom: 48 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: t.colors.bgPrimary },
  muted: { color: t.colors.textSecondary },
  link: { color: t.colors.crimsonGlow, textDecorationLine: "underline" },
  eyebrow: { color: t.colors.crimsonGlow, letterSpacing: 2.5, marginBottom: 12 },
  identity: { flexDirection: "row", alignItems: "center", gap: 16 },
  names: { flex: 1 },
  displayName: { fontSize: 26 },
  username: { marginTop: 2, color: t.colors.textMuted },
  bio: { marginTop: 18, lineHeight: 23, color: t.colors.textSecondary },
  followRow: { marginTop: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 },
  counts: { fontSize: 12 },
  strong: { fontSize: 12, color: t.colors.textPrimary },
  metaRow: { marginTop: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 },
  joined: { fontSize: 11, color: t.colors.textMuted },
  section: { marginTop: 36 },
  sectionTitle: { fontSize: 11, letterSpacing: 1.5, marginBottom: 14 },
  sectionCount: { fontSize: 11, color: t.colors.textMuted, opacity: 0.6 },
  empty: { fontSize: 12, color: t.colors.textMuted },
  favorites: { gap: 8 },
  logs: { gap: 12 },
  recipes: { gap: 16 },
  favorite: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: t.colors.border,
    backgroundColor: t.colors.bgCard,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pressed: { borderColor: t.colors.borderLight },
  swatch: { width: 4, height: 24, borderRadius: 2 },
  favoriteText: { flex: 1, minWidth: 0 },
  favoriteName: { fontFamily: t.fonts.sansBold, fontSize: 14 },
  favoriteSubtitle: { fontSize: 11, color: t.colors.textMuted },
  review: { paddingBottom: 18, marginBottom: 18 },
  reviewRule: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.colors.border },
  reviewHead: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", columnGap: 10, rowGap: 4 },
  reviewName: { fontFamily: t.fonts.sansBold, fontSize: 15 },
  date: { fontSize: 10, color: t.colors.textMuted },
  reviewBody: { marginTop: 6, fontSize: 14, lineHeight: 20, color: t.colors.textSecondary },
});
