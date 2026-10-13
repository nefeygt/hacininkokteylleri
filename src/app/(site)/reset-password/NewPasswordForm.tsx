"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { fieldClass, labelClass, primaryButtonClass } from "@/components/AccountCard";
import { MIN_PASSWORD_LENGTH } from "@/lib/account-config";
import { createClient } from "@/lib/supabase/browser";

export default function NewPasswordForm({ next }: { next: string }) {
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== repeat) {
      setError("Şifreler aynı değil.");
      return;
    }
    setPending(true);
    const { error } = await createClient().auth.updateUser({ password });
    if (error) {
      setError(
        /different from the old/i.test(error.message)
          ? "Yeni şifre eskisinden farklı olmalı."
          : `Şifre en az ${MIN_PASSWORD_LENGTH} karakter olmalı.`
      );
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

      {error && <p className="font-mono text-xs text-crimson-glow">{error}</p>}

      <button disabled={pending} className={primaryButtonClass}>
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        Şifreyi kaydet
      </button>
    </form>
  );
}
