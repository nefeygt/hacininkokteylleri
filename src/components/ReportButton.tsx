"use client";

import { useState, useTransition } from "react";
import { Flag } from "lucide-react";
import { reportContent, type ReportableTarget } from "@/app/[lang]/(site)/cocktails/actions";
import { REPORT_REASON_MAX_LENGTH } from "@/lib/community";
import { useLocale } from "./LocaleProvider";

/** "Bildir": opens a small inline form with an optional reason, then sends the report. */
export default function ReportButton({
  targetType,
  targetId,
  label,
}: {
  targetType: ReportableTarget;
  targetId: string;
  label?: string;
}) {
  const { t } = useLocale();
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
    return <span className="font-mono text-[10px] text-text-muted">{t.report.reported}</span>;
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 font-mono text-[10px] text-text-muted hover:text-crimson-glow"
      >
        <Flag className="h-3 w-3" />
        {label ?? t.report.report}
      </button>
    );
  }

  return (
    <div className="w-full basis-full rounded border border-border bg-bg-elevated/40 p-3">
      <input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        maxLength={REPORT_REASON_MAX_LENGTH}
        placeholder={t.report.reasonPlaceholder}
        aria-label={t.report.reasonLabel}
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
          {pending ? t.common.sending : t.common.send}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={pending}
          className="font-mono text-[11px] text-text-muted hover:text-text-primary"
        >
          {t.common.cancel}
        </button>
      </div>
    </div>
  );
}
