import { Wine } from "lucide-react";
import { signOut } from "../actions";
import SignInForm from "./SignInForm";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ yetki?: string }>;
}) {
  const { yetki } = await searchParams;
  const notAnAdmin = yetki === "yok";

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-sm border border-border bg-bg-card p-8">
        <div className="mb-8 flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-crimson/20">
            <Wine className="h-4 w-4 text-crimson-glow" />
          </div>
          <span className="font-mono text-sm font-bold tracking-wider">
            HACININ<span className="text-crimson-glow"> KOKTEYLLERİ</span>
          </span>
        </div>

        <h1 className="mb-1 text-xl font-bold">Yönetim paneli</h1>
        <p className="mb-6 font-mono text-xs text-text-muted">Yalnızca yöneticiler girebilir.</p>

        {notAnAdmin ? (
          <div className="space-y-4">
            <p className="rounded border border-crimson/40 bg-crimson/10 p-3 font-mono text-xs text-text-secondary">
              Bu hesabın yönetici yetkisi yok. Yetki için site sahibine yaz.
            </p>
            <form action={signOut}>
              <button className="w-full rounded border border-border px-4 py-2.5 font-mono text-sm text-text-secondary hover:border-border-light hover:text-text-primary">
                Başka hesapla gir
              </button>
            </form>
          </div>
        ) : (
          <SignInForm />
        )}
      </div>
    </div>
  );
}
