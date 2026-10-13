import Navbar from "@/components/Navbar";

// The public site's frame. The admin panel (src/app/admin) has its own.
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
    </>
  );
}
