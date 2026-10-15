import { REPORT_REASON_MAX_LENGTH } from "@shared/community";
import { Flag } from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { reportContent, type ReportableTarget } from "@/lib/community";
import { useSession } from "@/lib/session";
import { alpha, colors, fonts } from "@/lib/theme";
import { Message } from "./Form";
import { Mono } from "./Type";

/**
 * "Bildir" (the site's ReportButton): opens a small inline form with an
 * optional reason, then sends the report. Shown only to members who do not
 * own the content — `ownerId` is that owner.
 */
export default function ReportButton({
  targetType,
  targetId,
  ownerId,
  label = "Bildir",
}: {
  targetType: ReportableTarget;
  targetId: string;
  ownerId: string;
  label?: string;
}) {
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

  if (reported) return <Mono style={styles.small}>Bildirildi, teşekkürler.</Mono>;

  if (!open) {
    return (
      <Pressable onPress={() => setOpen(true)} hitSlop={8} style={styles.trigger} accessibilityRole="button" accessibilityLabel={label}>
        <Flag size={11} color={colors.textMuted} />
        <Mono style={styles.small}>{label}</Mono>
      </Pressable>
    );
  }

  return (
    <View style={styles.form}>
      <TextInput
        value={reason}
        onChangeText={setReason}
        maxLength={REPORT_REASON_MAX_LENGTH}
        placeholder="Neden? (isteğe bağlı)"
        placeholderTextColor={colors.textMuted}
        accessibilityLabel="Bildirim nedeni"
        style={styles.input}
      />
      {error && <Message error>{error}</Message>}
      <View style={styles.actions}>
        <Pressable onPress={send} disabled={pending} style={[styles.send, pending && styles.off]} accessibilityRole="button" accessibilityLabel="Gönder">
          <Mono style={styles.sendText}>{pending ? "Gönderiliyor…" : "Gönder"}</Mono>
        </Pressable>
        <Pressable onPress={() => setOpen(false)} disabled={pending} hitSlop={8} accessibilityRole="button" accessibilityLabel="Vazgeç">
          <Mono style={styles.small}>Vazgeç</Mono>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start" },
  small: { fontSize: 11, color: colors.textMuted },
  form: {
    alignSelf: "stretch",
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: alpha(colors.bgElevated, 0.4),
    borderRadius: 4,
    padding: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: colors.textPrimary,
    fontFamily: fonts.sans,
    fontSize: 13,
  },
  actions: { flexDirection: "row", alignItems: "center", gap: 14 },
  send: { backgroundColor: colors.crimson, borderRadius: 4, paddingHorizontal: 12, paddingVertical: 5 },
  sendText: { fontSize: 11, color: "#fff" },
  off: { opacity: 0.5 },
});
