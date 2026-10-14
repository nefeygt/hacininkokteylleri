// Limits shared by the forms and the server actions (browser-safe). The
// database's check constraints are the rule; these only warn early (M4).

export const REVIEW_MAX_LENGTH = 2000;
export const REPORT_REASON_MAX_LENGTH = 500;

/** "4,3" — one decimal, Turkish style. */
export function formatAverage(average: number): string {
  return average.toLocaleString("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

export const LOG_COMMENT_MAX_LENGTH = 1000;
