"use client";

import { useState, useTransition } from "react";
import { setLogsPublicDefault } from "./logs/actions";

/** Whether new drink logs start public; private unless the member changes it (ADR-014). */
export default function LogsDefaultToggle({ initial }: { initial: boolean }) {
  const [checked, setChecked] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function change(next: boolean) {
    setChecked(next);
    setError(null);
    startTransition(async () => {
      const result = await setLogsPublicDefault(next);
      if (result.error) {
        setChecked(!next);
        setError(result.error);
      }
    });
  }

  return (
    <div>
      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={checked}
          disabled={pending}
          onChange={(e) => change(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-crimson"
        />
        <span className="text-xs leading-relaxed text-text-secondary">
          Yeni kayıtlarım herkese açık başlasın. Her kaydı ayrıca açıp kapatabilirsin; mevcut kayıtlar değişmez.
        </span>
      </label>
      {error && <p className="mt-2 text-xs text-crimson-glow">{error}</p>}
    </div>
  );
}
