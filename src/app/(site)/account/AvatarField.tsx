"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import Avatar from "@/components/Avatar";
import { createClient } from "@/lib/supabase/browser";
import { AVATARS_BUCKET } from "@/lib/supabase/config";
import { setAvatar } from "./actions";

const SIZE = 256;

function encode(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
}

/** Crop the centre square, scale to 256 px and encode as WebP (JPEG where WebP cannot be encoded). */
async function prepare(file: File): Promise<{ blob: Blob; ext: string }> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  canvas
    .getContext("2d")!
    .drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, SIZE, SIZE);
  bitmap.close();

  const webp = await encode(canvas, "image/webp", 0.85);
  if (webp?.type === "image/webp") return { blob: webp, ext: "webp" };
  const jpeg = await encode(canvas, "image/jpeg", 0.85);
  if (!jpeg) throw new Error("Görsel dönüştürülemedi.");
  return { blob: jpeg, ext: "jpg" };
}

export default function AvatarField({
  userId,
  path,
  name,
}: {
  userId: string;
  path: string | null;
  name: string;
}) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [current, setCurrent] = useState(path);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(next: string | null) {
    const storage = createClient().storage.from(AVATARS_BUCKET);
    const result = await setAvatar(next);
    if (!result.ok) {
      // The profile still points at the old picture; drop the unused upload.
      if (next) await storage.remove([next]);
      throw new Error(result.error ?? "Kaydedilemedi.");
    }
    setCurrent(next);
    // Objects are never overwritten in place, so the old one is deleted (ADR-006).
    if (result.previous && result.previous !== next) await storage.remove([result.previous]);
    router.refresh();
  }

  async function upload(file: File) {
    setBusy(true);
    setError(null);
    try {
      const { blob, ext } = await prepare(file);
      const name = `${userId}/${Date.now().toString(36)}.${ext}`;
      const { error } = await createClient()
        .storage.from(AVATARS_BUCKET)
        .upload(name, blob, { contentType: blob.type, cacheControl: "31536000", upsert: false });
      if (error) throw error;
      await save(name);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Yükleme başarısız.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  async function remove() {
    setBusy(true);
    setError(null);
    try {
      await save(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kaldırılamadı.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <Avatar path={current} name={name} size={72} />
        {busy && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60">
            <Loader2 className="h-5 w-5 animate-spin text-text-primary" />
          </div>
        )}
      </div>

      <div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => input.current?.click()}
            className="inline-flex items-center gap-2 rounded border border-border px-3 py-2 text-xs text-text-secondary hover:border-border-light hover:text-text-primary disabled:opacity-60"
          >
            <ImagePlus className="h-3.5 w-3.5" /> {current ? "Fotoğrafı değiştir" : "Fotoğraf yükle"}
          </button>
          {current && (
            <button
              type="button"
              disabled={busy}
              onClick={remove}
              className="inline-flex items-center gap-1.5 rounded px-3 py-2 text-xs text-text-muted hover:text-crimson-glow disabled:opacity-60"
            >
              <X className="h-3.5 w-3.5" /> Kaldır
            </button>
          )}
        </div>
        {error && <p className="mt-2 text-xs text-crimson-glow">{error}</p>}
      </div>

      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload(file);
        }}
      />
    </div>
  );
}
