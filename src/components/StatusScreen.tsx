"use client";

import Link from "@/components/LocaleLink";
import { useLocale } from "./LocaleProvider";

// The frame of the site's 404 and error pages: a prescription-style code, a line and a way back.
export default function StatusScreen({
  code,
  title,
  children,
  action,
}: {
  code: string;
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
}) {
  const { t } = useLocale();
  return (
    <section className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-6 text-center">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/3 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-crimson/5 blur-[120px]" />
      </div>
      <div className="relative z-10 max-w-md">
        <div className="mb-4 font-mono text-[10px] uppercase tracking-[0.25em] text-crimson-glow">Rx · {code}</div>
        <h1 className="mb-3 text-3xl font-bold tracking-tight text-text-primary md:text-4xl">{title}</h1>
        {children && <p className="mb-8 text-sm leading-relaxed text-text-secondary">{children}</p>}
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          {action}
          <Link
            href="/cocktails"
            className="inline-flex items-center gap-2 rounded bg-crimson px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-crimson-light"
          >
            {t.status.toCocktails}
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded border border-border-light px-5 py-2.5 text-sm text-text-secondary transition-colors hover:text-text-primary"
          >
            {t.status.home}
          </Link>
        </div>
      </div>
    </section>
  );
}
