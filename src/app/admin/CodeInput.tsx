"use client";

/** A six-digit one-time code field that phones can autofill. */
export default function CodeInput({
  value,
  onChange,
  name,
}: {
  value?: string;
  onChange?: (code: string) => void;
  name?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.15em] text-text-muted">
        6 haneli kod
      </span>
      <input
        name={name}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 6)) : undefined}
        required
        autoFocus
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]{6}"
        maxLength={6}
        placeholder="000000"
        className="w-full rounded border border-border bg-bg-primary px-3 py-2.5 text-center font-mono text-2xl tracking-[0.5em] text-text-primary outline-none focus:border-crimson-glow/50"
      />
    </label>
  );
}
