"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";
import { useLocale } from "./LocaleProvider";
import {
  COCKTAIL_IMAGES_BUCKET,
  RECIPE_IMAGES_BUCKET,
  cocktailImageUrl,
  recipeImageUrl,
} from "@/lib/supabase/config";

const MAX_WIDTH = 1600;

/**
 * Gemini stamps a sparkle into the bottom-right corner of its images. It sits
 * 112 px in from both edges, 60 px wide, on a 2816 px-wide image and scales
 * with the width; the patch is copied from just left of it and feathered.
 * Measured on the original 37 photos (ADR-006).
 */
function removeGeminiSparkle(canvas: HTMLCanvasElement) {
  const { width: w, height: h } = canvas;
  const s = w / 2816;
  const cx = w - 112 * s;
  const cy = h - 112 * s;
  const r = 60 * s;

  const patch = document.createElement("canvas");
  patch.width = w;
  patch.height = h;
  const p = patch.getContext("2d")!;
  p.drawImage(canvas, 140 * s, 0);
  const fade = p.createRadialGradient(cx, cy, r - 8 * s, cx, cy, r + 8 * s);
  fade.addColorStop(0, "rgba(0,0,0,1)");
  fade.addColorStop(1, "rgba(0,0,0,0)");
  p.globalCompositeOperation = "destination-in";
  p.fillStyle = fade;
  p.fillRect(0, 0, w, h);

  canvas.getContext("2d")!.drawImage(patch, 0, 0);
}

function encode(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
}

/** Scale to at most 1600 px wide and encode as WebP (JPEG where WebP cannot be encoded). */
async function prepare(file: File, cleanSparkle: boolean, convertFailed: string): Promise<{ blob: Blob; ext: string }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_WIDTH / bitmap.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  if (cleanSparkle) removeGeminiSparkle(canvas);

  const webp = await encode(canvas, "image/webp", 0.8);
  if (webp?.type === "image/webp") return { blob: webp, ext: "webp" };
  const jpeg = await encode(canvas, "image/jpeg", 0.85);
  if (!jpeg) throw new Error(convertFailed);
  return { blob: jpeg, ext: "jpg" };
}

/**
 * A recipe photo. The panel's house recipes go to "cocktail-images" (with the
 * Gemini clean-up); a member's recipes go to their own folder in
 * "recipe-images" (`folder` = their user id, M6).
 */
export default function ImageField({
  value,
  slug,
  onChange,
  folder,
}: {
  value: string | null;
  slug: string;
  onChange: (path: string | null) => void;
  folder?: string;
}) {
  const { t } = useLocale();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cleanSparkle, setCleanSparkle] = useState(!folder);
  const bucket = folder ? RECIPE_IMAGES_BUCKET : COCKTAIL_IMAGES_BUCKET;
  const url = folder ? recipeImageUrl(value) : cocktailImageUrl(value);

  async function upload(file: File) {
    setBusy(true);
    setError(null);
    try {
      const { blob, ext } = await prepare(file, cleanSparkle, t.imageField.convertFailed);
      // A fresh name every time: objects are never overwritten in place (ADR-006).
      const fileName = `${slug || "kokteyl"}-${Date.now().toString(36)}.${ext}`;
      const name = folder ? `${folder}/${fileName}` : fileName;
      const { error } = await createClient()
        .storage.from(bucket)
        .upload(name, blob, { contentType: blob.type, cacheControl: "31536000", upsert: false });
      if (error) throw error;
      onChange(name);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.imageField.uploadFailed);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div>
      <div className="relative aspect-video w-full max-w-md overflow-hidden rounded-sm border border-border bg-bg-elevated">
        {url ? (
          <img src={url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-text-muted">
            {t.imageField.noPhoto}
          </div>
        )}
        {busy && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <Loader2 className="h-6 w-6 animate-spin text-text-primary" />
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => input.current?.click()}
          className="inline-flex items-center gap-2 rounded border border-border px-3 py-2 text-xs text-text-secondary hover:border-border-light hover:text-text-primary disabled:opacity-60"
        >
          <ImagePlus className="h-3.5 w-3.5" /> {url ? t.imageField.change : t.imageField.upload}
        </button>
        {url && (
          <button
            type="button"
            disabled={busy}
            onClick={() => onChange(null)}
            className="inline-flex items-center gap-1.5 rounded px-3 py-2 text-xs text-text-muted hover:text-crimson-glow"
          >
            <X className="h-3.5 w-3.5" /> {t.imageField.remove}
          </button>
        )}
        {!folder && (
          <label className="flex items-center gap-2 font-mono text-[11px] text-text-muted">
            <input
              type="checkbox"
              checked={cleanSparkle}
              onChange={(e) => setCleanSparkle(e.target.checked)}
              className="accent-crimson-glow"
            />
            {t.imageField.sparkle}
          </label>
        )}
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
      {error && <p className="mt-2 text-xs text-crimson-glow">{error}</p>}
    </div>
  );
}
