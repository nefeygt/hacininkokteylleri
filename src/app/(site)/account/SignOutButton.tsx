"use client";

import { useTransition } from "react";
import { signOut } from "./actions";

export default function SignOutButton() {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      className="rounded border border-border px-4 py-2 font-mono text-xs text-text-secondary transition-colors hover:border-border-light hover:text-text-primary disabled:opacity-60"
      onClick={() =>
        startTransition(async () => {
          await signOut();
          window.location.assign("/");
        })
      }
    >
      Çıkış yap
    </button>
  );
}
