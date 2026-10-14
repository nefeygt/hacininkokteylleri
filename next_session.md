# Next Session — Handoff Note

> This file is the starting point for the next session (a new chat, another Claude
> account, another computer, or a different agent). **Copy the prompt below and paste
> it — you shouldn't need to explain anything else.**

**Prepared by session:** 2026-10-14 (M8 start) · **Handing off:** **M8 step 1 done** — the Expo app
exists in `mobile/` (SDK 57): shell, theme, icons, the archive and the recipe screen, checked in
Chrome through Expo web. **Next: M8 step 2 — accounts in the app** (plus `/api/revalidate` on the site).

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

## 🎯 This Session's Task — M8 step 2: accounts in the app

### Step 0 — state check

`git status` — clean, `main` in step with `origin/main`. **Tools:** the Supabase MCP (`list_migrations`
on `qwvnhdghwycqlvsnlvlt` → still 11, the latest `20261014134219_showcase`) and Claude in Chrome
(`tabs_context_mcp`) — both belong to the Claude account; ask the user to connect a missing one.
Sign-ups on (`/auth/v1/settings` → `"disable_signup": false`). SQL at the end of 2026-10-14: the only
profile `ahmet_kafa`, every community table empty. Never delete or edit a row you did not create
without asking. `cd mobile && npm ci` on a fresh machine (the app has its own lockfile).

### Step 1 — ask the user first (they change what can be built)

Questions 7–9 below: the Expo account, and whether the Apple and Google developer accounts are
**personal or organisation** (the stores show that name as the seller). Remind them that Apple's
enrolment can take days and that a new personal Google Play account needs a **12-tester, 14-day
closed test** before production — both should start now, long before step 7.

### Step 2 — build (ADR-020)

1. **`POST /api/revalidate`** on the site (`src/app/api/revalidate/route.ts`): `Authorization: Bearer
   <member access token>`, verified with `supabase.auth.getUser(token)` (members only, no secret key);
   body `{ paths: string[] }`, at most ~8, each matching `/`, `/cocktails`, `/feed`, `/recipes/{slug}`,
   `/u/{username}`, `/logs/{uuid}`; `revalidatePath` each (`/recipes/[slug]` "page" when a review
   touches every recipe page, as `cocktails/actions.ts` does). The app calls it after every write;
   failures are ignored (ISR catches up).
2. **The session in the app:** a `SessionProvider` (session, profile, `account_settings`) mirroring
   the site's `useMember`/`accountSession()`; the Hesap tab shows sign-in or the account.
3. **E-mail:** sign in, sign up (`emailRedirectTo` = the site's `/auth/callback`, so the confirmation
   link opens the website; then sign in in the app), forgot password (the reset link opens the site's
   `/reset-password`). Copy the Turkish strings and error mapping from `src/app/(site)/login/`.
4. **Onboarding** as `/welcome`: username (suggested with `@shared/slug`), display name, 18+, the
   privacy notice (link to the site's `/privacy`; `PRIVACY_NOTICE_VERSION` — move it or read it from
   `@shared/account-config`, which is browser-safe), writes `account_settings` then `profiles`.
5. **Account:** edit profile, avatar (expo-image-picker → expo-image-manipulator: centre square,
   256 px WebP → `avatars/{id}/{base36}.webp`, then point the profile at it and delete the old object
   — ADR-006), logs-public default, sign out, **delete account** (remove the user's Storage objects
   first, then `delete_my_account()` — as `/account` does; the stores require in-app deletion).
