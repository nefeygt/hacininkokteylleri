"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { fieldClass, labelClass, primaryButtonClass } from "@/components/AccountCard";
import { useLocale } from "@/components/LocaleProvider";
import { MIN_PASSWORD_LENGTH } from "@/lib/account-config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { format } from "@/lib/i18n/format";
import { createClient } from "@/lib/supabase/browser";

/** Supabase's answer to a password change, in the page's language. */
function passwordError(message: string, t: Dictionary): string {
  const r = t.resetPassword;
  if (/different from the old/i.test(message)) return r.errDifferent;
  if (/aal2|mfa/i.test(message)) return r.errMfa;
  if (/at least|too short|weak/i.test(message)) return format(t.auth.passwordShort, { min: MIN_PASSWORD_LENGTH });
  if (/session|expired|jwt/i.test(message)) return r.errExpired;
  if (/rate limit|too many/i.test(message)) return t.auth.rateLimit;
  return r.errSaveFailed;
}

export default function NewPasswordForm({ next }: { next: string }) {
  const { t } = useLocale();
  const tr = t.resetPassword;
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [code, setCode] = useState("");
  // An account with two-factor authentication (the admins, ADR-011) may only
  // change its password from an aal2 session, so the reset asks for the code too.
  const [needsCode, setNeedsCode] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    createClient()
      .auth.mfa.getAuthenticatorAssuranceLevel()
      .then(({ data }) => setNeedsCode(data?.currentLevel === "aal1" && data.nextLevel === "aal2"));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== repeat) {
      setError(tr.mismatch);
      return;
    }
    setPending(true);
    const auth = createClient().auth;

    if (needsCode) {
      const { data: factors } = await auth.mfa.listFactors();
      const factor = factors?.totp.find((f) => f.status === "verified");
      const { error } = factor
        ? await auth.mfa.challengeAndVerify({ factorId: factor.id, code: code.trim() })
        : { error: new Error("no factor") };
      if (error) {
        setError(tr.wrongCode);
        setPending(false);
        return;
      }
      setNeedsCode(false);
    }

    const { error } = await auth.updateUser({ password });
    if (error) {
      setError(passwordError(error.message, t));
      setPending(false);
      return;
    }
    window.location.assign(next);
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block">
        <span className={labelClass}>{tr.newPassword}</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={MIN_PASSWORD_LENGTH}
          autoComplete="new-password"
          className={fieldClass}
        />
      </label>
      <label className="block">
        <span className={labelClass}>{tr.repeat}</span>
        <input
          type="password"
          value={repeat}
          onChange={(e) => setRepeat(e.target.value)}
          required
          minLength={MIN_PASSWORD_LENGTH}
          autoComplete="new-password"
          className={fieldClass}
        />
      </label>
      {needsCode && (
        <label className="block">
          <span className={labelClass}>{tr.code}</span>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            required
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{6}"
            placeholder="123456"
            className={fieldClass}
          />
          <span className="mt-1 block font-mono text-[11px] text-text-muted">
            {tr.codeHint}
          </span>
        </label>
      )}

      {error && <p className="text-xs text-crimson-glow">{error}</p>}

      <button disabled={pending} className={primaryButtonClass}>
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        {tr.save}
      </button>
    </form>
  );
}
