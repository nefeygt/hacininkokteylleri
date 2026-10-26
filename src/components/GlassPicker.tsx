"use client";

import { useState } from "react";
import GlassIcon from "@/components/GlassIcon";
import { GLASSES, glassKind } from "@/lib/glasses";

/**
 * The glass as a row of drawings (M9 Icebox round). The value stays free text: a drawing writes its
 * name; "Başka" opens the text field for a glass the list does not have (or an existing "A / B").
 */
export default function GlassPicker({
  value,
  onChange,
  maxLength,
  inputClassName,
  list,
}: {
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  inputClassName: string;
  /** A datalist of glasses already in use, for the "Başka" field. */
  list?: string;
}) {
  const kind = glassKind(value);
  // A value the drawings would rewrite ("Martini / Coupe", "Tiki") keeps its own words in the field.
  const [custom, setCustom] = useState(Boolean(value) && (!kind || kind.name !== value));

  return (
    <div>
      <div role="group" aria-label="Bardak" className="grid grid-cols-4 gap-1.5 sm:grid-cols-7">
        {GLASSES.map((g) => {
          const active = !custom && kind?.id === g.id;
          return (
            <button
              key={g.id}
              type="button"
              aria-pressed={active}
              onClick={() => {
                setCustom(false);
                onChange(active ? "" : g.name);
              }}
              className={`flex flex-col items-center gap-1 rounded border px-1 py-2 transition-colors ${
                active
                  ? "border-crimson bg-crimson/15 text-crimson-glow"
                  : "border-border text-text-secondary hover:border-border-light hover:text-text-primary"
              }`}
            >
              <GlassIcon id={g.id} className="h-7 w-7" />
              <span className="text-center font-mono text-[10px] leading-tight">{g.name}</span>
            </button>
          );
        })}
        <button
          type="button"
          aria-pressed={custom}
          onClick={() => setCustom(true)}
          className={`flex flex-col items-center justify-center gap-1 rounded border px-1 py-2 font-mono text-[10px] transition-colors ${
            custom
              ? "border-crimson bg-crimson/15 text-crimson-glow"
              : "border-border text-text-secondary hover:border-border-light hover:text-text-primary"
          }`}
        >
          <span className="text-lg leading-none">…</span>
          Başka
        </button>
      </div>
      {custom && (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={maxLength}
          list={list}
          placeholder="Bardağın adı"
          aria-label="Bardağın adı"
          autoFocus
          className={`mt-2 ${inputClassName}`}
        />
      )}
    </div>
  );
}
