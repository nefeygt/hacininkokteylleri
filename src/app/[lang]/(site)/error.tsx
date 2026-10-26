"use client";

import { useEffect } from "react";
import StatusScreen from "@/components/StatusScreen";

// A page of the public site threw (a database hiccup, most often); the navbar stays.
export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <StatusScreen
      code="500"
      title="Bir şeyler ters gitti"
      action={
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-2 rounded border border-crimson px-5 py-2.5 text-sm text-text-primary transition-colors hover:bg-crimson/10"
        >
          Tekrar dene
        </button>
      }
    >
      Sayfa yüklenirken bir sorun çıktı. Biraz sonra tekrar dene.
    </StatusScreen>
  );
}
