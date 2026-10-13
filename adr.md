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
