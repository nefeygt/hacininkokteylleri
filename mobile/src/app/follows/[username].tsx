import { Stack, router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import Avatar from "@/components/Avatar";
import { Body, Heading, Label, Mono } from "@/components/Type";
import { fetchFollowList, type FollowListKind, type FollowPerson } from "@/lib/social";
import { supabase } from "@/lib/supabase";
import { alpha, readable, type Theme } from "@/lib/theme";
import { useStyles, useTheme } from "@/lib/theme-context";
import { useLocale } from "@/lib/i18n";
import { format } from "@shared/i18n/format";

type Owner = { id: string; username: string; display_name: string };
type ListData = { owner: Owner; people: FollowPerson[]; total: number };

/** A profile's followers or the people they follow (the site's /u/{username}/followers and /following). */
export default function FollowsScreen() {
  const { t, a } = useLocale();
  const styles = useStyles(makeStyles);
  const theme = useTheme();
  const params = useLocalSearchParams<{ username: string; kind?: string }>();
  const username = params.username;
  const [kind, setKind] = useState<FollowListKind>(params.kind === "following" ? "following" : "followers");
  const [data, setData] = useState<ListData | null | undefined>(undefined);
  const [failed, setFailed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data: owner, error } = await supabase
        .from("profiles")
        .select("id, username, display_name")
        .eq("username", username.toLowerCase())
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!owner) {
        setData(null);
        return;
      }
      setData({ owner, ...(await fetchFollowList(owner.id, kind)) });
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, [username, kind]);

  useEffect(() => {
    load();
  }, [load]);

  const title = kind === "followers" ? t.follow.followers : t.follow.followingTitle;
  const header = <Stack.Screen options={{ title: `@${username}` }} />;

  if (data === undefined || data === null) {
    return (
      <View style={styles.center}>
        {header}
        {data === null ? (
          <Body style={styles.muted}>{a.notFound.profile}</Body>
        ) : failed ? (
          <Pressable onPress={load}>
            <Mono style={styles.link}>{a.load.people}</Mono>
          </Pressable>
        ) : (
          <ActivityIndicator color={theme.colors.crimsonGlow} />
        )}
      </View>
    );
  }

  const { owner, people, total } = data;
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
      {header}
      <View style={readable}>
        <Label style={styles.eyebrow}>{t.follow.profileEyebrow}</Label>
        <Heading style={styles.title}>
          {title} <Heading style={styles.total}>({total})</Heading>
        </Heading>

        <View style={styles.tabs} accessibilityRole="tablist" accessibilityLabel={t.follow.lists}>
          {(["followers", "following"] as const).map((k) => (
            <Pressable
              key={k}
              onPress={() => {
                if (k === kind) return;
                setKind(k);
                setData(undefined);
              }}
              accessibilityRole="tab"
              accessibilityState={{ selected: k === kind }}
              style={[styles.tab, k === kind && styles.tabOn]}
            >
              <Mono style={[styles.tabText, k === kind && styles.tabTextOn]}>
                {k === "followers" ? t.follow.followers : t.follow.followingTitle}
              </Mono>
            </Pressable>
          ))}
        </View>

        {failed ? (
          <Pressable onPress={load}>
            <Mono style={styles.link}>{a.load.people}</Mono>
          </Pressable>
        ) : people.length === 0 ? (
          <Mono style={styles.empty}>
            {format(kind === "followers" ? t.follow.noFollowers : t.follow.noFollowing, { name: owner.display_name })}
          </Mono>
        ) : (
          <View style={styles.list}>
            {people.map((p, i) => (
              <Pressable
                key={p.username}
                onPress={() => router.push({ pathname: "/u/[username]", params: { username: p.username } })}
                style={({ pressed }) => [styles.person, i < people.length - 1 && styles.rule, pressed && styles.pressed]}
                accessibilityRole="link"
                accessibilityLabel={`${p.display_name}, @${p.username}`}
              >
                <Avatar path={p.avatar_path} name={p.display_name} size={36} />
                <View style={styles.personText}>
                  <Body numberOfLines={1} style={styles.name}>
                    {p.display_name}
                  </Body>
                  <Mono numberOfLines={1} style={styles.handle}>
                    @{p.username}
                    {p.bio ? <Mono style={styles.bio}> · {p.bio}</Mono> : null}
                  </Mono>
                </View>
              </Pressable>
            ))}
          </View>
        )}
        {total > people.length && <Mono style={styles.more}>{format(t.follow.firstShown, { n: people.length })}</Mono>}
      </View>
    </ScrollView>
  );
}

const makeStyles = (t: Theme) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: t.colors.bgPrimary },
  content: { padding: 24, paddingBottom: 48 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: t.colors.bgPrimary },
  muted: { color: t.colors.textSecondary },
  link: { fontSize: 12, color: t.colors.crimsonGlow, textDecorationLine: "underline" },
  eyebrow: { color: t.colors.crimsonGlow, letterSpacing: 2.5, marginBottom: 8 },
  title: { fontSize: 26 },
  total: { fontSize: 26, color: t.colors.textMuted },
  tabs: { marginTop: 20, marginBottom: 24, flexDirection: "row", gap: 8 },
  tab: { borderRadius: 4, paddingHorizontal: 12, paddingVertical: 7 },
  tabOn: { backgroundColor: alpha(t.colors.crimson, 0.15) },
  tabText: { fontSize: 11, color: t.colors.textSecondary },
  tabTextOn: { color: t.colors.crimsonGlow },
  empty: { fontSize: 12, lineHeight: 18, color: t.colors.textMuted },
  list: { borderWidth: 1, borderColor: t.colors.border, borderRadius: 4, backgroundColor: t.colors.bgCard, overflow: "hidden" },
  person: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  rule: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.colors.border },
  pressed: { backgroundColor: t.colors.bgElevated },
  personText: { flex: 1, minWidth: 0 },
  name: { fontFamily: t.fonts.sansBold, fontSize: 14 },
  handle: { fontSize: 11, color: t.colors.textMuted },
  bio: { fontSize: 11, color: t.colors.textSecondary },
  more: { marginTop: 14, fontSize: 11, color: t.colors.textMuted },
});
