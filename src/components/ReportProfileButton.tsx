"use client";

import { useEffect, useState } from "react";
import { ACCOUNTS_OPEN } from "@/lib/account-config";
import { createClient } from "@/lib/supabase/browser";
import type { ReportableTarget } from "@/app/[lang]/(site)/cocktails/actions";
import ReportButton from "./ReportButton";

/** "Profili bildir" on someone else's profile, for signed-in visitors. The page stays static. */
export default function ReportProfileButton({ profileId }: { profileId: string }) {
  return <ReportIfSignedIn ownerId={profileId} targetType="profile" targetId={profileId} label="Profili bildir" />;
}

/**
 * A report button shown only to signed-in visitors who do not own the
 * content, decided in the browser so static pages stay static (ADR-016).
 */
export function ReportIfSignedIn({
  ownerId,
  targetType,
  targetId,
  label,
}: {
  ownerId: string;
  targetType: ReportableTarget;
  targetId: string;
  label?: string;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ACCOUNTS_OPEN) return;
    createClient()
      .auth.getSession()
      .then(({ data }) => {
        const userId = data.session?.user.id;
        setVisible(Boolean(userId) && userId !== ownerId);
      });
  }, [ownerId]);

  if (!visible) return null;
  return <ReportButton targetType={targetType} targetId={targetId} label={label} />;
}
