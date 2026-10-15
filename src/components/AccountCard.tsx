/** The frame around the public site's sign-in, onboarding and account screens. */
export default function AccountCard({
  title,
  subtitle,
  wide = false,
  children,
}: {
  title: string;
  subtitle?: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-start justify-center px-4 py-12 md:items-center">
      <div className={`w-full rounded-sm border border-border bg-bg-card p-8 ${wide ? "max-w-xl" : "max-w-sm"}`}>
        <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.25em] text-crimson-glow">Rx · Üyelik</div>
        <h1 className="mb-1 text-xl font-bold">{title}</h1>
        {subtitle && <p className="mb-6 text-xs leading-relaxed text-text-muted">{subtitle}</p>}
        {!subtitle && <div className="mb-6" />}
        {children}
      </div>
    </div>
  );
}

export const fieldClass =
  "w-full rounded border border-border bg-bg-primary px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-crimson-glow/50";

export const labelClass = "mb-1.5 block font-mono text-[10px] uppercase tracking-[0.15em] text-text-muted";

export const primaryButtonClass =
  "flex w-full items-center justify-center gap-2 rounded bg-crimson px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-crimson-light disabled:opacity-60";
