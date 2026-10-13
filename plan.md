# Hacı'nın Kokteylleri — Project Plan

> **FOR AGENTS:** This file is the single source of truth. Read it at the **start** of
> every session, update it at the **end**. Decision rationale lives in [adr.md](adr.md);
> the handoff to the next session lives in [next_session.md](next_session.md).
>
> Split of responsibility: *plan.md = what and why* · *adr.md = why we decided it that way* · *next_session.md = what to do right now*
>
> **Language rule (ADR-002):** everything we write — docs, code, comments, commits, SQL — is
> **English**. Everything visitors and admins read — UI strings, recipes — is **Turkish**.

**Last updated:** 2026-10-13 · **Active milestones:** M1 (admin panel, built — needs real accounts) and M2 (domain live; settings left)

---

## 1. Status Board

| Field | State |
|---|---|
| Active milestone | **M1 — Admin panel**: checked end to end with the owner's account and 2FA; **Hacı's first sign-in** (his own authenticator app) left. **M2 — Domain**: live; Google Search Console left |
| Last completed | **M0 — Foundation**, deployed as `a871688`: Supabase in Frankfurt, the 37 recipes and photos in the database and Storage, the site reading from it, this documentation system. **The site is live on `hacininkokteylleri.tech`** |
| Blockers | None in the code. Hacı's account uses `mustafafurkancam@hacininkokteylleri.com` — **that domain does not exist**; replace it with his real address (next_session.md). The network this computer was on (a Fortinet FortiGate) blocks the new domain — check from outside (§5.4) |
| Next critical decision | **The community data model ADR** (before M3): profiles, reviews (one per person per cocktail — ADR-012), drink logs, user recipes, showcase. The mobile app is decided: Expo, after M3 (ADR-013) |

---

## 2. Project Summary

**Hacı'nın Kokteylleri** is a cinematic cocktail archive built by Nazım Efe Yiğit (the
user, the site's owner) for his closest friend M. Furkan Çam — **Hacı** — a medical
student, cinephile and philosophy reader who creates the recipes. It started as a static
Next.js site on Vercel and is becoming a brand: its own domain, an admin panel for Hacı,
user accounts and community features, and a mobile app.

**Who it is for.** Turkish-speaking cocktail lovers. Tone: cinematic, witty, a little
political ("İtalyan burjuvazisine inat"), prescription-styled (Rx, mono type, crimson on
near-black). Every recipe is vegan unless it says otherwise.

**The north star.** *Hacı's own recipes stay the centrepiece.* Community features grow
around the archive; they never crowd it off the home page except through the showcase
(§3.2), which Hacı's audience votes on.

**Live:** `https://hacininkokteylleri.tech` (since 2026-10-13; `www` → apex) · admin at
`https://admin.hacininkokteylleri.tech` · `hacininkokteylleri.vercel.app` still serves too.

---

## 3. Product

### 3.1 What exists

- **Home** (`/`) — hero, "Hakkında".
- **Archive** (`/kokteyller`) — 37 recipes; search (with vodka/votka-style aliases), filters
  by base spirit, flavour and ingredient; a card per cocktail opening a prescription-style
  modal: ingredients drawn as icons (`VisualQuantity`), steps, garnish, note, vegan badge.
  Glossary terms ("Top up", "Şeker Şurubu", …) are underlined with a tooltip.
- **Admin panel** (`admin.` subdomain) — sign in; list with publish/draft toggle; create,
  edit and delete a cocktail with its ingredients, steps and photo (resized, WebP, Gemini
  sparkle removed in the browser); glossary editor. Every save is live on the site at once.

### 3.2 Roadmap — what the user has asked for (2026-10-13)

In the user's words, collected while M0 was being built. Milestones in §6.

1. **Accounts.** Sign up / sign in for the public.
2. **Reviews.** Anyone signed in can review a cocktail — 1–5 stars and optional text, public.
   **One review per person per cocktail**, Letterboxd-style (ADR-012).
3. **Favourites.** Save cocktails to a personal list.
4. **Drink log.** Log a cocktail you made or drank (Letterboxd for cocktails). The log
   starts from the recipe and **the user can change it** — "Kuzu Kulağı Sour, but with gin
   instead of vodka" — so a log keeps its own copy of the recipe as made. **A cocktail can be
   logged any number of times**, each with its own note: another evening, another experience
   (ADR-012).
