"use client";

import Link from "next/link";
import {
  ArrowRight,
  ChevronDown,
  Wine,
  Syringe,
  Dumbbell,
  Film,
  BookOpen,
  Leaf,
} from "lucide-react";

export default function Home() {
  const scrollToAbout = () => {
    document.getElementById("hakkinda")?.scrollIntoView({ behavior: "smooth" });
  };

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
            <button
              onClick={scrollToAbout}
              className="inline-flex items-center gap-2 rounded border border-border px-6 py-3 font-mono text-sm text-text-secondary transition-colors hover:border-border-light hover:text-text-primary"
            >
              Hakkında
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <ChevronDown className="h-5 w-5 animate-bounce text-text-muted/40" />
        </div>
      </section>

      {/* About / Hakkında Section */}
      <section id="hakkinda" className="border-t border-border px-6 py-24">
        <div className="mx-auto max-w-4xl">
          {/* Section header */}
          <div className="mb-16 text-center">
            <span className="mb-4 inline-block font-mono text-[10px] uppercase tracking-[0.25em] text-crimson-glow">
              Hakkında
            </span>
            <h2 className="text-3xl font-bold tracking-tight">
              Bu Site Kimin İçin?
            </h2>
          </div>

          {/* Main description */}
          <div className="mb-16 rounded border border-border bg-bg-card p-8">
            <p className="prescription-text leading-[2] text-text-secondary">
              Bu dijital arşiv ben, Nazım Efe Yiğit tarafından, en yakın dostum{" "}
              M. Furkan Çam, namıdiğer <span className="font-bold text-text-primary">Hacı</span> adına
              hazırlandı. Sevgili Furkan geleceğin aydın bir doktoru, tutkulu bir sinefil ve
              Letterboxd kullanıcısı, entelektüel bir felsefe okuryazarı,
              veganlık ve spor kültürünün kararlı bir savunucusu. Bu
              kokteyl koleksiyonu kendisinin yıllardır hazırlamakta/üretmekte
              olduğu tariflerin bir araya getirilmiş ve benim estetik anlayışıma uyan şık bir halidir.
            </p>
          </div>

    
          {/* Trait grid
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <TraitCard
              icon={<Syringe className="h-5 w-5" />}
              label="Tıp Öğrencisi"
              desc="Reçeteleri cerrahi hassasiyetle"
            />
            <TraitCard
              icon={<Film className="h-5 w-5" />}
              label="Sinefil"
              desc="Her kokteyl bir film karesi"
            />
            <TraitCard
              icon={<BookOpen className="h-5 w-5" />}
              label="Entelektüel"
              desc="Düşünceli, sorgulayan, arayan"
            />
            <TraitCard
              icon={<Leaf className="h-5 w-5" />}
              label="Vegan"
              desc="Hayvan sömürüsüz tarifler"
            />
            <TraitCard
              icon={<Dumbbell className="h-5 w-5" />}
              label="Gym Kültürü"
              desc="Disiplinli, kararlı, güçlü"
            />
            <TraitCard
              icon={<BookOpen className="h-5 w-5" />}
              label="Düşüncenin Sınırlarında"
              desc="Felsefe ve sürekli entelektüel arayış, Hacı'nın dünyayı anlama çabasının temelidir. O, sadece bir miksolojist değil, aynı zamanda hayatı ve toplumu sorgulayan, Platon'dan Marx'a uzanan geniş bir yelpazede okuyan ve tartışan bir düşünürdür. Aydınlanma ve sorgulama, onun her tarifine sindiği gibi, her dost sohbetine de yön verir."
            />
          </div> */}
          
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

function TraitCard({
  icon,
  label,
  desc,
}: {
  icon: React.ReactNode;
  label: string;
  desc: string;
}) {
  return (
    <div className="group rounded border border-border bg-bg-card p-5 transition-colors hover:border-border-light">
      <div className="mb-3 text-text-muted transition-colors group-hover:text-crimson-glow">
        {icon}
      </div>
      <h3 className="mb-1 font-mono text-xs font-bold uppercase tracking-wider text-text-primary">
        {label}
      </h3>
      <p className="font-mono text-[10px] text-text-muted">{desc}</p>
    </div>
  );
}
