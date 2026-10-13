const TURKISH: Record<string, string> = {
  ç: "c", ğ: "g", ı: "i", İ: "i", ö: "o", ş: "s", ü: "u",
  Ç: "c", Ğ: "g", Ö: "o", Ş: "s", Ü: "u", â: "a", î: "i", û: "u",
};

/** "Kuzu Kulağı Sour" → "kuzu-kulagi-sour". Matches the slug check in the database. */
export function slugify(text: string): string {
  return text
    .replace(/[çğıİöşüÇĞÖŞÜâîû]/g, (ch) => TURKISH[ch] ?? ch)
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
