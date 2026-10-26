import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AccountCard from "@/components/AccountCard";
import { accountSession, safeNext } from "@/lib/account";
import { suggestUsername } from "@/lib/profile";
import OnboardingForm from "./OnboardingForm";

export const metadata: Metadata = {
  title: "Hoş geldin",
  robots: { index: false },
};

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const destination = safeNext(next);

  const session = await accountSession();
  if (session.state === "signed-out") redirect("/login");
  if (session.state === "ok") redirect(destination);

  const name = session.user.name ?? "";

  return (
    <AccountCard
      title="Hoş geldin"
      subtitle="Son bir adım: herkesin göreceği adını seç. Bunları sonra hesabından değiştirebilirsin."
    >
      <OnboardingForm
        defaultUsername={suggestUsername(name)}
        defaultDisplayName={name.slice(0, 50)}
        next={destination}
      />
    </AccountCard>
  );
}
