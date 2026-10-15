"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { fieldClass, labelClass, primaryButtonClass } from "@/components/AccountCard";
import { MIN_PASSWORD_LENGTH } from "@/lib/account-config";
import { createClient } from "@/lib/supabase/browser";

/** Supabase's answer to a password change, in Turkish. */
function passwordError(message: string): string {
  if (/different from the old/i.test(message)) return "Yeni şifre eskisinden farklı olmalı.";
  if (/aal2|mfa/i.test(message)) return "Önce doğrulama uygulamandaki 6 haneli kodu gir.";
  if (/at least|too short|weak/i.test(message)) return `Şifre en az ${MIN_PASSWORD_LENGTH} karakter olmalı.`;
  if (/session|expired|jwt/i.test(message)) return "Oturumun sona erdi. Sıfırlama bağlantısını yeniden iste.";
  if (/rate limit|too many/i.test(message)) return "Çok fazla deneme yapıldı. Biraz bekleyip tekrar dene.";
  return "Şifre kaydedilemedi. Tekrar dene.";
}

export default function NewPasswordForm({ next }: { next: string }) {
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
      setError("Şifreler aynı değil.");
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
        setError("Doğrulama kodu yanlış ya da süresi geçti. Tekrar dene.");
        setPending(false);
        return;
      }
      setNeedsCode(false);
    }

    const { error } = await auth.updateUser({ password });
    if (error) {
      setError(passwordError(error.message));
      setPending(false);
      return;
    }
    window.location.assign(next);
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block">
        <span className={labelClass}>Yeni şifre</span>
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
        <span className={labelClass}>Yeni şifre (tekrar)</span>
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
          <span className={labelClass}>Doğrulama kodu</span>
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
            Bu hesapta iki adımlı doğrulama açık: doğrulama uygulamandaki 6 haneli kodu gir.
          </span>
        </label>
      )}

      {error && <p className="text-xs text-crimson-glow">{error}</p>}

      <button disabled={pending} className={primaryButtonClass}>
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        Şifreyi kaydet
      </button>
    </form>
  );
}
