// The showcase (M7, ADR-019): limits, period dates and states, shared by the
// site, the panel and the actions. Browser-safe.

export const PITCH_MAX_LENGTH = 500;

/** Turkey has no daylight saving time since 2016: midnight there is 21:00 UTC. */
const TURKEY_OFFSET = "+03:00";
const TIME_ZONE = "Europe/Istanbul";

export type PeriodLength = "week" | "month";

export interface ShowcasePeriod {
  id: string;
  startsAt: string;
  endsAt: string;
}

export type PeriodState = "upcoming" | "open" | "ended";

export function periodState(period: Pick<ShowcasePeriod, "startsAt" | "endsAt">, now = Date.now()): PeriodState {
  if (now < Date.parse(period.startsAt)) return "upcoming";
  if (now < Date.parse(period.endsAt)) return "open";
  return "ended";
}

/**
 * A period that starts at midnight (Turkey) on `startDate` (YYYY-MM-DD) and
 * lasts a week or a calendar month; the end is exclusive. Null for a bad date.
 */
export function periodBounds(startDate: string, length: PeriodLength): { startsAt: string; endsAt: string } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(startDate);
  if (!match) return null;
  const [year, month, day] = match.slice(1).map(Number);
  const start = new Date(Date.UTC(year, month - 1, day));
  if (start.getUTCMonth() !== month - 1 || start.getUTCDate() !== day) return null;

  let end: Date;
  if (length === "week") {
    end = new Date(Date.UTC(year, month - 1, day + 7));
  } else {
    // 31 January + one month = 28/29 February, not 3 March.
    const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    end = new Date(Date.UTC(year, month, Math.min(day, lastDay)));
  }
  const iso = (d: Date) => `${d.toISOString().slice(0, 10)}T00:00:00${TURKEY_OFFSET}`;
  return { startsAt: iso(start), endsAt: iso(end) };
}

const dayFormat = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", timeZone: TIME_ZONE });

/** "14 Ekim – 20 Ekim": the first and the last day (the end is exclusive). */
export function formatPeriod(period: Pick<ShowcasePeriod, "startsAt" | "endsAt">): string {
  const lastDay = new Date(Date.parse(period.endsAt) - 1);
  return `${dayFormat.format(new Date(period.startsAt))} – ${dayFormat.format(lastDay)}`;
}

/** The last day of a period, "20 Ekim". */
export function formatLastDay(period: Pick<ShowcasePeriod, "endsAt">): string {
  return dayFormat.format(new Date(Date.parse(period.endsAt) - 1));
}

/** The first day of a period, "14 Ekim". */
export function formatFirstDay(period: Pick<ShowcasePeriod, "startsAt">): string {
  return dayFormat.format(new Date(period.startsAt));
}

export const STATUS_LABELS = {
  pending: "İnceleniyor",
  approved: "Onaylandı",
  rejected: "Reddedildi",
} as const;
