import { Star } from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";
import { alpha, colors } from "@/lib/theme";

/** Five stars, the first `value` filled (the site's Stars). Read-only unless `onChange` is given. */
export default function Stars({ value, size = 14, onChange }: { value: number; size?: number; onChange?: (value: number) => void }) {
  const filled = (n: number) => n <= Math.round(value);

  if (!onChange) {
    return (
      <View style={styles.row} accessibilityRole="image" accessibilityLabel={`5 üzerinden ${value}`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            size={size}
            color={filled(n) ? colors.crimsonGlow : alpha(colors.textMuted, 0.4)}
            fill={filled(n) ? colors.crimsonGlow : "transparent"}
          />
        ))}
      </View>
    );
  }

  return (
    <View style={[styles.row, styles.input]} accessibilityRole="radiogroup" accessibilityLabel="Puan">
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable
          key={n}
          onPress={() => onChange(n)}
          hitSlop={4}
          accessibilityRole="radio"
          accessibilityLabel={`${n} yıldız`}
          accessibilityState={{ checked: value === n }}
          style={styles.star}
        >
          <Star
            size={size}
            color={filled(n) ? colors.crimsonGlow : alpha(colors.textMuted, 0.5)}
            fill={filled(n) ? colors.crimsonGlow : "transparent"}
          />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 2 },
  input: { gap: 4 },
  star: { padding: 2 },
});
