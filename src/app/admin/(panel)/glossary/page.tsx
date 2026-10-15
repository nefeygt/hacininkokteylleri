import { requireAdmin } from "@/lib/admin";
import GlossaryEditor from "../../GlossaryEditor";

export default async function GlossaryPage() {
  const { supabase } = await requireAdmin();
  const { data: terms, error } = await supabase
    .from("glossary_terms")
    .select("term, definition")
    .order("term");
  if (error) throw new Error(error.message);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Sözlük</h1>
      <p className="mb-6 mt-1 max-w-xl text-xs leading-relaxed text-text-muted">
        Buradaki terimler malzeme adlarında ve hazırlanış adımlarında geçtiği her yerde altı çizili gösterilir;
        üzerine gelince açıklaması çıkar. Büyük-küçük harf birebir eşleşmeli.
      </p>
      <GlossaryEditor terms={terms} />
    </div>
  );
}
