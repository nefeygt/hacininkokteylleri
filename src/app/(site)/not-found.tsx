import StatusScreen from "@/components/StatusScreen";

// A missing recipe, profile or log on the public site (notFound() in a page).
export default function SiteNotFound() {
  return (
    <StatusScreen code="404" title="Bu reçete bulunamadı">
      Aradığın sayfa hiç olmamış, kaldırılmış ya da adresi değişmiş olabilir.
    </StatusScreen>
  );
}
