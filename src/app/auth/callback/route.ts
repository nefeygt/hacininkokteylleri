import { NextResponse, type NextRequest } from "next/server";
import { safeNext } from "@/lib/account";
import { createClient } from "@/lib/supabase/server";

// Where Google (through Supabase Auth) sends the visitor back. The code is
// exchanged for a session cookie; a member without a profile goes to
// onboarding first. These redirects are real HTTP redirects (ADR-007).
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  if (!code) {
    // Supabase sends errors back as query parameters, e.g. when sign-ups are off.
    const description = searchParams.get("error_description") ?? "";
    const reason = /signups? not allowed/i.test(description) ? "kapali" : "google";
    return NextResponse.redirect(new URL(`/giris?hata=${reason}`, request.url));
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    return NextResponse.redirect(new URL("/giris?hata=google", request.url));
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", data.user.id)
    .maybeSingle();

  const destination = profile ? next : `/hosgeldin?next=${encodeURIComponent(next)}`;
  return NextResponse.redirect(new URL(destination, request.url));
}
