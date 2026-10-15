import { formatLogDate } from "@shared/drink-log";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react-native";
import { useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { shiftDate } from "@/lib/drink-logs";
import { alpha, colors, fonts } from "@/lib/theme";
import { Label, Mono } from "./Type";

const EARLIEST = "2000-01-01";
const WEEKDAYS = ["Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pz"];

/** "2026-10" → "Ekim 2026". */
function monthTitle(year: number, month: number): string {
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("tr-TR", { month: "long", year: "numeric", timeZone: "UTC" });
}

const pad = (n: number) => String(n).padStart(2, "0");
const isoOf = (year: number, month: number, day: number) => `${year}-${pad(month)}-${pad(day)}`;

/**
 * The log's date (a "YYYY-MM-DD" string): ‹ › move a day, "Bugün" and "Dün"
 * are shortcuts, and tapping the date opens a month calendar. Plain React
 * Native — a native date picker would need a new development build. Never
 * after `today` (today in Turkey; ADR-017).
 */
export default function DateField({ value, today, onChange }: { value: string; today: string; onChange: (date: string) => void }) {
  const [open, setOpen] = useState(false);
  const atEarliest = value <= EARLIEST;
  const atToday = value >= today;

  return (
    <View style={styles.group}>
      <Label style={styles.label}>Tarih</Label>
      <View style={styles.row}>
        <Pressable
          onPress={() => onChange(shiftDate(value, -1))}
          disabled={atEarliest}
          hitSlop={6}
          style={[styles.step, atEarliest && styles.off]}
          accessibilityRole="button"
          accessibilityLabel="Önceki gün"
        >
          <ChevronLeft size={18} color={colors.textSecondary} />
        </Pressable>
        <Pressable
          onPress={() => setOpen(true)}
          style={styles.dateButton}
          accessibilityRole="button"
          accessibilityLabel={`Tarih: ${formatLogDate(value)}. Takvimi aç`}
        >
          <CalendarDays size={14} color={colors.textMuted} />
          <Mono style={styles.date}>{formatLogDate(value)}</Mono>
        </Pressable>
        <Pressable
          onPress={() => onChange(shiftDate(value, 1))}
          disabled={atToday}
          hitSlop={6}
          style={[styles.step, atToday && styles.off]}
          accessibilityRole="button"
          accessibilityLabel="Sonraki gün"
        >
          <ChevronRight size={18} color={colors.textSecondary} />
        </Pressable>
      </View>
      <View style={styles.chips}>
        {[
          { label: "Bugün", date: today },
          { label: "Dün", date: shiftDate(today, -1) },
        ].map((chip) => (
          <Pressable
            key={chip.label}
            onPress={() => onChange(chip.date)}
            style={[styles.chip, value === chip.date && styles.chipOn]}
            accessibilityRole="button"
            accessibilityLabel={chip.label}
            accessibilityState={{ selected: value === chip.date }}
          >
            <Mono style={[styles.chipText, value === chip.date && styles.chipTextOn]}>{chip.label}</Mono>
          </Pressable>
        ))}
      </View>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} accessibilityLabel="Takvimi kapat">
          {/* Taps inside the sheet stay inside it. */}
          <Pressable style={styles.sheet} onPress={() => {}}>
            <Calendar
              value={value}
              today={today}
              onPick={(date) => {
                onChange(date);
                setOpen(false);
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function Calendar({ value, today, onPick }: { value: string; today: string; onPick: (date: string) => void }) {
  const [year, setYear] = useState(Number(value.slice(0, 4)));
  const [month, setMonth] = useState(Number(value.slice(5, 7)));

  const first = new Date(Date.UTC(year, month - 1, 1));
  const lead = (first.getUTCDay() + 6) % 7; // Monday first
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells: (number | null)[] = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);

  const monthKey = `${year}-${pad(month)}`;
  const canBack = monthKey > EARLIEST.slice(0, 7);
  const canForward = monthKey < today.slice(0, 7);

  function move(delta: number) {
    const m = month - 1 + delta;
    setYear(year + Math.floor(m / 12));
    setMonth(((m % 12) + 12) % 12 + 1);
  }

  return (
    <View>
      <View style={styles.calendarHead}>
        <Pressable onPress={() => move(-1)} disabled={!canBack} hitSlop={8} style={[styles.step, !canBack && styles.off]} accessibilityRole="button" accessibilityLabel="Önceki ay">
          <ChevronLeft size={18} color={colors.textSecondary} />
        </Pressable>
        <Mono style={styles.month}>{monthTitle(year, month)}</Mono>
        <Pressable onPress={() => move(1)} disabled={!canForward} hitSlop={8} style={[styles.step, !canForward && styles.off]} accessibilityRole="button" accessibilityLabel="Sonraki ay">
          <ChevronRight size={18} color={colors.textSecondary} />
        </Pressable>
      </View>
      <View style={styles.grid}>
        {WEEKDAYS.map((d) => (
          <View key={d} style={styles.cell}>
            <Mono style={styles.weekday}>{d}</Mono>
          </View>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <View key={`e${i}`} style={styles.cell} />;
          const iso = isoOf(year, month, day);
          const disabled = iso > today || iso < EARLIEST;
          const selected = iso === value;
          return (
            <Pressable
              key={iso}
              onPress={() => onPick(iso)}
              disabled={disabled}
              style={styles.cell}
              accessibilityRole="button"
              accessibilityLabel={formatLogDate(iso)}
              accessibilityState={{ selected, disabled }}
            >
              <View style={[styles.day, selected && styles.daySelected, iso === today && !selected && styles.dayToday]}>
                <Mono style={[styles.dayText, disabled && styles.dayDisabled, selected && styles.dayTextSelected]}>{day}</Mono>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: 8 },
  label: { color: colors.textSecondary, fontSize: 11, letterSpacing: 1.5 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgPrimary,
    borderRadius: 4,
  },
  step: { paddingHorizontal: 12, paddingVertical: 10 },
  off: { opacity: 0.3 },
  dateButton: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 10 },
  date: { fontSize: 14, color: colors.textPrimary },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderRadius: 999, backgroundColor: colors.bgElevated, paddingHorizontal: 12, paddingVertical: 5 },
  chipOn: { backgroundColor: alpha(colors.crimson, 0.3) },
  chipText: { fontSize: 11, color: colors.textMuted },
  chipTextOn: { color: colors.textPrimary },
  backdrop: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "rgba(0, 0, 0, 0.6)" },
  sheet: {
    width: "100%",
    maxWidth: 360,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgSecondary,
    borderRadius: 8,
    padding: 12,
  },
  calendarHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  month: { fontFamily: fonts.mono, fontSize: 14, color: colors.textPrimary },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: "center", justifyContent: "center" },
  weekday: { fontSize: 10, color: colors.textMuted },
  day: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  daySelected: { backgroundColor: colors.crimson },
  dayToday: { borderWidth: 1, borderColor: colors.borderLight },
  dayText: { fontSize: 13, color: colors.textPrimary },
  dayDisabled: { color: colors.textMuted, opacity: 0.4 },
  dayTextSelected: { color: "#fff" },
});
