# ADR — Architecture Decision Records

> Decisions that have been made, and **why**. Rejected alternatives are recorded too.
>
> **FOR AGENTS:** These decisions are closed. Don't relitigate them, apply them. If you
> believe one is wrong, raise it with the user; if they agree, mark the ADR `Superseded`
> and add a replacement with a new number. **Never delete an ADR.**
>
> Add a new ADR whenever you make a decision that will outlive the session.

| # | Decision | Status | Date |
|---|---|---|---|
| 001 | Documentation-driven multi-session workflow | ✅ Accepted | 2026-10-13 |
| 002 | English for everything we write; Turkish for what visitors read | ✅ Accepted | 2026-10-13 |
| 003 | The backend is Supabase, in Frankfurt | ✅ Accepted | 2026-10-13 |
| 004 | Content lives in the database, which is the source of truth | ✅ Accepted | 2026-10-13 |
| 005 | The public site is static and revalidated; a daily call keeps the project awake | ✅ Accepted | 2026-10-13 |
| 006 | Photos are WebP in a public bucket, never overwritten in place | ✅ Accepted | 2026-10-13 |
| 007 | The admin panel is the same app on a subdomain; the database decides who may write | ✅ Accepted | 2026-10-13 |
| 008 | Public config is committed in `.env`; secrets never enter the repository | ✅ Accepted | 2026-10-13 |
| 009 | Schema changes are migrations, applied through the MCP and mirrored in the repo | ✅ Accepted | 2026-10-13 |
| 010 | `hacininkokteylleri.tech` is canonical; DNS stays at the registrar | ✅ Accepted | 2026-10-13 |
| 011 | Admins need two-factor authentication, enforced by the database | ✅ Accepted | 2026-10-13 |
| 012 | Reviews are one per person per cocktail; logs are unlimited | ✅ Accepted (shape of the tables decided at M4/M5) | 2026-10-13 |
| 013 | The mobile app is Expo, started after accounts (M3) | ✅ Accepted | 2026-10-13 |
| 014 | The community data model | ✅ Accepted (built milestone by milestone, M3–M7) | 2026-10-13 |
| 015 | The brand is "haci"; paths and settings are English | ✅ Accepted | 2026-10-13 |
| 016 | Member state on static pages: read in the browser, written through server actions that revalidate | ✅ Accepted | 2026-10-14 |
| 017 | Drink logs: written on dynamic account pages, the recipe snapshot checked by the database | ✅ Accepted | 2026-10-14 |
| 018 | Community recipes, the feed, follows and log comments | ✅ Accepted | 2026-10-14 |
| 019 | The showcase: periods chosen per time, applying and voting on the feed, the winner on the home page | ✅ Accepted | 2026-10-14 |
| 020 | The Expo app: `mobile/` in this repository, full parity with the site, both stores, native sign-in | ✅ Accepted | 2026-10-14 |
| 021 | E-mail links carry a `token_hash` verified by the site; a password change on a 2FA account asks for the code | ✅ Accepted | 2026-10-15 |

---

## ADR-001 — Documentation-driven multi-session workflow

**Context.** The user works across several computers, Claude accounts and agents, and
wants any new session to pick the work up from a single prompt: commit here, continue
there, and the reverse. The pattern is borrowed from the user's game project (HOM), where
it carried a long project across dozens of sessions.

**Decision.** Three files with separate jobs, plus a pointer for Claude Code:

| File | Role | Updated |
|---|---|---|
| `plan.md` | **What and why** — status board, product, architecture, milestones, risks, icebox, session log | End of every session |
| `adr.md` | **Why we decided it that way** — closed decisions and rejected alternatives | When a lasting decision is made |
| `next_session.md` | **What to do right now** — the prompt to paste, the task, open questions, traps | **Rewritten** at the end of every session |
| `CLAUDE.md` | Loaded automatically by Claude Code; points at the three files | Rarely |

The prompt in `next_session.md` tells the agent to read the files first and update them
last. Nothing that matters lives only in a chat, in an agent's memory, or on one machine.

**Consequences.**
- (+) A new session starts with full context from one prompt
- (+) The repository alone is enough: `git pull` on any computer and paste the prompt
- (−) It takes discipline at the end of every session — written into the prompt as a mandatory step
- (−) If a session is cut off, the handoff goes stale, so it is updated **before context fills, even with work unfinished**

---

## ADR-002 — English for everything we write; Turkish for what visitors read

**Context.** The user chats in Turkish. The site's audience is Turkish. The repository
already had English identifiers and commit messages.

**Decision.** Documentation, code, identifiers, comments, commit messages and migration
SQL are **English**. Everything a visitor or an admin reads — UI strings, recipe content,
error messages shown in the panel — is **Turkish**. Chatting in Turkish never changes the
language of what we produce.

**Rejected.** *All Turkish:* the code and the tools are English already, and mixing
languages inside code is worse than either. *All English:* the product is for Turkish
speakers.

---

## ADR-003 — The backend is Supabase, in Frankfurt

**Context.** The site is growing into a brand with a mobile app, an admin panel and, later,
accounts, comments and user recipes. Until now the recipes were a TypeScript file in the
repository and every change needed a deploy.

**Decision.** **Supabase** — Postgres, Auth, Storage and an auto-generated API in one
place, usable from Next.js and from a mobile app with the same client library. The project
is `hacininkokteylleri-eu` (ref `qwvnhdghwycqlvsnlvlt`) in **eu-central-1 (Frankfurt)**.

The user first created the project in Seoul (ap-northeast-2). From Turkey that is roughly
250–300 ms per round trip against ~50 ms for Frankfurt, and the database was still empty,
so on 2026-10-13 the user chose to recreate it in Frankfurt. The Seoul project
(`kdicsywipwkauonkxcdc`) was paused to free the free plan's second slot; deleting it is
the user's to do in the dashboard.

**Consequences.**
- (+) One backend for the site, the admin panel and the mobile app
- (+) Row Level Security puts the access rules in the database, where every client obeys them
- (−) Free-plan limits: 500 MB database, 1 GB storage, 5 GB egress, **pauses after 7 days idle** (ADR-005), no backups
- (−) A third party holds the data; leaving would mean a migration

**Rejected.** *Firebase:* document store, weaker for relational content and SQL. *Our own
API server:* more to run and secure for no gain at this size. *Keep the TypeScript file:*
no admin panel, no mobile app, no user content.

---

## ADR-004 — Content lives in the database, which is the source of truth

**Decision.** Since 2026-10-13 the recipes are in Postgres, and `src/data/cocktails.ts` is
gone (it is in git history up to `bb06ba0`). Tables:

- `cocktails` — `id uuid` (what other tables reference) and a unique, URL-safe `slug`
  (what people see); `sort_order` sets display order; `is_published` hides drafts.
