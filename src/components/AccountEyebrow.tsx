"use client";

import { useLocale } from "./LocaleProvider";

/** The small "Rx · Üyelik" line above an account screen's title, in the page's language. */
export default function AccountEyebrow() {
  const { t } = useLocale();
  return (
    <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.25em] text-crimson-glow">{t.accountCard.eyebrow}</div>
  );
}
