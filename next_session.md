# Next Session — Handoff Note

> This file is the starting point for the next session (a new chat, another Claude
> account, another computer, or a different agent). **Copy the prompt below and paste
> it — you shouldn't need to explain anything else.**

**Prepared by session:** 2026-10-13 (night) · **Handing off:** the brand is now **`haci`**
(ADR-015): English URLs, Turkish UI, cherry logo. M3's database and pages are built and
**closed** to the public; Google sign-in is configured but the Google app is still in
Testing. **Next: publish the Google app, test sign-in end to end, finish M3.**

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

## 🎯 This Session's Task — finish M3 (accounts), then open it

### Step 1 — publish the Google app (in Chrome, ~5 minutes)

Google Cloud, account **`n.efeyigit@gmail.com`** (in the user's Chrome it is `authuser=1`),
project **`haci`** (`haci-511515`):
1. `https://console.cloud.google.com/auth/branding?authuser=1&project=haci-511515` —
   Application home page `https://hacininkokteylleri.tech`, privacy policy
   `https://hacininkokteylleri.tech/privacy`, terms of service empty, Authorized domains
   `hacininkokteylleri.tech` and `supabase.co`. **No logo** (a logo forces Google's
   verification — the user agreed to publish without one). Save. (Last session typed the home
   page but was stopped before saving — check the fields.)
2. `…/auth/audience?…` → **Publish app** → In production. Basic scopes only, so no review.

Check with Supabase's public settings (uses only the publishable key from `.env`):
`curl -s -H "apikey: $KEY" https://qwvnhdghwycqlvsnlvlt.supabase.co/auth/v1/settings` →
`external.google: true` (already true), `disable_signup: true` (stays true until Step 4).

### Step 2 — test sign-in end to end (needs the user)

Public sign-up is off, so a new Google user is refused (`/login?error=closed` — that path is
tested). For a real run: ask the user, then turn **"Allow new users to sign up"** on in
Supabase → Authentication → Sign In / Providers, run `npm run dev`, and on
`http://localhost:3000/login` have the user pick their Google account. Expect `/welcome` →
username, display name, 18+, privacy → `/account` → edit profile → `/u/{username}` →
delete the account (row gone in `auth.users`, `profiles`, `account_settings`). **Turn
sign-ups off again** unless the user wants M3 open. Admins cannot delete themselves here
(by design).

### Step 3 — the privacy notice's contact address

The user chose a mailbox on the domain: `iletisim@hacininkokteylleri.tech` with Namify's
free e-mail (manage.get.tech → the domain → Email). Creating it needs a password — **the user
creates it**; the agent adds the MX/SPF records Namify asks for if needed. Then set `CONTACT`
in `src/app/(site)/privacy/page.tsx` and remove the draft banner when M3 opens.

### Step 4 — open M3 (with the user's go)

`ACCOUNTS_OPEN = true` in `src/lib/account-config.ts` (the navbar link appears), sign-ups on in
Supabase, deploy, check on the live domain from outside (plan.md §5.4).

### Then

E-mail + password sign-in with Resend (needs a Resend account and DNS records at Namify),
avatar upload on `/account`, the wordmark in the navbar, Hacı's own first admin sign-in.
After M3: M4 reviews and favourites (ADR-014 has the tables).

---

## 🙋 Questions for the User

| # | Question | Why it matters | Until it is answered |
|---|---|---|---|
| 1 | **Open accounts to the public right after the e2e test, or wait for e-mail sign-in too?** | Google-only at launch is simpler; some people have no Google account | M3 stays closed |
| 2 | **Colour theme:** keep the dark crimson "Rx" look, or explore a lighter/warmer palette for a wider audience? The cherry logo works on either | The user said the theme can change (ADR-015) | Today's palette stays |
| 3 | **Resend:** whose account, and is `haci <noreply@hacininkokteylleri.tech>` fine as the sender? | E-mail sign-in, password resets | Google sign-in only |
| 4 | **Hacı's first admin sign-in** — when can he do it (his phone, a network that does not block the domain)? | His 2FA factor is not enrolled yet | He cannot use the panel |

---

## 📍 Current State

- **Production:** `hacininkokteylleri.tech` (apex), `www` → apex, `admin.hacininkokteylleri.tech`;
  `hacininkokteylleri.vercel.app` → 308 to the domain. `main` deploys on push; last pushes this
  session built and deployed cleanly.
- **Brand:** `haci` in titles, navbar, panel, home hero; personal "about" removed. Logo files
  in `public/brand/` (SVG sources + PNGs: 1024 app icon, 512 Play Store icon, transparent mark,
  wordmarks); favicon `src/app/icon.svg`, `src/app/apple-icon.png`. Re-export with
  `node scripts/export-brand.mjs`.
- **URLs are English:** `/cocktails`, `/login`, `/account`, `/welcome`, `/privacy`, `/u/{username}`,
  `/auth/callback`; panel `/login`, `/setup-2fa`, `/verify`, `/glossary`, `/cocktails/new`,
  `/cocktails/{id}`. Old Turkish paths 308-redirect (`next.config.mjs`).
- **Supabase** (ref `qwvnhdghwycqlvsnlvlt`): 6 migrations (latest `20261013144804_community_accounts`).
  Security advisor: only leaked-password protection (Pro plan — expected). Performance: clean.
  Auth: sign-ups **off**, Google provider **on** (client ID `533154070020-18t31ta9tqcupnpe4bjul5p7lbpmeib1.apps.googleusercontent.com`,
  secret only in Supabase), TOTP on.
- **Admins:** owner "Efe" (`n.efeyigit@outlook.com`, 2FA), editor "Hacı" (**`furkancam99@hotmail.com`**
  since this session; no sign-in yet, no 2FA yet).
- **Members:** none yet (no rows in `profiles`).
- **Search Console** (`wowcubey@gmail.com`): Domain property verified (TXT at Namify), sitemap
  submitted ("couldn't fetch" right after submitting is normal — it was live, 200 from outside),
  Change of Address vercel.app → domain in progress since 2026-10-13.

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
| Privacy contact address? | **A mailbox on the domain** (`iletisim@…`), not a personal address |
| Admins, 2FA, canonical domain, WHOIS, reviews/logs, mobile stack | See ADR-007, 011, 010, plan.md M2, ADR-012, ADR-013 |

---

## 🧭 Look-ahead

- **M3** finish and open → **M4** reviews and favourites → **M5** drink log → **M6** community
  recipes and feeds → **M7** showcase → **M8** Expo apps (the cherry icon is ready:
  `public/brand/haci-app-icon-1024.png`, `haci-play-store-512.png`; the adaptive-icon foreground
  needs the mark scaled into the 66% safe zone).
- Icebox highlights: localization (English first), colour theme review, a `haci` domain.
