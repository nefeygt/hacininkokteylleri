"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import { tooltips } from "@/data/cocktails";

export default function Tooltip({ term }: { term: string }) {
  const [visible, setVisible] = useState(false);
  const text = tooltips[term];

  if (!text) return <span>{term}</span>;

  return (
    <span
      className="relative inline-flex items-center gap-1"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      <span className="cursor-help border-b border-dashed border-crimson-glow/50 text-crimson-glow">
        {term}
      </span>
      <Info className="h-3 w-3 shrink-0 text-crimson-glow/60" />

      {visible && (
        <span className="absolute bottom-full left-1/2 z-50 mb-2 w-64 -translate-x-1/2 rounded border border-border-light bg-bg-elevated px-3 py-2 font-mono text-xs leading-relaxed text-text-secondary shadow-lg shadow-black/40">
          <span className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-b border-r border-border-light bg-bg-elevated" />
          {text}
        </span>
      )}
    </span>
  );
}

/** Wraps instruction text, replacing tooltip terms with interactive Tooltip components */
export function InstructionText({ text }: { text: string }) {
  const terms = Object.keys(tooltips);
  const regex = new RegExp(`(${terms.map(escapeRegex).join("|")})`, "g");
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, i) =>
        terms.includes(part) ? <Tooltip key={i} term={part} /> : part
      )}
    </span>
  );
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
