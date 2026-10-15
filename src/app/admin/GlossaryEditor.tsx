"use client";

import { useState, useTransition } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { deleteGlossaryTerm, saveGlossaryTerm } from "./actions";

type Term = { term: string; definition: string };

const field =
  "w-full rounded border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-crimson-glow/50";

function TermRow({ initial }: { initial: Term | null }) {
  const [term, setTerm] = useState(initial?.term ?? "");
  const [definition, setDefinition] = useState(initial?.definition ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const dirty = term !== (initial?.term ?? "") || definition !== (initial?.definition ?? "");

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await saveGlossaryTerm(initial?.term ?? null, term, definition);
      if (result.error) setError(result.error);
      else if (!initial) {
        setTerm("");
        setDefinition("");
      }
    });
  }

  function remove() {
    if (!initial) return;
    startTransition(async () => {
      const result = await deleteGlossaryTerm(initial.term);
      if (result.error) setError(result.error);
    });
  }

  return (
    <li className="grid gap-2 p-3 sm:grid-cols-[200px_1fr_auto]">
      <input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Terim" className={field} />
      <textarea
        rows={2}
        value={definition}
        onChange={(e) => setDefinition(e.target.value)}
        placeholder="Açıklama"
        className={`${field} resize-y`}
      />
      <div className="flex items-start gap-1">
        <button
          type="button"
          disabled={!dirty || pending}
          onClick={save}
          className="inline-flex items-center gap-1.5 rounded bg-crimson px-3 py-2 text-xs text-white hover:bg-crimson-light disabled:opacity-40"
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : initial ? null : <Plus className="h-3.5 w-3.5" />}
          {initial ? "Kaydet" : "Ekle"}
        </button>
        {initial && (
          <button
            type="button"
            disabled={pending}
            onClick={remove}
            title="Sil"
            className="flex h-8 w-8 items-center justify-center rounded text-text-muted hover:bg-bg-elevated hover:text-crimson-glow"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
      {error && <p className="text-xs text-crimson-glow sm:col-span-3">{error}</p>}
    </li>
  );
}

export default function GlossaryEditor({ terms }: { terms: Term[] }) {
  return (
    <ul className="divide-y divide-border rounded-sm border border-border bg-bg-card">
      {terms.map((t) => (
        <TermRow key={t.term} initial={t} />
      ))}
      <TermRow key="__new" initial={null} />
    </ul>
  );
}
