"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { fieldClass, labelClass, primaryButtonClass } from "@/components/AccountCard";
import { authErrorMessage as authError, MIN_PASSWORD_LENGTH } from "@/lib/account-config";
import { useLocale } from "@/components/LocaleProvider";
import { format } from "@/lib/i18n/format";
import { createClient } from "@/lib/supabase/browser";

type Mode = "sign-in" | "sign-up" | "forgot";

export default function EmailForm({ next }: { next: string }) {
  const { t, href } = useLocale();
  const tl = t.login;
  const TITLES: Record<Mode, string> = { "sign-in": tl.signIn, "sign-up": tl.signUp, forgot: tl.forgot };
  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);

  function switchTo(target: Mode) {
    setMode(target);
    setError(null);
    setSent(null);
  }

  /** E-mail links land on the callback, which exchanges the code for a session. */
  function callback(destination: string) {
    return `${window.location.origin}/auth/callback?via=email&next=${encodeURIComponent(destination)}`;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setSent(null);
    const auth = createClient().auth;

    if (mode === "sign-in") {
      const { error } = await auth.signInWithPassword({ email, password });
      if (error) {
        setError(authError(error.message, t.auth));
        setPending(false);
        return;
      }
      // /login sends a member on to `next`, or to onboarding if the profile is still owed.
      window.location.assign(href(`/login?next=${encodeURIComponent(next)}`));
      return;
    }

    if (mode === "sign-up") {
      const { error } = await auth.signUp({ email, password, options: { emailRedirectTo: callback(next) } });
      if (error) setError(authError(error.message, t.auth));
      // Supabase answers the same way for an address that already has an account.
      else setSent(tl.signUpSent);
    } else {
      const { error } = await auth.resetPasswordForEmail(email, { redirectTo: callback(href("/reset-password")) });
      if (error) setError(authError(error.message, t.auth));
      else setSent(tl.resetSent);
    }
    setPending(false);
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block">
        <span className={labelClass}>{tl.email}</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className={fieldClass}
        />
      </label>

      {mode !== "forgot" && (
        <label className="block">
          <span className={labelClass}>{tl.password}</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={mode === "sign-up" ? MIN_PASSWORD_LENGTH : undefined}
            autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
            className={fieldClass}
          />
          {mode === "sign-up" && (
            <span className="mt-1 block font-mono text-[10px] text-text-muted">
              {format(tl.minChars, { min: MIN_PASSWORD_LENGTH })}
            </span>
          )}
        </label>
      )}

      {error && <p className="text-xs text-crimson-glow">{error}</p>}
      {sent && <p className="text-xs leading-relaxed text-text-secondary">{sent}</p>}

      <button disabled={pending} className={primaryButtonClass}>
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        {TITLES[mode]}
      </button>

      <div className="flex flex-wrap justify-between gap-2 font-mono text-[11px] text-text-muted">
        {mode === "sign-in" ? (
          <>
            <button type="button" onClick={() => switchTo("sign-up")} className="underline underline-offset-2 hover:text-text-primary">
              {tl.noAccount}
            </button>
            <button type="button" onClick={() => switchTo("forgot")} className="underline underline-offset-2 hover:text-text-primary">
              {tl.forgotLink}
            </button>
          </>
        ) : (
          <button type="button" onClick={() => switchTo("sign-in")} className="underline underline-offset-2 hover:text-text-primary">
            {tl.backToSignIn}
          </button>
        )}
      </div>
    </form>
  );
}
