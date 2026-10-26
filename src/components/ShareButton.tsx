"use client";

import { useEffect, useState } from "react";
import { Check, Share2 } from "lucide-react";
import { useLocale } from "./LocaleProvider";

/**
 * "Paylaş" on a recipe page: the phone's share sheet where the browser has one,
 * otherwise the page's link to the clipboard. Shares the page without its query.
 */
export default function ShareButton({ title, text }: { title: string; text?: string }) {
  const { t } = useLocale();
  const [copy, setCopy] = useState<"idle" | "copied" | "failed">("idle");

  useEffect(() => {
    if (copy === "idle") return;
    const timer = setTimeout(() => setCopy("idle"), 2500);
    return () => clearTimeout(timer);
  }, [copy]);

  async function share() {
    const url = `${window.location.origin}${window.location.pathname}`;
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch {
        // Closing the share sheet rejects; nothing to do.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopy("copied");
    } catch {
      setCopy("failed");
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      title={t.cocktails.shareTitle}
      className="flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-bg-elevated px-3 font-mono text-[11px] text-text-muted transition-colors hover:text-crimson-glow"
    >
      {copy === "copied" ? <Check className="h-3.5 w-3.5 text-crimson-glow" /> : <Share2 className="h-3.5 w-3.5" />}
      <span aria-live="polite">
        {copy === "copied" ? t.cocktails.linkCopied : copy === "failed" ? t.cocktails.copyFailed : t.cocktails.share}
      </span>
    </button>
  );
}
