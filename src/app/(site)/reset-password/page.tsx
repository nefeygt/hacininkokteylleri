import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AccountCard from "@/components/AccountCard";
import { accountSession } from "@/lib/account";
import NewPasswordForm from "./NewPasswordForm";

export const metadata: Metadata = {
  title: "Yeni şifre",
  robots: { index: false },
};

// The password-reset e-mail signs the visitor in through /auth/callback and
// lands here; without that session there is nothing to reset.
export default async function ResetPasswordPage() {
  const session = await accountSession();
  if (session.state === "signed-out") redirect("/login?error=link");

  return (
    <AccountCard
      title="Yeni şifre"
      subtitle={session.user.email ? `${session.user.email} için yeni bir şifre belirle.` : undefined}
    >
      <NewPasswordForm next={session.state === "ok" ? "/account" : "/welcome"} />
    </AccountCard>
  );
}
