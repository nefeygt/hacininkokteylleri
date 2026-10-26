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
  const [{ data: settings }, { count: unread }] = await Promise.all([
    supabase.from("account_settings").select("logs_public_default").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("read_at", null),
  ]);

  return (
    <AccountCard title="Hesabım" subtitle={user.email ? `${user.email} ile giriş yaptın.` : undefined} wide>
      <div className="space-y-8">
        {profile.hidden_at && (
          <p className="rounded border border-crimson/40 bg-crimson/10 p-3 text-xs text-text-secondary">
            Profilin bir yönetici tarafından gizlendi; şu an yalnızca sen görüyorsun.
          </p>
        )}

        {/* On phones the navbar has no bell (ADR-030); this is the way in. */}
        <Link
          href="/account/notifications"
          className="flex items-center justify-between rounded border border-border bg-bg-elevated/40 px-4 py-3 transition-colors hover:bg-bg-elevated"
        >
          <span className="font-mono text-xs uppercase tracking-[0.15em] text-text-secondary">Bildirimler</span>
          <span className="flex items-center gap-2 font-mono text-[11px] text-text-muted">
            {unread ? (
              <span className="rounded-full bg-crimson-glow px-2 py-0.5 text-white">{unread} yeni</span>
            ) : (
              "Yeni yok"
            )}
            →
          </span>
        </Link>

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
          <div className="flex items-baseline justify-between">
            <h2 className="font-mono text-xs uppercase tracking-[0.15em] text-text-secondary">Tariflerim</h2>
            <Link
              href="/account/recipes"
              className="font-mono text-[11px] text-text-muted underline underline-offset-2 hover:text-text-primary"
            >
              Tariflerim →
            </Link>
          </div>
          <p className="mt-2 text-xs text-text-muted">Kendi tariflerini yaz; yayındakiler profilinde ve akışta görünür.</p>
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
          <span className="text-xs text-text-muted">Bu cihazdan çık</span>
          <SignOutButton />
        </section>

        <section className="border-t border-border pt-6">
          <h2 className="mb-2 font-mono text-xs uppercase tracking-[0.15em] text-crimson-glow">Hesabı sil</h2>
          <p className="mb-4 text-xs leading-relaxed text-text-muted">
            Hesabın, profilin ve yazdığın her şey kalıcı olarak silinir. Bu geri alınamaz.
          </p>
          <DeleteAccount userId={user.id} username={profile.username} />
        </section>
      </div>
    </AccountCard>
  );
}
