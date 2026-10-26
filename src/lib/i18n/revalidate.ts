import { revalidatePath } from "next/cache";
import { LOCALES } from "./locales";

/**
 * revalidatePath for a public path in every language (ADR-032): pages live under /[lang], so "/cocktails"
 * is cached as /tr/cocktails, /en/cocktails…; a route pattern ("/cocktails/[slug]") becomes "/[lang]/cocktails/[slug]".
 */
export function revalidateLocalized(path: string, type?: "page" | "layout") {
  const tail = path === "/" ? "" : path;
  if (path.includes("[")) {
    revalidatePath(`/[lang]${tail}`, type ?? "page");
    return;
  }
  for (const locale of LOCALES) revalidatePath(`/${locale}${tail}`, type);
}