- `cocktail_ingredients` — one row per ingredient with its `position`; `icon` is the enum
  the recipe card draws (`shot`, `dash`, `drop`, `slice`, `spoon`, `topup`).
- `glossary_terms` — terms underlined with a tooltip wherever they appear.
- `admins` — who may edit (ADR-007).

**Access.** Row Level Security on every table. The public (`anon`) reads published rows
and nothing else; writes need an admin (ADR-007). The project's default privileges grant
`anon` everything on new tables, so **every new table revokes that and grants only what it
needs** — copy the pattern in `20261013131519_content_schema.sql`.

**Consequences.**
- (+) Hacı edits without a deploy; the mobile app reads the same rows
- (−) Content changes no longer show in git history. There are no backups on the free plan — see the risk in `plan.md`

**Rejected.** *Content in the repo, synced to the database:* versioned, but it keeps the
deploy-to-edit loop the admin panel exists to remove.

---

## ADR-005 — The public site is static and revalidated; a daily call keeps the project awake

**Decision.** Public pages read with a session-less client (`src/lib/supabase/public.ts`),
so Next.js renders them at build time and **revalidates at most hourly**
(`export const revalidate = 3600`). Every admin write calls `revalidatePath` on the public
pages, so edits are live at once. Visitors never wait on the database.

Supabase pauses a free project after a week without requests, which would also take the
photos offline. **A Vercel cron calls `/api/keepalive` daily** (`vercel.json`) and runs one
tiny query.

**Consequences.**
- (+) Fast pages; a database hiccup serves the last good page instead of an error
- (−) A page that reads per-user data (M3 onwards) must be dynamic or fetch on the client — don't add cookies to the public pages by accident

---

## ADR-006 — Photos are WebP in a public bucket, never overwritten in place

**Decision.** Photos live in the public Storage bucket **`cocktail-images`** as WebP, at most
1600 px wide (JPEG only where the browser cannot encode WebP); `cocktails.image_path` holds
the object name. Public URL: `{SUPABASE_URL}/storage/v1/object/public/cocktail-images/{image_path}`.

- **Never overwrite an object.** A new photo gets a new name (`{slug}-{base36 time}.webp`)
  and the old object is deleted after the row points elsewhere. CDNs and apps cache by URL.
- The original 37 PNGs (~5 MB each, 175 MB in all) became ~35 KB WebPs (1.3 MB in all).
  Their sources are in git history up to `bb06ba0` (`public/images/cocktails/`); the
  imported WebPs are kept in `supabase/storage/cocktail-images/`.
- **The Gemini sparkle is removed.** The photos are Gemini-generated and carried its
  sparkle in the bottom-right corner. It sits 112 px in from both edges and is 60 px wide
  on a 2816 px-wide image, scaling with width; it is covered by a feathered patch copied
  from 140 px to its left (the background there is dark and even). The 37 originals were
  cleaned offline before import; the admin panel's uploader does the same in the browser
  (`src/app/admin/ImageField.tsx`), on by default with a checkbox to turn it off.

**Rejected.** *Images in `public/` on Vercel:* adding a cocktail would need a deploy.
*Supabase image transformations:* paid plan only.

---

## ADR-007 — The admin panel is the same app on a subdomain; the database decides who may write

**Decision.**
- **One Next.js app, two hosts.** `src/proxy.ts` (Next 16's middleware) rewrites every
  request on `admin.*` to the routes under `src/app/admin`, so the panel's addresses are
  clean (`admin.hacininkokteylleri.tech/kokteyller/…`). On the public host, `/admin` is a
  404. Locally the panel is **http://admin.localhost:3000**.
- **Supabase Auth, email and password.** No public sign-up yet; accounts are created by
  the owner in the dashboard (Authentication → Users → Add user).
- **`admins` table, roles `owner` and `editor`.** The user is the owner, Hacı an editor.
  Both have the same content rights today; the role exists so owner-only screens can come
  later without a migration.
- **The database enforces it.** Every write policy checks `private.is_admin()`, a
  security-definer function in a schema the Data API does not expose. The pages check too
  (`requireAdmin` in `src/lib/admin.ts`), but only for a friendly redirect — the policies
  are the rule.
- **Server actions never call `redirect()`.** Next.js renders an action's redirect target
  internally, without passing through `src/proxy.ts`, so on the admin host `redirect("/")`
  rendered the *public* home page (found 2026-10-13 on the first real sign-in). Actions
  return `{ ok }` / `{ error }` and the browser navigates (`window.location.assign` after a
  sign-in or 2FA step, `router.push` otherwise). `redirect()` during a page render is fine —
  that one is a real HTTP redirect the browser follows.
- **No secret key anywhere in the app.** Writes run as the signed-in admin. Saving a
  cocktail and its ingredient list is one transaction in `public.save_cocktail(jsonb, jsonb)`
  (security invoker, so the policies apply). Photos upload straight from the browser with
  the admin's session.

**Rejected.** *A separate admin app or Vercel project:* two deploys, duplicated types and
config. *Supabase Studio as the admin:* too raw for Hacı, and it hands out full database
access. *A service-role key on the server:* one leaked variable would bypass every policy.

---

## ADR-008 — Public config is committed in `.env`; secrets never enter the repository

**Decision.** `.env` holds only values that ship to every browser anyway — the Supabase URL,
the **publishable** key, the site URL — and is committed, so a fresh clone runs and Vercel
builds without dashboard setup. Anything secret (the Supabase secret key, tokens,
passwords) goes in `.env.local` (git-ignored) or Vercel's environment variables, and
never in chat. Today the app needs no secret at all.

---

## ADR-009 — Schema changes are migrations, applied through the MCP and mirrored in the repo

**Decision.** The schema changes only through migrations. An agent applies one with the
Supabase MCP (`apply_migration`), reads the version it was given (`list_migrations`), and
saves the identical SQL as `supabase/migrations/{version}_{name}.sql`. Then it regenerates
`src/lib/supabase/database.types.ts` and runs the security advisor (`get_advisors`).

Never change the schema from the dashboard's table editor: the repository would stop
describing the database. Content edits (rows) are not migrations — they go through the
admin panel.

The Supabase **GitHub integration is not connected** to this project. If it is ever turned
on with "deploy to production", the mirrored versions make it skip what is already applied.

**Rejected.** *Supabase CLI and `db push`:* needs the database password on every machine.

---

## ADR-010 — `hacininkokteylleri.tech` is canonical; DNS stays at the registrar

**Decision.** The domain was registered on 2026-10-13 at get.tech (Namify, through the
GitHub Student Pack; dashboard `manage.get.tech`). On Vercel (project `hacininkokteylleri`,
team "Nazım Efe Yiğit's projects"):

| Host | Role |
|---|---|
| `hacininkokteylleri.tech` | The site — canonical |
| `www.hacininkokteylleri.tech` | 308 → apex |
| `admin.hacininkokteylleri.tech` | The admin panel (ADR-007) |
| `hacininkokteylleri.vercel.app` | Still served; Vercel's default |

DNS records at Namify (nameservers unchanged):

| Type | Host | Value |
|---|---|---|
| A | `@` | `216.198.79.1` |
| CNAME | `www` | `1327916967901761.vercel-dns-017.com` |
| CNAME | `admin` | `1327916967901761.vercel-dns-017.com` |

**Why apex.** Shorter on posters, store listings and in speech. Vercel recommends www as
canonical for resilience; at this scale the difference does not matter.

**Rejected.** *Moving nameservers to Vercel:* simpler subdomains, but email and everything
else would have to move with them, and three records are enough.

---

## ADR-011 — Admins need two-factor authentication, enforced by the database

**Context.** The user asked for 2FA on the panel so that a leaked password alone opens nothing.

**Decision.** Supabase Auth's **TOTP** factor (an authenticator app — Google Authenticator,
Microsoft Authenticator, …; free on every plan, enabled in the project).

