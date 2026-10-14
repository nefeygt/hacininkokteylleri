"use client";

import { useState } from "react";
import { Star } from "lucide-react";

/** Five stars, the first `value` filled. Read-only unless `onChange` is given. */
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
      <span className="inline-flex items-center gap-0.5" aria-label={`5 üzerinden ${value}`} role="img">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            style={{ width: size, height: size }}
            className={n <= Math.round(value) ? "fill-crimson-glow text-crimson-glow" : "text-text-muted/40"}
          />
        ))}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1" role="radiogroup" aria-label="Puan" onMouseLeave={() => setHover(null)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} yıldız`}
          onMouseEnter={() => setHover(n)}
          onClick={() => onChange(n)}
          className="rounded p-0.5 transition-transform hover:scale-110"
        >
          <Star
            style={{ width: size, height: size }}
            className={n <= shown ? "fill-crimson-glow text-crimson-glow" : "text-text-muted/50"}
          />
        </button>
      ))}
    </span>
  );
}
