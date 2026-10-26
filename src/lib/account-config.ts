// Account settings that both server and browser code read (no server imports here).

/**
 * Community accounts open to the public when M3 ships. Until then the sign-in
 * link stays out of the navbar and public sign-up stays off in Supabase Auth;
 * the pages work for anyone who already has an account (ADR-014).
 */
export const ACCOUNTS_OPEN = true;

/** Shown at onboarding and stored in account_settings. Bump it when /privacy changes. */
export const PRIVACY_NOTICE_VERSION = "2026-10-26";

/** Matches "Minimum password length" in Supabase Auth, which is the rule; the form only warns early. */
export const MIN_PASSWORD_LENGTH = 8;

/** Supabase Auth's messages, in words a visitor understands (the site's /login and the app). */
export function authErrorMessage(message: string): string {
  if (/invalid login credentials/i.test(message)) return "E-posta ya da şifre yanlış.";
  if (/email not confirmed/i.test(message)) return "Önce e-postana gelen bağlantıyla adresini onayla.";
  if (/signups? not allowed/i.test(message)) return "Üyelik henüz açılmadı. Çok yakında!";
  if (/password should|at least \d+ characters|weak password/i.test(message)) return `Şifre en az ${MIN_PASSWORD_LENGTH} karakter olmalı.`;
  if (/rate limit|too many/i.test(message)) return "Çok fazla deneme yapıldı. Biraz bekleyip tekrar dene.";
  return "Bir şeyler ters gitti. Tekrar dene.";
}

/** Only same-site paths are followed after sign-in, never another origin. */
export function safeNext(next: string | null | undefined, fallback = "/account"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