- **The database is the rule.** `private.is_admin()` is true only for a row in `admins`
  **and** a session at assurance level `aal2` (`auth.jwt() ->> 'aal'`). Every write policy and
  every storage policy goes through it, so a password-only (`aal1`) session can write nothing,
  from the panel or straight at the API. Migration `20261013140454_admin_mfa.sql`.
- An `aal1` admin still sees their **own** `admins` row, so the panel can tell "not an admin"
  from "admin, code still owed".
- **The panel's flow** (`adminSession()` in `src/lib/admin.ts`): password → no factor yet →
  `/iki-adim` (QR code, first code; the session becomes `aal2`) → panel. Later sign-ins:
  password → `/dogrula` (code) → panel. Half-finished enrolments are removed before a new QR
  code is made.
- **Ordinary users are unaffected.** When public accounts arrive (M3) they sign in without a
  second factor; only admin powers need `aal2`.
- **A lost phone:** the owner deletes that admin's factor in Supabase → Authentication →
  Users → the user → MFA factors (or `delete from auth.mfa_factors where user_id = …`); the
  admin enrols again on the next sign-in. If the owner loses theirs, the same is done from the
  Supabase dashboard, which has its own login.

**Rejected.** *SMS codes:* paid plan only, and weaker. *Checking 2FA only in the app:* one
direct API call with a stolen password would bypass it.

---

## ADR-012 — Reviews are one per person per cocktail; logs are unlimited

**Context.** M4 and M5 needed the user's answer on how comments, ratings and drink logs
relate (asked 2026-10-13).

**Decision (the user's).** Letterboxd-style:
- **A review** — a 1–5 star rating with optional text, public — is **one per person per
  cocktail**. Writing again edits it.
- **A drink log** can be added **any number of times** for the same cocktail, each with its own
  date, note and the recipe as made — another evening is another experience.

The exact tables (whether a log can carry its own rating, how the review and the latest log
relate) are designed in the community-model ADR before M3/M4 are built.

---

## ADR-013 — The mobile app is Expo, started after accounts (M3)

**Decision (the user's, 2026-10-13).** The app is built with **Expo** (React Native,
TypeScript, `supabase-js`), and work on it starts **after M3**, so it ships with sign-in
from the first version instead of being retrofitted. Content still comes from the same
Supabase project and is edited in the same admin panel. Where the app's code lives (this
repository as a monorepo, or a second one) is decided when M8 starts.

**Rejected.** *Starting now, read-only:* the app's real value — logging, favourites,
reviews — all needs accounts. *Flutter / native:* a second language next to the web's
TypeScript, and no shared types.

---

## ADR-014 — The community data model

**Status.** Accepted by the user 2026-10-13. The tables are built
milestone by milestone (M3 profiles … M7 showcase); this ADR fixes their shape and rules up
front so the early ones do not box in the later ones.

**Context.** M3–M7 add accounts, reviews, favourites, drink logs, community recipes and the
showcase (plan.md §3.2). The user's answers (2026-10-13): **Supabase Auth stays** (Clerk,
which the user has through the GitHub Student Pack, was considered and rejected — below);
public sign-in with **Google first, then e-mail and password**; profiles public, **drink logs
private by default**; showcase **upvotes — one per user per entry, self-votes allowed — and
any admin approves applications**. ADR-012 already fixed one review per person per cocktail
and unlimited logs.

### Principles

1. **Everything community hangs off `profiles`, not `auth.users`.** Community tables reference
   `profiles(id)`, so a signed-in user who has not finished onboarding (username + 18+
   confirmation) has no profile and can write nothing. The gate is a foreign key, not app code.
2. **Deleting an account deletes the person's content.** `profiles.id` references
   `auth.users on delete cascade`, and every community table cascades from `profiles`. The one
   exception is a drink log's link to a *recipe* that was deleted (below).
3. **One permissive policy per table, role and action.** Ordinary users and admins share the
   `authenticated` role, so each policy ORs the user's condition with
   `(select private.is_admin())` — the pattern the content tables already use (ADR-007). No
   overlapping permissive policies, so the performance advisor stays clean.
4. **Moderation is a column, guarded by a trigger.** Moderated tables carry `hidden_at
   timestamptz` and `hidden_by uuid`. A hidden row is invisible to everyone except its author
   (who sees it marked "gizlendi" and may still delete it) and admins. Authors may update
   their own rows, so a shared `before update` trigger, `private.guard_moderation()`, raises
   unless `private.is_admin()` when `hidden_at`/`hidden_by` change. Admin powers keep
   needing `aal2` (ADR-011).
5. **Every new table** revokes the default grants, grants only what it needs, enables RLS and
   indexes its foreign keys (ADR-004, the advisors).
6. **Volume limits live in the database.** An insert trigger per table caps rows per user per
   day (starting values: 50 logs, 20 reviews written or rewritten, 10 recipes, 20 reports).
   Uniqueness already caps reviews, favourites and votes.

### Tables

**`profiles`** (M3) — public identity, one per auth user.

| Column | Type / rule |
|---|---|
| `id` | `uuid` PK → `auth.users(id) on delete cascade` |
| `username` | `text unique`, `^[a-z0-9_]{3,20}$` (the app suggests one from the display name with `slugify`), not in a reserved list (`admin`, `haci`, `kokteyller`, `vitrin`, `giris`, …); changeable |
| `display_name` | `text`, 1–50 chars |
| `avatar_path` | `text null` — object in a new public bucket `avatars`, path `{user_id}/{name}.webp`, never overwritten (ADR-006), small size cap |
| `bio` | `text null`, ≤ 280 chars |
| `created_at`, `updated_at`, `hidden_at`, `hidden_by` | |

