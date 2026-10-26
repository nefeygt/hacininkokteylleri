"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { fieldClass, labelClass, primaryButtonClass } from "@/components/AccountCard";
import { updateProfile } from "./actions";

export default function ProfileForm({
  username,
  displayName,
  bio,
}: {
  username: string;
  displayName: string;
  bio: string;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      const result = await updateProfile(formData);
      if (result.ok) {
        setMessage({ ok: true, text: "Kaydedildi." });
        router.refresh();
      } else {
        setMessage({ ok: false, text: result.error ?? "Kaydedilemedi." });
      }
    });
  }

  return (
    <form action={submit} className="space-y-4">
      <label className="block">
        <span className={labelClass}>Kullanıcı adı</span>
        <div className="flex items-center rounded border border-border bg-bg-primary focus-within:border-crimson-glow/50">
          <span className="pl-3 text-sm text-text-muted">@</span>
          <input
            name="username"
            defaultValue={username}
            required
            minLength={3}
            maxLength={20}
            pattern="[a-z0-9_]{3,20}"
            autoCapitalize="none"
            spellCheck={false}
            className="w-full bg-transparent px-1 py-2.5 text-sm text-text-primary outline-none"
          />
        </div>
      </label>

      <label className="block">
        <span className={labelClass}>Görünen ad</span>
        <input name="display_name" defaultValue={displayName} required maxLength={50} className={fieldClass} />
      </label>

      <label className="block">
        <span className={labelClass}>Hakkında</span>
        <textarea name="bio" defaultValue={bio} maxLength={280} rows={3} className={`${fieldClass} resize-none`} />
        <span className="mt-1 block font-mono text-[10px] text-text-muted">En fazla 280 karakter.</span>
      </label>

      {message && (
        <p className={`text-xs ${message.ok ? "text-text-secondary" : "text-crimson-glow"}`}>{message.text}</p>
      )}

      <button disabled={pending} className={primaryButtonClass}>
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        Kaydet
      </button>
    </form>
  );
}
