// Limits shared by the forms and the server actions (browser-safe). The
// database's check constraints are the rule; these only warn early (M4).

import { tr } from "./i18n/dictionaries/tr";
import { DEFAULT_LOCALE, INTL_LOCALES, type Locale } from "./i18n/locales";

export const REVIEW_MAX_LENGTH = 2000;
export const REPORT_REASON_MAX_LENGTH = 500;

/** Ratings go from 0.5 to 5 in half stars (reviews and drink logs, 2026-10-15). */
export const RATING_STEP = 0.5;

/** The database's check: 0.5–5, a whole or half number. */
export function isValidRating(rating: number): boolean {
  return Number.isFinite(rating) && rating >= 0.5 && rating <= 5 && Number.isInteger(rating * 2);
}

/** The Turkish message; other languages read `validation.ratingError` from their dictionary. */
export const RATING_ERROR = tr.validation.ratingError;

/** "3,5" or "4" — a single rating, in the language's number style. */
export function formatRating(rating: number, locale: Locale = DEFAULT_LOCALE): string {
  return rating.toLocaleString(INTL_LOCALES[locale], { maximumFractionDigits: 1 });
}

/** "★★★½☆" — a rating as text, for compact lists. */
export function ratingStars(rating: number): string {
  const half = Math.round(rating * 2) / 2;
  const full = Math.floor(half);
  const hasHalf = half > full;
  return "★".repeat(full) + (hasHalf ? "½" : "") + "☆".repeat(5 - full - (hasHalf ? 1 : 0));
}

/** "4,3" — one decimal, in the language's number style. */
export function formatAverage(average: number, locale: Locale = DEFAULT_LOCALE): string {
  return average.toLocaleString(INTL_LOCALES[locale], { minimumFractionDigits: 1, maximumFractionDigits: 1 });
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

/** The columns of `cocktail_ratings` that `toRating` reads. */
export const RATING_COLUMNS = "cocktail_id, review_count, average_rating, half_star_counts";

/** A recipe's rating from a `cocktail_ratings` row: average, count and the reviews per half star ([0] = 0.5 … [9] = 5). */
export function toRating(r: { average_rating: number | null; review_count: number | null; half_star_counts: number[] | null }): {
  average: number;
  count: number;
  halfStars?: number[];
} {
  return { average: Number(r.average_rating), count: r.review_count ?? 0, halfStars: r.half_star_counts ?? undefined };
}
