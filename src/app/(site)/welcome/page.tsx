import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AccountCard from "@/components/AccountCard";
import { accountSession, safeNext } from "@/lib/account";
import { slugify } from "@/lib/slug";
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
  const suggestion = slugify(name).replace(/-/g, "_").slice(0, 20);

  return (
    <AccountCard
      title="Hoş geldin"
      subtitle="Son bir adım: herkesin göreceği adını seç. Bunları sonra hesabından değiştirebilirsin."
    >
      <OnboardingForm
        defaultUsername={suggestion.length >= 3 ? suggestion : ""}
        defaultDisplayName={name.slice(0, 50)}
        next={destination}
      />
    </AccountCard>
  );
}
