"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { verifyTotp } from "../actions";
import CodeInput from "../CodeInput";

export default function VerifyForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await verifyTotp(formData);
      if (result.ok) window.location.assign("/");
      else setError(result.error ?? null);
    });
  }

  return (
    <form action={submit} className="space-y-4">
      <CodeInput name="code" />
      {error && <p className="text-xs text-crimson-glow">{error}</p>}
      <button
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded bg-crimson px-4 py-2.5 text-sm font-medium text-white hover:bg-crimson-light disabled:opacity-60"
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        Doğrula
      </button>
    </form>
  );
}
