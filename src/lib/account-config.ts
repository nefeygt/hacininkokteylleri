// Account settings that both server and browser code read (no server imports here).

/**
 * Community accounts open to the public when M3 ships. Until then the sign-in
 * link stays out of the navbar and public sign-up stays off in Supabase Auth;
 * the pages work for anyone who already has an account (ADR-014).
 */
export const ACCOUNTS_OPEN = false;

/** Shown at onboarding and stored in account_settings. Bump it when /privacy changes. */
export const PRIVACY_NOTICE_VERSION = "2026-10";

/** Matches "Minimum password length" in Supabase Auth, which is the rule; the form only warns early. */
export const MIN_PASSWORD_LENGTH = 8;

/** Only same-site paths are followed after sign-in, never another origin. */
export function safeNext(next: string | null | undefined, fallback = "/account"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
