"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import DrinkLogEntry, { DRINK_LOG_WITH_AUTHOR_COLUMNS, type DrinkLogRow } from "@/components/DrinkLogEntry";
import { useMember } from "@/components/useMember";
import { createClient } from "@/lib/supabase/browser";

const SHOWN = 30;

/**
 * The latest public drink logs of the people the visitor follows (M6,
 * ADR-018), read in the browser so the feed page stays static (ADR-016).
 */
export default function FollowingLogs() {
  const { member } = useMember();
  const [logs, setLogs] = useState<DrinkLogRow[] | null>(null);
  const [counts, setCounts] = useState<Map<string, number>>(new Map());
  const [followsNobody, setFollowsNobody] = useState(false);
  const memberId = member.state === "ok" ? member.id : null;

  useEffect(() => {
    if (!memberId) return;
    const supabase = createClient();
    let cancelled = false;

    (async () => {
      const { data: follows } = await supabase.from("follows").select("followee_id").eq("follower_id", memberId).limit(1000);
      const ids = (follows ?? []).map((f) => f.followee_id);
      if (ids.length === 0) {
        if (!cancelled) {
          setFollowsNobody(true);
          setLogs([]);
        }
        return;
      }
      const { data } = await supabase
        .from("drink_logs")
        .select(DRINK_LOG_WITH_AUTHOR_COLUMNS)
        .in("user_id", ids)
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(SHOWN);
      const rows = (data ?? []) as DrinkLogRow[];
      const { data: comments } = rows.length
        ? await supabase.from("log_comments").select("log_id").in("log_id", rows.map((r) => r.id))
        : { data: [] };
      if (cancelled) return;
      const byLog = new Map<string, number>();
      for (const c of comments ?? []) byLog.set(c.log_id, (byLog.get(c.log_id) ?? 0) + 1);
      setCounts(byLog);
      setLogs(rows);
    })();

    return () => {
      cancelled = true;
    };
  }, [memberId]);

  if (member.state === "loading") return <p className="text-xs text-text-muted">Yükleniyor…</p>;

  if (member.state === "signed-out") {
    return (
      <p className="rounded bg-bg-elevated/50 px-4 py-3 text-xs leading-relaxed text-text-secondary">
        Takip ettiğin kişilerin içki günlüklerini burada görmek için{" "}
        <Link href={`/login?next=${encodeURIComponent("/feed")}`} className="text-crimson-glow underline underline-offset-2">
          giriş yap
        </Link>
        .
      </p>
    );
  }

  if (member.state === "onboarding") {
    return (
      <p className="rounded bg-bg-elevated/50 px-4 py-3 text-xs text-text-secondary">
        Önce{" "}
        <Link href="/welcome" className="text-crimson-glow underline underline-offset-2">
          profilini tamamla
        </Link>
        .
      </p>
    );
  }

  if (logs === null) return <p className="text-xs text-text-muted">Yükleniyor…</p>;

  if (logs.length === 0) {
    return (
      <p className="text-xs leading-relaxed text-text-muted">
        {followsNobody
          ? "Henüz kimseyi takip etmiyorsun. Bir tarifin sahibinin ya da bir yorumcunun profiline gidip “Takip et”e dokun."
          : "Takip ettiklerin henüz herkese açık bir kayıt paylaşmadı."}
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {logs.map((log) => (
        <li key={log.id}>
          <DrinkLogEntry log={log} mode="public" commentCount={counts.get(log.id)} />
        </li>
      ))}
    </ul>
  );
}
