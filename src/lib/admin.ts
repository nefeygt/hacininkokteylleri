import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Who is signed in, and how far they are through signing in as an admin.
 * - "signed-out": no session
 * - "not-admin":  signed in, but no row in `admins`
 * - "enroll":     an admin without an authenticator app yet
 * - "verify":     an admin who has one but has not entered a code this session
 * - "ok":         an admin at aal2 — the only state the database trusts (ADR-011)
 */
export async function adminSession() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return { supabase, state: "signed-out" as const };

  const { data: admin } = await supabase
    .from("admins")
    .select("display_name, role")
    .eq("user_id", userId)
    .maybeSingle();
  if (!admin) return { supabase, state: "not-admin" as const };

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel === "aal2") return { supabase, state: "ok" as const, userId, admin };
  return { supabase, state: aal?.nextLevel === "aal2" ? ("verify" as const) : ("enroll" as const) };
}

/**
 * Every admin page and action starts here; anything short of "ok" is sent to
 * the right step. The database enforces the same rule on every write.
 */
export async function requireAdmin() {
  const session = await adminSession();
  switch (session.state) {
    case "ok":
      return session;
    case "signed-out":
      redirect("/login");
    case "not-admin":
      redirect("/login?access=denied");
    case "enroll":
      redirect("/setup-2fa");
    case "verify":
      redirect("/verify");
  }
}
