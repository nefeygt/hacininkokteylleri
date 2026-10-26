"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BRAND } from "@/lib/brand";
import AccountLink from "./AccountLink";
import ThemePicker from "./ThemePicker";

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-bg-primary/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4 sm:px-6">
        {/* The wordmark carries the cherry over the "i" (ADR-015); on phones it is the only link home. */}
        <Link href="/" aria-label={`${BRAND} — Ana Sayfa`} className="flex shrink-0 items-center opacity-90 transition-opacity hover:opacity-100">
          {/* Light themes swap in the dark drawing (globals.css). */}
          <Image src="/brand/haci-wordmark-light.svg" alt={BRAND} width={69} height={32} priority className="wordmark-on-dark" />
          <Image src="/brand/haci-wordmark-dark.svg" alt="" width={69} height={32} className="wordmark-on-light" />
        </Link>

        <div className="flex items-center gap-1">
          <NavLink href="/" active={pathname === "/"} className="hidden sm:block">
            Ana Sayfa
          </NavLink>
          <NavLink href="/cocktails" active={pathname === "/cocktails"}>
            Kokteyller
          </NavLink>
          <NavLink href="/feed" active={pathname === "/feed"}>
            Akış
          </NavLink>
          <AccountLink pathname={pathname} />
          <ThemePicker />
        </div>
      </div>
    </nav>
  );
}

function NavLink({
  href,
  active,
  className = "",
  children,
}: {
  href: string;
  active: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`${className} whitespace-nowrap rounded px-2 py-1.5 sm:px-3 font-mono text-xs tracking-wide transition-colors ${
        active
          ? "bg-crimson/15 text-crimson-glow"
          : "text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
      }`}
    >
      {children}
    </Link>
  );
}
