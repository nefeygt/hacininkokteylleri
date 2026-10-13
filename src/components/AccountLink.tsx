"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { UserRound } from "lucide-react";
import { ACCOUNTS_OPEN } from "@/lib/account-config";
import { createClient } from "@/lib/supabase/browser";

/**
 * "Giriş" or "Hesabım" in the navbar. It reads the session in the browser, so
 * the public pages stay static (ADR-005). Hidden until accounts open (M3).
 */
export default function AccountLink({ active }: { active: boolean }) {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    if (!ACCOUNTS_OPEN) return;
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => setSignedIn(Boolean(data.session)));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setSignedIn(Boolean(session)));
    return () => data.subscription.unsubscribe();
  }, []);

  if (!ACCOUNTS_OPEN || signedIn === null) return null;

  return (
    <Link
      href={signedIn ? "/hesap" : "/giris"}
      className={`ml-1 flex items-center gap-1.5 rounded px-3 py-1.5 font-mono text-xs tracking-wide transition-colors ${
        active
          ? "bg-crimson/15 text-crimson-glow"
          : "text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
      }`}
    >
      <UserRound className="h-3.5 w-3.5" />
      {signedIn ? "Hesabım" : "Giriş"}
    </Link>
  );
}
