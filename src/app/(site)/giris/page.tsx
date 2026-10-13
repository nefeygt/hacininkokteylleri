import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import AccountCard from "@/components/AccountCard";
import { accountSession, safeNext } from "@/lib/account";
import GoogleButton from "./GoogleButton";

export const metadata: Metadata = {
  title: "Giriş",
  robots: { index: false },
};

const ERRORS: Record<string, string> = {
  google: "Google ile giriş tamamlanamadı. Tekrar dene.",
  kapali: "Üyelik henüz açılmadı. Çok yakında!",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; hata?: string }>;
}) {
  const { next, hata } = await searchParams;
  const destination = safeNext(next);

  const { state } = await accountSession();
  if (state === "ok") redirect(destination);
  if (state === "onboarding") redirect("/hosgeldin");

  return (
    <AccountCard
      title="Giriş yap"
      subtitle="Yorum yazmak, favorilerini ve içtiklerini kaydetmek için bir hesap aç ya da giriş yap."
    >
      <div className="space-y-4">
        {hata && (
          <p className="rounded border border-crimson/40 bg-crimson/10 p-3 font-mono text-xs text-text-secondary">
            {ERRORS[hata] ?? ERRORS.google}
          </p>
        )}
        <GoogleButton next={destination} />
        <p className="font-mono text-[11px] leading-relaxed text-text-muted">
          E-posta ile giriş yakında. Devam ederek{" "}
          <Link href="/gizlilik" className="underline underline-offset-2 hover:text-text-primary">
            aydınlatma metnini
          </Link>{" "}
          okumuş olursun. Hesap açmak için 18 yaşından büyük olmalısın.
        </p>
      </div>
    </AccountCard>
  );
}