RLS: anon and authenticated read rows that are not hidden; the owner reads their own; admins
read all. The owner inserts their own row (`id = auth.uid()`) **only if their
`account_settings` row confirms 18+**, and updates it. No delete policy — the row goes with
the account.

**`account_settings`** (M3) — private, one per user, never shown to anyone else.

| Column | Type / rule |
|---|---|
| `user_id` | `uuid` PK → `auth.users(id) on delete cascade` |
| `adult_confirmed_at` | `timestamptz not null` — the 18+ confirmation; no birth date is stored (data minimisation, KVKK) |
| `privacy_notice_version` | `text not null` — which privacy notice (aydınlatma metni) was shown at sign-up |
| `logs_public_default` | `boolean not null default false` |

RLS: the owner reads, inserts and updates their own row; admins read.

**Community recipes** (M6) — in the existing `cocktails` table, not a new one.
`cocktails.author_id uuid null → profiles(id) on delete cascade`; **null = a house recipe
(Hacı's)**. One recipe shape means one renderer, and reviews, favourites, logs and the
showcase all reference `cocktails(id)`. Slugs stay globally unique (the app adds a suffix,
`negroni-2`). The archive, the home page and every house-recipe fetcher filter
`author_id is null`; community recipes appear only on profiles, feeds and the showcase (the
north star in plan.md §2). RLS, one policy per action — e.g. select for `authenticated`:
`(is_published and hidden_at is null) or author_id = auth.uid() or is_admin()`; insert and
update check `author_id = auth.uid()` (a user can never write a house recipe) or
`is_admin()`. `save_cocktail` is extended at M6 to let authors save their own recipes. User
photos go to a separate bucket under `{user_id}/` with a per-file size cap (plan.md §7).

**`reviews`** (M4) — one per person per cocktail (ADR-012).

| Column | Type / rule |
|---|---|
| `id` | `uuid` PK |
| `cocktail_id` | → `cocktails(id) on delete cascade` |
| `user_id` | → `profiles(id) on delete cascade` |
| `rating` | `smallint`, 1–5 (whole stars) |
| `body` | `text null`, ≤ 2000 chars |
| `created_at`, `updated_at`, `hidden_at`, `hidden_by` | |
| | `unique (cocktail_id, user_id)` — writing again is an upsert |

RLS: everyone reads visible reviews; the author reads, writes and deletes their own; insert
only on a published cocktail. Averages and counts come from a view `cocktail_ratings`
(`security_invoker = on`, so hidden reviews are not counted) and reach the static pages at
their hourly revalidation (ADR-005).

**`favorites`** (M4) — public, as the user chose.
`(user_id → profiles, cocktail_id → cocktails)` as the PK, both cascading, `created_at`.
Everyone reads; the owner inserts and deletes.

**`drink_logs`** (M5) — unlimited per person per cocktail (ADR-012).

| Column | Type / rule |
|---|---|
| `id` | `uuid` PK |
| `user_id` | → `profiles(id) on delete cascade` |
| `cocktail_id` | `uuid null` → `cocktails(id) on delete set null` — the log outlives the recipe because it keeps its own copy |
| `drunk_on` | `date not null default current_date`, not in the future |
| `recipe` | `jsonb not null` — the recipe **as made**, in the shape `save_cocktail` takes: `{name, ingredients: [{name, amount, unit, icon}], instructions: [], garnish, glass}`; validated by a check function and size-capped |
| `rating` | `smallint null`, 1–5 — **that evening's rating**, part of the log; it never feeds the cocktail's average (the review is the public opinion) |
| `note` | `text null`, ≤ 2000 chars |
| `is_public` | `boolean not null` — the app fills it from `logs_public_default` (false unless the user changed it) |
| `created_at`, `updated_at`, `hidden_at`, `hidden_by` | |

RLS: the owner reads, writes and deletes their own; others read only rows that are
`is_public` and not hidden; admins read all. Drinking history is personal data, so private
is the default (KVKK). Indexes: `(user_id, drunk_on desc)`, `(cocktail_id)`.

**Showcase** (M7) — upvotes, self-votes allowed, any admin approves.

- `showcase_periods` — `id`, `starts_at`, `ends_at` (an admin picks a week or a month); periods
  never overlap (an exclusion constraint on the time range). Admins write; everyone reads.
- `showcase_entries` — `id`, `period_id`, `cocktail_id` (must be the applicant's own published
  community recipe), `user_id`, `pitch text null` (≤ 500), `status`
  (`pending`/`approved`/`rejected`), `reviewed_by`, `reviewed_at`, `vote_count integer not null
  default 0`, `created_at`, `hidden_at`, `hidden_by`. `unique (period_id, user_id)` — **one
  application per user per period**. Everyone reads approved entries; the applicant reads
  their own; admins read all and are the only ones who change `status` (guarded like
  `hidden_at`).
- `showcase_votes` — `(entry_id, user_id)` as the PK, `created_at`. **A user may vote for any
  number of entries, once each, including their own.** Insert and delete only while the entry
  is approved and its period is open (`now()` between `starts_at` and `ends_at`). A voter reads
  only their own votes; the total lives in `showcase_entries.vote_count`, kept by a
  security-definer trigger function in `private`, so who voted for what stays private.
- **The winner is derived, not stored:** the approved entry with the most votes in the latest
  period that has ended (ties: the earlier application) is featured on the home page until
  the next period ends. No scheduled job is needed.

**`reports`** (with the first feature users write to, M4).
`id`, `reporter_id → profiles`, `target_type` enum (`profile`, `cocktail`, `review`,
`drink_log`, `showcase_entry`), `target_id uuid`, `reason text` (≤ 500), `created_at`,
`resolved_at`, `resolved_by`; `unique (reporter_id, target_type, target_id)`. Users insert
their own; only admins read and resolve them.

### Accounts

- **Sign-in:** Supabase Auth — Google first; e-mail and password once a sender on the domain
  exists (Resend, DNS records at Namify). Public sign-up stays off until M3 ships. Ordinary
  users need no second factor (ADR-011).
- **Onboarding:** after the first sign-in, a screen asks for the username, the display name and
  the 18+ confirmation, and shows the privacy notice; it writes `account_settings`, then
  `profiles`.
- **Admins and profiles:** an admin is also a user and may create a profile like anyone; admin
  powers still come only from `admins` + `aal2`. House recipes are credited to "Hacı" because
  `author_id` is null, not through his profile.
- **Account deletion** (M3), with no secret key in the app: the browser removes the user's
  Storage objects (Supabase refuses to delete an auth user who owns objects), then calls
  `public.delete_my_account()`, a security-definer function that deletes from `auth.users`
  where `id = auth.uid()`; the cascades remove the rest. The session's JWT stays valid until
  it expires, but every row it could touch is gone. To be verified when it is built.

### Consequences

- (+) Every rule is a policy or a constraint; the Expo app gets the same rules for free.
- (+) The first tables (`profiles`, `account_settings`) do not change when later ones arrive;
  M4–M7 are additive.
- (+) Private-by-default logs and no stored birth date keep the KVKK exposure small.
- (−) Sharing `cocktails` with community recipes means every house-recipe query must filter
  `author_id is null`; one forgotten filter puts user recipes in the archive. Mitigated by
  keeping those queries in `src/lib/content.ts`'s fetchers only.
- (−) `vote_count` is a cached total kept by a trigger; a bug there would need a recount.
- (−) Daily rate limits by trigger are coarse; bursts within a day are not limited.

**Rejected.**
- *Clerk for public accounts.* Admin 2FA is built on Supabase's `aal2` (ADR-011), so either the
  admins would move too or the app would run two sign-in systems; community rows could not
  reference `auth.users`; profiles would need a webhook with a signing secret (ADR-007/008);
  and a second processor in the US would hold personal data (KVKK). Its real advantages —
  ready-made screens and its own mailer — are small next to that.
- *A separate `community_recipes` table:* two recipe shapes, two renderers, and polymorphic
  references from reviews, favourites, logs and the showcase.
- *A profile row created by a trigger on `auth.users`:* Google sign-in gives no username or 18+
  confirmation, and a failing trigger blocks sign-in itself.
- *Logs feeding the cocktail's average:* one frequent logger would outweigh everyone else; the
  one-per-person review is the opinion that counts.
- *One vote per user per period:* the user chose upvotes.
- *Counting votes through a security-definer view:* the security advisor flags those, and it
  would expose who voted for what.

---

## ADR-015 — The brand is "haci"; paths and settings are English

**Context.** On 2026-10-13 the user decided the project is becoming a product for a global
audience, not a personal gift site: "Hacı'nın Kokteylleri" is too long and too Turkish for
app stores, and the personal "about Hacı" text did not belong on a brand's home page.

**Decision (the user's).**
- **The brand name is `haci`, always lowercase**, everywhere a person reads the product's
  name: the website, the admin panel, the Google sign-in screen, authenticator entries and the
  future iOS/Android apps. It lives in one constant, `BRAND` in `src/lib/brand.ts`; page
  titles come from the root layout's template (`%s · haci`).
- **The domain stays `hacininkokteylleri.tech`** for now; moving to a "haci" domain is for
  later, if the product grows (ADR-010 still applies).
- **Every path, query parameter and setting is English; only what people read is Turkish.**
  This extends ADR-002 to URLs: `/cocktails`, `/login`, `/account`, `/welcome`, `/privacy`,
  `/u/{username}`; in the panel `/glossary`, `/setup-2fa`, `/verify`, `/cocktails/new`;
  `?error=`, `?access=denied`. The Turkish paths they replaced redirect permanently
  (`next.config.mjs`). Recipe content stays Turkish; localization (English first) is
  planned, not scheduled (plan.md §9).
- **The logo is the cherry ("Kiraz")**, chosen from three concepts (cherry, coupe glass,
  prescription "h"). Sources in `public/brand/`: `haci-mark.svg` (transparent mark),
  `haci-app-icon.svg` (full-bleed square, `#141414` ground), `haci-wordmark-{light,dark}.svg`
  (lowercase monoline "haci" whose i-dot is the cherry, drawn as paths so no font is
  needed). `node scripts/export-brand.mjs` renders the PNGs (1024 app icon, 512 Play Store
  icon, 180 Apple touch icon, transparent mark, wordmarks). The site's favicon is
  `src/app/icon.svg`. Colours: cherry `#c0392b`, shade `#8b1a1a`, stem and type `#e8e6e3`,
  ground `#141414` — today's palette; a theme review may change them.

**Consequences.**
- (+) One short, pronounceable name across web and stores; URLs that read the same in any
  language.
- (−) The domain and the brand differ until a "haci" domain is bought.
- (−) The owner's authenticator entry still says "Hacı'nın Kokteylleri" (issuer at
  enrolment); new enrolments say "haci". The panel's code screen mentions both.

**Rejected.** *Keeping "Hacı'nın Kokteylleri":* long, untranslatable, and the dotless ı breaks
in many fonts and store search. *The coupe glass logo:* generic among cocktail apps. *The
prescription "h":* closest to today's Rx styling, but alcohol + "prescription" risks reading
as a medical claim in app-store review.

---

## ADR-016 — Member state on static pages: read in the browser, written through server actions that revalidate

**Context.** M4 put per-member state (my review, my favourites) on the archive, which must stay
static (ADR-005), and public numbers (averages) that change with every review.

**Decision.**
- **Reading.** Static pages never read the session on the server. `useMember()`
  (`src/components/useMember.ts`) reads the session, the profile and the favourites in the
  browser; the reviews under a recipe load in the browser when the card opens. The page HTML is
  the same for everyone.
- **Writing.** Every member write is a server action (`src/app/(site)/cocktails/actions.ts`)
  running as the member (RLS decides), which then calls `revalidatePath` for `/cocktails` and the
  member's `/u/{username}`. The open page refreshes itself from the action's response, so a new
  average shows at once; panel moderation revalidates the same pages. Writes are not done from the
  browser client plus a separate "revalidate" endpoint — that endpoint would let anyone flush the
  cache.
- **Aggregates** come from the `cocktail_ratings` view at render time and ride the page's ISR.
- **Deep links** to a recipe are `/cocktails?cocktail={slug}`, read in the browser on arrival and
  kept in the address bar while the card is open; `/login?next=` returns there.
- **No `window.prompt` / `confirm` / `alert` for flows** — inline forms and two-step buttons. Native
  dialogs block the browser automation we verify with, and read poorly on phones.

**Consequences.**
- (+) The archive stays one static file per hour; a member's view costs two small REST calls.
- (+) The Expo app (M8) uses the same tables and policies directly; the actions only add revalidation.
- (−) A brief flash: the heart and "your review" appear after the session loads.
- (−) Locally, `next build` reuses Next's fetch cache, so a rebuild can show old averages — delete
  `.next/cache/fetch-cache` (production revalidation is unaffected).

**Rejected.** *Making `/cocktails` dynamic:* every visit would hit the database (ADR-005).
*Optimistic averages computed in the browser:* duplicates the view's rules (hidden reviews, hidden
profiles).

