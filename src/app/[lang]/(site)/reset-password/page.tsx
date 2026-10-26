import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AccountCard from "@/components/AccountCard";
import { accountSession } from "@/lib/account";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { format } from "@/lib/i18n/format";
import { asLocale, localePath } from "@/lib/i18n/locales";
import NewPasswordForm from "./NewPasswordForm";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const t = getDictionary(asLocale((await params).lang)).resetPassword;
  return { title: t.metaTitle, robots: { index: false } };
}

// The password-reset e-mail signs the visitor in through /auth/callback and
// lands here; without that session there is nothing to reset.
export default async function ResetPasswordPage({ params }: { params: Promise<{ lang: string }> }) {
  const lang = asLocale((await params).lang);
  const t = getDictionary(lang).resetPassword;
  const session = await accountSession();
  if (session.state === "signed-out") redirect(localePath(lang, "/login?error=link"));

  return (
    <AccountCard
      title={t.title}
      subtitle={session.user.email ? format(t.subtitle, { email: session.user.email }) : undefined}
    >
      <NewPasswordForm next={localePath(lang, session.state === "ok" ? "/account" : "/welcome")} />
    </AccountCard>
  );
}
