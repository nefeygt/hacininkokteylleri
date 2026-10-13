"use client";

import { useOptimistic, useTransition } from "react";
import { setPublished } from "./actions";

export default function PublishToggle({ id, published }: { id: string; published: boolean }) {
  const [pending, startTransition] = useTransition();
  const [shown, setShown] = useOptimistic(published);

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          setShown(!shown);
          await setPublished(id, !shown);
        })
      }
      className={`shrink-0 rounded-sm px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors disabled:opacity-60 ${
        shown
          ? "bg-green-900/30 text-green-400 hover:bg-green-900/50"
          : "bg-bg-elevated text-text-muted hover:text-text-secondary"
      }`}
      title={shown ? "Yayından kaldır" : "Yayınla"}
    >
      {shown ? "Yayında" : "Taslak"}
    </button>
  );
}