5. **Community recipes and feeds.** Users write their own recipes and share them publicly
   on their profile/feed. **The home page keeps showing Hacı's recipes.**
6. **The showcase (vitrin).** Users apply to have a recipe featured on the home page; the
   most-voted application is featured for a period (a week, a month).
7. **Mobile app.** Expo, started after accounts (ADR-013). Reads the same backend; content is
   edited in the same admin panel by the owner and Hacı.

### 3.3 Product rules

- Hacı's archive is curated: only admins create or change house recipes.
- Anything a user writes is public by default, can be hidden by an admin, and is the
  user's to delete. Moderation tools ship with each social feature, not after it.
- Alcohol: the site and the app will need an **18+ confirmation** before accounts open (M3).

---

## 4. Decisions (summary)

| # | Decision | Why |
|---|---|---|
| 001 | `plan.md` / `adr.md` / `next_session.md` handoff | Any machine, account or agent continues from one prompt |
| 002 | English in the repo, Turkish in the product | One language per layer |
| 003 | Supabase in Frankfurt | One backend for site, panel and app; ~50 ms from Turkey |
| 004 | Content in Postgres, RLS on every table | Edits without deploys; rules enforced in one place |
| 005 | Static pages revalidated; daily keep-alive | Fast pages; free projects pause after 7 idle days |
| 006 | WebP photos in a public bucket, never overwritten | Cheap, cacheable, editable from the panel |
| 007 | Admin = same app on `admin.`; `admins` table + policies | One deploy; no secret key in the app |
| 011 | Admins need 2FA (TOTP), enforced in `private.is_admin()` | A leaked password alone opens nothing |
| 012 | One review per person per cocktail; unlimited logs | Letterboxd-style, the user's call |
| 013 | Mobile app: Expo, after M3 | Ships with accounts; shares TypeScript |
| 008 | Public config committed in `.env` | A fresh clone runs; secrets never committed |
| 009 | Migrations via MCP, mirrored with exact versions | The repo always describes the database |
| 010 | Apex canonical; DNS records at Namify | Short brand URL; three records, nothing moved |

→ Full rationale and rejected alternatives: [adr.md](adr.md)

---

## 5. Technical Architecture

### 5.1 The system

```
                 ┌──────────────── Vercel (project "hacininkokteylleri", Hobby) ────────────────┐
 visitors ──────►│ hacininkokteylleri.tech        Next.js 16 app (App Router, Tailwind 4)       │
 Hacı, owner ───►│ admin.hacininkokteylleri.tech  src/proxy.ts rewrites admin.* → /admin/*       │
                 │                                cron: /api/keepalive daily                     │
                 └───────────────┬──────────────────────────────────────────────┬────────────────┘
                                 │ publishable key, RLS                        │ admin's session, RLS
                 ┌───────────────▼────────── Supabase "hacininkokteylleri-eu" (Frankfurt) ────────┐
 mobile app ────►│ Postgres: cocktails · cocktail_ingredients · glossary_terms · admins            │
   (planned)     │ Auth: email + password (admins only for now)                                   │
                 │ Storage: public bucket "cocktail-images" (WebP)                                │
                 └────────────────────────────────────────────────────────────────────────────────┘
```

**Golden rule 1 — the database is the gatekeeper.** Every table has RLS; every permission
is a policy. App code may check too, for a nicer error, but never instead (ADR-007).

**Golden rule 2 — no secret key in the app.** Public pages use the publishable key; admin
writes run as the signed-in admin (ADR-007, ADR-008).

**Golden rule 3 — the repository describes the database.** Every schema change is a
migration file with the version Supabase applied (ADR-009).

### 5.2 Data model (today)

| Table | Key columns | Who reads | Who writes |
|---|---|---|---|
| `cocktails` | `id uuid`, `slug` unique, `name`, `subtitle`, `base_alcohol`, `flavor`, `tags text[]`, `color #rrggbb`, `image_path`, `instructions text[]`, `garnish`, `glass`, `vegan`, `note`, `sort_order`, `is_published` | everyone (published); admins (all) | admins |
| `cocktail_ingredients` | `cocktail_id`, `position` (unique together), `name`, `amount numeric(6,2)`, `unit`, `icon` enum | as its cocktail | admins |
| `glossary_terms` | `term` PK, `definition` | everyone | admins |
| `admins` | `user_id` → `auth.users`, `role` (`owner`/`editor`), `display_name` | own row; admins (all) | nobody over the API — SQL only |

