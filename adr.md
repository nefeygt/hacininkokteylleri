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