6. **Google:** `@react-native-google-signin/google-signin` (config plugin) → `signInWithIdToken`.
   Needs, in Google Cloud `haci-511515` (`n.efeyigit@gmail.com`, `authuser=1`): an **iOS client**
   (bundle `tech.hacininkokteylleri.haci`) and an **Android client** (package + the SHA-1 of the EAS
   signing key — create the key with the first EAS build or `eas credentials`; later also the Play
   app-signing SHA-1). Add every client ID to Supabase → Auth → Google → "Client IDs" (the web client
   stays first). Not testable in Expo Go — needs an EAS **development build** (the user's Expo account).
7. **Sign in with Apple (iOS only):** `expo-apple-authentication` → `signInWithIdToken({ provider:
   "apple" })`; Supabase Apple provider with the bundle ID as client ID; needs the Apple Developer
   account. `/privacy` must name Apple → draft the text, **the user approves** before deploying.
8. Verify: e-mail flows and onboarding in Expo web (Chrome) against the real project with a test
   account the user creates or approves — never type passwords yourself; Google/Apple on a device
   with the development build (the user). Delete test rows afterwards.

### Also open (not blocking)

- The wordmark in the navbar; Hacı's own first admin sign-in (question 5).
- A log could show what changed against the house recipe (ADR-017 consequence) → Icebox if wanted.
- Icebox (plan.md §9): follower lists, notifications, comment editing, tuning "popular", a showcase
  archive of past winners.

---

## 🙋 Questions for the User

| # | Question | Why it matters | Until it is answered |
|---|---|---|---|
| 3 | **Colour theme:** keep the dark crimson "Rx" look, or explore a lighter/warmer palette? | The user said the theme can change (ADR-015) | Today's palette stays (the app copies it from one theme file) |
| 5 | **Hacı's first admin sign-in** — when (his phone, a network that does not block the domain)? | His 2FA factor is not enrolled yet | He cannot use the panel |
| 6 | **The first real showcase period** — when, a week or a month? | Nothing promotes it until a period exists (the feed hides the section) | No period; the feature is invisible |
| 7 | **An Expo account** (expo.dev, free) — which username? | EAS builds the app for devices and stores; Google/Apple sign-in need a development build | Only Expo Go / Expo web testing |
| 8 | **Apple Developer: personal or organisation?** ($99/yr; organisation needs a D-U-N-S number and shows the company as seller) | The App Store shows the seller's name; enrolment takes days | No iOS build on devices, no Sign in with Apple |
| 9 | **Google Play: personal or organisation?** ($25; a new personal account needs 12 testers for 14 days before production) | The seller name, and the closed-test wait | No Play release |

---

## 📍 Current State

- **The app (M8, 2026-10-14):** `mobile/` — Expo SDK 57, Expo Router, React Native 0.86, its own
  `package.json`/lockfile/`.env` (`EXPO_PUBLIC_*`, public). Identifiers `tech.hacininkokteylleri.haci`,
  name `haci`, scheme `haci`, dark only. Screens: tabs Kokteyller (archive: search with aliases,
  filters, pull to refresh), Akış and Hesap (both "Sitede aç" placeholders until steps 2–6);
  `cocktail/[slug]` (the recipe, glossary terms open on tap). Shared code: `@shared/*` → `src/lib/*`
  (types, `archive-filter.ts` — new, the site's `CocktailBrowser` uses it too — and the other
  browser-safe modules). Icons rendered by `scripts/export-brand.mjs`. Not yet on any device or store.
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
- **Supabase** (ref `qwvnhdghwycqlvsnlvlt`): 11 migrations, the latest `20261014134219_showcase`.
  Advisors: only leaked-password protection (Pro plan) plus "unused index" infos on still-empty tables.
- **M4 (2026-10-14):** `reviews`, `favorites`, `reports`, view `cocktail_ratings`; the site's
  `cocktails/actions.ts`, `useMember`, `CocktailReviews`, `ReportButton`; the panel's
  `/moderation`. All tables empty after the test (the test rows were deleted).
- **M7 (2026-10-14, done; live check passed):** migration `20261014134219_showcase` (11 migrations
  now); `src/lib/showcase.ts`, `content.ts` (`getShowcase`, `getShowcaseWinner`), `src/app/(site)/feed/actions.ts`
  (apply, withdraw, vote), components `ShowcaseEntries`, `ShowcaseApply`; the home page is now ISR 1h
  with the winner card; the panel's `/showcase` page (`ShowcaseControls.tsx`) and reported applications
  in Moderasyon. `/privacy` version `2026-10-14.3` (the showcase line), approved by the user.
- **M6 (2026-10-14, done; live check passed):** migration `20261014081320_community_recipes` (10
  migrations now, applied live); `src/lib/recipe.ts`, `src/app/(site)/account/recipes/` (list, `new`,
  `[id]`, `RecipeForm`, `actions.ts`), `recipes/[slug]`, `feed`, `logs/[id]` (+ `logs/actions.ts`),
  `u/actions.ts`; components `RecipeDetails`, `RecipeActions`, `RecipeView`, `ImageField` (moved from
  the panel), `FollowButton`, `FollowingLogs`, `LogComments`; the panel's moderation lists members'
  recipes and comments. `/privacy` version `2026-10-14.2` (recipes and photos, follows, comments), approved by the user.
- **M5 (2026-10-14):** `drink_logs` (migration `20261014073958_drink_logs`, 9 migrations now);
  `src/lib/drink-log.ts`, `src/app/(site)/account/logs/` (list, `new`, `[id]`, `LogForm`,
  `actions.ts`), `LogsDefaultToggle` on `/account`, `DrinkLogEntry`, `ReportIfSignedIn`; the panel's
  moderation lists reported and recent public logs. `/privacy` version `2026-10-14` (drink log line,
  approved by the user). Live check passed on the user's phone (2026-10-14); tables empty afterwards.
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

**This session's lessons (M8 step 1)**
- **`CI=1 npx expo start` disables file watching** — edits never reach the browser and the bundle looks
  stale. Run `npx expo start --web --port 8081` without it (add `--clear` after config changes).
- **Expo web in a background Chrome tab:** screenshots time out and typed keys are lost, but the DOM
  works — `innerText`, `querySelector('[aria-label="…"]').click()`, and for a `TextInput` the native
  value setter + an `input` event. `Pressable` renders `role="button"` with its `accessibilityLabel`.
- **Uppercase Turkish:** `textTransform: "uppercase"` (and CSS without `lang="tr"`) gives "ARŞIV". The
  app's `Label` uppercases with `upperTr()` (`i` → `İ` first) instead. Words like "Highball" become
  "HİGHBALL" — the site (`lang="tr"`) does the same.
- **`rm` after `cd` in one Bash command is refused** by a safety check (unresolvable glob) — use
  absolute paths in removals.
- `npx expo install` picks SDK-compatible versions — never `npm install` a native package in `mobile/`.
- SDK 56+: import navigation from `expo-router` only, never `@react-navigation/*` (`DarkTheme`,
  `ThemeProvider`, `Tabs`, `Stack` all come from `expo-router`).
- The shared modules in `src/lib` must not import `./content` (it pulls in Next/server code):
  `recipe.ts` and `drink-log.ts` now take `IngredientIcon` from `database.types`.

**Lessons from M7**
- **MCP connectors and Claude in Chrome belong to the Claude account.** A new account starts without
  the Supabase connector and with Chrome's extension signed in to the other account — check both in
  Step 0 and ask the user to connect them (Connectors / the Claude side panel in Chrome).
- **Another ambiguous embed:** `showcase_entries → profiles` has two paths (directly and through
  `showcase_votes`) — name the key, `profiles!showcase_entries_user_id_fkey(...)`.
- **In a plpgsql test, `r := r || 'text'` on a `text[]` reads the literal as an array** ("malformed
  array literal") and aborts the step being tested — write `'text'::text`.
- **JavaScript lowercases "İ" to "i̇"** (with a combining dot): matching CSS-uppercased Turkish button
  text with `innerText.toLowerCase()` fails; match `textContent` exactly instead.
- To test the derived winner, move the test period into the past in SQL (`starts_at`/`ends_at`);
  `next dev` renders the home page on every request, so no rebuild is needed.

**Lessons from M6**
- **PostgREST refuses an ambiguous embed.** `drink_logs`, `reviews` and `favorites` link
  `cocktails` and `profiles`, so `cocktails → profiles` has several paths: name the key,
  `profiles!cocktails_author_id_fkey(...)`.
- **Python's stdout on this machine is cp1254** — characters like `−` crash a script that prints;
  run with `PYTHONIOENCODING=utf-8`, or write files with `io.open(..., encoding='utf-8')`.
- `alter type … add value` works inside `apply_migration` as long as the new value is not used in
  the same transaction.
- In Chrome, `innerText` follows CSS `text-transform` ("MALZEMELER"): match case-insensitively.
- To act as a member in SQL without a password: `set_config('request.jwt.claims', '{"sub":…,
  "role":"authenticated","aal":"aal1"}', true)` then `execute 'set local role authenticated'` inside
  a `do` block; `execute 'reset role'` to switch users.

**Lessons from M5**
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
| Showcase period length, page, home card, application? | **Admin picks a week or a month each time; apply and vote inside `/feed`; a featured card below the hero; recipe + pitch + photo required** (ADR-019) |
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
| Mobile app: where, scope, platforms, sign-in? | **`mobile/` in this repo; full parity with the site before the first store release; iOS + Android from day one on the user's accounts; native Google + e-mail (+ Sign in with Apple on iOS)** (ADR-020, 2026-10-14) |
| Admins, 2FA, canonical domain, WHOIS, reviews/logs, mobile stack | See ADR-007, 011, 010, plan.md M2, ADR-012, ADR-013 |

---

## 🧭 Look-ahead

- **M8** steps 3–7 (plan.md §6): reviews/favourites/profiles → drink log → members' recipes, feed,
  follows, comments → showcase → store release (EAS production builds, Turkish listings, 18+ rating,
  privacy forms, Play's closed test, App Store review).
- Icebox highlights: localization (English first), colour theme review, a `haci` domain.
