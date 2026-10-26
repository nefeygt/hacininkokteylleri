import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import StatusScreen from "@/components/StatusScreen";
import RootDocument from "./root-document";

export const metadata: Metadata = { title: "Sayfa bulunamadı · haci" };

// An address no route matches (ADR-032: with a root layout per tree, this one brings its own document).
// Missing recipes or profiles inside a language use [lang]/(site)/not-found.tsx instead.
export default function GlobalNotFound() {
  return (
    <RootDocument lang="tr">
      <Navbar />
      <main>
        <StatusScreen code="404" title="Bu reçete bulunamadı">
          Aradığın sayfa hiç olmamış, kaldırılmış ya da adresi değişmiş olabilir.
        </StatusScreen>
      </main>
    </RootDocument>
  );
}
