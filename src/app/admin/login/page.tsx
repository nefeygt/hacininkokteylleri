import { redirect } from "next/navigation";
import { adminSession } from "@/lib/admin";
import AuthCard from "../AuthCard";
import SignOutButton from "../SignOutButton";
import SignInForm from "./SignInForm";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ access?: string }>;
}) {
  const { access } = await searchParams;

  // Already signed in: send them on to the step they are at.
  const { state } = await adminSession();
  if (state === "ok") redirect("/");
  if (state === "verify") redirect("/verify");
  if (state === "enroll") redirect("/setup-2fa");

  if (access === "denied" || state === "not-admin") {
    return (
      <AuthCard title="Yönetim paneli" subtitle="Yalnızca yöneticiler girebilir.">
        <div className="space-y-4">
          <p className="rounded border border-crimson/40 bg-crimson/10 p-3 text-xs text-text-secondary">
            Bu hesabın yönetici yetkisi yok. Yetki için site sahibine yaz.
          </p>
          <SignOutButton className="w-full rounded border border-border px-4 py-2.5 text-sm text-text-secondary hover:border-border-light hover:text-text-primary">
            Başka hesapla gir
          </SignOutButton>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Yönetim paneli" subtitle="Yalnızca yöneticiler girebilir.">
      <SignInForm />
    </AuthCard>
  );
}
