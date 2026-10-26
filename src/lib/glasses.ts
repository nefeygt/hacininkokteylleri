// The glass picker (M9 Icebox round): the kinds of glass a recipe or a log names, each with a drawing
// (src/components/GlassIcon.tsx). The field stays free text, so older values and odd glasses still work;
// the picker writes a kind's name, and `glassKind` finds the drawing for any text. Shared with the app.

export interface GlassKind {
  id: string;
  /** What the picker writes into the field. */
  name: string;
  /** Lower-case words that mean this glass in existing data ("Martini / Coupe" → martini first). */
  aliases: string[];
}

export const GLASSES: GlassKind[] = [
  { id: "highball", name: "Highball", aliases: ["highball"] },
  { id: "collins", name: "Collins", aliases: ["collins"] },
  { id: "rocks", name: "Rocks", aliases: ["rocks", "old fashioned", "tumbler"] },
  { id: "coupe", name: "Coupe", aliases: ["coupe"] },
  { id: "martini", name: "Martini", aliases: ["martini"] },
  { id: "margarita", name: "Margarita", aliases: ["margarita"] },
  { id: "wine", name: "Şarap Kadehi", aliases: ["şarap", "kadeh", "wine"] },
  { id: "flute", name: "Flüt", aliases: ["flüt", "flute", "şampanya"] },
  { id: "hurricane", name: "Hurricane", aliases: ["hurricane"] },
  { id: "shot", name: "Shot", aliases: ["shot", "shooter"] },
  { id: "mug", name: "Kupa", aliases: ["toddy", "kupa", "mug", "fincan"] },
  { id: "copper-mug", name: "Bakır Kupa", aliases: ["bakır"] },
  { id: "pitcher", name: "Karaf", aliases: ["karaf", "pitcher", "sürahi"] },
];

/**
 * The glass a free-text value names, reading its parts in order ("Hurricane / Highball" → Hurricane),
 * or null for a glass the list does not have.
 */
export function glassKind(value: string | null | undefined): GlassKind | null {
  if (!value) return null;
  for (const part of value.toLocaleLowerCase("tr-TR").split("/")) {
    const text = part.trim();
    // "Bakır Kupa" must not fall to "Kupa": the longest alias that matches wins.
    let best: { kind: GlassKind; length: number } | null = null;
    for (const kind of GLASSES) {
      for (const alias of kind.aliases) {
        if (text.includes(alias) && (!best || alias.length > best.length)) best = { kind, length: alias.length };
      }
    }
    if (best) return best.kind;
  }
  return null;
}
