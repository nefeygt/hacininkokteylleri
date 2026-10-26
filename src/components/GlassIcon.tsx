import type { SVGProps } from "react";

// Line drawings of the glasses in src/lib/glasses.ts, on a 24 px grid in the current colour.
const PATHS: Record<string, string[]> = {
  highball: ["M7 3h10v17a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1z", "M7 9h10"],
  collins: ["M8.5 2h7v19a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1z", "M8.5 8h7"],
  rocks: ["M5 9h14l-1 11a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1z", "M9.5 13.5h4v4h-4z"],
  coupe: ["M4 6h16c0 4-3.6 6-8 6s-8-2-8-6z", "M12 12v8", "M8 21h8"],
  martini: ["M4 4h16l-8 9z", "M7.5 7.5h9", "M12 13v7", "M8 21h8"],
  margarita: ["M3 5h18c0 2.5-2.5 4-5.5 4H14c0 2-1 3-2 3s-2-1-2-3H8.5C5.5 9 3 7.5 3 5z", "M12 12v8", "M8 21h8"],
  wine: ["M7 3h10v4a5 5 0 0 1-10 0z", "M7.2 6h9.6", "M12 12v8", "M8 21h8"],
  flute: ["M9.5 2h5v8.5a2.5 2.5 0 0 1-5 0z", "M9.5 5h5", "M12 13v7", "M9 21h6"],
  hurricane: ["M8 2h8c0 3-2 4-2 6.5s3 3.5 3 7c0 3-2 4.5-5 4.5s-5-1.5-5-4.5c0-3.5 3-4.5 3-7S8 5 8 2z", "M10 22h4"],
  shot: ["M7.5 9h9l-1.2 11a1 1 0 0 1-1 .9H9.7a1 1 0 0 1-1-.9z", "M8.2 13.5h7.6"],
  mug: ["M5 6h11v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z", "M16 9h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2", "M8 3v1.5", "M11 2.5V4"],
  "copper-mug": ["M5 5h11l-.6 15a1 1 0 0 1-1 1H6.6a1 1 0 0 1-1-1z", "M15.8 8H19v7h-3.4", "M5.2 9.5h10.6"],
  pitcher: ["M8 3h7l-1 3c2.5 1.5 4 4 4 8v6a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1v-6c0-4 1-6.5 3-8z", "M6 3h3", "M7.4 13h10.4"],
};

/** The drawing of a glass kind; an unknown id draws a plain tumbler. */
export default function GlassIcon({ id, ...props }: { id: string } & SVGProps<SVGSVGElement>) {
  const paths = PATHS[id] ?? PATHS.rocks;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
