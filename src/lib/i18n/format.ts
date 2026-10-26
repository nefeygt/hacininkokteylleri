/** Fills "{name}" placeholders: format("{n} sonuç", { n: 3 }) → "3 sonuç". */
export function format(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in vars ? String(vars[key]) : match));
}
