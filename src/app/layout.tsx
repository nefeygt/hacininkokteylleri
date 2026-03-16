import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin", "latin-ext"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hacı'nın Kokteylleri",
  description:
    "Hacı için özel olarak hazırlanmış, sinematik bir kokteyl arşivi.",
  verification: {
    google: "ZfTQJ4AR0Rq0iytJ0JXhQZgXCSoCOTTWhQB6PvYMLyY",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-bg-primary text-text-primary antialiased">
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
