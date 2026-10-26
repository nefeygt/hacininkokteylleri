// Limits shared by the forms and the server actions (browser-safe). The
// database's check constraints are the rule; these only warn early (M4).

export const REVIEW_MAX_LENGTH = 2000;
export const REPORT_REASON_MAX_LENGTH = 500;

/** Ratings go from 0.5 to 5 in half stars (reviews and drink logs, 2026-10-15). */
export const RATING_STEP = 0.5;

/** The database's check: 0.5–5, a whole or half number. */
export function isValidRating(rating: number): boolean {
  return Number.isFinite(rating) && rating >= 0.5 && rating <= 5 && Number.isInteger(rating * 2);
}

export const RATING_ERROR = "0,5 ile 5 arasında, yarım yıldızlarla bir puan seç.";

/** "3,5" or "4" — a single rating, Turkish style. */
export function formatRating(rating: number): string {
  return rating.toLocaleString("tr-TR", { maximumFractionDigits: 1 });
}

/** "★★★½☆" — a rating as text, for compact lists. */
export function ratingStars(rating: number): string {
  const half = Math.round(rating * 2) / 2;
  const full = Math.floor(half);
  const hasHalf = half > full;
  return "★".repeat(full) + (hasHalf ? "½" : "") + "☆".repeat(5 - full - (hasHalf ? 1 : 0));
}

/** "4,3" — one decimal, Turkish style. */
export function formatAverage(average: number): string {
  return average.toLocaleString("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

export const LOG_COMMENT_MAX_LENGTH = 1000;

/** One bar of the rating breakdown: the half-star value, its reviews and its height against the tallest (0–1). */
export interface BreakdownBar {
  rating: number;
  count: number;
  share: number;
}

/** The ten bars of a rating breakdown (0.5 … 5), from the view's per-half-star counts (M9). */
export function ratingBreakdown(halfStars: number[] | undefined): BreakdownBar[] {
  const counts = Array.from({ length: 10 }, (_, i) => halfStars?.[i] ?? 0);
  const max = Math.max(...counts, 1);
  return counts.map((count, i) => ({ rating: (i + 1) / 2, count, share: count / max }));
}
