"use client";

import { useState, useTransition } from "react";
import { Flag } from "lucide-react";
import { reportContent } from "@/app/(site)/cocktails/actions";
import { REPORT_REASON_MAX_LENGTH } from "@/lib/community";

/** "Bildir": opens a small inline form with an optional reason, then sends the report. */
export default function ReportButton({
  targetType,
  targetId,
  label = "Bildir",
}: {
  targetType: "review" | "profile";
  targetId: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [reported, setReported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function send() {
    setError(null);
    startTransition(async () => {
      const result = await reportContent(targetType, targetId, reason);
      if (result.error) {
        setError(result.error);
        return;
      }
      setReported(true);
      setOpen(false);
    });
  }

  if (reported) {
    return <span className="font-mono text-[10px] text-text-muted">Bildirildi, teşekkürler.</span>;
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 font-mono text-[10px] text-text-muted hover:text-crimson-glow"
      >
        <Flag className="h-3 w-3" />
        {label}
      </button>
    );
  }

  return (
    <div className="w-full basis-full rounded border border-border bg-bg-elevated/40 p-3">
      <input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        maxLength={REPORT_REASON_MAX_LENGTH}
        placeholder="Neden? (isteğe bağlı)"
        aria-label="Bildirim nedeni"
        className="w-full rounded border border-border bg-bg-card px-2.5 py-1.5 text-xs text-text-primary placeholder-text-muted outline-none focus:border-crimson-glow/40"
      />
      {error && <p className="mt-2 font-mono text-[11px] text-crimson-glow">{error}</p>}
      <div className="mt-2 flex items-center gap-3">
        <button
          type="button"
          onClick={send}
          disabled={pending}
          className="rounded bg-crimson px-3 py-1 font-mono text-[11px] text-white hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Gönderiliyor…" : "Gönder"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={pending}
          className="font-mono text-[11px] text-text-muted hover:text-text-primary"
        >
          Vazgeç
        </button>
      </div>
    </div>
  );
}
