// Account settings that both server and browser code read (no server imports here).

import { tr } from "./i18n/dictionaries/tr";
import type { Dictionary } from "./i18n/dictionaries/types";
import { format } from "./i18n/format";

/**
 * Community accounts open to the public when M3 ships. Until then the sign-in
 * link stays out of the navbar and public sign-up stays off in Supabase Auth;
 * the pages work for anyone who already has an account (ADR-014).
 */
export const ACCOUNTS_OPEN = true;

/** Shown at onboarding and stored in account_settings. Bump it when /privacy changes. */
export const PRIVACY_NOTICE_VERSION = "2026-10-26.2";

/** Matches "Minimum password length" in Supabase Auth, which is the rule; the form only warns early. */
export const MIN_PASSWORD_LENGTH = 8;

/** Supabase Auth's messages, in words a visitor understands (the site's /login and the app). */
export function authErrorMessage(message: string, a: Dictionary["auth"] = tr.auth): string {
  if (/invalid login credentials/i.test(message)) return a.invalidCredentials;
  if (/email not confirmed/i.test(message)) return a.emailNotConfirmed;
  if (/signups? not allowed/i.test(message)) return a.signupsClosed;
  if (/password should|at least \d+ characters|weak password/i.test(message)) return format(a.passwordShort, { min: MIN_PASSWORD_LENGTH });
  if (/rate limit|too many/i.test(message)) return a.rateLimit;
  return a.generic;
}

/** Only same-site paths are followed after sign-in, never another origin. */
export function safeNext(next: string | null | undefined, fallback = "/account"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
