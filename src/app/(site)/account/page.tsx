import type { Metadata } from "next";
import Link from "next/link";
import AccountCard from "@/components/AccountCard";
import { requireMember } from "@/lib/account";
import AvatarField from "./AvatarField";
import DeleteAccount from "./DeleteAccount";
import LogsDefaultToggle from "./LogsDefaultToggle";
import ProfileForm from "./ProfileForm";
import SignOutButton from "./SignOutButton";

export const metadata: Metadata = {
  title: "Hesabım",
  robots: { index: false },
};

export default async function AccountPage() {
  const { supabase, profile, user } = await requireMember();
  const { data: settings } = await supabase
    .from("account_settings")
    .select("logs_public_default")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <AccountCard title="Hesabım" subtitle={user.email ? `${user.email} ile giriş yaptın.` : undefined} wide>
      <div className="space-y-8">
        {profile.hidden_at && (
          <p className="rounded border border-crimson/40 bg-crimson/10 p-3 font-mono text-xs text-text-secondary">
            Profilin bir yönetici tarafından gizlendi; şu an yalnızca sen görüyorsun.
          </p>
        )}

        <section>
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="font-mono text-xs uppercase tracking-[0.15em] text-text-secondary">Profil</h2>
            <Link
              href={`/u/${profile.username}`}
              className="font-mono text-[11px] text-text-muted underline underline-offset-2 hover:text-text-primary"
            >
              Herkese açık profilin →
            </Link>
          </div>
          <div className="mb-6">
            <AvatarField userId={user.id} path={profile.avatar_path} name={profile.display_name} />
          </div>
          <ProfileForm
            username={profile.username}
            displayName={profile.display_name}
            bio={profile.bio ?? ""}
          />
        </section>

        <section className="border-t border-border pt-6">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="font-mono text-xs uppercase tracking-[0.15em] text-text-secondary">İçki günlüğü</h2>
            <Link
              href="/account/logs"
              className="font-mono text-[11px] text-text-muted underline underline-offset-2 hover:text-text-primary"
            >
              Günlüğüm →
            </Link>
          </div>
          <LogsDefaultToggle initial={settings?.logs_public_default ?? false} />
        </section>

        <section className="flex items-center justify-between border-t border-border pt-6">
          <span className="font-mono text-xs text-text-muted">Bu cihazdan çık</span>
          <SignOutButton />
        </section>

        <section className="border-t border-border pt-6">
          <h2 className="mb-2 font-mono text-xs uppercase tracking-[0.15em] text-crimson-glow">Hesabı sil</h2>
          <p className="mb-4 font-mono text-xs leading-relaxed text-text-muted">
            Hesabın, profilin ve yazdığın her şey kalıcı olarak silinir. Bu geri alınamaz.
          </p>
          <DeleteAccount userId={user.id} username={profile.username} />
        </section>
      </div>
    </AccountCard>
  );
}
