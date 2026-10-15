import { Check } from "lucide-react-native";
import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View, type TextInputProps } from "react-native";
import { colors, fonts } from "@/lib/theme";
import { Label, Mono } from "./Type";

// The site's account forms (AccountCard's field, label and button classes) for React Native.

export function Field({ label, hint, prefix, style, ...props }: TextInputProps & { label: string; hint?: string; prefix?: string }) {
  return (
    <View style={styles.field}>
      <Label style={styles.label}>{label}</Label>
      <View style={styles.inputRow}>
        {prefix && <Mono style={styles.prefix}>{prefix}</Mono>}
        <TextInput
          placeholderTextColor={colors.textMuted}
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
      {pending ? <ActivityIndicator size="small" color={kind === "primary" ? "#fff" : colors.textSecondary} /> : icon}
      <Mono style={[styles.buttonText, buttonText[kind]]}>{title}</Mono>
    </Pressable>
  );
}

export function Checkbox({ checked, onChange, children, label }: { checked: boolean; onChange: (next: boolean) => void; children: ReactNode; label: string }) {
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
  return <Mono style={[styles.message, error && styles.error]}>{children}</Mono>;
}

export function Notice({ children }: { children: ReactNode }) {
  return (
    <View style={styles.notice}>
      <Mono style={styles.noticeText}>{children}</Mono>
    </View>
  );
}

export function Divider({ label }: { label: string }) {
  return (
    <View style={styles.divider}>
      <View style={styles.rule} />
      <Label>{label}</Label>
      <View style={styles.rule} />
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 6 },
  label: { color: colors.textSecondary, fontSize: 11, letterSpacing: 1.5 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    backgroundColor: colors.bgPrimary,
  },
  prefix: { paddingLeft: 12, color: colors.textMuted, fontSize: 14 },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.textPrimary,
    fontFamily: fonts.sans,
    fontSize: 15,
  },
  inputWithPrefix: { paddingLeft: 4, fontFamily: fonts.mono, fontSize: 14 },
  hint: { fontSize: 11, color: colors.textMuted },
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
    borderColor: colors.borderLight,
    borderRadius: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  boxOn: { backgroundColor: colors.crimson, borderColor: colors.crimson },
  checkText: { flex: 1 },
  message: { fontSize: 12, lineHeight: 18, color: colors.textSecondary },
  error: { color: colors.crimsonGlow },
  notice: { borderWidth: 1, borderColor: "rgba(139, 26, 26, 0.4)", backgroundColor: "rgba(139, 26, 26, 0.1)", borderRadius: 4, padding: 12 },
  noticeText: { fontSize: 12, lineHeight: 18 },
  divider: { flexDirection: "row", alignItems: "center", gap: 12 },
  rule: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
});

const buttonStyles = StyleSheet.create({
  primary: { backgroundColor: colors.crimson },
  secondary: { borderWidth: 1, borderColor: colors.borderLight, backgroundColor: colors.bgElevated },
  danger: { borderWidth: 1, borderColor: "rgba(139, 26, 26, 0.5)" },
  link: { paddingHorizontal: 0, paddingVertical: 4, justifyContent: "flex-start" },
});

const buttonText = StyleSheet.create({
  primary: { color: "#fff" },
  secondary: { color: colors.textPrimary },
  danger: { color: colors.crimsonGlow },
  link: { color: colors.textMuted, fontSize: 11, textDecorationLine: "underline" },
});
