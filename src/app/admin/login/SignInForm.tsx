"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { signIn } from "../actions";

const field =
  "w-full rounded border border-border bg-bg-primary px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-crimson-glow/50";

export default function SignInForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await signIn(formData);
      // A full page load, so the next request goes through src/proxy.ts with the new session.
      if (result.ok) window.location.assign("/");
      else setError(result.error ?? null);
    });
  }

  return (
    <form action={submit} className="space-y-4">
      <label className="block">
        <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.15em] text-text-muted">
          E-posta
        </span>
        <input name="email" type="email" autoComplete="email" required className={field} />
      </label>
      <label className="block">
        <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.15em] text-text-muted">
          Şifre
        </span>
        <input name="password" type="password" autoComplete="current-password" required className={field} />
      </label>

      {error && <p className="text-xs text-crimson-glow">{error}</p>}

      <button
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded bg-crimson px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-crimson-light disabled:opacity-60"
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        Giriş yap
      </button>
    </form>
  );
}
