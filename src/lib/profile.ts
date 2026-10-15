// A member's profile fields: the rules and the Turkish messages, shared by the
// site's server actions and the app (browser-safe, no Next.js imports — ADR-020).
// The database checks the same rules; these only give a nicer error first.

import { slugify } from "./slug";

export const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;
export const DISPLAY_NAME_MAX = 50;
export const BIO_MAX = 280;

export type ProfileFields = { username: string; displayName: string; bio: string | null };

/** Trims and checks what a member typed; returns the clean fields or a message. */
export function checkProfile(input: { username: string; displayName: string; bio?: string }): ProfileFields | { error: string } {
  const username = input.username.trim().toLowerCase();
  const displayName = input.displayName.trim();
  const bio = (input.bio ?? "").trim();

  if (!USERNAME_PATTERN.test(username)) {
    return { error: "Kullanıcı adı 3–20 karakter olmalı: küçük harf, rakam ya da alt çizgi." };
  }
  if (displayName.length < 1 || displayName.length > DISPLAY_NAME_MAX) {
    return { error: `Görünen ad 1–${DISPLAY_NAME_MAX} karakter olmalı.` };
  }
  if (bio.length > BIO_MAX) return { error: `Hakkında en fazla ${BIO_MAX} karakter olabilir.` };
  return { username, displayName, bio: bio || null };
}

/** Postgres errors from the profile constraints, in words a member understands. */
export function profileError(code: string | undefined, message: string): string {
  if (code === "23505") return "Bu kullanıcı adı alınmış. Başka bir tane dene.";
  if (code === "23514") return "Bu kullanıcı adı kullanılamaz. Başka bir tane dene.";
  return `Kaydedilemedi: ${message}`;
}

/** A starting username from a name ("Efe Yiğit" → "efe_yigit"), or "" when too short. */
export function suggestUsername(name: string): string {
  const suggestion = slugify(name).replace(/-/g, "_").slice(0, 20);
  return suggestion.length >= 3 ? suggestion : "";
}
