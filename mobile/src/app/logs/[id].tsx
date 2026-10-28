import { formatLogDate, readRecipe, todayInTurkey } from "@shared/drink-log";
import { Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { Notice } from "@/components/Form";
import KeyboardScrollView from "@/components/KeyboardScrollView";
import LogForm from "@/components/LogForm";
import MemberGate from "@/components/MemberGate";
import { Body, Heading, Mono } from "@/components/Type";
import type { Writer } from "@/lib/community";
import { fetchMyLog, leave, type DrinkLog } from "@/lib/drink-logs";
import { readable, type Theme } from "@/lib/theme";
import { useStyles, useTheme } from "@/lib/theme-context";

/** Edit or delete one of the member's own drink logs (the site's /account/logs/{id}). */
export default function EditLogScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <MemberGate from={{ pathname: "/logs/[id]", params: { id } }}>{(writer) => <EditLog writer={writer} id={id} />}</MemberGate>;
}

function EditLog({ writer, id }: { writer: Writer; id: string }) {
  const styles = useStyles(makeStyles);
  const theme = useTheme();
  const [log, setLog] = useState<DrinkLog | null | undefined>(undefined);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    try {
      setLog(await fetchMyLog(writer.id, id));
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, [writer.id, id]);

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
          <ActivityIndicator color={theme.colors.crimsonGlow} />
        )}
      </View>
    );
  }

  if (log === null) {
    return (
      <View style={styles.center}>
        <Body style={styles.muted}>Bu kayıt bulunamadı.</Body>
      </View>
    );
  }

  const recipe = readRecipe(log.recipe);

  return (
    <KeyboardScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: recipe.name }} />
      <View style={readable}>
        <Heading style={styles.title}>{recipe.name}</Heading>
        <Body style={styles.subtitle}>{formatLogDate(log.drunk_on)} kaydını düzenle.</Body>
        {log.hidden_at && (
          <View style={styles.notice}>
            <Notice>Bu kayıt bir yönetici tarafından gizlendi; yalnızca sen görüyorsun.</Notice>
          </View>
        )}
        <View style={styles.form}>
          <LogForm
            writer={writer}
            id={log.id}
            today={todayInTurkey()}
            initial={{
              cocktailId: log.cocktail_id ?? "",
              drunkOn: log.drunk_on,
              recipe,
              rating: log.rating,
              note: log.note ?? "",
              isPublic: log.is_public,
            }}
            onDone={leave}
          />
        </View>
      </View>
    </KeyboardScrollView>
  );
}

const makeStyles = (t: Theme) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: t.colors.bgPrimary },
  content: { padding: 24, paddingBottom: 48 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: t.colors.bgPrimary },
  muted: { color: t.colors.textSecondary },
  link: { fontSize: 12, color: t.colors.crimsonGlow, textDecorationLine: "underline" },
  title: { fontSize: 24 },
  subtitle: { marginTop: 4, fontSize: 12, color: t.colors.textMuted },
  notice: { marginTop: 16 },
  form: { marginTop: 24 },
});
