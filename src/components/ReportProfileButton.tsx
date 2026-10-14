"use client";

import { useEffect, useState } from "react";
import { ACCOUNTS_OPEN } from "@/lib/account-config";
import { createClient } from "@/lib/supabase/browser";
import ReportButton from "./ReportButton";

/** "Profili bildir" on someone else's profile, for signed-in visitors. The page stays static. */
export default function ReportProfileButton({ profileId }: { profileId: string }) {
  const [visible, setVisible] = useState(false);

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
  return <ReportButton targetType="profile" targetId={profileId} label="Profili bildir" />;
}