---

## ADR-017 — Drink logs: written on dynamic account pages, the recipe snapshot checked by the database

**Context.** M5 builds `drink_logs` as ADR-014 shaped it. The open questions were where the
"log this" form lives, how far a member may change the recipe, how the `recipe jsonb` is
checked, and what admins see of logs that are private by default.

**Decision.**
- **The form is a page, not part of the recipe card.** "Günlüğe ekle" in the card links to
  `/account/logs/new?cocktail={slug}` (a picker without a slug); editing is `/account/logs/{id}`
  and the list `/account/logs`. These are dynamic pages under `/account`, where the proxy already
  refreshes the session, so the archive stays static (ADR-005) and the modal stays a recipe. The
  same pages serve a phone's browser and give the Expo app (M8) a model to copy.
- **The whole recipe as made is editable:** ingredients (name, amount, unit; new rows get the
  `shot` icon, existing ones keep theirs), steps (one per line), garnish and glass. The name stays
  the cocktail's. The log keeps `cocktail_id` for the link back; the snapshot is what it shows.
- **The database checks the snapshot.** `private.is_valid_log_recipe(jsonb)` allows only the keys
  of `save_cocktail`'s shape, 1–30 ingredients with an icon from the enum, ≤ 30 steps, length caps
  and ≤ 16 KB, and answers false (never null) for anything else; the check constraint calls it, so
  `authenticated` may execute it. `cleanRecipe()` in `src/lib/drink-log.ts` mirrors it for
  friendly errors. Logs can only be added for published cocktails; `drunk_on` may be at most one
  day ahead of the server's date, because "today" in Turkey is tomorrow in UTC after 21:00.
