# Hacı'nın Kokteylleri — Project Plan

> **FOR AGENTS:** This file is the single source of truth. Read it at the **start** of
> every session, update it at the **end**. Decision rationale lives in [adr.md](adr.md);
> the handoff to the next session lives in [next_session.md](next_session.md).
>
> Split of responsibility: *plan.md = what and why* · *adr.md = why we decided it that way* · *next_session.md = what to do right now*
>
> **Language rule (ADR-002):** everything we write — docs, code, comments, commits, SQL — is
> **English**. Everything visitors and admins read — UI strings, recipes — is **Turkish**.

**Last updated:** 2026-10-13 (late night) · **Active milestone:** M3 — Accounts (built and tested end to end, closed to the public) · **Brand:** `haci` (ADR-015)

---

## 1. Status Board

| Field | State |
|---|---|
| Active milestone | **M3 — Accounts**: Google app **in production**; Google sign-in → onboarding → profile edit → avatar → public profile → account deletion **tested end to end** (2026-10-13). **Closed to the public** (`ACCOUNTS_OPEN = false`, sign-ups off). Privacy contact address live (`iletisim@`, forwarded through ImprovMX). Left: the user's final read of `/privacy` and the decision to open (Google only, or with e-mail sign-in via Resend) |
| Last completed | **M2 — Domain** (Search Console moved from vercel.app to the domain) and the **brand change to `haci`** with English URLs and the cherry logo (ADR-015). M1 is done except Hacı's own first sign-in |
| Blockers | None in the code. Opening M3 waits on the user's go (Google only, or wait for e-mail sign-in). The network the user's office computer is on (a Fortinet FortiGate) blocks the domain — check from outside (§5.4) |
| Next critical decision | **The colour theme** for a global audience (the user is open to change, ADR-015) and, later, localization. The mobile app is decided: Expo, after M3 (ADR-013) |

---

## 2. Project Summary

