import { Analytics } from "@vercel/analytics/next";
import Navbar from "@/components/Navbar";

// The public site's frame. The admin panel (src/app/admin) has its own.
// Analytics is Vercel's cookieless page-view count, public site only (/privacy names it).
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Analytics />
    </>
  );
}