Functions: `private.is_admin()` (an `admins` row **and** a 2FA session, `aal2` — ADR-011; used
by every write policy; not exposed over HTTP) and
`public.save_cocktail(cocktail jsonb, ingredients jsonb)` (one-transaction save, security
invoker). Storage policies on `cocktail-images`: admins list/insert/update/delete.

**Community model — a sketch, decided with an ADR at M3/M4, not before:**
`profiles` (one per auth user: username, display name, avatar); `cocktails.author_id`
(null = Hacı's house recipe) so user recipes share the recipe shape; `reviews` (rating 1–5
plus optional text, **unique per user and cocktail** — ADR-012); `favorites`; `drink_logs`
(**many per user and cocktail**: date, note, and a **jsonb snapshot of the recipe as made**);
`showcase_periods`,
`showcase_entries`, `showcase_votes`. All additive to today's schema.

### 5.3 Code map

```
src/
  proxy.ts                      host routing: admin.* → /admin/*, /admin 404 on the public host
  app/
    layout.tsx                  root: fonts, globals, metadata
    (site)/                     public site (Navbar in its layout)
      page.tsx                  home
      kokteyller/page.tsx       archive — server component, ISR 1h
    admin/                      the panel (only reachable through admin.*)
      giris/                    sign-in
      iki-adim/                 first sign-in: connect an authenticator app (QR code)
      dogrula/                  later sign-ins: the 6-digit code
      (panel)/                  everything behind requireAdmin(): list, kokteyller/yeni, kokteyller/[id], sozluk
      actions.ts                every write (server actions)
      CocktailForm.tsx, ImageField.tsx, GlossaryEditor.tsx, PublishToggle.tsx
    api/keepalive/route.ts      daily ping (vercel.json cron)
  components/                   site components (CocktailBrowser, CocktailCard, CocktailModal, Tooltip, …)
  lib/
    content.ts                  DB rows → the shapes components draw; public fetchers
    admin.ts                    requireAdmin()
    slug.ts                     Turkish-aware slugify
    supabase/                   config, public/server/browser/proxy clients, database.types.ts (generated)
supabase/
  migrations/                   {version}_{name}.sql — mirrors of what is applied (ADR-009)
  storage/cocktail-images/      the 37 imported WebPs (the bucket's starting content)
```

### 5.4 Run and verify

```bash
npm install
npm run dev                 # site: http://localhost:3000 · panel: http://admin.localhost:3000
npx tsc --noEmit            # types
npm run build               # must pass before every push; /kokteyller must show "○ … 1h"
```

Smoke test against a running server (`npx next start -p 3000` after a build):

```bash
curl -s localhost:3000/api/keepalive                                   # {"ok":true,"cocktails":37}
curl -s -o /dev/null -w "%{http_code}\n" localhost:3000/admin          # 404 — panel hidden on the public host
curl -s -o /dev/null -w "%{http_code}\n" -H "Host: admin.localhost:3000" localhost:3000/giris   # 200
```

**Checking the live domain from this machine can fail for a reason that is not ours:** the
network the user's computer was on runs a Fortinet FortiGate that blocks the newly registered
domain (local DNS answers `208.91.112.55`, FortiGuard's block page; HTTPS shows a Fortinet
certificate and a 403). Check from outside instead:

```bash
curl -s -H "Accept: application/json" "https://check-host.net/check-http?host=https://hacininkokteylleri.tech&max_nodes=3"
# then: curl -s -H "Accept: application/json" https://check-host.net/check-result/<request_id>
```

