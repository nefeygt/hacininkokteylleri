"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { fieldClass } from "@/components/AccountCard";
import { createClient } from "@/lib/supabase/browser";
import { AVATARS_BUCKET, RECIPE_IMAGES_BUCKET } from "@/lib/supabase/config";
import { useLocale } from "@/components/LocaleProvider";
import { deleteAccount } from "./actions";

export default function DeleteAccount({ userId, username }: { userId: string; username: string }) {
  const { t, href } = useLocale();
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function remove() {
    setError(null);
    startTransition(async () => {
      // Supabase refuses to delete a user who still owns Storage objects, so
      // the member's own files go first (ADR-014): the avatar and recipe photos.
      for (const bucket of [AVATARS_BUCKET, RECIPE_IMAGES_BUCKET]) {
        const storage = createClient().storage.from(bucket);
        const { data: files, error: listError } = await storage.list(userId, { limit: 1000 });
        if (listError) {
          setError(t.account.filesReadFailed);
          return;
        }
        if (files.length > 0) {
          const { error: removeError } = await storage.remove(files.map((f) => `${userId}/${f.name}`));
          if (removeError) {
            setError(t.account.filesDeleteFailed);
            return;
          }
        }
      }

      const result = await deleteAccount(confirmation);
      if (result.ok) window.location.assign(href("/"));
      else setError(result.error ?? t.account.deleteFailed);
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded border border-crimson/50 px-4 py-2 text-xs text-crimson-glow transition-colors hover:bg-crimson/10"
      >
        {t.account.deleteStart}
      </button>
    );
  }

  return (
    <div className="space-y-3 rounded border border-crimson/40 bg-crimson/5 p-4">
      <label className="block">
        <span className="mb-1.5 block font-mono text-[11px] text-text-secondary">
          {t.account.deleteConfirm}<strong className="text-text-primary">{username}</strong>
        </span>
        <input
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          autoCapitalize="none"
          spellCheck={false}
          className={fieldClass}
        />
      </label>

      {error && <p className="text-xs text-crimson-glow">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={remove}
          disabled={pending || confirmation.trim().toLowerCase() !== username}
          className="flex items-center gap-2 rounded bg-crimson px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-crimson-light disabled:opacity-50"
        >
          {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {t.account.deleteFinal}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setConfirmation("");
            setError(null);
          }}
          disabled={pending}
          className="rounded border border-border px-4 py-2 text-xs text-text-secondary hover:text-text-primary"
        >
          {t.common.cancel}
        </button>
      </div>
    </div>
  );
}
