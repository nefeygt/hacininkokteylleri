import { Star } from "lucide-react";
import { formatRating, ratingBreakdown } from "@/lib/community";
import type { Rating } from "@/lib/content";

/** How the reviews spread over the half stars, Letterboxd-style: ten bars from ½ to 5 (M9). */
export default function RatingBreakdown({ rating }: { rating: Rating }) {
  if (!rating.halfStars || rating.count === 0) return null;
  const bars = ratingBreakdown(rating.halfStars);
  const summary = bars
    .filter((b) => b.count > 0)
    .map((b) => `${formatRating(b.rating)} yıldız: ${b.count}`)
    .join(", ");

  return (
    <figure className="mb-6 flex items-end gap-3" aria-label={`Puan dağılımı. ${summary}`}>
      <Star className="mb-0.5 h-3 w-3 shrink-0 fill-crimson-glow text-crimson-glow" aria-hidden />
      <div className="flex h-12 flex-1 items-end gap-0.5" aria-hidden>
        {bars.map((b) => (
          <div
            key={b.rating}
            title={`${formatRating(b.rating)} yıldız: ${b.count} değerlendirme`}
            className="group relative flex h-full flex-1 items-end"
          >
            <div
              className={`w-full rounded-t-sm transition-colors ${
                b.count > 0 ? "bg-text-muted group-hover:bg-crimson-glow" : "bg-border"
              }`}
              style={{ height: b.count > 0 ? `${Math.max(b.share * 100, 6)}%` : "2px" }}
            />
          </div>
        ))}
      </div>
      <span className="mb-0.5 flex shrink-0 gap-px" aria-hidden>
        {[0, 1, 2, 3, 4].map((i) => (
          <Star key={i} className="h-2.5 w-2.5 fill-crimson-glow text-crimson-glow" />
        ))}
      </span>
      <figcaption className="sr-only">{summary}</figcaption>
    </figure>
  );
}
