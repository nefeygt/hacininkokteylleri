/**
 * Picks the singular or plural of "one|other" by an amount: plural("piece|pieces", 1) → "piece". A label without
 * "|" (every Turkish one) is returned as is. English needs only the two forms; a language with more gets its rule here.
 */
export function plural(label: string, n: number | string): string {
  const [one, other = one] = label.split("|");
  return String(n) === "1" ? one : other;
}

/** Fills "{name}" placeholders: format("{n} sonuç", { n: 3 }) → "3 sonuç". A "one|other" template picks by {n}. */
export function format(template: string, vars: Record<string, string | number>): string {
  const chosen = "n" in vars ? plural(template, vars.n) : template;
  return chosen.replace(/\{(\w+)\}/g, (match, key: string) => (key in vars ? String(vars[key]) : match));
}
