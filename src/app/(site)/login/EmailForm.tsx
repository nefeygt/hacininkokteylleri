"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { fieldClass, labelClass, primaryButtonClass } from "@/components/AccountCard";
import { authErrorMessage as authError, MIN_PASSWORD_LENGTH } from "@/lib/account-config";
import { createClient } from "@/lib/supabase/browser";

type Mode = "sign-in" | "sign-up" | "forgot";

const TITLES: Record<Mode, string> = {
  "sign-in": "Giriş yap",
  "sign-up": "Hesap oluştur",
  forgot: "Sıfırlama bağlantısı gönder",
};

export default function EmailForm({ next }: { next: string }) {
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
        setError(authError(error.message));
        setPending(false);
        return;
      }
      // /login sends a member on to `next`, or to onboarding if the profile is still owed.
      window.location.assign(`/login?next=${encodeURIComponent(next)}`);
      return;
    }

    if (mode === "sign-up") {
      const { error } = await auth.signUp({ email, password, options: { emailRedirectTo: callback(next) } });
      if (error) setError(authError(error.message));
      // Supabase answers the same way for an address that already has an account.
      else setSent("Onay bağlantısını e-postana gönderdik. Bağlantıya tıklayınca hesabın açılır. Gelmediyse Gereksiz/Spam klasörüne bak; bu adresle zaten bir hesap varsa e-posta gelmez, giriş yap ya da şifreni sıfırla.");
    } else {
      const { error } = await auth.resetPasswordForEmail(email, { redirectTo: callback("/reset-password") });
      if (error) setError(authError(error.message));
      else setSent("Bu adresle bir hesap varsa, şifre sıfırlama bağlantısını gönderdik. Gelmediyse Gereksiz/Spam klasörüne bak.");
    }
    setPending(false);
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block">
        <span className={labelClass}>E-posta</span>
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
          <span className={labelClass}>Şifre</span>
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
              En az {MIN_PASSWORD_LENGTH} karakter.
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
              Hesabın yok mu? Oluştur
            </button>
            <button type="button" onClick={() => switchTo("forgot")} className="underline underline-offset-2 hover:text-text-primary">
              Şifremi unuttum
            </button>
          </>
        ) : (
          <button type="button" onClick={() => switchTo("sign-in")} className="underline underline-offset-2 hover:text-text-primary">
            Giriş yapmaya dön
          </button>
        )}
      </div>
    </form>
  );
}
