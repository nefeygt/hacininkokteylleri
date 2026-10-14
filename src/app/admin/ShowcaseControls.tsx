"use client";

import { useState, useTransition } from "react";
import type { PeriodLength } from "@/lib/showcase";
import type { Database } from "@/lib/supabase/database.types";
import { createShowcasePeriod, deleteShowcasePeriod, setShowcaseEntryStatus } from "./actions";

type Status = Database["public"]["Enums"]["showcase_status"];

const button =
  "shrink-0 rounded-sm px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors disabled:opacity-60";

/** Opens a showcase period: a start day and a week or a month (M7, ADR-019). */
export function ShowcasePeriodForm({ defaultStart }: { defaultStart: string }) {
  const [start, setStart] = useState(defaultStart);
  const [length, setLength] = useState<PeriodLength>("week");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setDone(false);
    startTransition(async () => {
      const result = await createShowcasePeriod(start, length);
      if (result.error) setError(result.error);
      else setDone(true);
    });
  }

  const field =
    "rounded border border-border bg-bg-card px-3 py-1.5 font-mono text-xs text-text-primary outline-none focus:border-crimson-glow/40";

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-3 rounded-sm border border-border bg-bg-card p-4">
      <label className="block">
        <span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.15em] text-text-muted">Başlangıç</span>
        <input type="date" value={start} onChange={(e) => setStart(e.target.value)} required className={field} />
      </label>
      <label className="block">
        <span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.15em] text-text-muted">Süre</span>
        <select value={length} onChange={(e) => setLength(e.target.value as PeriodLength)} className={field}>
          <option value="week">1 hafta</option>
          <option value="month">1 ay</option>
        </select>
      </label>
      <button
        type="submit"
        disabled={pending || !start}
        className="rounded bg-crimson px-4 py-1.5 font-mono text-xs text-white hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Açılıyor…" : "Dönem aç"}
      </button>
      <p className="basis-full font-mono text-[10px] text-text-muted">
        Dönem seçilen günün gece yarısında (Türkiye) başlar. Başvurular dönem bitene kadar açıktır; oylama yalnızca dönem
        içinde.
      </p>
      {error && <p className="basis-full font-mono text-[11px] text-crimson-glow">{error}</p>}
      {done && <p className="basis-full font-mono text-[11px] text-green-400">Dönem açıldı.</p>}
    </form>
  );
}

/** Approve / reject an application; any admin may (ADR-014). */
export function EntryStatusButtons({ id, status }: { id: string; status: Status }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function set(next: Status) {
    setError(null);
    startTransition(async () => {
      const result = await setShowcaseEntryStatus(id, next);
      if (result.error) setError(result.error);
    });
  }

  return (
    <span className="flex shrink-0 items-center gap-2">
      {error && <span className="max-w-xs font-mono text-[10px] text-crimson-glow">{error}</span>}
      {status !== "approved" && (
        <button type="button" onClick={() => set("approved")} disabled={pending} className={`${button} bg-green-900/40 text-green-400 hover:bg-green-900/60`}>
          {pending ? "…" : "Onayla"}
        </button>
      )}
      {status !== "rejected" && (
        <button type="button" onClick={() => set("rejected")} disabled={pending} className={`${button} bg-crimson/15 text-crimson-glow hover:bg-crimson/25`}>
          {pending ? "…" : "Reddet"}
        </button>
      )}
    </span>
  );
}

/** Deletes a period with its applications and votes; two steps (ADR-016: no confirm dialogs). */
export function DeletePeriodButton({ id, entryCount }: { id: string; entryCount: number }) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function remove() {
    setError(null);
    startTransition(async () => {
      const result = await deleteShowcasePeriod(id);
      if (result.error) setError(result.error);
    });
  }

  if (!confirming) {
    return (
      <button type="button" onClick={() => setConfirming(true)} className="font-mono text-[10px] text-text-muted hover:text-crimson-glow">
        Dönemi sil
      </button>
    );
  }
  return (
    <span className="flex flex-wrap items-center gap-2 font-mono text-[10px]">
      <span className="text-text-muted">
        {entryCount > 0 ? `${entryCount} başvuru ve oyları da silinecek.` : "Silinsin mi?"}
      </span>
      <button type="button" onClick={remove} disabled={pending} className="text-crimson-glow hover:underline disabled:opacity-50">
        {pending ? "Siliniyor…" : "Evet, sil"}
      </button>
      <button type="button" onClick={() => setConfirming(false)} disabled={pending} className="text-text-muted hover:text-text-primary">
        Vazgeç
      </button>
      {error && <span className="text-crimson-glow">{error}</span>}
    </span>
  );
}
