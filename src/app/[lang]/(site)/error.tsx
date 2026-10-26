"use client";

import { useEffect } from "react";
import StatusScreen from "@/components/StatusScreen";
import { useLocale } from "@/components/LocaleProvider";

// A page of the public site threw (a database hiccup, most often); the navbar stays.
export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useLocale();
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <StatusScreen
      code="500"
      title={t.status.errorTitle}
      action={
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-2 rounded border border-crimson px-5 py-2.5 text-sm text-text-primary transition-colors hover:bg-crimson/10"
        >
          {t.status.retry}
        </button>
      }
    >
      {t.status.errorBody}
    </StatusScreen>
  );
}
