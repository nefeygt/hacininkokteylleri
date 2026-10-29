import type { Metadata } from "next";
import Link from "next/link";
import { ACCOUNTS_OPEN, PRIVACY_NOTICE_VERSION } from "@/lib/account-config";
import { BRAND } from "@/lib/brand";
import { asLocale, localePath } from "@/lib/i18n/locales";
import { format } from "@/lib/i18n/format";
import { alternatesFor, openGraphBase } from "@/lib/seo";
import { PRIVACY_NOTICE } from "./notice";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const lang = asLocale((await params).lang);
  const t = PRIVACY_NOTICE[lang];
  return {
    title: t.metaTitle,
    description: t.metaDescription,
    alternates: alternatesFor(lang, "/privacy"),
    openGraph: { ...openGraphBase(lang), url: localePath(lang, "/privacy") },
  };
}

// The KVKK privacy notice (aydınlatma metni); its words per language are in ./notice.ts, and the Turkish text
// governs. It shows a draft banner until accounts open; when the text changes, bump PRIVACY_NOTICE_VERSION in
// src/lib/account-config.ts. CONTACT forwards to the owner through ImprovMX.
const CONTROLLER = "Nazım Efe Yiğit";
const CONTACT = "contact@hacininkokteylleri.tech";
const SITE = "hacininkokteylleri.tech";

export default async function PrivacyPage({ params }: { params: Promise<{ lang: string }> }) {
  const lang = asLocale((await params).lang);
  const t = PRIVACY_NOTICE[lang];
  return (
    <article className="mx-auto max-w-3xl px-6 py-16 leading-relaxed text-text-secondary">
      <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.25em] text-crimson-glow">
        {format(t.version, { version: PRIVACY_NOTICE_VERSION })}
      </div>
      <h1 className="mb-8 text-3xl font-bold text-text-primary">{t.title}</h1>

      {t.governs && (
        <p className="mb-8 rounded border border-border bg-bg-card p-3 text-xs text-text-muted">
          {fill(t.governs, {
            turkish: (
              <Link href="/privacy" hrefLang="tr" className="text-text-primary underline underline-offset-2 hover:text-crimson-glow">
                {t.governsLink}
              </Link>
            ),
          })}
        </p>
      )}

      {!ACCOUNTS_OPEN && (
        <p className="mb-8 rounded border border-border bg-bg-card p-3 text-xs text-text-muted">{t.draft}</p>
      )}

      <Section title={t.controllerTitle}>
        <p>{fill(t.controller, { brand: BRAND, site: SITE, controller: CONTROLLER, contact: <Mail /> })}</p>
      </Section>

      <Section title={t.dataTitle}>
        <List items={t.data} />
      </Section>

      <Section title={t.purposesTitle}>
        <List items={t.purposes} />
        <p className="mt-3">{t.noAds}</p>
      </Section>

      <Section title={t.processorsTitle}>
        <p>{t.processorsIntro}</p>
        <List items={t.processors} className="mt-2" />
        <p className="mt-3">{t.transfers}</p>
      </Section>

      <Section title={t.retentionTitle}>
        <p>{t.retention}</p>
      </Section>

      <Section title={t.rightsTitle}>
        <p>{t.rightsIntro}</p>
        <List items={t.rights} className="mt-2" />
        <p className="mt-3">{fill(t.rightsOutro, { contact: <Mail /> })}</p>
      </Section>

      <Section id="delete-account" title={fill(t.deleteTitle, { brand: <span className="normal-case">{BRAND}</span> })}>
        <p>
          {fill(t.deleteBody, {
            account: (
              <Link href={localePath(lang, "/account")} className="text-text-primary underline underline-offset-2 hover:text-crimson-glow">
                {t.deleteAccountLink}
              </Link>
            ),
            contact: <Mail />,
          })}
        </p>
      </Section>
    </article>
  );
}

/** Like format(), but a placeholder may become an element (the mailto link). */
function fill(template: string, parts: Record<string, React.ReactNode>): React.ReactNode[] {
  return template.split(/\{(\w+)\}/).map((piece, i) => (i % 2 === 1 ? <span key={i}>{parts[piece] ?? `{${piece}}`}</span> : piece));
}

function List({ items, className = "" }: { items: string[]; className?: string }) {
  return (
    <ul className={`list-disc space-y-1 pl-5 ${className}`}>
      {items.map((item) => (
        <li key={item}>{fill(item, { contact: <Mail /> })}</li>
      ))}
    </ul>
  );
}

function Mail() {
  return (
    <a href={`mailto:${CONTACT}`} className="text-text-primary underline underline-offset-2 hover:text-crimson-glow">
      {CONTACT}
    </a>
  );
}

function Section({ id, title, children }: { id?: string; title: React.ReactNode; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-8 scroll-mt-24">
      <h2 className="mb-3 font-mono text-sm font-bold uppercase tracking-[0.1em] text-text-primary">{title}</h2>
      {children}
    </section>
  );
}