- **Privacy.** `is_public` is filled from `account_settings.logs_public_default` (private unless the
  member changes it) and can be changed per log. Admins could read every log (RLS, `aal2`), but
  the panel lists only public logs and reported ones; a private log is shown to an admin only
  after someone reported it while it was public.
- `/privacy` names the drink log explicitly; the notice version became `2026-10-14`.

**Consequences.**
- (+) No change to the archive's static rendering; a log costs nothing for visitors who never log.
- (+) The snapshot cannot grow into a free-form blob, whatever client writes it.
- (−) Logging leaves the archive for a page; the way back is the browser's back button or the link
  in the log list.
- (−) Recipe changes are not marked against the house recipe ("gin instead of vodka" is shown as
  the new list, not as a diff) — a candidate for later.

**Rejected.** *An inline form inside the recipe modal:* a long, nested form in a scrolling modal
on a phone, and a second editing surface to keep in step with the edit page. *Storing only the
changes against the house recipe:* the log must outlive edits and deletion of the recipe
(ADR-014).


---

## ADR-018 — Community recipes, the feed, follows and log comments

**Context.** M6 builds members' recipes as ADR-014 shaped them. On 2026-10-14 the user answered
the open questions: the feed shows **all members' popular recipes, "just like Letterboxd's main
page"**, and **the latest logs of the people you follow**; when someone you follow writes a note
on a log, **you can reply to them on that log, like Letterboxd review comments**; members'
recipes are **reviewable** like house ones; the recipe URL may be `/r/{slug}` or a better one.
Follows and comments were not in ADR-014, so they are decided here.

**Decision.**
- **URL `/recipes/{slug}`** (the user left the choice open): readable, English (ADR-015),
  carries the keyword, and since slugs are unique across house and members' recipes the same
  path can serve house recipes later. One page per recipe, static with a 5-minute revalidation
  and revalidated at once on edits, reviews, favourites and moderation (ADR-005, ADR-016); it is
  in the sitemap. House recipes keep the archive's card (`recipeHref()` in `content.ts` picks).
