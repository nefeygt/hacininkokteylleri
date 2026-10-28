import { Check } from "lucide-react-native";
import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View, type TextInputProps } from "react-native";
import { alpha, type Theme } from "@/lib/theme";
import { useStyles, useTheme } from "@/lib/theme-context";
import { Label, Mono } from "./Type";

// The site's account forms (AccountCard's field, label and button classes) for React Native.

export function Field({ label, hint, prefix, style, ...props }: TextInputProps & { label: string; hint?: string; prefix?: string }) {
  const styles = useStyles(makeStyles);
  const theme = useTheme();
  return (
    <View style={styles.field}>
      <Label style={styles.label}>{label}</Label>
      <View style={styles.inputRow}>
        {prefix && <Mono style={styles.prefix}>{prefix}</Mono>}
        <TextInput
          placeholderTextColor={theme.colors.textMuted}
          accessibilityLabel={label}
          {...props}
          style={[styles.input, prefix ? styles.inputWithPrefix : null, style]}
        />
      </View>
      {hint && <Mono style={styles.hint}>{hint}</Mono>}
    </View>
  );
}

type ButtonKind = "primary" | "secondary" | "danger" | "link";

export function Button({
  title,
  onPress,
  kind = "primary",
  pending = false,
  disabled = false,
  icon,
}: {
  title: string;
  onPress: () => void;
  kind?: ButtonKind;
  pending?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
}) {
  const styles = useStyles(makeStyles);
  const buttonStyles = useStyles(makeButtonStyles);
  const buttonText = useStyles(makeButtonText);
  const theme = useTheme();
  const off = pending || disabled;
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: off, busy: pending }}
      style={({ pressed }) => [styles.button, buttonStyles[kind], off && styles.off, pressed && !off && styles.pressed]}
    >
      {pending ? <ActivityIndicator size="small" color={kind === "primary" ? "#fff" : theme.colors.textSecondary} /> : icon}
      <Mono style={[styles.buttonText, buttonText[kind]]}>{title}</Mono>
    </Pressable>
  );
}

export function Checkbox({ checked, onChange, children, label }: { checked: boolean; onChange: (next: boolean) => void; children: ReactNode; label: string }) {
  const styles = useStyles(makeStyles);
  return (
    <Pressable
      onPress={() => onChange(!checked)}
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked }}
      style={styles.checkRow}
    >
      <View style={[styles.box, checked && styles.boxOn]}>{checked && <Check size={12} color="#fff" strokeWidth={3} />}</View>
      <View style={styles.checkText}>{children}</View>
    </Pressable>
  );
}

/** An error (crimson) or a plain notice under a form. */
export function Message({ children, error = false }: { children: ReactNode; error?: boolean }) {
  const styles = useStyles(makeStyles);
  return <Mono style={[styles.message, error && styles.error]}>{children}</Mono>;
}

export function Notice({ children }: { children: ReactNode }) {
  const styles = useStyles(makeStyles);
  return (
    <View style={styles.notice}>
      <Mono style={styles.noticeText}>{children}</Mono>
    </View>
  );
}

export function Divider({ label }: { label: string }) {
  const styles = useStyles(makeStyles);
  return (
    <View style={styles.divider}>
      <View style={styles.rule} />
      <Label>{label}</Label>
      <View style={styles.rule} />
    </View>
  );
}

const makeStyles = (t: Theme) => StyleSheet.create({
  field: { gap: 6 },
  label: { color: t.colors.textSecondary, fontSize: 11, letterSpacing: 1.5 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: t.colors.border,
    borderRadius: 4,
    backgroundColor: t.colors.bgPrimary,
  },
  prefix: { paddingLeft: 12, color: t.colors.textMuted, fontSize: 14 },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: t.colors.textPrimary,
    fontFamily: t.fonts.sans,
    fontSize: 15,
  },
  inputWithPrefix: { paddingLeft: 4, fontFamily: t.fonts.mono, fontSize: 14 },
  hint: { fontSize: 11, color: t.colors.textMuted },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  buttonText: { fontSize: 13 },
  off: { opacity: 0.5 },
  pressed: { opacity: 0.8 },
  checkRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  box: {
    width: 18,
    height: 18,
    marginTop: 1,
    borderWidth: 1,
    borderColor: t.colors.borderLight,
    borderRadius: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  boxOn: { backgroundColor: t.colors.crimson, borderColor: t.colors.crimson },
  checkText: { flex: 1 },
  message: { fontSize: 12, lineHeight: 18, color: t.colors.textSecondary },
  error: { color: t.colors.crimsonGlow },
  notice: { borderWidth: 1, borderColor: alpha(t.colors.crimson, 0.4), backgroundColor: alpha(t.colors.crimson, 0.1), borderRadius: 4, padding: 12 },
  noticeText: { fontSize: 12, lineHeight: 18 },
  divider: { flexDirection: "row", alignItems: "center", gap: 12 },
  rule: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: t.colors.border },
});

const makeButtonStyles = (t: Theme) => StyleSheet.create({
  primary: { backgroundColor: t.colors.crimson },
  secondary: { borderWidth: 1, borderColor: t.colors.borderLight, backgroundColor: t.colors.bgElevated },
  danger: { borderWidth: 1, borderColor: alpha(t.colors.crimson, 0.5) },
  link: { paddingHorizontal: 0, paddingVertical: 4, justifyContent: "flex-start" },
});

const makeButtonText = (t: Theme) => StyleSheet.create({
  primary: { color: "#fff" },
  secondary: { color: t.colors.textPrimary },
  danger: { color: t.colors.crimsonGlow },
  link: { color: t.colors.textMuted, fontSize: 11, textDecorationLine: "underline" },
});
