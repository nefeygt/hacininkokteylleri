import { Wine } from "lucide-react";
import SignOutButton from "./SignOutButton";

/** The frame around the sign-in, two-factor setup and code screens. */
export default function AuthCard({
  title,
  subtitle,
  showSignOut = false,
  children,
}: {
  title: string;
  subtitle: string;
  showSignOut?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm rounded-sm border border-border bg-bg-card p-8">
        <div className="mb-8 flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-crimson/20">
            <Wine className="h-4 w-4 text-crimson-glow" />
          </div>
          <span className="font-mono text-sm font-bold tracking-wider">
            HACININ<span className="text-crimson-glow"> KOKTEYLLERİ</span>
          </span>
        </div>

        <h1 className="mb-1 text-xl font-bold">{title}</h1>
        <p className="mb-6 font-mono text-xs leading-relaxed text-text-muted">{subtitle}</p>

        {children}

        {showSignOut && (
          <div className="mt-6 border-t border-border pt-4">
            <SignOutButton className="font-mono text-[11px] text-text-muted underline underline-offset-2 hover:text-text-primary">
              Çıkış yap
            </SignOutButton>
          </div>
        )}
      </div>
    </div>
  );
}
