# Hacı'nın Kokteylleri — Project Plan

> **FOR AGENTS:** This file is the single source of truth. Read it at the **start** of
> every session, update it at the **end**. Decision rationale lives in [adr.md](adr.md);
> the handoff to the next session lives in [next_session.md](next_session.md).
>
> Split of responsibility: *plan.md = what and why* · *adr.md = why we decided it that way* · *next_session.md = what to do right now*
>
> **Language rule (ADR-002):** everything we write — docs, code, comments, commits, SQL — is
> **English**. Everything visitors and admins read — UI strings, recipes — is **Turkish**.

**Last updated:** 2026-10-14 · **Active milestone:** **M7 — The showcase** (built and deployed; live check left; M6's live check also left) · **Brand:** `haci` (ADR-015)

---

## 1. Status Board

| Field | State |
|---|---|
| Active milestone | **M7 — The showcase** — built and tested end to end on `localhost` (2026-10-14, ADR-019): admin-opened periods (a week or a month), applications (own published recipe + photo + pitch) and upvotes in the feed's "Vitrin" section, approval in the panel's Vitrin page, the derived winner on the home page. `/privacy` `2026-10-14.3` approved. **Left:** the live check on the domain |
| Previous milestone | **M6 — Community recipes and feeds** (2026-10-14, ADR-018): built, tested on `localhost`, deployed. **Left:** its live check on the domain (the user's phone) — can be done together with M7's. M5 — Drink log done 2026-10-14 |
| Last completed | **M2 — Domain** (Search Console moved from vercel.app to the domain) and the **brand change to `haci`** with English URLs and the cherry logo (ADR-015). M1 is done except Hacı's own first sign-in |
| Blockers | None in the code. The network the user's office computer is on (a Fortinet FortiGate) blocks the domain — check from outside (§5.4) |
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
- **Accounts (M3, open)** — `/login` (Google, e-mail + password), `/welcome` (username, 18+, privacy notice),
  `/account` (edit profile, profile picture, sign out, delete account), `/u/{username}`,
  `/privacy` (KVKK notice, in effect). The navbar link follows `ACCOUNTS_OPEN` in `src/lib/account-config.ts`.
- **Reviews and favourites (M4)** — every card shows the average rating; the recipe card has a
  heart (favourite) and a reviews section (write, edit, delete your one review; report others);
  "Favorilerim" filter in the archive; `/cocktails?cocktail={slug}` opens a recipe; profiles
  list favourites and reviews and have "Profili bildir". Panel → **Moderasyon**: open reports,
  latest reviews, hide/show, close a report.
- **Drink log (M5)** — "Günlüğe ekle" on the recipe card opens `/account/logs/new?cocktail={slug}`:
  the recipe as made (ingredients, steps, garnish, glass editable), date, that evening's rating
  (never in the average), note, public or private (private by default; `/account` has the
  "new logs start public" setting). `/account/logs` lists your logs, `/account/logs/{id}` edits or
  deletes one. Public logs show on `/u/{username}` with "Bildir"; the panel's Moderasyon lists
  reported logs and the latest public ones (hide/show).
- **Community recipes and the feed (M6)** — `/account/recipes` (own recipes, drafts and published),
  `/account/recipes/new` and `/{id}` (the panel's form, simplified: no ordering; the slug comes from
  the name once; a photo in the member's own folder). A published recipe has its own page
  `/recipes/{slug}` (author byline, favourite, "Günlüğe ekle", reviews, "Tarifi bildir"). `/feed`
  ("Akış" in the navbar): "Bu ay popüler" (reviews + favourites in 30 days), "Yeni tarifler", and
  "Takip ettiklerinden" (public logs of people you follow). Profiles: "Takip et", follower and
  following counts, the member's recipes. Each public log has a page `/logs/{id}` with a flat
  comment thread (the author replies; "kayıt sahibi" badge; delete, report). Panel → Moderasyon:
  members' recipes and comments, reported or recent, hide/show (ADR-018).
- **The showcase (M7)** — `/feed` opens with "Vitrin" (`/feed#showcase`): the open (or next) period,
  approved applications ranked by upvotes, "Vitrine başvur" (one of your published recipes with a
  photo + a pitch; one per period; withdraw), your application's status, the last winner. The home
  page shows the winner of the latest ended period below the hero. Panel → **Vitrin**: open a period
  (start day, 1 week / 1 month), approve/reject, votes and the winner, delete a period; reported
  applications in Moderasyon (ADR-019).

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
| 016 | Member state read in the browser; writes via server actions that revalidate | Static pages stay static; averages update at once |
| 017 | Drink logs are written on dynamic pages under `/account/logs`; the snapshot is checked in the database | The archive stays static; the recipe as made stays a recipe |
| 018 | Members' recipes on `/recipes/{slug}`; `/feed` (popular + new recipes, followed people's logs); public follows; flat comments on public logs | Letterboxd-style community; the home page and archive stay Hacı's |
| 019 | Showcase: admin picks a week or a month per period; apply + vote in `/feed`; recipe + photo + pitch required; derived winner as a card on the home page | The user's answers; every rule in the database, no scheduled job |

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
| `cocktails` | `id uuid`, `slug` unique, `name`, `subtitle`, `base_alcohol`, `flavor`, `tags text[]`, `color #rrggbb`, `image_path`, `instructions text[]`, `garnish`, `glass`, `vegan`, `note`, `sort_order`, `is_published`; M6: `author_id` → `profiles` (null = house recipe), `hidden_at`/`hidden_by`, length caps for members' rows | everyone (published, not hidden); the author (own drafts); admins (all) | admins (any); members only rows with their own `author_id`, via `save_recipe` (≤ 10 new a day) |
| `cocktail_ingredients` | `cocktail_id`, `position` (unique together), `name` ≤ 100, `amount numeric(6,2)`, `unit` ≤ 20, `icon` enum | as its cocktail | admins; the recipe's author |
| `glossary_terms` | `term` PK, `definition` | everyone | admins |
| `admins` | `user_id` → `auth.users`, `role` (`owner`/`editor`), `display_name` | own row; admins (all) | nobody over the API — SQL only |
| `account_settings` | `user_id` PK → `auth.users`, `adult_confirmed_at` (server time), `privacy_notice_version`, `logs_public_default` | owner; admins | owner (column grants) |
| `profiles` | `id` PK → `auth.users`, `username` unique `^[a-z0-9_]{3,20}$` minus a reserved list (Turkish and English route words), `display_name`, `avatar_path` (`{id}/…` in the `avatars` bucket), `bio` ≤ 280, `hidden_at`/`hidden_by` | everyone (not hidden); owner; admins | owner, only after `account_settings` exists; admins hide |
| `reviews` | `id`, `cocktail_id`, `user_id` → `profiles`, `rating` 1–5, `body` ≤ 2000, `updated_at` (moves only when the author edits), `hidden_at`/`hidden_by`; unique `(cocktail_id, user_id)` | everyone (not hidden); author; admins | author (published cocktails only, ≤ 20 writes a day); admins hide/delete |
| `favorites` | PK `(user_id, cocktail_id)`, `created_at` | everyone | owner (published cocktails only) |
| `reports` | `reporter_id` → `profiles`, `target_type` enum, `target_id`, `reason` ≤ 500, `resolved_at`/`resolved_by` (stamped by a trigger); unique per reporter and target | admins | members file (≤ 20 a day); admins resolve |
| `drink_logs` | `id`, `user_id` → `profiles`, `cocktail_id` → `cocktails` (set null), `drunk_on` (2000-01-01 … today + 1), `recipe jsonb` (checked by `private.is_valid_log_recipe`, ≤ 16 KB), `rating` 1–5 null, `note` ≤ 2000, `is_public` (default false), `updated_at` (author edits only), `hidden_at`/`hidden_by` | everyone (public and not hidden); owner; admins | owner (published cocktails only, ≤ 50 new a day); admins hide/delete |
| view `cocktail_ratings` | `cocktail_id`, `review_count`, `average_rating` — visible reviews by visible profiles (security invoker) | everyone | — |
| `follows` (M6) | PK `(follower_id, followee_id)` → `profiles`, no self-follows, `created_at` | everyone | the follower (visible profiles only, ≤ 200 a day) |
| `log_comments` (M6) | `id`, `log_id` → `drink_logs` (cascade), `user_id` → `profiles`, `body` 1–1000, `created_at`, `hidden_at`/`hidden_by` | whoever can read the log (not hidden); commenter; admins | members on visible public logs (≤ 100 a day); deleted by the commenter, the log's author or admins; admins hide |
| `showcase_periods` (M7) | `id`, `starts_at`, `ends_at` (exclusive; midnight Turkey), never overlapping | everyone | admins (insert, delete) |
| `showcase_entries` (M7) | `id`, `period_id`, `cocktail_id` (own published recipe with a photo), `user_id`, `pitch` 1–500, `status` `pending`/`approved`/`rejected`, `reviewed_by`/`reviewed_at` (trigger), `vote_count` (trigger), `hidden_at`/`hidden_by`; unique `(period_id, user_id)` | everyone (approved, not hidden); applicant; admins | applicant inserts until the period ends, deletes (withdraws); admins approve/reject/hide |
| `showcase_votes` (M7) | PK `(entry_id, user_id)`, `created_at` | the voter only | members, on approved visible entries while the period is open (self-votes allowed) |
| view `recipe_popularity` (M6) | `cocktail_id`, `recent_reviews`, `recent_favorites`, `score` — last 30 days, visible members' recipes only (security invoker) | everyone | — |

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

M4 added `private.limit_reviews()` / `private.limit_reports()` (daily limits, security
definer) and `private.stamp_report_resolution()`. M5 added `private.is_valid_log_recipe(jsonb)`
(the snapshot's check; executable by `authenticated` because check constraints run as the writer)
and `private.limit_drink_logs()`. M6 added `public.save_recipe(recipe jsonb, ingredients jsonb)`
(members' one-transaction save, always their own `author_id`, slug fixed at creation),
`private.limit_recipes()` / `limit_follows()` / `limit_log_comments()`, the moderation guard on
`cocktails`, the `log_comment` report target, and the public `recipe-images` bucket (1 MB,
WebP/JPEG; members write only under `{user_id}/`; admins may delete) — ADR-018. M7 added
`private.stamp_showcase_review()` and `private.count_showcase_vote()` (security definer) — ADR-019.

**The rest of the community model is decided in ADR-014** (drink logs, community recipes in
`cocktails` with `author_id`, showcase) and is built milestone by milestone.

### 5.3 Code map

```
src/
  proxy.ts                      host routing: admin.* → /admin/*, /admin 404 on the public host
  app/
    layout.tsx                  root: fonts, globals, metadata
    (site)/                     public site (Navbar in its layout)
      page.tsx                  home
      cocktails/page.tsx        archive — server component, ISR 1h
      cocktails/actions.ts      saveReview, deleteReview, setFavorite, reportContent (M4)
      login/ welcome/ account/  member sign-in (Google, e-mail + password), onboarding, account (dynamic; account/actions.ts)
      account/logs/             drink log (M5): list, new (?cocktail=), [id] edit; LogForm, actions.ts
      account/recipes/          members' recipes (M6): list, new, [id] edit; RecipeForm, actions.ts
      recipes/[slug]/           a member's recipe page (ISR 5 min) → RecipeView
      page.tsx                  home (ISR 1h): hero + the showcase winner (M7)
      feed/                     Akış (ISR 5 min): Vitrin (M7), popular + new recipes, FollowingLogs (browser); actions.ts (apply, withdraw, vote)
      logs/[id]/                one public log + its comments (ISR 5 min, noindex); logs/actions.ts (comments)
      u/actions.ts              setFollow (M6)
      reset-password/           new password after the reset e-mail
      u/[username]/             public profile (ISR 5 min)
      privacy/                  KVKK notice (static)
    admin/                      the panel (only reachable through admin.*)
      login/                    sign-in
      setup-2fa/                first sign-in: connect an authenticator app (QR code)
      verify/                   later sign-ins: the 6-digit code
      (panel)/                  everything behind requireAdmin(): list, cocktails/new, cocktails/[id], glossary, moderation, showcase (M7)
      actions.ts                every write (server actions)
      CocktailForm.tsx, GlossaryEditor.tsx, PublishToggle.tsx, ModerationButton.tsx, ShowcaseControls.tsx
    auth/callback/route.ts      Google → Supabase → here: code exchange, then /welcome or next
    api/keepalive/route.ts      daily ping (vercel.json cron)
    icon.svg, apple-icon.png    favicon and touch icon (the cherry, ADR-015)
    robots.ts, sitemap.ts       for search engines
  components/                   site components (CocktailBrowser, CocktailCard, CocktailModal, Tooltip, …);
                                M4: useMember (session + favourites in the browser), CocktailReviews, Stars, ReportButton;
                                M5: DrinkLogEntry, ReportIfSignedIn (in ReportProfileButton.tsx);
                                M6: RecipeDetails (one renderer for every recipe), RecipeActions, RecipeView,
                                ImageField (shared with the panel), FollowButton, FollowingLogs, LogComments;
                                M7: ShowcaseEntries (votes), ShowcaseApply (application form)
  lib/
    content.ts                  DB rows → the shapes components draw; public fetchers
    admin.ts                    requireAdmin()
    account.ts                  accountSession(), requireMember() (server only)
    account-config.ts           ACCOUNTS_OPEN, PRIVACY_NOTICE_VERSION, safeNext() (browser-safe)
    brand.ts                    BRAND = "haci" 
    community.ts                review/report length limits, formatAverage (browser-safe)
    drink-log.ts                the log's recipe snapshot: type, limits, cleanRecipe, formatting (browser-safe)
    recipe.ts                   a member's recipe: RecipeInput, limits, icons, cleanRecipeInput (browser-safe)
    showcase.ts                 periods (bounds in Turkey time, state, formatting), pitch limit, status labels (browser-safe)
    slug.ts                     Turkish-aware slugify
    supabase/                   config, public/server/browser/proxy clients, database.types.ts (generated)
supabase/
  migrations/                   {version}_{name}.sql — mirrors of what is applied (ADR-009)
  storage/cocktail-images/      the 37 imported WebPs (the bucket's starting content)
  templates/                    Supabase Auth e-mail templates (Turkish), mirrored by hand
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

### ✅ M3 — Accounts `DONE 2026-10-14`

- [x] ADR-014 (community data model), agreed with the user
- [x] Migration `community_accounts`: `account_settings`, `profiles`, moderation guard, `avatars` bucket, `delete_my_account()`; 16 policy checks in SQL (rolled back); advisors clean
- [x] Pages: `/login` (Google), `/auth/callback`, `/welcome`, `/account` (profile, sign out, delete), `/u/{username}`, `/privacy` (draft)
- [x] Google Cloud project `haci` + OAuth client; Google provider enabled in Supabase (secret pasted by the user)
- [x] Publish the Google app — Branding: home page, `/privacy`, authorized domains; **no logo** (a logo forces Google verification); Audience → **In production** (2026-10-13)
- [x] End to end on `localhost:3000` (2026-10-13): Google sign-in (the user's `wowcubey@gmail.com`) → `/welcome` → `/account` → bio edit and avatar upload/replace seen on `/u/{username}` → delete; `auth.users`, identities, `profiles`, `account_settings` and the avatar object all gone, the profile page 404s
- [x] Privacy notice contact address: **`contact@hacininkokteylleri.tech`** shown (`iletisim@` works too) forwarded to `n.efeyigit@outlook.com` through **ImprovMX** (MX + SPF at Namify; account and aliases by the user; test mails arrived, 2026-10-13). ImprovMX listed as a processor in `/privacy`
- [x] A final read of `/privacy` by the user (2026-10-14) — Resend added as a processor and the password storage stated before it took effect
- [x] E-mail + password code (2026-10-13): sign in / sign up / forgot password on `/login` (`EmailForm`), `/reset-password`, callback `via=email` errors; checked locally with sign-ups off (wrong password, sign-up refused)
- [x] Resend: account (the user's), domain `hacininkokteylleri.tech` in **Ireland (eu-west-1)**, tracking off; DNS at Namify: `TXT resend._domainkey` (DKIM), `CNAME rsend` → `rsend-euw1.forge.rmta.net`, `CNAME send` → `send.forge.rmta.net`, `TXT _dmarc v=DMARC1; p=none;`
- [x] Resend domain **verified** (2026-10-14); custom SMTP in Supabase (`smtp.resend.com:465`, sender `haci <noreply@hacininkokteylleri.tech>`, key pasted by the user); minimum password length 8 (the user)
- [x] Turkish e-mail templates in Supabase — confirm sign-up, reset password, change e-mail; sources in `supabase/templates/` (paste by hand when they change)
- [x] E-mail tested end to end on `localhost:3000` (2026-10-14): sign-up → confirmation e-mail via Resend → `/welcome` → `/account` → sign out → reset e-mail → `/reset-password` → sign in with the new password → delete; all rows gone
- [x] Avatar upload on `/account` (and shown on `/u/{username}`)
- [x] Open it (2026-10-14, the user's go): `ACCOUNTS_OPEN = true` deployed, sign-ups on (the user)
- [x] Live check (2026-10-14): `/`, `/login`, `/privacy` 200 from outside (check-host.net); the production deployment URL in Chrome (the office firewall blocks the domain) shows no draft banner, Resend listed, the "Giriş" navbar link. A Google round trip on the live domain needs an unblocked network — the user, whenever convenient (not blocking)

### ✅ M4 — Reviews and favourites `DONE 2026-10-14`

- [x] Migration `reviews_favorites`: `reviews`, `favorites`, `reports`, view `cocktail_ratings`, daily limits (20 reviews written/rewritten, 20 reports), English reserved usernames; 29 policy checks in SQL (rolled back); advisors clean
- [x] Migration `reviews_updated_at_on_edit`: hiding a review no longer moves its date
- [x] Archive: average on every card; recipe card: favourite heart, reviews (write / edit / two-step delete / report); "Favorilerim" filter; `?cocktail={slug}` deep link (also the way back from `/login`)
- [x] Profiles: favourites and reviews; "Profili bildir"
- [x] Panel → Moderasyon: open reports with the target, latest reviews, hide/show, close
- [x] End to end on `localhost:3000` / `admin.localhost:3000` (2026-10-14) with the user's Google account (`ahmet_kafa`) and a seeded test member: review → average updated at once → edit → report → admin hides (gone from the list and the average) → report closed → delete → favourite on/off → profile report. Test rows deleted
- [x] Live check on `hacininkokteylleri.tech` (2026-10-14, the user's Chrome over mobile data): Google sign-in as `ahmet_kafa` on the live domain → `/account`; a 4-star review on Kuzu Kulağı Devrimi → the card showed 4,0 (1), also in the cached static page fetched anonymously → review deleted → no rating, 0 rows

### ✅ M5 — Drink log `DONE 2026-10-14`

- [x] Migration `drink_logs` (ADR-014): the table, `private.is_valid_log_recipe()`, 50 logs a day, moderation guard, `updated_at` only on author edits; 29 policy checks in SQL (rolled back); advisors clean
- [x] "Günlüğe ekle" on the recipe card → `/account/logs/new?cocktail={slug}` (a picker without a slug); recipe as made, date, rating, note, public/private (ADR-017)
- [x] `/account/logs` (own logs) and `/account/logs/{id}` (edit, two-step delete); `/account` setting "new logs start public"
- [x] Public logs on `/u/{username}` with "Bildir"; panel Moderasyon: reported logs and the latest public ones, hide/show
- [x] `/privacy` names the drink log (the user approved the text, 2026-10-14); notice version `2026-10-14`
- [x] End to end on `localhost:3000` / `admin.localhost:3000` (2026-10-14) with the user's `ahmet_kafa`: log from the card with vodka → gin, 4 stars → private (not on the profile) → edited to public (on the profile, also for an anonymous fetch) → default setting on (new form pre-ticked) and off again → a seeded member's report in the panel → hidden (gone from the profile, owner sees "gizlendi") → report closed → log deleted. Test rows and the seeded member removed
- [x] Live check on `hacininkokteylleri.tech` (2026-10-14, the user's phone): passed. Afterwards 0 logs, reviews and reports; the only profile is `ahmet_kafa`

### 🔵 M6 — Community recipes and feeds `BUILT 2026-10-14 — live check left`

The user's answers (2026-10-14): the feed = all members' popular recipes (Letterboxd's main page)
+ the latest logs of people you follow; replies on a followed person's log, like Letterboxd review
comments; members' recipes reviewable; `/r/{slug}` "or whichever is better" → `/recipes/{slug}`
(ADR-018). The archive and the home page stay Hacı's.

- [x] Migration `community_recipes`: `cocktails.author_id`/`hidden_at`, members' policies,
  `save_recipe`, `recipe-images` bucket, `recipe_popularity`, `follows`, `log_comments`, limits;
  33 policy checks in SQL (rolled back); advisors clean (only the known items)
- [x] Write/edit/delete recipes (`/account/recipes`), drafts, photo in the member's folder
- [x] `/recipes/{slug}` with reviews, favourite, "Günlüğe ekle", report; in the sitemap
- [x] `/feed`: popular (30 days), new, followed people's public logs; "Akış" in the navbar
- [x] Follows (button, counts) on profiles; the member's recipes on the profile
- [x] `/logs/{id}` with a flat comment thread (author's replies marked, delete, report)
- [x] Panel Moderasyon: members' recipes and comments, reported or recent, hide/show
- [x] End to end on `localhost:3000` / `admin.localhost:3000` (2026-10-14) with the user's
  `ahmet_kafa` and a seeded member: recipe with photo → page → review 4 + favourite → popular on the
  feed → follow → the member's log on the feed → comment → owner's reply (badge) → report → admin
  hides the comment, closes the report, hides the recipe (404 for guests, gone from the feed,
  "gizlendi" for the author) → recipe deleted (photo removed, review/favourite gone, the log kept
  its copy). Test rows and the seeded member removed; the archive's card still renders
- [x] `/privacy` text (recipes, photos, follows, comments; version `2026-10-14.2`) — approved by the user (2026-10-14); deployed
- [ ] Live check on the domain from an unblocked network (the user's phone)

### 🔵 M7 — The showcase `BUILT 2026-10-14 — live check left`

The user's answers (2026-10-14): the admin picks a week or a month each time; applying and voting
inside `/feed`; the winner as a featured card below the hero; recipe + pitch + photo all required
(ADR-019).

- [x] Migration `showcase`: `showcase_periods` (no overlaps), `showcase_entries` (own published recipe
  with a photo, pitch, one per period, admin review stamped by a trigger), `showcase_votes` (open
  period only, private, `vote_count` by a trigger); 38 policy checks in SQL (rolled back); advisors
  clean (only the known items)
- [x] Feed: "Vitrin" section — period, approved entries by votes, upvote/undo, report, apply form,
  own application status and withdraw, last winner
- [x] Home page: the derived winner below the hero (ISR 1h; revalidated by panel and recipe actions)
- [x] Panel: Vitrin page (open a period, approve/reject, votes, winner, delete); reported applications
  in Moderasyon with hide/show
- [x] `/privacy` names the showcase (version `2026-10-14.3`) — approved by the user (2026-10-14)
- [x] End to end on `localhost:3000` / `admin.localhost:3000` (2026-10-14) with the user's
  `ahmet_kafa`: period opened in the panel → recipe with a photo → applied on the feed (pending, not
  visible anonymously) → approved → self-vote (1, persisted) → taken back (0) → voted again → period
  moved into the past in SQL → winner card on the home page, "Son kazanan" on the feed, "★ kazanan" in
  the panel → a report in Moderasyon → hidden (gone from the home page and the feed) → report closed,
  period deleted, recipe deleted (photo gone). All test rows removed
- [ ] Live check on the domain from an unblocked network (the user's phone)

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
| Free-plan limits (500 MB DB, 1 GB storage, 5 GB egress) | Low–medium from M6 | Members' photos: 1 MB a file, resized to 1600 px WebP in the browser, 10 recipes a day; watch storage in the dashboard |
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
- A photo uploaded in the panel and then abandoned (form not saved) stays in the bucket; the same
  for a member's recipe form (the file stays in their folder until they delete their account).
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
  2026-10-13: later, once the current work is done). **Includes an English privacy notice next to
  the Turkish one** for global users (the user, 2026-10-13)
- **Colour theme review** for a wider audience (the user is open to change; logo colours follow)
- A `haci` domain, if the product grows (ADR-015)
- Paging / "show more" for reviews (the card shows the latest 50; a profile the latest 100)
- Rating breakdown (how many 5s, 4s, …) and sorting the archive by rating
- Follower / following lists on profiles; "people you may know" (M6 shows counts only)
- Notifications (a reply to your comment, a new follower, a comment on your log)
- Editing a comment; threaded replies (M6 comments are flat, delete-only)
- Tune "popular" (weights, logs, a week vs a month) once there is real traffic
- House recipes on `/recipes/{slug}` too (the path is ready: slugs are unique across both)
- Showcase: an archive of past winners; telling applicants when they are approved (M7 shows the status on the feed only)
- The `haci` wordmark (`public/brand/haci-wordmark-light.svg`) in the navbar instead of text
- **Our own auth domain** (e.g. `auth.hacininkokteylleri.tech`, Supabase custom domain, a paid
  add-on) plus Google brand verification, so Google's account chooser says `haci` instead of
  `qwvnhdghwycqlvsnlvlt.supabase.co` (seen live 2026-10-14). The user: "we'll buy it if it grows"

---

## 10. Session Log

| Date | Session | Outcome |
|---|---|---|
| 2026-10-14 | M7 build | A new Claude account: the user connected the Supabase connector and Claude in Chrome. M6 live check still left (the user's). The user answered the M7 questions (period chosen per time, apply/vote in `/feed`, winner card below the hero, recipe + pitch + photo required). Migration `showcase` (38 policy checks). The feed's Vitrin section, the home page winner, the panel's Vitrin page, moderation of applications; `/privacy` `2026-10-14.3` (the user's OK). ADR-019. Tested end to end in Chrome on localhost; test rows removed. Deployed; live check left |
| 2026-10-14 | M6 build | The user answered the M6 questions (feed like Letterboxd, follows, replies on logs, reviewable recipes, `/recipes/{slug}`). Migration `community_recipes` (33 policy checks). Members' recipes, recipe pages, `/feed`, follows, log comments, moderation; `/privacy` updated (version `2026-10-14.2`, the user's OK). ADR-018. Tested end to end in Chrome (localhost) with the user's account and a seeded member (removed). Deployed; live check left |
| 2026-10-14 | M5 live check | The user checked the drink log on the live domain from their phone: passed. Database clean afterwards (0 logs). **M5 done**; next M6 |
| 2026-10-14 | M5 build | Migration `drink_logs` (29 policy checks). Log from the recipe card on a dynamic page under `/account/logs` (ADR-017), list/edit/delete, public/private with a default on `/account`, public logs on profiles with reports, the panel's moderation. `/privacy` names the drink log (the user's OK), version `2026-10-14`. Tested end to end in Chrome with the user's account and a seeded reporter (removed). Deployed; live check left |
| 2026-10-14 | M4 live check | Over the user's mobile data in their Chrome: the domain 200; **Google sign-in on the live domain** works; review → card 4,0 (1) (also the cached static page) → delete → 0 rows. **M4 done**. The supabase.co name on Google's chooser → Icebox (own auth domain) |
| 2026-10-14 | M4 build | Sign-ups still on; no members yet (the user's own `ahmet_kafa` appeared during the session). Migrations `reviews_favorites` and `reviews_updated_at_on_edit`; 29 policy checks. Ratings on cards, reviews and favourites in the recipe card, profile activity, reports, the panel's moderation page. Tested end to end in Chrome with the user's account and a seeded member (removed). Prompt/confirm dialogs replaced by inline forms (they freeze automation). ADR-016. Deployed |
| 2026-10-14 | Open M3 | Sign-ups confirmed off at the start. `/privacy` gained Resend as a processor and how the password is stored; the user approved the text. **Accounts opened** (`ACCOUNTS_OPEN = true`, `d487c84`) and sign-ups turned on by the user. Live check: `/`, `/login`, `/privacy` 200 from outside (check-host); the production deployment in Chrome shows no draft banner and the "Giriş" link. **M3 done**; a Google sign-in on the live domain from an unblocked network is left to the user |
| 2026-10-13 → 14 | Contact mail + e-mail sign-in | `contact@`/`iletisim@` forwarded through ImprovMX (Namify has no forwarding). Privacy notice: contact address, ImprovMX listed. The user chose to open accounts only after e-mail sign-in. Resend (Ireland) verified, custom SMTP in Supabase, Turkish auth templates. E-mail sign-in / sign-up / reset built and tested end to end. English privacy notice → Icebox (localization) |
| 2026-10-13 (late night) | M3 publish + e2e + avatars | Google app branding saved and **published to production** (no logo). Avatar upload built (`AvatarField`, `setAvatar`, `Avatar`). End-to-end test with the user's Google account: onboarding, profile edit, avatar upload and replace, public profile, account deletion — all rows and files gone |
| 2026-10-13 (night) | ADR-014 + M3 build + brand | ADR-014 agreed (Supabase Auth kept over Clerk). Hacı's real e-mail set. M3 database (profiles, settings, moderation guard, avatars, account deletion) and pages built, closed. Search Console moved to the domain; vercel.app redirects. Personal "about" removed; **brand `haci`**, English URLs, cherry logo (ADR-015). Google Cloud project + OAuth client; Google provider on in Supabase |
| 2026-10-13 (later) | M1 check + 2FA | Admin accounts added (owner "Efe", editor "Hacı"). **2FA required for admin powers** (ADR-011), the owner enrolled. Panel checked end to end. Server-action redirect bug fixed. Sign-ups off; Auth URLs set. WHOIS checked — already private. Decisions: one review per person per cocktail, unlimited logs (ADR-012); Expo after M3 (ADR-013) |
| 2026-10-13 | M0 + M1 build + M2 setup | Documentation system. Supabase recreated in Frankfurt (Seoul paused). Schema, RLS, content and photos imported; Gemini sparkles removed. Site reads from Supabase. Admin panel on `admin.` built. Domain bought by the user; Vercel domains and Namify DNS configured. Deployed (`a871688`); live on `hacininkokteylleri.tech`, checked from outside |
