# Next Session — Handoff Note

> This file is the starting point for the next session (a new chat, another Claude
> account, another computer, or a different agent). **Copy the prompt below and paste
> it — you shouldn't need to explain anything else.**

**Prepared by session:** 2026-10-14 (M5 build) · **Handing off:** **M5 — drink log is built,
tested end to end on `localhost` and deployed**; only the live check on the domain is left (Step 1).
**Next: M6 — community recipes and feeds** (Step 2).

---

## 📋 Prompt to Copy

```
Hi. We're working on haci (formerly Hacı'nın Kokteylleri) — a Next.js + Supabase cocktail
site (hacininkokteylleri.tech) with an admin panel, growing into a community and mobile apps.

BEFORE YOU START, read these in order:
1. plan.md         — the single source of truth (status board, product, architecture, milestones)
2. next_session.md — this file (what to do, open questions, things that bite)
3. adr.md          — decisions already made and why (don't relitigate them, apply them)

Then do the work described under "This Session's Task".

WORKING RULES:
- Write EVERYTHING in the repository in English — docs, code, comments, commit messages,
  SQL — and every URL path, query parameter and setting too. Everything visitors and admins
  read (UI strings, recipes) is Turkish. I may chat with you in Turkish; that never changes
  the language of what you produce. See ADR-002 and ADR-015.
- The brand is "haci", always lowercase (src/lib/brand.ts, ADR-015).
- Don't reopen decisions that are already closed. If one needs to change, ask me first.
- Don't add features outside the active milestone. Ideas go to plan.md §9 "Icebox".
- The database is the gatekeeper: every table has RLS, every permission is a policy, and
  there is no secret key in the app (ADR-007). Admin powers need a 2FA session (ADR-011).
- Schema changes: apply with the Supabase MCP, mirror the SQL as
  supabase/migrations/{version}_{name}.sql, regenerate database.types.ts, run the advisors
  (ADR-009).
- Verify your own work before claiming it is done: `npm run build` must pass, and UI
  changes are checked in a real browser (Claude in Chrome — my Chrome, signed in to
  Vercel, Supabase, Namify, Google Cloud and Search Console). plan.md §5.4 has the commands.
- Use your own judgement on small calls; only use AskUserQuestion for things that
  genuinely change direction.

AT THE END OF THE SESSION (before context fills, even if work is unfinished):
- Update plan.md: status board, milestone checkboxes, session log
- Rewrite next_session.md: new state, new task, new open questions
- Add an ADR to adr.md if you made a decision that outlives the session
- Commit and push (main deploys to production — build first)
```

---

## 🎯 This Session's Task — M5 live check, then M6

### Step 0 — state check

`curl -s -H "apikey: $KEY" https://qwvnhdghwycqlvsnlvlt.supabase.co/auth/v1/settings` (publishable
key from `.env` via `grep`) → `"disable_signup": false`. `select username from public.profiles;` and
`select count(*) from public.drink_logs;` — on 2026-10-14 the only profile was the user's own
`ahmet_kafa` and there were no logs, reviews or reports. Accounts are not necessarily real people
yet (the user, 2026-10-14), but never delete or edit a row you did not create without asking.

### Step 1 — M5 live check (the user, on an unblocked network)

