"use client";

import { useState, useEffect, useCallback } from "react";
import { Info } from "lucide-react";
import { tooltips } from "@/data/cocktails";

export default function Tooltip({ term }: { term: string }) {
  const [visible, setVisible] = useState(false);
  const text = tooltips[term];

  // Close on outside tap (mobile)
  const handleOutside = useCallback(() => {
    if (visible) setVisible(false);
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => {
      document.addEventListener("click", handleOutside, { once: true });
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", handleOutside);
    };
  }, [visible, handleOutside]);

  if (!text) return <span>{term}</span>;

  return (
    <span
      className="inline-flex cursor-help items-center gap-1"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onClick={(e) => {
        e.stopPropagation();
        setVisible((v) => !v);
      }}
    >
      <span className="border-b border-dashed border-crimson-glow/50 text-crimson-glow">
        {term}
      </span>
      {/* Icon is the anchor — tooltip is positioned relative to this wrapper */}
      <span className="relative inline-flex shrink-0">
        <Info className="h-3 w-3 text-crimson-glow/60" />

        {visible && (
          <span className="absolute bottom-full right-1/2 z-[100] mb-2 w-64 translate-x-1/2 rounded border border-border-light bg-bg-elevated px-3 py-2 font-mono text-xs leading-relaxed text-text-secondary shadow-xl shadow-black/60">
            <span className="absolute -bottom-1 right-1/2 h-2 w-2 translate-x-1/2 rotate-45 border-b border-r border-border-light bg-bg-elevated" />
            {text}
          </span>
        )}
      </span>
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
