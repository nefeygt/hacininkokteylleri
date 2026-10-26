import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AccountCard from "@/components/AccountCard";
import { accountSession, safeNext } from "@/lib/account";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { asLocale, localePath } from "@/lib/i18n/locales";
import { suggestUsername } from "@/lib/profile";
import OnboardingForm from "./OnboardingForm";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const t = getDictionary(asLocale((await params).lang)).welcome;
  return { title: t.metaTitle, robots: { index: false } };
}

export default async function OnboardingPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ next?: string }>;
}) {
  const lang = asLocale((await params).lang);
  const t = getDictionary(lang).welcome;
  const { next } = await searchParams;
  const destination = safeNext(next, localePath(lang, "/account"));

  const session = await accountSession();
  if (session.state === "signed-out") redirect(localePath(lang, "/login"));
  if (session.state === "ok") redirect(destination);

  const name = session.user.name ?? "";

  return (
    <AccountCard
      title={t.title}
      subtitle={t.subtitle}
    >
      <OnboardingForm
        defaultUsername={suggestUsername(name)}
        defaultDisplayName={name.slice(0, 50)}
        next={destination}
      />
    </AccountCard>
  );
}
