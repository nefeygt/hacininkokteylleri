import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { safeNext } from "@/lib/account";
import { createClient } from "@/lib/supabase/server";

// Where Google (through Supabase Auth) and the links in our e-mails (sign-up
// confirmation, password reset, e-mail change; `via=email`) send the visitor
// back. Google brings a PKCE `code`; the e-mails bring a `token_hash` (see
// supabase/templates), which works in any browser and for links the app asked
// for, where the PKCE verifier lives on the phone. Either becomes a session
// cookie; a member without a profile goes to onboarding first, except on the
// way to a new password. These redirects are real HTTP redirects (ADR-007).

const EMAIL_LINK_TYPES: EmailOtpType[] = ["signup", "email", "recovery", "email_change", "invite", "magiclink"];

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeNext(searchParams.get("next"));
  const failed = searchParams.get("via") === "email" ? "link" : "google";

  if (tokenHash && type && EMAIL_LINK_TYPES.includes(type)) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (error || !data.user) return NextResponse.redirect(new URL("/login?error=link", request.url));
    return afterSignIn(request, supabase, data.user.id, type === "recovery" ? "/reset-password" : next);
  }

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

  return afterSignIn(request, supabase, data.user.id, next);
}

async function afterSignIn(
  request: NextRequest,
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  next: string
) {
  if (next === "/reset-password") return NextResponse.redirect(new URL(next, request.url));

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  const destination = profile ? next : `/welcome?next=${encodeURIComponent(next)}`;
  return NextResponse.redirect(new URL(destination, request.url));
}
