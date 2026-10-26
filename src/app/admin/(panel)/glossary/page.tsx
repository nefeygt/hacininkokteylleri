import { requireAdmin } from "@/lib/admin";
import GlossaryEditor from "../../GlossaryEditor";
import { TRANSLATED_LOCALES } from "../../translations";

export default async function GlossaryPage() {
  const { supabase } = await requireAdmin();
  const [{ data: terms, error }, { data: rows, error: rowsError }] = await Promise.all([
    supabase.from("glossary_terms").select("term, definition").order("term"),
    supabase.from("glossary_term_translations").select("term, locale, translated_term, definition"),
  ]);
  if (error) throw new Error(error.message);
  if (rowsError) throw new Error(rowsError.message);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Sözlük</h1>
      <p className="mb-6 mt-1 max-w-xl text-xs leading-relaxed text-text-muted">
        Buradaki terimler malzeme adlarında ve hazırlanış adımlarında geçtiği her yerde altı çizili gösterilir;
        üzerine gelince açıklaması çıkar. Büyük-küçük harf birebir eşleşmeli. İngilizce terim, İngilizce tariflerde
        altı çizilecek kelimedir (ör. &quot;Şeker Şurubu&quot; → &quot;Simple syrup&quot;); boş kalırsa İngilizce sayfalarda
        bu terim açıklamasız görünür.
      </p>
      <GlossaryEditor
        terms={terms.map((t) => ({
          ...t,
          translations: Object.fromEntries(
            TRANSLATED_LOCALES.map((l) => {
              const row = rows.find((r) => r.term === t.term && r.locale === l);
              return [l, { term: row?.translated_term ?? "", definition: row?.definition ?? "" }];
            })
          ) as Record<(typeof TRANSLATED_LOCALES)[number], { term: string; definition: string }>,
        }))}
      />
    </div>
  );
}
