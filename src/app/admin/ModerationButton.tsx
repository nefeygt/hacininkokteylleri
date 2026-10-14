"use client";

import { useTransition } from "react";
import { resolveReport, setProfileHidden, setReviewHidden } from "./actions";

type Action =
  | { kind: "review"; id: string; hide: boolean }
  | { kind: "profile"; id: string; hide: boolean }
  | { kind: "resolve"; id: string };

function label(action: Action) {
  if (action.kind === "resolve") return "Kapat";
  return action.hide ? "Gizle" : "Göster";
}

/** One moderation step; the page refreshes from the action's revalidation. */
export default function ModerationButton({ action }: { action: Action }) {
  const [pending, startTransition] = useTransition();

  function run() {
    startTransition(async () => {
      const result =
        action.kind === "resolve"
          ? await resolveReport(action.id)
          : action.kind === "review"
            ? await setReviewHidden(action.id, action.hide)
            : await setProfileHidden(action.id, action.hide);
      if (result.error) window.alert(result.error);
    });
  }

  const danger = action.kind !== "resolve" && action.hide;
  return (
    <button
      type="button"
      onClick={run}
      disabled={pending}
      className={`shrink-0 rounded-sm px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors disabled:opacity-60 ${
        danger
          ? "bg-crimson/15 text-crimson-glow hover:bg-crimson/25"
          : "bg-bg-elevated text-text-muted hover:text-text-secondary"
      }`}
    >
      {pending ? "…" : label(action)}
    </button>
  );
}