- **Recipes live in `cocktails` with `author_id`** (ADR-014). Members write through a new
  `public.save_recipe(recipe, ingredients)` (security invoker, always `author_id = auth.uid()`,
  1–30 ingredients, the slug fixed at creation so shared links keep working); `save_cocktail`
  stays the panel's. Policies: members insert/update/delete only rows whose `author_id` is
  theirs — a house recipe (`author_id` null) can never be written by a member; drafts
  (`is_published = false`) are seen only by their author. `hidden_at`/`hidden_by` and the
  moderation guard as everywhere; 10 recipes a day; a check constraint caps lengths for members'
  rows only (house recipes keep the panel's freedom). Photos go to the public `recipe-images`
  bucket under `{user_id}/` (1 MB, WebP/JPEG, resized to 1600 px in the browser; `ImageField`
  is shared with the panel). Members' recipes appear on `/recipes/{slug}`, profiles, the feed
  and the sitemap — never in the archive, on the home page or in the panel's list (ADR-014).
- **The feed is `/feed` ("Akış"),** not the home page, which stays Hacı's (ADR-014, plan.md §2).
  "Bu ay popüler": published members' recipes ranked by the view `recipe_popularity` — visible
  reviews plus favourites of the last 30 days (security invoker); recipes with no activity are
  left to "Yeni tarifler", the newest. "Takip ettiklerinden": the latest public logs of the
  people you follow, read in the browser (ADR-016) with comment counts.
- **Follows are public** (`follows (follower_id, followee_id)`), as on Letterboxd: anyone reads
  them; profiles show follower and following counts and a "Takip et" button. No self-follows,
  hidden profiles cannot be followed, 200 a day. No follower lists yet (Icebox).
- **Comments on public drink logs** (`log_comments`): one flat thread per log, on its page
  `/logs/{id}` (noindex — drinking history is shared by link, not searched). **Any member may
  comment on any public, visible log** (Letterboxd's default); the log's author replies in the
  same thread, marked "kayıt sahibi". The commenter, the log's author and admins delete; admins
  hide; comments can be reported (`report_target` gained `log_comment`); 100 a day. A comment is
  readable only while its log is — making a log private hides its thread.
- **Moderation** ships with the features: the panel's Moderasyon lists the latest members'
  recipes and comments and reported ones, with hide/show.
- `/privacy` names members' recipes and photos, follows and comments; version `2026-10-14.2`.

**Consequences.**
- (+) One recipe shape and one renderer (`RecipeDetails`) for house and members' recipes; reviews,
  favourites and logs work on members' recipes with no new tables.
- (+) Every new rule is a policy; 33 SQL checks (rolled back) cover them.
- (−) "Popular" counts favourites and reviews equally and ignores logs (most logs are private);
  tune when there is real traffic.
- (−) A photo uploaded and then abandoned in the form stays in the member's folder until they
  delete their account (as in the panel, plan.md §8).
- (−) No notifications: a member sees replies only by opening the log.

**Rejected.** *Showing the feed on the home page:* the home page is Hacı's (ADR-014). *`/r/{slug}`:*
shorter, but opaque in a shared link and in search results. *Comments only from followers:*
Letterboxd lets anyone comment; following stays a reading choice, and the log's author can delete
any comment on their log. *Threaded replies:* a flat thread is what Letterboxd uses and what a
phone screen shows well.

---

## ADR-019 — The showcase: periods chosen per time, applying and voting on the feed, the winner on the home page

**Context.** M7 builds the showcase as ADR-014 shaped it (`showcase_periods`, `showcase_entries`,
`showcase_votes`; upvotes, one per member per entry, self-votes allowed; any admin approves; the
winner derived, not stored). On 2026-10-14 the user answered the open questions: **the admin picks a
week or a month each time**; applying and voting live **inside `/feed`**, not on a page of their own;
the home page shows the winner as **a featured card below the hero**; an application needs **the
recipe, a pitch and a photo** — all three required.

**Decision.**
- **Periods.** An admin opens one in the panel's new **Vitrin** page (`/showcase` on the admin host):
  a start day and "1 hafta" / "1 ay". A period runs from midnight in Turkey (`+03:00`, no DST) on that
  day; the end is exclusive (a week = 7 days, a month = the same day next month, clamped to the
  month's last day — `periodBounds()` in `src/lib/showcase.ts`). Periods never overlap (an exclusion
  constraint on `tstzrange(starts_at, ends_at, '[)')`). The form suggests the day the latest period
  ends. Deleting a period removes its applications and votes.
- **Applications** are open until a period ends — also before it starts, so the next period can fill
  up. The database checks everything: the applicant's own, published, visible recipe **with a photo**
  (`image_path is not null`), a pitch of 1–500 characters (`btrim`), one application per member per
  period, status `pending` (members have no grant on `status`). Pending and rejected applications are
  seen only by their applicant and admins. A member withdraws (deletes) their own; there is no
  editing — withdraw and apply again.
- **Approval.** Any admin approves or rejects (`status`, update policy admins-only, `aal2`);
  `private.stamp_showcase_review()` writes `reviewed_by`/`reviewed_at`. Hiding (`hidden_at`, the shared
  moderation guard) is for reported applications, from Moderasyon; `showcase_entry` was already a
  report target.
- **Votes** are allowed only on approved, visible entries of the **open** period whose recipe is still
  published and visible; taking a vote back follows the same window. A voter reads only their own
  votes; `vote_count` is kept by `private.count_showcase_vote()` (security definer), so totals are
  public and who voted for what is not.
- **On the feed** a "Vitrin" section (`#showcase`, above "Bu ay popüler") shows the open period — or,
  if none is open, the next one — with its approved entries ranked by votes (each card with its pitch,
  an upvote button and "Bildir"), the member's own application and its status, the application form
  (recipe picker limited to eligible recipes, pitch), and the last winner. The counts are part of the
  static page (5-minute ISR, revalidated by every vote); the visitor's own votes and application are
  read in the browser (ADR-016). The section is hidden until the first period exists.
- **The winner** is derived at render time (`getShowcaseWinner()` in `content.ts`): the latest period
  that has ended, its approved visible entry with the most votes, the earlier application on a tie.
  Hidden entries, and entries whose recipe or author is no longer visible, drop out (RLS and the
  inner join), so the next visible entry of that period takes their place. The home page became **static with an hourly revalidation** so the winner changes within the
  hour after a period ends; panel actions, recipe edits/deletes and hiding revalidate `/` at once.
- `/privacy` names the showcase (pitches public once approved, votes private); version `2026-10-14.3`,
  approved by the user.

**Consequences.**
- (+) Every rule is a policy, a constraint or a trigger; 38 SQL checks (rolled back) cover them.
- (+) No scheduled job: periods open and close by their timestamps; the winner is a query.
- (−) The winner reaches the home page up to an hour after a period ends (ISR); the feed within five
  minutes.
- (−) If the author removes the winning recipe's photo later, the card falls back to the colour; the
  photo rule binds only at application time.
- (−) A hidden or withdrawn winner leaves the home page to the next-ranked visible entry of the same
  period, or to nothing.

**Rejected.** *A `/showcase` page in the navbar:* the user chose the feed. *A stored winner column or
a cron job:* ADR-014 derives it. *Pitch editing:* withdraw-and-reapply is simpler and loses the votes,
which is honest for a changed pitch. *Applications only while a period is open:* the next period would
start empty.

---

## ADR-020 — The Expo app: `mobile/` in this repository, full parity with the site, both stores, native sign-in

**Context.** M8 builds the app ADR-013 chose (Expo, after accounts). On 2026-10-14 the user
answered the open questions: the code lives **in this repository**; the first store version does
**everything the public site does** (the archive, accounts, reviews and favourites, the drink log,
members' recipes, the feed, follows, comments, the showcase); **iOS and Android from day one**, on
the user's own Apple Developer ($99/yr) and Google Play ($25 once) accounts; members sign in with
**native Google sign-in and e-mail + password**.

**Decision.**
- **Where.** `mobile/` is a standalone Expo project (its own `package.json` and lockfile; no npm
  workspaces), so the site's install and Vercel's build are untouched (`.vercelignore`, the root
  `tsconfig.json` excludes it). The app imports the browser-safe modules of `src/lib/` —
  `database.types.ts`, `recipe.ts`, `drink-log.ts`, `showcase.ts`, `community.ts`, `slug.ts`,
  `brand.ts` — through the alias `@shared/*` (Metro watches `../src/lib`). Those modules must stay
  free of Next.js imports. One set of handoff docs (ADR-001) covers both.
- **Stack.** The latest Expo SDK at the start (57), Expo Router (file-based, typed routes),
  TypeScript, `supabase-js` with the session kept in the device's storage, plain `StyleSheet` with
  the site's palette in one theme file. Builds and store submissions through **EAS** on the user's
  Expo account. Identifiers: bundle ID / package name **`tech.hacininkokteylleri.haci`** (reverse of
  the domain we own; permanent, never shown to people), display name **`haci`** (ADR-015), URL
  scheme `haci`. Icons from `public/brand/` (the adaptive foreground scaled into the 66% safe zone).
- **The database stays the gatekeeper.** The app talks to Supabase directly with the publishable
  key and the member's session — the same tables, policies, triggers and limits as the site (ADR-007,
  ADR-014). No new secret, no server of its own. The admin panel stays web-only (2FA, ADR-011).
- **Keeping the site's static pages fresh.** The site's server actions revalidate pages after a
  write (ADR-016); the app writes straight to the database, so it then calls
  **`POST /api/revalidate`** on the site with the member's access token and the paths its write
  touched. The route checks the token with Supabase Auth (members only) and revalidates only
  site paths of known shapes (`/`, `/cocktails`, `/feed`, `/recipes/{slug}`, `/u/{username}`,
  `/logs/{id}`), a few per call. That is what any member can already trigger by writing on the
  site, so it gives nothing away; a failed call only delays the page until its ISR window.
- **Sign-in.** E-mail + password as on the web (confirmation and reset links open the website).
  Google: native sign-in (`@react-native-google-signin/google-signin`) → an ID token →
  `supabase.auth.signInWithIdToken`; this needs Android and iOS OAuth clients in Google Cloud
  `haci-511515` and their client IDs added to Supabase's Google provider. **On iOS, Apple's App
  Store rule 4.8 requires Sign in with Apple next to Google**, so the iOS app also offers it
  (`expo-apple-authentication` → `signInWithIdToken`, Supabase's Apple provider with the bundle ID);
  `/privacy` then names Apple, with the user's approval. Onboarding (username, 18+, the privacy
  notice) and account deletion work as on the web — the stores require in-app deletion.
- **Order of work.** Shell and archive → accounts → reviews, favourites, reports, profiles → drink
  log → members' recipes, feed, follows, comments → showcase → store builds and listings
  (plan.md M8).

**Consequences.**
- (+) One schema, one set of rules and shared validation for the site and the app.
- (+) The site deploys exactly as before; the app has its own release cycle through EAS.
- (−) Full parity before the first store release is a long milestone.
- (−) Google Play requires a new personal developer account to run a closed test with at least 12
  testers for 14 days before production access; Apple's enrolment can take days. Both are the
  user's to start early.
- (−) Native Google sign-in needs a development build — Expo Go cannot test it.
- (−) Sign in with Apple adds a processor and a provider to configure.

**Rejected.** *A second repository:* the shared types and validation would be copied and drift,
and the handoff would split. *npm workspaces:* hoisting React Native's dependencies next to
Next.js's risks the site's build for little gain at two packages. *Google sign-in through a web
browser (Supabase's OAuth page):* no native client to set up, but a clumsier flow and the
`supabase.co` host on Google's chooser. *An app-only API server:* the policies already are the API.

---

## ADR-021 — E-mail links carry a `token_hash` verified by the site; a password change on a 2FA account asks for the code

**Context.** On 2026-10-15 the user asked for a password reset from the app, opened the e-mail on
their phone and got "link invalid"; a second try from the site reached the form but every new
password was refused with "at least 8 characters". The auth logs showed two separate faults:
- The e-mail templates linked to `{{ .ConfirmationURL }}`. Supabase then finishes the link with
  the flow of the client that asked for it. The app's client uses the **implicit** flow, so the
  tokens arrived in a `#hash` that `/auth/callback` (a server route) never sees → "link invalid".
  The site uses **PKCE**, whose verifier lives in the browser that asked, so a reset requested on
  a laptop and opened on a phone fails too.
- The account was the owner admin, which has TOTP (ADR-011). Supabase refuses a password change
  from an `aal1` session on such an account (`insufficient_aal`), and `NewPasswordForm` showed every
  error as "at least 8 characters" (so did `authErrorMessage()`, for any message containing
  "password").

**Decision.**
- **The templates link to the site's callback with a `token_hash`** (Supabase's recommended form
  for server-side apps): reset → `{{ .SiteURL }}/auth/callback?via=email&type=recovery&token_hash=…`,
  sign-up → `{{ .RedirectTo }}&type=email&token_hash=…` (keeps the site's `next`), e-mail change →
  `{{ .SiteURL }}/auth/callback?via=email&type=email_change&next=/account&token_hash=…`. The
  callback calls `verifyOtp({ token_hash, type })` and sets the session cookie; Google's `code`
  path is unchanged. A link now works in any browser, whoever asked for it (site or app). The
  sources in `supabase/templates/` are the truth; the dashboard copies were updated on 2026-10-15.
- **The reset form asks for the 6-digit code** when the session is `aal1` and the account has a
  verified TOTP factor (`challengeAndVerify`, then `updateUser`), and maps Supabase's errors one by
  one.

**Consequences.**
- (+) Reset and confirmation links from the app work; links are no longer tied to one browser.
- (+) Admins can reset their own password without a support step.
- (−) Template changes are pasted into the dashboard by hand (as before); a template that still
  uses `ConfirmationURL` would bring the old fault back for app-requested links.
- (−) As before, a mail scanner that opens links can use up a one-time link; asking again sends a
  new one.

**Rejected.** *PKCE in the app:* its verifier stays on the phone, so the site still could not
finish the link. *A client-side page reading the `#hash`:* fixes only the app's links, keeps tokens
in URLs and leaves the cross-browser PKCE failure.

---

## ADR-022 — After signing in, the app returns to the screen that asked and finishes the action; fields stay above the keyboard

**Context.** On the phone (2026-10-15) a sign-in left the member on the Hesap tab, on their account
form. The user wanted the archive instead, and — when the sign-in started from a recipe's heart — that
recipe, with the cocktail saved and a message saying so. The same pass showed the review form hidden
behind the keyboard: React Native 0.86 draws Android apps edge to edge, so the window no longer
shrinks for the keyboard, and `KeyboardAvoidingView` would need every screen's header height.

**Decision.**
- **`mobile/src/lib/after-sign-in.ts`.** A screen that needs a member calls `askToSignIn(from,
  cocktailId?)`: it remembers the way back (and a heart), closes the stack screens and opens the Hesap
  tab. When the session goes from signed out to a member, the Hesap tab calls `leaveAfterSignIn()`:
  the archive tab, then the remembered recipe pushed on top. A new member gets there after onboarding.
  `FavoritesProvider` saves the remembered heart before it reads the list and the recipe shows
  "Favorilerine eklendi." for four seconds. Leaving the Hesap tab still signed out forgets both. A
  session restored at launch moves nobody; a sign-in from the Hesap tab itself lands on the archive.
- **`KeyboardScrollView`** replaces `KeyboardAvoidingView` on the recipe, Hesap and onboarding screens:
  it adds the keyboard's height at the bottom and scrolls the focused field (and ~72 px under it, room
  for its buttons) above the keyboard; screens underneath (`useIsFocused`) ignore it. Taps reach buttons
  while the keyboard is open (`keyboardShouldPersistTaps="handled"`).

**Consequences.**
- (+) A sign-in prompt costs the member nothing: they are back where they were, the heart done.
- (+) One component for every form screen; it works the same on iOS.
- (−) The way back lives in module memory: an app restart in the middle of a sign-in forgets it (the
  member lands on the archive).
- (−) Review prompts return to the recipe but do not reopen the form; the member taps again.

**Rejected.** *`router.navigate("/account")` from the recipe:* it pushed a second tab navigator, so two
Hesap tabs reacted to the sign-in and the second sent the member to the archive. *A keyboard library
(react-native-keyboard-controller):* a native module and a new development build for what one
component does.
