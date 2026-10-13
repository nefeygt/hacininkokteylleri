import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export { ACCOUNTS_OPEN, PRIVACY_NOTICE_VERSION, safeNext } from "./account-config";

/**
 * Who is signed in on the public site, and whether they finished onboarding.
 * - "signed-out":  no session
 * - "onboarding":  signed in, no profile yet (username + 18+ still owed)
 * - "ok":          a member with a profile
 */
export async function accountSession() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return { supabase, state: "signed-out" as const };

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, display_name, bio, avatar_path, hidden_at")
    .eq("id", claims.sub)
    .maybeSingle();

  const user = {
    id: claims.sub,
    email: typeof claims.email === "string" ? claims.email : undefined,
    name: nameFromClaims(claims.user_metadata),
  };
  if (!profile) return { supabase, state: "onboarding" as const, user };
  return { supabase, state: "ok" as const, user, profile };
}

/** Every member-only page starts here. Redirects happen during render, which is fine (ADR-007). */
export async function requireMember() {
  const session = await accountSession();
  if (session.state === "signed-out") redirect("/login");
  if (session.state === "onboarding") redirect("/welcome");
  return session;
}

function nameFromClaims(metadata: unknown): string | undefined {
  if (!metadata || typeof metadata !== "object") return undefined;
  const m = metadata as Record<string, unknown>;
  const name = m.full_name ?? m.name;
  return typeof name === "string" && name.trim() ? name.trim() : undefined;
}
