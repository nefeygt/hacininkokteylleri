import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Every admin page and action starts here. Signed out → the sign-in page;
 * signed in without a row in `admins` → the sign-in page with a notice. The
 * database's policies enforce the same rule again on every write (ADR-007).
 */
export async function requireAdmin() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) redirect("/giris");

  const { data: admin } = await supabase
    .from("admins")
    .select("display_name, role")
    .eq("user_id", userId)
    .maybeSingle();
  if (!admin) redirect("/giris?yetki=yok");

  return { supabase, userId, admin };
}