On `hacininkokteylleri.tech` (the user's phone or mobile data): open a recipe → "Günlüğe ekle" →
change an ingredient → save → it is private on `/account/logs` → edit it to public → it shows on
`/u/{username}` → delete it. Tick the last box of M5 in plan.md and mark M5 done.

### Step 2 — M6: community recipes and feeds

ADR-014 fixes the shape: user recipes live in `cocktails` with `author_id → profiles` (null = a
house recipe); every house-recipe fetcher in `src/lib/content.ts` must filter `author_id is null`
(the archive and home stay Hacı's); RLS per action (authors write only their own; never a house
recipe); `save_cocktail` extended for authors; a separate photo bucket under `{user_id}/` with a
size cap; 10 recipes a day; moderation columns and reports (`cocktail` target). Pages: write/edit a
recipe (reuse the panel's `CocktailForm` ideas, not its admin actions), recipes on `/u/{username}`,
a feed. **Ask the user first** about: what "feed" means (all members' latest recipes? people you
follow — follows are not in ADR-014), whether user recipes can be reviewed/favourited/logged like
house ones (the tables allow it), and a recipe page URL (`/r/{slug}`?). Update `/privacy` if
uploads change (ask before it changes). Follow ADR-009, ADR-014, ADR-016, ADR-017.

### Also open (not blocking)

- The wordmark in the navbar; Hacı's own first admin sign-in (question 5).
- A log could show what changed against the house recipe (ADR-017 consequence) → Icebox if wanted.

---

## 🙋 Questions for the User

| # | Question | Why it matters | Until it is answered |
|---|---|---|---|
| 3 | **Colour theme:** keep the dark crimson "Rx" look, or explore a lighter/warmer palette? | The user said the theme can change (ADR-015) | Today's palette stays |
| 5 | **Hacı's first admin sign-in** — when (his phone, a network that does not block the domain)? | His 2FA factor is not enrolled yet | He cannot use the panel |

---

## 📍 Current State

- **Production:** `hacininkokteylleri.tech` (apex), `www` → apex, `admin.hacininkokteylleri.tech`;
  `hacininkokteylleri.vercel.app` → 308 to the domain. `main` deploys on push.
- **Accounts (M3, done and open 2026-10-14):** Google app **in production** (Google Cloud `haci-511515`, branding: home
  page, `/privacy`, authorized domains, no logo). Supabase: Google provider on, TOTP on,
  sign-ups **on** since the opening (2026-10-14, the user flips it). Pages: `/login`, `/auth/callback`, `/welcome`, `/account`
  (profile, **avatar** — new this session, sign out, delete), `/u/{username}` (shows the avatar),
  `/privacy` (in effect; contact `contact@`; processors Supabase, Vercel, Google, Resend, ImprovMX). All tested end to end on `localhost:3000` on 2026-10-13
  with the user's `wowcubey@gmail.com` Google account; the test account was deleted (all rows
  and the avatar object gone).
- **Avatars:** `src/app/(site)/account/AvatarField.tsx` (centre square → 256 px WebP →
  `{user_id}/{base36}.webp` → `setAvatar` → old object deleted), `src/components/Avatar.tsx`
  (picture or initial), `avatarUrl()` / `AVATARS_BUCKET` in `src/lib/supabase/config.ts`.
- **Supabase** (ref `qwvnhdghwycqlvsnlvlt`): 9 migrations, the latest `20261014073958_drink_logs`.
  Advisors: only leaked-password protection (Pro plan) plus "unused index" infos on still-empty tables.
- **M4 (2026-10-14):** `reviews`, `favorites`, `reports`, view `cocktail_ratings`; the site's
  `cocktails/actions.ts`, `useMember`, `CocktailReviews`, `ReportButton`; the panel's
  `/moderation`. All tables empty after the test (the test rows were deleted).
- **M5 (2026-10-14):** `drink_logs` (migration `20261014073958_drink_logs`, 9 migrations now);
  `src/lib/drink-log.ts`, `src/app/(site)/account/logs/` (list, `new`, `[id]`, `LogForm`,
  `actions.ts`), `LogsDefaultToggle` on `/account`, `DrinkLogEntry`, `ReportIfSignedIn`; the panel's
  moderation lists reported and recent public logs. `/privacy` version `2026-10-14` (drink log line,
  approved by the user). Tables empty after the test; `ahmet_kafa`'s `logs_public_default` is false.
- **Admins:** owner "Efe" (`n.efeyigit@outlook.com`, 2FA), editor "Hacı"
  (`furkancam99@hotmail.com`, no sign-in yet, no 2FA yet). The two e-mail users in `auth.users`
  are these admins (no profiles).
- **Members:** open since 2026-10-14. Only profile: the user's own Google account `ahmet_kafa`
  (it signed in at 06:46 UTC and finished onboarding during the M4 test).
- **Search Console** (`wowcubey@gmail.com`): Domain property verified, sitemap submitted, Change
  of Address vercel.app → domain in progress since 2026-10-13.

---

## ⚠️ Things That Will Bite You

**Next.js 16 and the two hosts**
- Middleware is **`src/proxy.ts`** exporting `proxy()`. It also redirects the vercel.app host and
  refreshes the session **only** on account paths (`/login`, `/auth`, `/welcome`, `/account`);
  other public pages must stay static (ADR-005).
- The panel's pages live under `src/app/admin` but are **only** reachable through an `admin.*`
  host; locally **`http://admin.localhost:3000`**. Links inside the panel are written **without**
  `/admin`.
- **Never call `redirect()` inside a server action** (ADR-007) — return `{ ok }` and navigate in
  the browser. `redirect()` while rendering a page, and in route handlers, is fine.
- `src/lib/account.ts` is server-only (imports `next/headers`); client components import from
  `src/lib/account-config.ts`.
- **After renaming route folders, delete `.next`** — stale generated types break the build
  ("Cannot find module …/kokteyller/page.js").
- `next.config.mjs` redirects run before the proxy, so one list covers both hosts.

**Supabase**
- New tables are fully granted to `anon` by default: `revoke all`, grant only what is needed
  (column grants where users must not touch a column), enable RLS, one permissive policy per
  role and action (ADR-014).
- Write policies call `(select private.is_admin())`, which needs `aal2`. To test policies in
  SQL, set the claim and role inside a `do` block and end it with `raise exception` to roll
  back (this session's 16 checks did exactly that).
- `execute_sql` returns only the last statement's rows; `apply_migration` assigns the version —
  read it with `list_migrations` before naming the mirror file.
- A user who owns Storage objects cannot be deleted — the account page removes their
  `avatars/{id}/…` files first.
- Free plan: no backups, pauses after 7 idle days (keep-alive cron), built-in mailer only for
  org members.

**Google**
- The OAuth client secret is shown **once**; it is already in Supabase. If it is ever needed
  again, create a new secret in Google Cloud → Clients.
- Two Google accounts are in play: **Search Console = `wowcubey@gmail.com`**, **Google Cloud =
  `n.efeyigit@gmail.com`** (`authuser=1`).
- Keep `public/googlece68c38f8ad9ec89.html` and the `verification.google` meta tag in
  `src/app/layout.tsx` for at least 180 days — they keep the old vercel.app property verified
  during the move.

**Auto mode, permissions and tools**
- Never type passwords or secrets, never create accounts; the user does. **Chrome autofills
  the user's saved e-mail and password into Supabase's provider forms** — clear those fields
  before saving.
- `cat .env` is blocked by the auto-mode classifier; read one public variable with `grep`.
- In the Bash tool, a heredoc containing apostrophes (Turkish text like "Hacı'nın") can fail
  with "unexpected EOF" — write the script to the scratchpad with the Write tool and run it.

**Browsers and consoles**
- Use **Claude in Chrome**. Keystrokes go only to the front tab. The extension sometimes
  disconnects — call `tabs_context_mcp` with `createIfEmpty: true` for a fresh group.
- Google Cloud pages load slowly and their accessibility tree is often empty — use screenshots
  and coordinates; wait a few seconds after navigation.
- Namify's record-type dropdown: click it, type `TXT`, press **Enter** (clicking the option does
  not select it). Host name empty = apex.
- **The office network blocks the new domain** (a Fortinet FortiGate). Check DNS with
  `https://dns.google/resolve?name=…` and HTTP with check-host.net (plan.md §5.4).

**This session's lessons (M5)**
- **A check constraint lets NULL through.** A validation function used in one must return
  `false`, never null (`coalesce(…, false)`), and the writing role needs EXECUTE on it.
- **Tailwind: a shared `w-full` class beats `w-16`** on the same element (both are in the CSS; the
  later rule wins). Keep widths out of shared field classes.
- **Screenshots in Chrome can be stale** right after a server restart — check the DOM
  (`getBoundingClientRect`) before "fixing" what a screenshot shows. A `find` ref click on a Next
  `<Link>` sometimes does nothing; coordinates or `javascript_tool` `click()` work.
- The admin session on `admin.localhost:3000` (aal2) was still valid in the user's Chrome, so the
  panel could be tested without signing in.
- A `next start` in a background Bash task reports "exit code 127" when its node process is
  stopped by PID — expected, not an error.

**Lessons from M4**
- **Clicks in a background Chrome tab do nothing.** When the tab is hidden (`document.hidden`),
  `computer` clicks and screenshots time out or are lost. Use `javascript_tool` to click
  (`button.click()`), `find`/`get_page_text` to read, and SQL to confirm.
- **Native dialogs freeze automation** — never use `window.prompt/confirm/alert` in flows (ADR-016).
- **Next's fetch cache survives `next build`** locally: a rebuild can show old averages. Delete
  `.next/cache/fetch-cache` before rebuilding when seeded data must show.
- Supabase upsert needs UPDATE on every inserted column; with column grants, edit-then-insert
  instead (see `saveReview`).
- A trigger `before update of col…` keeps `updated_at` from moving on moderation-only updates.
- To test as a member without a password, seed a member in SQL: insert `auth.users (id, email,
  aud, role)`, then `account_settings` and `profiles`; delete the `auth.users` row afterwards (cascade).

**Earlier lessons**
- **Google accounts in the user's Chrome can sign out.** At the start only `wowcubey@gmail.com`
  was signed in, and Google Cloud forced `authuser=0` ("You need additional access rights"). The
  user re-added `n.efeyigit@gmail.com`; it is `authuser=1` again. Check the avatar menu first.
- Google Cloud's "/" shortcut focuses its search box, and a promo banner shifts the page a few
  seconds after load — take a fresh screenshot right before clicking by coordinates.
- **The auto-mode classifier blocks** clicking "Publish app" without the user's explicit OK, and
  flipping Supabase's sign-up switch even with it — ask the user to do the Supabase switch.
- Screenshots of the `localhost` tab timed out (renderer "frozen" while in the background);
  `find`, `file_upload`, `form_input` and SQL checks still worked. `file_upload` fills a hidden
  `<input type=file>` without opening the native picker; files under the repo are allowed.
- A fresh machine has no `node_modules`: run `npm ci` before `npx tsc` (otherwise npx fetches
  an unrelated `tsc` package).

**Windows**
- A background `next start` keeps its `node` child after the task stops. Free the port by PID:
  `Get-NetTCPConnection -LocalPort 3000 -State Listen` → check the command line → `Stop-Process`.
- Git has no identity configured on this machine; commit with
  `git -c user.name=nefeygt -c user.email=n.efeyigit@outlook.com commit …`.

**Photos**
- Never overwrite an object in a bucket: new name, update the row, delete the old object (ADR-006).

---

## ✅ Closed Questions (don't ask again)

| Question | Answer |
|---|---|
| Where is the backend? | **Supabase, Frankfurt** (ADR-003) |
| Clerk for public accounts (GitHub Student Pack)? | **No — Supabase Auth** (ADR-014, the user agreed) |
| Sign-in methods for the public? | **Google first, then e-mail + password** (Resend) |
| What is public on a profile? | Username, display name, avatar, bio, reviews, favourites. **Drink logs private by default** (ADR-014) |
| Showcase voting? | **Upvotes: one per user per entry, self-votes allowed; any admin approves** (ADR-014) |
| Hacı's e-mail? | **`furkancam99@hotmail.com`** — set 2026-10-13 |
| Brand name? | **`haci`, lowercase, everywhere** (ADR-015) |
| Domain? | **Stays `hacininkokteylleri.tech`** for now (ADR-010, ADR-015) |
| Language of URLs and settings? | **English**; UI Turkish; localization later (ADR-015) |
| Logo? | **The cherry ("Kiraz")** — `public/brand/` (ADR-015) |
| Logo on Google's consent screen? | **Not now** — publish without it; add with verification later |
| Privacy contact address? | **`contact@` (shown) and `iletisim@`, forwarded to `n.efeyigit@outlook.com` through ImprovMX** — live 2026-10-13 |
| Open with Google only, or wait for e-mail sign-in? | **Wait — open after Resend e-mail sign-in works** (2026-10-13) |
| Is `/privacy` final? Open M3? | **Yes and yes** — opened 2026-10-14 |
| Are the accounts real people? | **Not necessarily yet** (the user, 2026-10-14): nothing promotes sign-up; still never touch rows you did not create without asking |
| Resend account and sender? | **The user's account; `haci <noreply@hacininkokteylleri.tech>`** |
| Admins, 2FA, canonical domain, WHOIS, reviews/logs, mobile stack | See ADR-007, 011, 010, plan.md M2, ADR-012, ADR-013 |

---

## 🧭 Look-ahead

- **M3**, **M4** done → **M5** built (live check left) → **M6** community
  recipes and feeds → **M7** showcase → **M8** Expo apps (the cherry icon is ready:
  `public/brand/haci-app-icon-1024.png`, `haci-play-store-512.png`; the adaptive-icon foreground
  needs the mark scaled into the 66% safe zone).
- Icebox highlights: localization (English first), colour theme review, a `haci` domain.
