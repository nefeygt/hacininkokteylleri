import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import StatusScreen from "@/components/StatusScreen";

export const metadata: Metadata = { title: "Sayfa bulunamadı" };

// An address no route matches. It renders outside the (site) layout, so it brings the navbar itself.
export default function NotFound() {
  return (
    <>
      <Navbar />
      <main>
        <StatusScreen code="404" title="Bu reçete bulunamadı">
          Aradığın sayfa hiç olmamış, kaldırılmış ya da adresi değişmiş olabilir.
        </StatusScreen>
      </main>
    </>
  );
}
