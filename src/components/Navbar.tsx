"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wine, Film } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-bg-primary/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="group flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-crimson/20 transition-colors group-hover:bg-crimson/30">
            <Wine className="h-4 w-4 text-crimson-glow" />
          </div>
          <span className="font-mono text-sm font-bold tracking-wider text-text-primary">
            HACININ
            <span className="text-crimson-glow"> KOKTEYLLERİ</span>
          </span>
        </Link>

        <div className="flex items-center gap-1">
          <NavLink href="/" active={pathname === "/"}>
            Ana Sayfa
          </NavLink>
          <NavLink href="/kokteyller" active={pathname === "/kokteyller"}>
            Kokteyller
          </NavLink>
          <a
            href="https://letterboxd.com/krasic/"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 flex h-8 w-8 items-center justify-center rounded text-text-muted transition-colors hover:bg-bg-elevated hover:text-text-secondary"
            title="Letterboxd"
          >
            <Film className="h-4 w-4" />
          </a>
        </div>
      </div>
    </nav>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`rounded px-3 py-1.5 font-mono text-xs tracking-wide transition-colors ${
        active
          ? "bg-crimson/15 text-crimson-glow"
          : "text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
      }`}
    >
      {children}
    </Link>
  );
}
