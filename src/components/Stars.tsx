"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { formatRating } from "@/lib/community";

/** How much of star `n` (1–5) is filled for `value`: 1, 0.5 or 0, to the nearest half. */
function fill(n: number, value: number): number {
  const half = Math.round(value * 2) / 2;
  return half >= n ? 1 : half >= n - 0.5 ? 0.5 : 0;
}

function StarIcon({ amount, size, muted }: { amount: number; size: number; muted: string }) {
  return (
    <span className="relative inline-block" style={{ width: size, height: size }}>
      <Star style={{ width: size, height: size }} className={`absolute inset-0 ${muted}`} />
      {amount > 0 && (
        <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: amount === 1 ? size : size / 2 }}>
          <Star style={{ width: size, height: size }} className="fill-crimson-glow text-crimson-glow" />
        </span>
      )}
    </span>
  );
}

/**
 * Five stars filled to `value`, in half stars (an average shows to the
 * nearest half). Read-only unless `onChange` is given: then each star's left
 * half picks n − 0.5 and its right half n.
 */
export default function Stars({
  value,
  size = 14,
  onChange,
}: {
  value: number;
  size?: number;
  onChange?: (value: number) => void;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover ?? value;

  if (!onChange) {
    return (
      <span className="inline-flex items-center gap-0.5" aria-label={`5 üzerinden ${formatRating(value)}`} role="img">
        {[1, 2, 3, 4, 5].map((n) => (
          <StarIcon key={n} amount={fill(n, value)} size={size} muted="text-text-muted/40" />
        ))}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1" role="radiogroup" aria-label="Puan" onMouseLeave={() => setHover(null)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className="relative rounded p-0.5">
          <StarIcon amount={fill(n, shown)} size={size} muted="text-text-muted/50" />
          {[n - 0.5, n].map((v, i) => (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={value === v}
              aria-label={`${formatRating(v)} yıldız`}
              onMouseEnter={() => setHover(v)}
              onClick={() => onChange(v)}
              className={`absolute inset-y-0 w-1/2 ${i === 0 ? "left-0" : "right-0"}`}
            />
          ))}
        </span>
      ))}
    </span>
  );
}
