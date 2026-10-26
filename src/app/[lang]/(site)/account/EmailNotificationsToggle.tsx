"use client";

import { useState, useTransition } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { setEmailNotifications } from "./logs/actions";

/** Whether unread notifications reach the member by e-mail, as one digest at most every 15 minutes (ADR-031). */
export default function EmailNotificationsToggle({ initial }: { initial: boolean }) {
  const { t } = useLocale();
  const [checked, setChecked] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function change(next: boolean) {
    setChecked(next);
    setError(null);
    startTransition(async () => {
      const result = await setEmailNotifications(next);
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
          {t.account.emailDigest}
        </span>
      </label>
      {error && <p className="mt-2 text-xs text-crimson-glow">{error}</p>}
    </div>
  );
}
