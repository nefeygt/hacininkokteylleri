"use client";

import { useEffect, useState, useTransition } from "react";
import { Flag } from "lucide-react";
import { reportContent } from "@/app/(site)/cocktails/actions";
import { ACCOUNTS_OPEN } from "@/lib/account-config";
import { createClient } from "@/lib/supabase/browser";

/** "Bildir" on someone else's profile, for signed-in visitors. The page stays static. */
export default function ReportProfileButton({ profileId }: { profileId: string }) {
  const [visible, setVisible] = useState(false);
  const [reported, setReported] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!ACCOUNTS_OPEN) return;
    createClient()
      .auth.getSession()
      .then(({ data }) => {
        const userId = data.session?.user.id;
        setVisible(Boolean(userId) && userId !== profileId);
      });
  }, [profileId]);

  if (!visible) return null;

  function report() {
    const reason = window.prompt("Bu profili neden bildiriyorsun? (isteğe bağlı)");
    if (reason === null) return;
    startTransition(async () => {
      const result = await reportContent("profile", profileId, reason);
      if (result.error) window.alert(result.error);
      else setReported(true);
    });
  }

  return (
    <button
      type="button"
      onClick={report}
      disabled={pending || reported}
      className="flex items-center gap-1 font-mono text-[11px] text-text-muted hover:text-crimson-glow disabled:hover:text-text-muted"
    >
      <Flag className="h-3 w-3" />
      {reported ? "Bildirildi" : "Profili bildir"}
    </button>
  );
}
