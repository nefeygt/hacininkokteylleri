import { Stack, router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, StyleSheet, View } from "react-native";
import DrinkLogEntry from "@/components/DrinkLogEntry";
import KeyboardScrollView from "@/components/KeyboardScrollView";
import LogComments from "@/components/LogComments";
import { Body, Heading, Label, Mono } from "@/components/Type";
import { fetchPublicLog, type AuthoredLog } from "@/lib/social";
import { colors, readable } from "@/lib/theme";

/** One public drink log and its comments — the site's /logs/{id} (ADR-018). */
export default function LogScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [log, setLog] = useState<AuthoredLog | null | undefined>(undefined);
  const [failed, setFailed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  // A new key remounts the thread, so pulling to refresh reloads the comments too.
  const [round, setRound] = useState(0);

  const load = useCallback(async () => {
    try {
      setLog(await fetchPublicLog(id));
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (log === undefined) {
    return (
      <View style={styles.center}>
        {failed ? (
          <Pressable onPress={load}>
            <Mono style={styles.link}>Kayıt yüklenemedi. Tekrar dene</Mono>
          </Pressable>
        ) : (
          <ActivityIndicator color={colors.crimsonGlow} />
        )}
      </View>
    );
  }

  if (log === null) {
    return (
      <View style={styles.center}>
        <Body style={styles.muted}>Bu kayıt bulunamadı ya da artık herkese açık değil.</Body>
      </View>
    );
  }

  return (
    <KeyboardScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            await load();
            setRound((r) => r + 1);
            setRefreshing(false);
          }}
          tintColor={colors.crimsonGlow}
        />
      }
    >
      <Stack.Screen options={{ title: `@${log.profiles.username}` }} />
      <View style={readable}>
        <Label style={styles.eyebrow}>Rx · Günlük kaydı</Label>
        <View style={styles.head}>
          <Heading style={styles.title}>{log.profiles.display_name} günlüğünden</Heading>
          <Pressable
            onPress={() => router.push({ pathname: "/u/[username]", params: { username: log.profiles.username } })}
            hitSlop={8}
            accessibilityRole="link"
          >
            <Mono style={styles.profile}>Profil →</Mono>
          </Pressable>
        </View>
        <DrinkLogEntry log={{ ...log, profiles: undefined }} mode="public" showCommentsLink={false} />
        <LogComments key={round} logId={log.id} ownerId={log.user_id} />
      </View>
    </KeyboardScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgPrimary },
  content: { padding: 24, paddingBottom: 48 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: colors.bgPrimary },
  muted: { color: colors.textSecondary, textAlign: "center" },
  link: { fontSize: 12, color: colors.crimsonGlow, textDecorationLine: "underline" },
  eyebrow: { color: colors.crimsonGlow, letterSpacing: 2.5, marginBottom: 8 },
  head: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 16 },
  title: { flex: 1, fontSize: 22 },
  profile: { fontSize: 11, color: colors.textMuted, textDecorationLine: "underline" },
});
