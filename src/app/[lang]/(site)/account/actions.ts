"use server";

import { revalidateLocalized } from "@/lib/i18n/revalidate";
import { accountSession, PRIVACY_NOTICE_VERSION } from "@/lib/account";
import { format } from "@/lib/i18n/format";
import { isLocale } from "@/lib/i18n/locales";
import { actionDictionary, actionLocale } from "@/lib/i18n/server";
import { checkProfile, profileError, type ProfileFields } from "@/lib/profile";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";

// Like the panel's actions, these never call redirect(); the browser navigates
// after { ok } (ADR-007).

export type AccountResult = { ok?: boolean; error?: string };

function readProfile(formData: FormData, v: Dictionary["validation"]): ProfileFields | { error: string } {
  return checkProfile(
    {
      username: String(formData.get("username") ?? ""),
      displayName: String(formData.get("display_name") ?? ""),
      bio: String(formData.get("bio") ?? ""),
    },
    v,
  );
}

/** Onboarding: the 18+ confirmation and privacy notice first, then the profile (ADR-014). */
export async function completeOnboarding(formData: FormData): Promise<AccountResult> {
  const t = await actionDictionary();
  if (formData.get("adult") !== "on") return { error: t.actions.adultRequired };
  if (formData.get("privacy") !== "on") return { error: t.actions.privacyRequired };

  const fields = readProfile(formData, t.validation);
  if ("error" in fields) return fields;

  const session = await accountSession();
  if (session.state === "signed-out") return { error: t.actions.sessionLost };
  if (session.state === "ok") return { ok: true };
  const { supabase, user } = session;

  // The settings row may exist from an attempt that failed on the username.
  const { error: settingsError } = await supabase
    .from("account_settings")
    .upsert(
      { user_id: user.id, privacy_notice_version: PRIVACY_NOTICE_VERSION },
      { onConflict: "user_id", ignoreDuplicates: true }
    );
  if (settingsError) return { error: format(t.validation.saveFailed, { message: settingsError.message }) };
  // E-mails go out in the language the member signed up in (ADR-032); the switcher updates it later.
  await supabase.from("account_settings").update({ locale: await actionLocale() }).eq("user_id", user.id);

  const { error } = await supabase.from("profiles").insert({
    id: user.id,
    username: fields.username,
    display_name: fields.displayName,
    bio: fields.bio,
  });
  if (error) return { error: profileError(error.code, error.message, t.validation) };

  return { ok: true };
}

export async function updateProfile(formData: FormData): Promise<AccountResult> {
  const t = await actionDictionary();
  const fields = readProfile(formData, t.validation);
  if ("error" in fields) return fields;

  const session = await accountSession();
  if (session.state !== "ok") return { error: t.actions.sessionLost };
  const { supabase, profile } = session;

  const { error } = await supabase
    .from("profiles")
    .update({ username: fields.username, display_name: fields.displayName, bio: fields.bio })
    .eq("id", profile.id);
  if (error) return { error: profileError(error.code, error.message, t.validation) };

  revalidateLocalized(`/u/${profile.username}`);
  revalidateLocalized(`/u/${fields.username}`);
  return { ok: true };
}

/**
 * Points the profile at a picture the browser has just uploaded, or at none.
 * Returns the previous object so the browser can delete it: objects are never
 * overwritten in place (ADR-006). The database also checks the folder.
 */
export async function setAvatar(path: string | null): Promise<AccountResult & { previous?: string | null }> {
  const t = await actionDictionary();
  const session = await accountSession();
  if (session.state !== "ok") return { error: t.actions.sessionLost };
  const { supabase, profile } = session;

  if (path !== null && !new RegExp(`^${profile.id}/[a-z0-9]+\\.(webp|jpg)$`).test(path)) {
    return { error: t.actions.invalidFile };
  }

  const { error } = await supabase.from("profiles").update({ avatar_path: path }).eq("id", profile.id);
  if (error) return { error: format(t.validation.saveFailed, { message: error.message }) };

  revalidateLocalized(`/u/${profile.username}`);
  return { ok: true, previous: profile.avatar_path };
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
}

/**
 * Deletes the account and, through the cascades, everything the member wrote.
 * The browser removes the member's files from Storage first.
 */
export async function deleteAccount(confirmation: string): Promise<AccountResult> {
  const t = (await actionDictionary()).actions;
  const session = await accountSession();
  if (session.state === "signed-out") return { error: t.sessionLost };
  const { supabase } = session;

  if (session.state === "ok" && confirmation.trim().toLowerCase() !== session.profile.username) {
    return { error: t.confirmUsername };
  }

  const { error } = await supabase.rpc("delete_my_account");
  if (error) {
    if (error.message.includes("Admin accounts")) {
      return { error: t.adminNoDelete };
    }
    if (error.message.includes("uploaded files")) {
      return { error: t.uploadsFirst };
    }
    return { error: format(t.accountDeleteFailed, { message: error.message }) };
  }

  await supabase.auth.signOut();
  if (session.state === "ok") revalidateLocalized(`/u/${session.profile.username}`);
  revalidateLocalized("/cocktails"); // their reviews leave the averages
  revalidateLocalized("/cocktails/[slug]", "page");
  return { ok: true };
}

/** The language a member's e-mails use (ADR-032), set from the language switcher; ignored when signed out. */
export async function rememberLocale(locale: string): Promise<void> {
  if (!isLocale(locale)) return;
  const session = await accountSession();
  if (session.state !== "ok") return;
  await session.supabase.from("account_settings").update({ locale }).eq("user_id", session.user.id);
}
