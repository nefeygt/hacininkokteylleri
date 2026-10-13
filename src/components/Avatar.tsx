import { avatarUrl } from "@/lib/supabase/config";

/** A member's picture, or the first letter of their name when they have none. */
export default function Avatar({
  path,
  name,
  size,
}: {
  path: string | null | undefined;
  name: string;
  size: number;
}) {
  const url = avatarUrl(path);
  const style = { width: size, height: size };

  if (url) {
    return (
      <img
        src={url}
        alt=""
        width={size}
        height={size}
        style={style}
        className="shrink-0 rounded-full border border-border object-cover"
      />
    );
  }

  return (
    <div
      style={{ ...style, fontSize: size * 0.4 }}
      className="flex shrink-0 items-center justify-center rounded-full border border-border bg-bg-elevated font-mono text-text-muted"
    >
      {name.trim().charAt(0).toLocaleUpperCase("tr-TR") || "?"}
    </div>
  );
}