**Verify in a real browser before claiming a UI change works** — use Claude in Chrome (the
user's Chrome, signed in to Vercel, Supabase and Namify). The built-in browser pane is not
signed in to anything.

After any schema change: mirror the migration, regenerate `database.types.ts`, run
`get_advisors` (security and performance) — the security advisor must stay empty.

### 5.5 Services and accounts

| Service | What | Notes |
|---|---|---|
| GitHub | `nefeygt/hacininkokteylleri` (public) | `main` deploys to production on push |
| Vercel | project `hacininkokteylleri`, team "Nazım Efe Yiğit's projects", **Hobby** | Domains: apex, `www` (308 → apex), `admin` |
| Supabase | org `hacininkokteylleri` (free); project **`hacininkokteylleri-eu`**, ref **`qwvnhdghwycqlvsnlvlt`**, eu-central-1 | Connected to Claude through the Supabase MCP. Old Seoul project `kdicsywipwkauonkxcdc` paused — the user deletes it |
| Domain | `hacininkokteylleri.tech` at get.tech / Namify (`manage.get.tech`) | Registered 2026-10-13, expires 2027-10-13; **auto-renew on, $29.99 on 2027-09-11**; WHOIS privacy off |
| Google Search Console | verification meta tag in `src/app/layout.tsx` | Add the new domain as a property (M2) |

---

## 6. Milestones

### ✅ M0 — Foundation `DONE 2026-10-13`

- [x] Documentation system: `plan.md`, `adr.md`, `next_session.md`, `CLAUDE.md` (ADR-001)
- [x] Supabase project in Frankfurt (ADR-003); schema with RLS (ADR-004); 37 cocktails, 153 ingredients, 4 glossary terms imported and checked
- [x] Photos: Gemini sparkle removed, WebP at 1600 px (175 MB → 1.3 MB), uploaded to `cocktail-images` (ADR-006)
- [x] The site reads from Supabase, static with hourly revalidation; daily keep-alive cron (ADR-005)
- [x] Security advisor empty; anonymous writes refused (checked over HTTP)

### 🔵 M1 — Admin panel `BUILT — needs the end-to-end check`

- [x] `admins` table, roles, write policies, storage policies, `save_cocktail` (ADR-007)
- [x] Panel on `admin.*`: sign-in, list + publish toggle, create/edit/delete, photo upload, glossary
- [x] The owner's and Hacı's accounts created by the user; added to `admins` as `owner` "Efe" and `editor` "Hacı"
- [x] **Two-factor authentication** (TOTP) required for admin rights, in the database and the panel (ADR-011); checked in SQL at `aal1` and `aal2`
- [x] The owner enrolled an authenticator app on first sign-in (2026-10-13)
- [x] End to end on `admin.localhost:3000` with the owner's account (2026-10-13): created a test cocktail with a Gemini-stamped PNG (stored as a 38 KB WebP, sparkle gone, 1-year cache), saw it on `/kokteyller`, edited it, unpublished it (gone from the site), deleted it (row and photo gone); added and deleted a glossary term
- [x] Fixed on the way: server-action redirects bypassed the proxy and showed the public home on the admin host (ADR-007)
- [x] Public sign-ups turned off in Supabase Auth until M3
- [ ] Hacı signs in once, on his phone, and enrols his own authenticator app
- [ ] Hacı's login e-mail replaced with a real one (see Blockers)
- [ ] The same check once on the live `admin.hacininkokteylleri.tech` from a network that does not block it

### 🔵 M2 — Domain live `LIVE — settings left`

- [x] Vercel: apex, `www` → apex (308), `admin` added to the project
- [x] Namify DNS: `A @ 216.198.79.1`, `CNAME www` and `CNAME admin` → `1327916967901761.vercel-dns-017.com`
- [x] All three serve over HTTPS — apex 200, `admin` 307 to its sign-in, `www` 308 to the apex (checked from outside with check-host.net, 2026-10-13)
- [x] Supabase Auth → URL Configuration: Site URL `https://hacininkokteylleri.tech`; redirect URLs `https://hacininkokteylleri.tech/**`, `https://admin.hacininkokteylleri.tech/**`, `http://admin.localhost:3000/**`, `http://localhost:3000/**`
- [x] WHOIS: checked — the public record (RDAP and port-43 WHOIS at the registry) shows **no registrant data at all**, only Namify's. Paid privacy is not needed; do not put false data in the contact details (inaccurate WHOIS can get a domain suspended)
- [ ] Google Search Console: add `hacininkokteylleri.tech` (DNS TXT at Namify)
- [ ] Consider redirecting `hacininkokteylleri.vercel.app` to the apex

### ⚪ M3 — Accounts

Public sign-up and sign-in (Google, and email with a custom SMTP sender on the domain —
Supabase's built-in mailer only reaches the org's own members), `profiles`, an 18+
confirmation, a privacy notice (KVKK) and account deletion. The admin panel keeps its own
sign-in. **An ADR for the community data model comes first.**

### ⚪ M4 — Reviews and favourites

Reviews (1–5 stars, optional text, public, one per person per cocktail — ADR-012),
favourites, average rating on cards; hide/report tools in the panel.

### ⚪ M5 — Drink log

Log a drink from a recipe — as many times as you like (ADR-012) — edit the recipe as made
(snapshot), date, note; a personal log page.

### ⚪ M6 — Community recipes and feeds

User recipes (same shape as house recipes, `author_id` set), profile pages and a feed; the
archive and the home page stay Hacı's.

### ⚪ M7 — The showcase

Applications, voting periods (week / month), the winner featured on the home page; admin
review of applications.

### ⚪ M8 — Mobile app

**Expo** (React Native + TypeScript + supabase-js), started **after M3** (ADR-013). Same
Supabase backend and the same panel for content. Monorepo or second repository: decided
when it starts.

---

## 7. Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| **No backups on the free plan** — a bad edit or delete is permanent | Medium | Before M3: a scheduled export of content to the repo, or the Pro plan once there are users |
| Free project **pauses after 7 idle days**, taking photos down | Low now | Daily keep-alive cron (ADR-005). If it ever pauses: Supabase dashboard → Restore |
| Free-plan limits (500 MB DB, 1 GB storage, 5 GB egress) | Low until M6 | Photos are ~35 KB; user uploads (M6) need a size cap per user |
| **.tech renewal** costs $29.99/yr from 2027-09-11 (auto-renew on) | Certain | The user decides before then; turn off auto-renew if moving the brand |
| Registrant details at Namify | Low | Not published: the registry's RDAP and WHOIS show only the registrar (checked 2026-10-13). Paid privacy not needed |
| Supabase's leaked-password check (HaveIBeenPwned) is off — Pro plan only | Low | 2FA makes a leaked password alone useless for admin powers (ADR-011) |
| Vercel **Hobby is for non-commercial use** | If monetised | Move to Pro before ads, sponsorships or sales |
| User content: abuse, spam, legal (KVKK, alcohol and minors) | Certain at M3+ | Moderation tools with each feature; 18+ gate; privacy notice; rate limits |
| Supabase's built-in email reaches only org members (a few per hour) | Certain at M3 | Custom SMTP (e.g. Resend) on the domain before public sign-up |

---

## 8. Known issues (not yet scheduled)

- The flavour filter matches exactly: "Tatlı" does not find "Tatlı-Ekşi" or "Acı-Tatlı".
  The base-spirit and flavour chips are a hard-coded list in `CocktailBrowser.tsx`, so a
  new value added in the panel ("Likör", "Aperitif") has no chip.
- Ingredient names are free text ("Vodka" and "Votka" both exist), which the future
  drink log and "what can I make" features will want normalised.
- A photo uploaded in the panel and then abandoned (form not saved) stays in the bucket.

---

## 9. Icebox (deferred ideas)

- A page per cocktail (`/kokteyller/[slug]`) for sharing and search engines, with an OG image
- Filters built from the data instead of hard-coded lists
- A normalised ingredient catalogue; "what can I make with what I have"
- Who changed what (`updated_by`) and a change history in the panel
- Drag-and-drop ordering in the panel
- Google sign-in for admins
- A cleanup for orphaned photos in the bucket
- HEIC photos from iPhones (today the browser must be able to decode the file)

---

## 10. Session Log

| Date | Session | Outcome |
|---|---|---|
| 2026-10-13 (later) | M1 check + 2FA | Admin accounts added (owner "Efe", editor "Hacı"). **2FA required for admin powers** (ADR-011), the owner enrolled. Panel checked end to end. Server-action redirect bug fixed. Sign-ups off; Auth URLs set. WHOIS checked — already private. Decisions: one review per person per cocktail, unlimited logs (ADR-012); Expo after M3 (ADR-013) |
| 2026-10-13 | M0 + M1 build + M2 setup | Documentation system. Supabase recreated in Frankfurt (Seoul paused). Schema, RLS, content and photos imported; Gemini sparkles removed. Site reads from Supabase. Admin panel on `admin.` built. Domain bought by the user; Vercel domains and Namify DNS configured. Deployed (`a871688`); live on `hacininkokteylleri.tech`, checked from outside |
