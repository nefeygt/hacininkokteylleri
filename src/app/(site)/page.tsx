import Link from "next/link";
import { ArrowRight, Wine } from "lucide-react";

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-6 text-center">
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-crimson/5 blur-[120px]" />
        </div>

        <div className="relative z-10">
          {/* Mono subtitle */}
          <div className="mb-6 inline-flex items-center gap-2 rounded bg-bg-elevated/60 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.25em] text-text-muted">
            <Wine className="h-3 w-3 text-crimson-glow" />
            Sinematik Bir Kokteyl Deneyimi
          </div>

          {/* Title */}
          <h1 className="mb-4 text-5xl font-bold tracking-tight md:text-7xl">
            Hacı&apos;nın
            <br />
            <span className="text-crimson-glow">Kokteylleri</span>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mb-10 max-w-md font-mono text-sm leading-relaxed text-text-secondary">
            Her biri özenle formüle edilmiş kokteyl reçeteleri.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/kokteyller"
              className="group inline-flex items-center gap-2 rounded bg-crimson px-6 py-3 font-mono text-sm font-medium text-white transition-colors hover:bg-crimson-light"
            >
              Kokteyllere Git
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-8 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-muted">
          Hacı&apos;nın Kokteylleri &mdash; Sevgiyle hazırlandı
        </p>
      </footer>
    </div>
  );
}
