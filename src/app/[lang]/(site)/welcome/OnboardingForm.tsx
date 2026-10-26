"use client";

import Link from "@/components/LocaleLink";
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { fieldClass, labelClass, primaryButtonClass } from "@/components/AccountCard";
import { useLocale } from "@/components/LocaleProvider";
import { completeOnboarding } from "../account/actions";

export default function OnboardingForm({
  defaultUsername,
  defaultDisplayName,
  next,
}: {
  defaultUsername: string;
  defaultDisplayName: string;
  next: string;
}) {
  const { t } = useLocale();
  const tw = t.welcome;
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await completeOnboarding(formData);
      if (result.ok) window.location.assign(next);
      else setError(result.error ?? null);
    });
  }

  return (
    <form action={submit} className="space-y-4">
      <label className="block">
        <span className={labelClass}>{tw.username}</span>
        <div className="flex items-center rounded border border-border bg-bg-primary focus-within:border-crimson-glow/50">
          <span className="pl-3 text-sm text-text-muted">@</span>
          <input
            name="username"
            defaultValue={defaultUsername}
            required
            minLength={3}
            maxLength={20}
            pattern="[a-z0-9_]{3,20}"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            className="w-full bg-transparent px-1 py-2.5 text-sm text-text-primary outline-none"
          />
        </div>
        <span className="mt-1 block font-mono text-[10px] text-text-muted">
          {tw.usernameHint}
        </span>
      </label>

      <label className="block">
        <span className={labelClass}>{tw.displayName}</span>
        <input name="display_name" defaultValue={defaultDisplayName} required maxLength={50} className={fieldClass} />
      </label>

      <div className="space-y-3 rounded border border-border p-3">
        <label className="flex items-start gap-2.5 text-xs leading-relaxed text-text-secondary">
          <input name="adult" type="checkbox" required className="mt-0.5 accent-crimson" />
          {tw.adult}
        </label>
        <label className="flex items-start gap-2.5 text-xs leading-relaxed text-text-secondary">
          <input name="privacy" type="checkbox" required className="mt-0.5 accent-crimson" />
          <span>
            {tw.privacyPrefix}
            <Link href="/privacy" target="_blank" className="underline underline-offset-2 hover:text-text-primary">
              {tw.privacyLink}
            </Link>
            {tw.privacySuffix}
          </span>
        </label>
      </div>

      {error && <p className="text-xs text-crimson-glow">{error}</p>}

      <button disabled={pending} className={primaryButtonClass}>
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        {tw.submit}
      </button>
    </form>
  );
}
