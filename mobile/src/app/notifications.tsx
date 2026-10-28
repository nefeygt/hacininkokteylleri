import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { describeNotification, type NotificationRow } from "@shared/notifications";
import { INTL_LOCALES, type Locale } from "@shared/i18n/locales";
import Avatar from "@/components/Avatar";
import MemberGate from "@/components/MemberGate";
import { Body, Heading, Label, Mono } from "@/components/Type";
import type { Writer } from "@/lib/community";
import { fetchNotifications, markAllRead, openNotificationLink, useNotifications } from "@/lib/notifications";
import { alpha, readable, type Theme } from "@/lib/theme";
import { useStyles, useTheme } from "@/lib/theme-context";
import { useLocale } from "@/lib/i18n";

/** "28 Ekim 21:40", in Turkish time like the site. */
function formatWhen(value: string, locale: Locale) {
  return new Date(value).toLocaleString(INTL_LOCALES[locale], {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Istanbul",
  });
}

/** What happened to the member's things (the site's /account/notifications, ADR-030). Opening it marks everything read. */
export default function NotificationsScreen() {
  return <MemberGate from="/notifications" feature="notifications">{(writer) => <Notifications writer={writer} />}</MemberGate>;
}

function Notifications({ writer }: { writer: Writer }) {
  const { t, a } = useLocale();
  const styles = useStyles(makeStyles);
  const theme = useTheme();
  const { refresh } = useNotifications();
  const [rows, setRows] = useState<NotificationRow[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // The rows keep their "new" marks for this visit; the database (and the badge) see them read.
  const load = useCallback(async () => {
    try {
      const next = await fetchNotifications(writer.id);
      setRows(next);
      setFailed(false);
      if (next.some((row) => !row.read_at)) {
        await markAllRead(writer.id);
        await refresh();
      }
    } catch {
      setFailed(true);
    }
  }, [writer.id, refresh]);

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
        <Label style={styles.eyebrow}>{t.notificationsPage.eyebrow}</Label>
        <Heading style={styles.title}>{t.notificationsPage.title}</Heading>
        <Body style={styles.subtitle}>{t.notificationsPage.subtitle}</Body>

        <View style={styles.body}>
          {failed ? (
            <Pressable onPress={load}>
              <Mono style={styles.link}>{a.load.notifications}</Mono>
            </Pressable>
          ) : rows === null ? (
            <ActivityIndicator color={theme.colors.crimsonGlow} />
          ) : rows.length === 0 ? (
            <Body style={styles.empty}>{t.notificationsPage.empty}</Body>
          ) : (
            <View style={styles.list}>
              {rows.map((row, i) => (
                <NotificationItem key={row.id} row={row} last={i === rows.length - 1} />
              ))}
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

function NotificationItem({ row, last }: { row: NotificationRow; last: boolean }) {
  const { t, locale } = useLocale();
  const styles = useStyles(makeStyles);
  const { text, href } = describeNotification(row, t);
  const sentence = row.actor ? `@${row.actor.username} ${text}` : text;
  return (
    <Pressable
      onPress={() => openNotificationLink(href)}
      style={({ pressed }) => [styles.item, !row.read_at && styles.unread, !last && styles.rule, pressed && styles.pressed]}
      accessibilityRole="link"
      accessibilityLabel={row.read_at ? sentence : `${t.notificationsPage.new}: ${sentence}`}
    >
      {row.actor ? (
        <Avatar path={row.actor.avatar_path} name={row.actor.display_name} size={32} />
      ) : (
        <View style={styles.house}>
          <Mono style={styles.houseText}>Rx</Mono>
        </View>
      )}
      <View style={styles.itemBody}>
        <Body style={styles.text}>
          {row.actor && <Body style={styles.actor}>@{row.actor.username} </Body>}
          {text}
        </Body>
        <Mono style={styles.when}>{formatWhen(row.created_at, locale)}</Mono>
      </View>
      {!row.read_at && <View style={styles.dot} />}
    </Pressable>
  );
}

const makeStyles = (t: Theme) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: t.colors.bgPrimary },
  content: { padding: 24, paddingBottom: 48 },
  eyebrow: { color: t.colors.crimsonGlow, letterSpacing: 2.5, marginBottom: 8 },
  title: { fontSize: 26 },
  subtitle: { marginTop: 6, fontSize: 12, lineHeight: 18, color: t.colors.textMuted },
  body: { marginTop: 24 },
  link: { fontSize: 12, color: t.colors.crimsonGlow, textDecorationLine: "underline" },
  empty: { fontSize: 13, lineHeight: 20, color: t.colors.textMuted },
  list: { borderWidth: 1, borderColor: t.colors.border, borderRadius: 4, backgroundColor: t.colors.bgCard, overflow: "hidden" },
  item: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  unread: { backgroundColor: alpha(t.colors.crimson, 0.06) },
  rule: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.colors.border },
  pressed: { backgroundColor: t.colors.bgElevated },
  house: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: t.colors.border,
    backgroundColor: t.colors.bgElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  houseText: { fontSize: 10, color: t.colors.crimsonGlow },
  itemBody: { flex: 1, minWidth: 0 },
  text: { fontSize: 14, lineHeight: 20, color: t.colors.textPrimary },
  actor: { fontSize: 14, lineHeight: 20, fontFamily: t.fonts.sansBold, color: t.colors.textPrimary },
  when: { marginTop: 2, fontSize: 10, color: t.colors.textMuted },
  dot: { marginTop: 7, width: 8, height: 8, borderRadius: 4, backgroundColor: t.colors.crimsonGlow },
});
