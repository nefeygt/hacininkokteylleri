import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { alpha, type Theme } from "@/lib/theme";
import { useStyles } from "@/lib/theme-context";
import { Label, Mono } from "./Type";
import { useLocale } from "@/lib/i18n";

export interface Option {
  value: string;
  label: string;
  /** A heading shown above the first option of each group (the catalogue's categories). */
  group?: string;
}

/**
 * A short list to pick one value from, as a sheet over the form (units,
 * ingredient icons). Open while `current` is not null.
 */
export default function OptionSheet({
  title,
  options,
  current,
  onPick,
  onClose,
}: {
  title: string;
  options: Option[];
  current: string | null;
  onPick: (value: string) => void;
  onClose: () => void;
}) {
  const { t } = useLocale();
  const styles = useStyles(makeStyles);
  return (
    <Modal visible={current !== null} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel={t.cocktails.close}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <Label style={styles.title}>{title}</Label>
          <ScrollView style={styles.list}>
            {options.map((option, index) => {
              const on = option.value === current;
              const heading = option.group && option.group !== options[index - 1]?.group ? option.group : null;
              return (
                <View key={option.value}>
                {heading && <Label style={styles.group}>{heading}</Label>}
                <Pressable
                  onPress={() => onPick(option.value)}
                  style={({ pressed }) => [styles.option, on && styles.optionOn, pressed && styles.optionPressed]}
                  accessibilityRole="button"
                  accessibilityLabel={option.label}
                  accessibilityState={{ selected: on }}
                >
                  <Mono style={[styles.optionText, on && styles.optionTextOn]}>{option.label}</Mono>
                </Pressable>
                </View>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const makeStyles = (t: Theme) => StyleSheet.create({
  group: { fontSize: 10, letterSpacing: 1.5, color: t.colors.textMuted, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  backdrop: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "rgba(0, 0, 0, 0.6)" },
  sheet: {
    width: "100%",
    maxWidth: 320,
    maxHeight: "70%",
    borderWidth: 1,
    borderColor: t.colors.border,
    backgroundColor: t.colors.bgSecondary,
    borderRadius: 8,
    paddingVertical: 12,
  },
  title: { color: t.colors.textSecondary, fontSize: 11, letterSpacing: 1.5, paddingHorizontal: 16, marginBottom: 6 },
  list: { flexGrow: 0 },
  option: { paddingHorizontal: 16, paddingVertical: 11 },
  optionOn: { backgroundColor: alpha(t.colors.crimson, 0.25) },
  optionPressed: { backgroundColor: t.colors.bgElevated },
  optionText: { fontSize: 14, color: t.colors.textSecondary },
  optionTextOn: { color: t.colors.textPrimary },
});
