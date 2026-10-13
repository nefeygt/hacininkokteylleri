import Link from "next/link";
import { ExternalLink, LogOut, Wine } from "lucide-react";
import { requireAdmin } from "@/lib/admin";
import SignOutButton from "../SignOutButton";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "/";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const { admin } = await requireAdmin();

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-bg-primary/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded bg-crimson/20">
                <Wine className="h-3.5 w-3.5 text-crimson-glow" />
              </div>
              <span className="hidden font-mono text-xs font-bold tracking-wider sm:inline">
                YÖNETİM
              </span>
            </Link>
            <nav className="flex items-center gap-1 font-mono text-xs">
              <Link href="/" className="rounded px-2.5 py-1.5 text-text-secondary hover:bg-bg-elevated hover:text-text-primary">
                Kokteyller
              </Link>
              <Link href="/sozluk" className="rounded px-2.5 py-1.5 text-text-secondary hover:bg-bg-elevated hover:text-text-primary">
                Sözlük
              </Link>
              <a
                href={SITE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 rounded px-2.5 py-1.5 text-text-muted hover:bg-bg-elevated hover:text-text-primary"
              >
                Site <ExternalLink className="h-3 w-3" />
              </a>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden font-mono text-[11px] text-text-muted sm:inline">
              {admin.display_name}
              <span className="ml-1.5 rounded bg-bg-elevated px-1.5 py-0.5 text-[9px] uppercase tracking-wider">
                {admin.role === "owner" ? "sahip" : "editör"}
              </span>
            </span>
            <SignOutButton
              title="Çıkış"
              className="flex h-8 w-8 items-center justify-center rounded text-text-muted hover:bg-bg-elevated hover:text-text-primary"
            >
              <LogOut className="h-4 w-4" />
            </SignOutButton>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </>
  );
}
