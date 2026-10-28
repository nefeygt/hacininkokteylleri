import { INTL_LOCALES, type Locale } from "@shared/i18n/locales";
import { formatLogDate } from "@shared/drink-log";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react-native";
import { useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { shiftDate } from "@/lib/drink-logs";
import { alpha, type Theme } from "@/lib/theme";
import { useStyles, useTheme } from "@/lib/theme-context";
import { Label, Mono } from "./Type";
import { useLocale } from "@/lib/i18n";
import { format } from "@shared/i18n/format";

const EARLIEST = "2000-01-01";
// 2024-01-01 is a Monday: the week starts there, in the language's short weekday names.
function weekdays(locale: Locale): string[] {
  return [0, 1, 2, 3, 4, 5, 6].map((i) =>
    new Date(Date.UTC(2024, 0, 1 + i)).toLocaleDateString(INTL_LOCALES[locale], { weekday: "short", timeZone: "UTC" })
  );
}

/** "2026-10" → "Ekim 2026" / "October 2026". */
function monthTitle(year: number, month: number, locale: Locale): string {
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString(INTL_LOCALES[locale], { month: "long", year: "numeric", timeZone: "UTC" });
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
  const { t, a, locale } = useLocale();
  const styles = useStyles(makeStyles);
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const atEarliest = value <= EARLIEST;
  const atToday = value >= today;

  return (
    <View style={styles.group}>
      <Label style={styles.label}>{t.logForm.date}</Label>
      <View style={styles.row}>
        <Pressable
          onPress={() => onChange(shiftDate(value, -1))}
          disabled={atEarliest}
          hitSlop={6}
          style={[styles.step, atEarliest && styles.off]}
          accessibilityRole="button"
          accessibilityLabel={a.date.previousDay}
        >
          <ChevronLeft size={18} color={theme.colors.textSecondary} />
        </Pressable>
        <Pressable
          onPress={() => setOpen(true)}
          style={styles.dateButton}
          accessibilityRole="button"
          accessibilityLabel={format(a.date.openCalendar, { date: formatLogDate(value, locale) })}
        >
          <CalendarDays size={14} color={theme.colors.textMuted} />
          <Mono style={styles.date}>{formatLogDate(value, locale)}</Mono>
        </Pressable>
        <Pressable
          onPress={() => onChange(shiftDate(value, 1))}
          disabled={atToday}
          hitSlop={6}
          style={[styles.step, atToday && styles.off]}
          accessibilityRole="button"
          accessibilityLabel={a.date.nextDay}
        >
          <ChevronRight size={18} color={theme.colors.textSecondary} />
        </Pressable>
      </View>
      <View style={styles.chips}>
        {[
          { label: a.date.today, date: today },
          { label: a.date.yesterday, date: shiftDate(today, -1) },
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
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} accessibilityLabel={a.date.closeCalendar}>
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
  const { a, locale } = useLocale();
  const styles = useStyles(makeStyles);
  const theme = useTheme();
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
        <Pressable onPress={() => move(-1)} disabled={!canBack} hitSlop={8} style={[styles.step, !canBack && styles.off]} accessibilityRole="button" accessibilityLabel={a.date.previousMonth}>
          <ChevronLeft size={18} color={theme.colors.textSecondary} />
        </Pressable>
        <Mono style={styles.month}>{monthTitle(year, month, locale)}</Mono>
        <Pressable onPress={() => move(1)} disabled={!canForward} hitSlop={8} style={[styles.step, !canForward && styles.off]} accessibilityRole="button" accessibilityLabel={a.date.nextMonth}>
          <ChevronRight size={18} color={theme.colors.textSecondary} />
        </Pressable>
      </View>
      <View style={styles.grid}>
        {weekdays(locale).map((d) => (
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
              accessibilityLabel={formatLogDate(iso, locale)}
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

const makeStyles = (t: Theme) => StyleSheet.create({
  group: { gap: 8 },
  label: { color: t.colors.textSecondary, fontSize: 11, letterSpacing: 1.5 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: t.colors.border,
    backgroundColor: t.colors.bgPrimary,
    borderRadius: 4,
  },
  step: { paddingHorizontal: 12, paddingVertical: 10 },
  off: { opacity: 0.3 },
  dateButton: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 10 },
  date: { fontSize: 14, color: t.colors.textPrimary },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderRadius: 999, backgroundColor: t.colors.bgElevated, paddingHorizontal: 12, paddingVertical: 5 },
  chipOn: { backgroundColor: alpha(t.colors.crimson, 0.3) },
  chipText: { fontSize: 11, color: t.colors.textMuted },
  chipTextOn: { color: t.colors.textPrimary },
  backdrop: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "rgba(0, 0, 0, 0.6)" },
  sheet: {
    width: "100%",
    maxWidth: 360,
    borderWidth: 1,
    borderColor: t.colors.border,
    backgroundColor: t.colors.bgSecondary,
    borderRadius: 8,
    padding: 12,
  },
  calendarHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  month: { fontFamily: t.fonts.mono, fontSize: 14, color: t.colors.textPrimary },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: "center", justifyContent: "center" },
  weekday: { fontSize: 10, color: t.colors.textMuted },
  day: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  daySelected: { backgroundColor: t.colors.crimson },
  dayToday: { borderWidth: 1, borderColor: t.colors.borderLight },
  dayText: { fontSize: 13, color: t.colors.textPrimary },
  dayDisabled: { color: t.colors.textMuted, opacity: 0.4 },
  dayTextSelected: { color: "#fff" },
});
