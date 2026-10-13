"use client";

import { useState, useTransition } from "react";
import { Loader2, QrCode } from "lucide-react";
import { startTotpEnrollment, verifyTotpEnrollment } from "../actions";
import CodeInput from "../CodeInput";

type Factor = { factorId: string; qrCode: string; secret: string };

export default function EnrollTotp() {
  const [factor, setFactor] = useState<Factor | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function begin() {
    setError(null);
    startTransition(async () => {
      const result = await startTotpEnrollment();
      if ("error" in result) setError(result.error);
      else setFactor(result);
    });
  }

  function verify(e: React.FormEvent) {
    e.preventDefault();
    if (!factor) return;
    setError(null);
    startTransition(async () => {
      const result = await verifyTotpEnrollment(factor.factorId, code);
      if (result.ok) window.location.assign("/");
      else setError(result.error ?? null);
    });
  }

  if (!factor) {
    return (
      <div className="space-y-4">
        <ol className="list-decimal space-y-1.5 pl-4 font-mono text-xs leading-relaxed text-text-secondary">
          <li>Telefonuna Google Authenticator, Microsoft Authenticator ya da benzeri bir uygulama kur.</li>
          <li>Aşağıdaki düğmeyle QR kodu oluştur ve uygulamayla tara.</li>
          <li>Uygulamanın gösterdiği 6 haneli kodu gir.</li>
        </ol>
        {error && <p className="font-mono text-xs text-crimson-glow">{error}</p>}
        <button
          type="button"
          onClick={begin}
          disabled={pending}
          className="flex w-full items-center justify-center gap-2 rounded bg-crimson px-4 py-2.5 font-mono text-sm font-medium text-white hover:bg-crimson-light disabled:opacity-60"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}
          QR kodu oluştur
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={verify} className="space-y-4">
      <div className="mx-auto w-48 rounded bg-white p-2">
        {/* The QR code is an SVG data URI from Supabase. */}
        <img src={factor.qrCode} alt="Doğrulama uygulaması için QR kodu" className="h-full w-full" />
      </div>
      <details className="font-mono text-[11px] text-text-muted">
        <summary className="cursor-pointer hover:text-text-secondary">QR okutamıyor musun? Anahtarı elle gir</summary>
        <code className="mt-2 block break-all rounded bg-bg-primary p-2 text-text-secondary">{factor.secret}</code>
      </details>
      <CodeInput value={code} onChange={setCode} />
      {error && <p className="font-mono text-xs text-crimson-glow">{error}</p>}
      <button
        disabled={pending || code.length !== 6}
        className="flex w-full items-center justify-center gap-2 rounded bg-crimson px-4 py-2.5 font-mono text-sm font-medium text-white hover:bg-crimson-light disabled:opacity-60"
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        Doğrula ve bitir
      </button>
    </form>
  );
}