**haci** (formerly *Hacı'nın Kokteylleri*) is a cinematic cocktail archive built by Nazım
Efe Yiğit (the user, the site's owner) with his closest friend M. Furkan Çam — **Hacı** —
who creates the recipes. It started as a static Next.js site on Vercel and is becoming a
product for a global audience: the brand `haci` (ADR-015), its own domain, an admin panel,
user accounts and community features, and iOS/Android apps.

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

- **Home** (`/`) — hero with the `haci` name and a link to the archive (the personal
  "Hakkında" section was removed on 2026-10-13: the site is a brand now).
- **Archive** (`/cocktails`) — 37 recipes; search (with vodka/votka-style aliases), filters
  by base spirit, flavour and ingredient; a card per cocktail opening a prescription-style
  modal: ingredients drawn as icons (`VisualQuantity`), steps, garnish, note, vegan badge.
  Glossary terms ("Top up", "Şeker Şurubu", …) are underlined with a tooltip.
- **Admin panel** (`admin.` subdomain) — sign in; list with publish/draft toggle; create,
  edit and delete a cocktail with its ingredients, steps and photo (resized, WebP, Gemini
  sparkle removed in the browser); glossary editor. Every save is live on the site at once.
- **Accounts (M3, closed)** — `/login` (Google), `/welcome` (username, 18+, privacy notice),
  `/account` (edit profile, profile picture, sign out, delete account), `/u/{username}`,
  `/privacy` (KVKK notice, draft). Hidden from the navbar until `ACCOUNTS_OPEN` in `src/lib/account-config.ts`.

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
| 014 | Community data model: everything hangs off `profiles` | Rules in the database; additive per milestone |
| 015 | Brand `haci`; English paths, Turkish UI; cherry logo | A global product with one short name |

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
   (planned)     │ Auth: admins pw + TOTP; members Google (M3)                                    │
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
| `account_settings` | `user_id` PK → `auth.users`, `adult_confirmed_at` (server time), `privacy_notice_version`, `logs_public_default` | owner; admins | owner (column grants) |
| `profiles` | `id` PK → `auth.users`, `username` unique `^[a-z0-9_]{3,20}$` minus a reserved list, `display_name`, `avatar_path` (`{id}/…` in the `avatars` bucket), `bio` ≤ 280, `hidden_at`/`hidden_by` | everyone (not hidden); owner; admins | owner, only after `account_settings` exists; admins hide |

Functions: `private.is_admin()` (an `admins` row **and** a 2FA session, `aal2` — ADR-011; used
by every write policy; not exposed over HTTP) and
`public.save_cocktail(cocktail jsonb, ingredients jsonb)` (one-transaction save, security
invoker). Storage policies on `cocktail-images`: admins list/insert/update/delete. M3 added
`private.guard_moderation()` (only admins set `hidden_at`; it writes `hidden_by`),
`public.delete_my_account()` → `private.delete_account()` (security definer; refuses admins
and users who still own Storage objects), and the public `avatars` bucket (512 KB,
WebP/JPEG; users write only under their own folder). The browser crops the centre square,
scales it to 256 px WebP, uploads `{id}/{base36 time}.webp`, then `setAvatar` points the
profile at it and the browser deletes the previous object (never overwritten, ADR-006).

**The rest of the community model is decided in ADR-014** (reviews, favourites, drink logs,
community recipes in `cocktails` with `author_id`, showcase, reports) and is built
milestone by milestone.

### 5.3 Code map

```
src/
  proxy.ts                      host routing: admin.* → /admin/*, /admin 404 on the public host
  app/
    layout.tsx                  root: fonts, globals, metadata
    (site)/                     public site (Navbar in its layout)
      page.tsx                  home
      cocktails/page.tsx        archive — server component, ISR 1h
      login/ welcome/ account/  member sign-in, onboarding, account (dynamic; account/actions.ts)
      u/[username]/             public profile (ISR 5 min)
      privacy/                  KVKK notice (static)
    admin/                      the panel (only reachable through admin.*)
      login/                    sign-in
      setup-2fa/                first sign-in: connect an authenticator app (QR code)
      verify/                   later sign-ins: the 6-digit code
      (panel)/                  everything behind requireAdmin(): list, cocktails/new, cocktails/[id], glossary
      actions.ts                every write (server actions)
      CocktailForm.tsx, ImageField.tsx, GlossaryEditor.tsx, PublishToggle.tsx
    auth/callback/route.ts      Google → Supabase → here: code exchange, then /welcome or next
    api/keepalive/route.ts      daily ping (vercel.json cron)
    icon.svg, apple-icon.png    favicon and touch icon (the cherry, ADR-015)
    robots.ts, sitemap.ts       for search engines
  components/                   site components (CocktailBrowser, CocktailCard, CocktailModal, Tooltip, …)
  lib/
    content.ts                  DB rows → the shapes components draw; public fetchers
    admin.ts                    requireAdmin()
    account.ts                  accountSession(), requireMember() (server only)
    account-config.ts           ACCOUNTS_OPEN, PRIVACY_NOTICE_VERSION, safeNext() (browser-safe)
    brand.ts                    BRAND = "haci" 
    slug.ts                     Turkish-aware slugify
    supabase/                   config, public/server/browser/proxy clients, database.types.ts (generated)
supabase/
  migrations/                   {version}_{name}.sql — mirrors of what is applied (ADR-009)
  storage/cocktail-images/      the 37 imported WebPs (the bucket's starting content)
public/brand/                   logo sources (SVG) and exported PNGs; scripts/export-brand.mjs renders them
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
curl -s -o /dev/null -w "%{http_code}\n" -H "Host: admin.localhost:3000" localhost:3000/login   # 200
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" localhost:3000/kokteyller    # 308 → /cocktails
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" localhost:3000/account       # 307 → /login (signed out)
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" -H "Host: hacininkokteylleri.vercel.app" localhost:3000/   # 308 → the domain
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
| Google Search Console | account `wowcubey@gmail.com`; **Domain property `hacininkokteylleri.tech`** (DNS TXT at Namify); sitemap submitted | The old `https://hacininkokteylleri.vercel.app/` property is **moving** to the domain (Change of Address, started 2026-10-13). It stays verified by the meta tag in `src/app/layout.tsx` and `public/googlece68c38f8ad9ec89.html` (served on vercel.app without the redirect) — keep both for 180 days |
| Google Cloud | account `n.efeyigit@gmail.com`, project **`haci`** (`haci-511515`) | Google Auth Platform: app name `haci`, External, **In production** since 2026-10-13 (home page, `/privacy`, domains `hacininkokteylleri.tech` + the Supabase host; no logo, so no verification). OAuth web client "haci web (Supabase Auth)": origins the domain and `http://localhost:3000`, redirect `https://qwvnhdghwycqlvsnlvlt.supabase.co/auth/v1/callback`. The secret lives only in Supabase |

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
- [x] Hacı's login e-mail replaced with his real one (`auth.users` and his e-mail identity, 2026-10-13)
- [ ] The same check once on the live `admin.hacininkokteylleri.tech` from a network that does not block it

### ✅ M2 — Domain live `DONE 2026-10-13`

- [x] Vercel: apex, `www` → apex (308), `admin` added to the project
- [x] Namify DNS: `A @ 216.198.79.1`, `CNAME www` and `CNAME admin` → `1327916967901761.vercel-dns-017.com`
- [x] All three serve over HTTPS — apex 200, `admin` 307 to its sign-in, `www` 308 to the apex (checked from outside with check-host.net, 2026-10-13)
- [x] Supabase Auth → URL Configuration: Site URL `https://hacininkokteylleri.tech`; redirect URLs `https://hacininkokteylleri.tech/**`, `https://admin.hacininkokteylleri.tech/**`, `http://admin.localhost:3000/**`, `http://localhost:3000/**`
- [x] WHOIS: checked — the public record (RDAP and port-43 WHOIS at the registry) shows **no registrant data at all**, only Namify's. Paid privacy is not needed; do not put false data in the contact details (inaccurate WHOIS can get a domain suspended)
- [x] Google Search Console: Domain property `hacininkokteylleri.tech` verified (DNS TXT at Namify), sitemap submitted, Change of Address from the vercel.app property started (2026-10-13)
- [x] `hacininkokteylleri.vercel.app` 308-redirects to the domain (`src/proxy.ts`), except its Search Console verification file

### 🔵 M3 — Accounts `BUILT AND TESTED, CLOSED — contact address and the go-ahead left`

- [x] ADR-014 (community data model), agreed with the user
- [x] Migration `community_accounts`: `account_settings`, `profiles`, moderation guard, `avatars` bucket, `delete_my_account()`; 16 policy checks in SQL (rolled back); advisors clean
- [x] Pages: `/login` (Google), `/auth/callback`, `/welcome`, `/account` (profile, sign out, delete), `/u/{username}`, `/privacy` (draft)
- [x] Google Cloud project `haci` + OAuth client; Google provider enabled in Supabase (secret pasted by the user)
- [x] Publish the Google app — Branding: home page, `/privacy`, authorized domains; **no logo** (a logo forces Google verification); Audience → **In production** (2026-10-13)
- [x] End to end on `localhost:3000` (2026-10-13): Google sign-in (the user's `wowcubey@gmail.com`) → `/welcome` → `/account` → bio edit and avatar upload/replace seen on `/u/{username}` → delete; `auth.users`, identities, `profiles`, `account_settings` and the avatar object all gone, the profile page 404s
- [x] Privacy notice contact address: `iletisim@hacininkokteylleri.tech` (and `contact@`) forwarded to `n.efeyigit@outlook.com` through **ImprovMX** (MX + SPF at Namify; account and aliases by the user; test mails arrived, 2026-10-13). ImprovMX listed as a processor in `/privacy`
- [ ] A final read of `/privacy` by the user (the draft banner goes away by itself when `ACCOUNTS_OPEN` is true)
- [ ] E-mail and password sign-in with a sender on the domain (Resend), after Google
- [x] Avatar upload on `/account` (and shown on `/u/{username}`)
- [ ] Open it: `ACCOUNTS_OPEN = true`, sign-ups on

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
| `iletisim@`/`contact@` mail passes through ImprovMX (free plan, US) | Certain | Listed in `/privacy`; the ImprovMX account is the user's |
| Supabase's built-in email reaches only org members (a few per hour) | Certain at M3 | Custom SMTP (e.g. Resend) on the domain before public sign-up |

---

## 8. Known issues (not yet scheduled)

- The flavour filter matches exactly: "Tatlı" does not find "Tatlı-Ekşi" or "Acı-Tatlı".
  The base-spirit and flavour chips are a hard-coded list in `CocktailBrowser.tsx`, so a
  new value added in the panel ("Likör", "Aperitif") has no chip.
- Ingredient names are free text ("Vodka" and "Votka" both exist), which the future
  drink log and "what can I make" features will want normalised.
- A photo uploaded in the panel and then abandoned (form not saved) stays in the bucket.
- Google's consent screen will say "continue to `qwvnhdghwycqlvsnlvlt.supabase.co`" rather
  than `haci` until the app is brand-verified and Supabase Auth runs on our own domain
  (custom domain is a paid add-on).
- The reserved-username list (migration `community_accounts`) holds the old Turkish route
  words; profiles live under `/u/`, so nothing collides — add the English ones with the next
  profiles migration.
- The owner's authenticator entry is named "Hacı'nın Kokteylleri" (the old issuer); harmless.

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
- **Localization** — English first, then others; UI strings out of the components (the user,
  2026-10-13: later, once the current work is done)
- **Colour theme review** for a wider audience (the user is open to change; logo colours follow)
- A `haci` domain, if the product grows (ADR-015)
- The `haci` wordmark (`public/brand/haci-wordmark-light.svg`) in the navbar instead of text

---

## 10. Session Log

| Date | Session | Outcome |
|---|---|---|
| 2026-10-13 (late night) | M3 publish + e2e + avatars | Google app branding saved and **published to production** (no logo). Avatar upload built (`AvatarField`, `setAvatar`, `Avatar`). End-to-end test with the user's Google account: onboarding, profile edit, avatar upload and replace, public profile, account deletion — all rows and files gone |
| 2026-10-13 (night) | ADR-014 + M3 build + brand | ADR-014 agreed (Supabase Auth kept over Clerk). Hacı's real e-mail set. M3 database (profiles, settings, moderation guard, avatars, account deletion) and pages built, closed. Search Console moved to the domain; vercel.app redirects. Personal "about" removed; **brand `haci`**, English URLs, cherry logo (ADR-015). Google Cloud project + OAuth client; Google provider on in Supabase |
| 2026-10-13 (later) | M1 check + 2FA | Admin accounts added (owner "Efe", editor "Hacı"). **2FA required for admin powers** (ADR-011), the owner enrolled. Panel checked end to end. Server-action redirect bug fixed. Sign-ups off; Auth URLs set. WHOIS checked — already private. Decisions: one review per person per cocktail, unlimited logs (ADR-012); Expo after M3 (ADR-013) |
| 2026-10-13 | M0 + M1 build + M2 setup | Documentation system. Supabase recreated in Frankfurt (Seoul paused). Schema, RLS, content and photos imported; Gemini sparkles removed. Site reads from Supabase. Admin panel on `admin.` built. Domain bought by the user; Vercel domains and Namify DNS configured. Deployed (`a871688`); live on `hacininkokteylleri.tech`, checked from outside |
