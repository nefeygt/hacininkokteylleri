import type { Metadata } from "next";
import Link from "@/components/LocaleLink";
import { redirect } from "next/navigation";
import AccountCard from "@/components/AccountCard";
import { accountSession, safeNext } from "@/lib/account";
import EmailForm from "./EmailForm";
import GoogleButton from "./GoogleButton";

export const metadata: Metadata = {
  title: "Giriş",
  robots: { index: false },
};

const ERRORS: Record<string, string> = {
  google: "Google ile giriş tamamlanamadı. Tekrar dene.",
  link: "Bağlantı geçersiz ya da süresi dolmuş. Yeni bir bağlantı iste.",
  closed: "Üyelik henüz açılmadı. Çok yakında!",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  const destination = safeNext(next);

  const { state } = await accountSession();
  if (state === "ok") redirect(destination);
  if (state === "onboarding") redirect("/welcome");

  return (
    <AccountCard
      title="Giriş yap"
      subtitle="Yorum yazmak, favorilerini ve içtiklerini kaydetmek için bir hesap aç ya da giriş yap."
    >
      <div className="space-y-4">
        {error && (
          <p className="rounded border border-crimson/40 bg-crimson/10 p-3 text-xs text-text-secondary">
            {ERRORS[error] ?? ERRORS.google}
          </p>
        )}
        <GoogleButton next={destination} />
        <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.15em] text-text-muted">
          <span className="h-px flex-1 bg-border" />
          ya da
          <span className="h-px flex-1 bg-border" />
        </div>
        <EmailForm next={destination} />
        <p className="font-mono text-[11px] leading-relaxed text-text-muted">
          Devam ederek{" "}
          <Link href="/privacy" className="underline underline-offset-2 hover:text-text-primary">
            aydınlatma metnini
          </Link>{" "}
          okumuş olursun. Hesap açmak için 18 yaşından büyük olmalısın.
        </p>
      </div>
    </AccountCard>
  );
}
