import type { Metadata } from "next";
import RootDocument from "../root-document";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://hacininkokteylleri.tech"),
  title: "Yönetim",
  robots: { index: false, follow: false },
};

// The panel's root layout (ADR-032: the site's root layout sits under [lang]). Served only on
// admin.hacininkokteylleri.tech (see src/proxy.ts); its UI stays Turkish.
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <RootDocument lang="tr">
      <div className="min-h-screen">{children}</div>
    </RootDocument>
  );
}
