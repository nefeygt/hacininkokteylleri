import type { Metadata } from "next";
import Link from "@/components/LocaleLink";
import { redirect } from "next/navigation";
import AccountCard from "@/components/AccountCard";
import { accountSession, safeNext } from "@/lib/account";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { asLocale, localePath } from "@/lib/i18n/locales";
import EmailForm from "./EmailForm";
import GoogleButton from "./GoogleButton";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const t = getDictionary(asLocale((await params).lang)).login;
  return { title: t.metaTitle, robots: { index: false } };
}

export default async function SignInPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const lang = asLocale((await params).lang);
  const t = getDictionary(lang).login;
  const errors: Record<string, string> = { google: t.googleFailed, link: t.linkInvalid, closed: t.closed };
  const { next, error } = await searchParams;
  const destination = safeNext(next, localePath(lang, "/account"));

  const { state } = await accountSession();
  if (state === "ok") redirect(destination);
  if (state === "onboarding") redirect(localePath(lang, "/welcome"));

  return (
    <AccountCard title={t.title} subtitle={t.subtitle}>
      <div className="space-y-4">
        {error && (
          <p className="rounded border border-crimson/40 bg-crimson/10 p-3 text-xs text-text-secondary">
            {errors[error] ?? errors.google}
          </p>
        )}
        <GoogleButton next={destination} />
        <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.15em] text-text-muted">
          <span className="h-px flex-1 bg-border" />
          {t.or}
          <span className="h-px flex-1 bg-border" />
        </div>
        <EmailForm next={destination} />
        <p className="font-mono text-[11px] leading-relaxed text-text-muted">
          {t.continuePrefix}
          <Link href="/privacy" className="underline underline-offset-2 hover:text-text-primary">
            {t.privacyLink}
          </Link>
          {t.continueSuffix}
        </p>
      </div>
    </AccountCard>
  );
}
