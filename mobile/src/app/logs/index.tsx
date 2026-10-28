import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import DrinkLogEntry from "@/components/DrinkLogEntry";
import { Button } from "@/components/Form";
import MemberGate from "@/components/MemberGate";
import { Body, Heading, Label, Mono } from "@/components/Type";
import type { Writer } from "@/lib/community";
import { fetchMyLogs, type DrinkLog } from "@/lib/drink-logs";
import { readable, type Theme } from "@/lib/theme";
import { useStyles, useTheme } from "@/lib/theme-context";

/** The member's own drink logs, private and public, newest first (the site's /account/logs). */
export default function LogsScreen() {
  return <MemberGate from="/logs">{(writer) => <Logs writer={writer} />}</MemberGate>;
}

function Logs({ writer }: { writer: Writer }) {
  const styles = useStyles(makeStyles);
  const theme = useTheme();
  const [logs, setLogs] = useState<DrinkLog[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setLogs(await fetchMyLogs(writer.id));
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, [writer.id]);

  // Again whenever the screen comes back: a log was added, edited or deleted.
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
          tintColor={theme.colors.crimsonGlow}
        />
      }
    >
      <View style={readable}>
        <Label style={styles.eyebrow}>Rx · Günlük</Label>
        <Heading style={styles.title}>İçki günlüğüm</Heading>
        <Body style={styles.subtitle}>
          Yaptığın ya da içtiğin her kokteyl, o akşamki hâliyle. Herkese açık olmayanları yalnızca sen görürsün.
        </Body>
        <View style={styles.new}>
          <Button title="+ Yeni kayıt" onPress={() => router.push("/logs/new")} />
        </View>

        {failed ? (
          <Pressable onPress={load}>
            <Mono style={styles.link}>Kayıtlar yüklenemedi. Tekrar dene</Mono>
          </Pressable>
        ) : logs === null ? (
          <ActivityIndicator color={theme.colors.crimsonGlow} />
        ) : logs.length === 0 ? (
          <Mono style={styles.empty}>
            Henüz kayıt yok. Arşivde bir tarifi açıp “Günlüğe ekle”ye dokun ya da yukarıdan bir kokteyl seç.
          </Mono>
        ) : (
          <View style={styles.list}>
            {logs.map((log) => (
              <DrinkLogEntry key={log.id} log={log} mode="own" />
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const makeStyles = (t: Theme) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: t.colors.bgPrimary },
  content: { padding: 24, paddingBottom: 48 },
  eyebrow: { color: t.colors.crimsonGlow, letterSpacing: 2.5, marginBottom: 8 },
  title: { fontSize: 26 },
  subtitle: { marginTop: 6, fontSize: 12, lineHeight: 18, color: t.colors.textMuted },
  new: { marginVertical: 24, alignSelf: "flex-start" },
  link: { fontSize: 12, color: t.colors.crimsonGlow, textDecorationLine: "underline" },
  empty: { fontSize: 12, lineHeight: 18, color: t.colors.textMuted },
  list: { gap: 12 },
});
