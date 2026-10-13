"use server";

import { revalidatePath } from "next/cache";
import { accountSession, PRIVACY_NOTICE_VERSION } from "@/lib/account";
import { createClient } from "@/lib/supabase/server";

// Like the panel's actions, these never call redirect(); the browser navigates
// after { ok } (ADR-007).

export type AccountResult = { ok?: boolean; error?: string };

const USERNAME = /^[a-z0-9_]{3,20}$/;
const SESSION_LOST = "Oturumun sona ermiş. Sayfayı yenileyip tekrar giriş yap.";

type ProfileFields = { username: string; displayName: string; bio: string | null };

function readProfile(formData: FormData): ProfileFields | { error: string } {
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const displayName = String(formData.get("display_name") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();

  if (!USERNAME.test(username)) {
    return { error: "Kullanıcı adı 3–20 karakter olmalı: küçük harf, rakam ya da alt çizgi." };
  }
  if (displayName.length < 1 || displayName.length > 50) {
    return { error: "Görünen ad 1–50 karakter olmalı." };
  }
  if (bio.length > 280) return { error: "Hakkında en fazla 280 karakter olabilir." };
  return { username, displayName, bio: bio || null };
}

/** Postgres errors from the profile constraints, in words a member understands. */
function profileError(code: string | undefined, message: string): string {
  if (code === "23505") return "Bu kullanıcı adı alınmış. Başka bir tane dene.";
  if (code === "23514") return "Bu kullanıcı adı kullanılamaz. Başka bir tane dene.";
  return `Kaydedilemedi: ${message}`;
}

/** Onboarding: the 18+ confirmation and privacy notice first, then the profile (ADR-014). */
export async function completeOnboarding(formData: FormData): Promise<AccountResult> {
  if (formData.get("adult") !== "on") return { error: "Devam etmek için 18 yaşından büyük olmalısın." };
  if (formData.get("privacy") !== "on") return { error: "Devam etmek için aydınlatma metnini onayla." };

  const fields = readProfile(formData);
  if ("error" in fields) return fields;

  const session = await accountSession();
  if (session.state === "signed-out") return { error: SESSION_LOST };
  if (session.state === "ok") return { ok: true };
  const { supabase, user } = session;

  // The settings row may exist from an attempt that failed on the username.
  const { error: settingsError } = await supabase
    .from("account_settings")
    .upsert(
      { user_id: user.id, privacy_notice_version: PRIVACY_NOTICE_VERSION },
      { onConflict: "user_id", ignoreDuplicates: true }
    );
  if (settingsError) return { error: `Kaydedilemedi: ${settingsError.message}` };

  const { error } = await supabase.from("profiles").insert({
    id: user.id,
    username: fields.username,
    display_name: fields.displayName,
    bio: fields.bio,
  });
  if (error) return { error: profileError(error.code, error.message) };

  return { ok: true };
}

export async function updateProfile(formData: FormData): Promise<AccountResult> {
  const fields = readProfile(formData);
  if ("error" in fields) return fields;

  const session = await accountSession();
  if (session.state !== "ok") return { error: SESSION_LOST };
  const { supabase, profile } = session;

  const { error } = await supabase
    .from("profiles")
    .update({ username: fields.username, display_name: fields.displayName, bio: fields.bio })
    .eq("id", profile.id);
  if (error) return { error: profileError(error.code, error.message) };

  revalidatePath(`/u/${profile.username}`);
  revalidatePath(`/u/${fields.username}`);
  return { ok: true };
}

/**
 * Points the profile at a picture the browser has just uploaded, or at none.
 * Returns the previous object so the browser can delete it: objects are never
 * overwritten in place (ADR-006). The database also checks the folder.
 */
export async function setAvatar(path: string | null): Promise<AccountResult & { previous?: string | null }> {
  const session = await accountSession();
  if (session.state !== "ok") return { error: SESSION_LOST };
  const { supabase, profile } = session;

  if (path !== null && !new RegExp(`^${profile.id}/[a-z0-9]+\\.(webp|jpg)$`).test(path)) {
    return { error: "Geçersiz dosya." };
  }

  const { error } = await supabase.from("profiles").update({ avatar_path: path }).eq("id", profile.id);
  if (error) return { error: `Kaydedilemedi: ${error.message}` };

  revalidatePath(`/u/${profile.username}`);
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
  const session = await accountSession();
  if (session.state === "signed-out") return { error: SESSION_LOST };
  const { supabase } = session;

  if (session.state === "ok" && confirmation.trim().toLowerCase() !== session.profile.username) {
    return { error: "Onay için kullanıcı adını aynen yaz." };
  }

  const { error } = await supabase.rpc("delete_my_account");
  if (error) {
    if (error.message.includes("Admin accounts")) {
      return { error: "Yönetici hesapları buradan silinemez." };
    }
    if (error.message.includes("uploaded files")) {
      return { error: "Önce yüklediğin dosyalar silinmeli. Sayfayı yenileyip tekrar dene." };
    }
    return { error: `Hesap silinemedi: ${error.message}` };
  }

  await supabase.auth.signOut();
  if (session.state === "ok") revalidatePath(`/u/${session.profile.username}`);
  return { ok: true };
}
