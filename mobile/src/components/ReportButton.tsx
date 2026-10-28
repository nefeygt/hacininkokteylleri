import { REPORT_REASON_MAX_LENGTH } from "@shared/community";
import { Flag } from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { reportContent, type ReportableTarget } from "@/lib/community";
import { useSession } from "@/lib/session";
import { alpha, type Theme } from "@/lib/theme";
import { useStyles, useTheme } from "@/lib/theme-context";
import { Message } from "./Form";
import { Mono } from "./Type";
import { useLocale } from "@/lib/i18n";

/**
 * "Bildir" (the site's ReportButton): opens a small inline form with an
 * optional reason, then sends the report. Shown only to members who do not
 * own the content — `ownerId` is that owner.
 */
export default function ReportButton({
  targetType,
  targetId,
  ownerId,
  label,
}: {
  targetType: ReportableTarget;
  targetId: string;
  ownerId: string;
  label?: string;
}) {
  const { t } = useLocale();
  const styles = useStyles(makeStyles);
  const theme = useTheme();
  const session = useSession();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [reported, setReported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (session.state !== "ok" || session.profile.id === ownerId) return null;
  const writer = { id: session.profile.id, username: session.profile.username };

  async function send() {
    setError(null);
    setPending(true);
    const result = await reportContent(writer, targetType, targetId, reason);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setReported(true);
    setOpen(false);
  }

  if (reported) return <Mono style={styles.small}>{t.report.reported}</Mono>;

  if (!open) {
    return (
      <Pressable onPress={() => setOpen(true)} hitSlop={8} style={styles.trigger} accessibilityRole="button" accessibilityLabel={label}>
        <Flag size={11} color={theme.colors.textMuted} />
        <Mono style={styles.small}>{label ?? t.report.report}</Mono>
      </Pressable>
    );
  }

  return (
    <View style={styles.form}>
      <TextInput
        value={reason}
        onChangeText={setReason}
        maxLength={REPORT_REASON_MAX_LENGTH}
        placeholder={t.report.reasonPlaceholder}
        placeholderTextColor={theme.colors.textMuted}
        accessibilityLabel={t.report.reasonLabel}
        style={styles.input}
      />
      {error && <Message error>{error}</Message>}
      <View style={styles.actions}>
        <Pressable onPress={send} disabled={pending} style={[styles.send, pending && styles.off]} accessibilityRole="button" accessibilityLabel={t.common.send}>
          <Mono style={styles.sendText}>{pending ? t.common.sending : t.common.send}</Mono>
        </Pressable>
        <Pressable onPress={() => setOpen(false)} disabled={pending} hitSlop={8} accessibilityRole="button" accessibilityLabel={t.common.cancel}>
          <Mono style={styles.small}>{t.common.cancel}</Mono>
        </Pressable>
      </View>
    </View>
  );
}

const makeStyles = (t: Theme) => StyleSheet.create({
  trigger: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start" },
  small: { fontSize: 11, color: t.colors.textMuted },
  form: {
    alignSelf: "stretch",
    gap: 8,
    borderWidth: 1,
    borderColor: t.colors.border,
    backgroundColor: alpha(t.colors.bgElevated, 0.4),
    borderRadius: 4,
    padding: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: t.colors.border,
    backgroundColor: t.colors.bgCard,
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: t.colors.textPrimary,
    fontFamily: t.fonts.sans,
    fontSize: 13,
  },
  actions: { flexDirection: "row", alignItems: "center", gap: 14 },
  send: { backgroundColor: t.colors.crimson, borderRadius: 4, paddingHorizontal: 12, paddingVertical: 5 },
  sendText: { fontSize: 11, color: "#fff" },
  off: { opacity: 0.5 },
});
