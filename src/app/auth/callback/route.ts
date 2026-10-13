import { NextResponse, type NextRequest } from "next/server";
import { safeNext } from "@/lib/account";
import { createClient } from "@/lib/supabase/server";

// Where Google (through Supabase Auth) and the links in our e-mails (sign-up
// confirmation, password reset; `via=email`) send the visitor back. The code is
// exchanged for a session cookie; a member without a profile goes to
// onboarding first, except on the way to a new password. These redirects are
// real HTTP redirects (ADR-007).
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));
  const failed = searchParams.get("via") === "email" ? "link" : "google";

  if (!code) {
    // Supabase sends errors back as query parameters, e.g. when sign-ups are off.
    const description = searchParams.get("error_description") ?? "";
    const reason = /signups? not allowed/i.test(description) ? "closed" : failed;
    return NextResponse.redirect(new URL(`/login?error=${reason}`, request.url));
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    return NextResponse.redirect(new URL(`/login?error=${failed}`, request.url));
  }

  if (next === "/reset-password") return NextResponse.redirect(new URL(next, request.url));

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", data.user.id)
    .maybeSingle();

  const destination = profile ? next : `/welcome?next=${encodeURIComponent(next)}`;
  return NextResponse.redirect(new URL(destination, request.url));
}
