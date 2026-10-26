import "./globals.css";
import { THEME_BOOT_SCRIPT } from "@/lib/themes";
import { fontVariables } from "./fonts";

/** The <html> both root layouts share — the site's ([lang]) and the panel's (admin) — with fonts and the theme. */
export default function RootDocument({ lang, children }: { lang: string; children: React.ReactNode }) {
  return (
    // The boot script sets data-theme before React loads, hence the suppressed warning.
    <html lang={lang} className={fontVariables} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      {/* Browser extensions add attributes to <body> before React loads. */}
      <body className="min-h-screen bg-bg-primary text-text-primary antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
