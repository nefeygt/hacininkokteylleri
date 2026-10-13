# Next Session — Handoff Note

> This file is the starting point for the next session (a new chat, another Claude
> account, another computer, or a different agent). **Copy the prompt below and paste
> it — you shouldn't need to explain anything else.**

**Prepared by session:** 2026-10-14 · **Handing off:** M3 is **built and tested end to end** for
both sign-in methods — Google (app in production) and e-mail + password (Resend in Ireland,
custom SMTP, Turkish templates). The privacy notice has its contact address (`contact@`,
forwarded through ImprovMX). Accounts stay **closed** (`ACCOUNTS_OPEN = false`, sign-ups off).
**Next: the user's final read of `/privacy`, then open M3 with the user's go.**

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

## 🎯 This Session's Task — open M3 (everything is built and tested)

### Step 0 — check sign-ups are off

Last session the user turned "Allow new users to sign up" on for the test and was asked to turn
it off afterwards. Check (publishable key only, from `.env`):
`curl -s -H "apikey: $KEY" https://qwvnhdghwycqlvsnlvlt.supabase.co/auth/v1/settings` →
`"disable_signup": true`. If it is `false` and M3 is not opening this session, ask the user to
switch it off (Supabase → Authentication → Sign In / Providers → User Signups → Save) — the
auto-mode classifier does not let the agent flip it.

### Step 1 — the privacy notice ✅ (contact address done)

`iletisim@hacininkokteylleri.tech` and `contact@hacininkokteylleri.tech` forward to
`n.efeyigit@outlook.com` through **ImprovMX** (the user's account and aliases; DNS at Namify:
`MX @ mx1.improvmx.com 10`, `MX @ mx2.improvmx.com 20`, `TXT @ "v=spf1 include:spf.improvmx.com ~all"`;
test mails to both arrived, 2026-10-13). `/privacy` shows **`contact@`** (the user's pick) as a mailto link and lists
ImprovMX as a processor. Left: the user's final read. The draft banner disappears by itself when
`ACCOUNTS_OPEN` is true. Namify has no forwarding of its own — never start its paid Titan trial.

### Step 2 — e-mail + password sign-in with Resend (code done; Resend domain added)

Done 2026-10-13: the Resend account (the user's), the domain in Ireland with tracking off, its
DNS at Namify (DKIM TXT `resend._domainkey`, CNAME `rsend` → `rsend-euw1.forge.rmta.net`, CNAME
`send` → `send.forge.rmta.net`, `TXT _dmarc "v=DMARC1; p=none;"`), and the code (`EmailForm` on
`/login`, `/reset-password`, `via=email` in the callback). Done 2026-10-14: Resend verified, Supabase custom SMTP
and minimum password length 8 (the user), Turkish templates (`supabase/templates/`, pasted into
Supabase). **End-to-end test passed 2026-10-14** (sign-up, confirmation, onboarding, sign-out, reset, sign-in with the new password, deletion). Saving a template in Supabase's dashboard: set the body
with `monaco.editor.getModels()[0].setValue(...)`, the subject with `form_input`, then click Save
from JS (`button.click()`) and confirm a `PATCH …/config` 200 — coordinate/ref clicks often miss.

**The user decided (2026-10-13): accounts open only after e-mail sign-in works too.**
1. The user creates a Resend account (the agent never creates accounts) and adds the domain;
   Resend's records (DKIM `resend._domainkey`, and MX + SPF on its `send.` subdomain) do not
   collide with ImprovMX's MX/SPF on the apex — the agent adds them at Namify.
2. The user creates an API key and pastes it into Supabase → Authentication → Emails → SMTP
   Settings (host `smtp.resend.com`, port 465, user `resend`, sender
   `haci <noreply@hacininkokteylleri.tech>` unless the user prefers another). The key never
   enters the repository or the chat (ADR-008).
3. Turkish e-mail templates in Supabase (confirm sign-up, reset password, change e-mail).
4. Code: e-mail + password on `/login` (sign in / sign up), a "forgot password" request and a
   `/reset-password` page; the callback already handles the code exchange. Test end to end with
   sign-ups briefly on (the user flips the switch).

### Step 3 — open M3 (only with the user's explicit go)

`ACCOUNTS_OPEN = true` in `src/lib/account-config.ts` (the navbar link appears), the user turns
sign-ups on in Supabase, build, push (deploys), then check on the live domain from outside
(plan.md §5.4) and once in Chrome: `/login` → Google → `/welcome`. Note: with sign-ups on,
e-mail + password sign-up is also open at the API, but "Confirm email" is on and the built-in
mailer only reaches org members, so nobody outside can finish it — Resend fixes this properly.

### Then

The wordmark in the navbar, Hacı's own first admin sign-in. After M3: **M4 reviews and favourites**
(ADR-014 has the tables; the reserved-username list gets the English route words in that
migration — plan.md §8).

---

## 🙋 Questions for the User

| # | Question | Why it matters | Until it is answered |
|---|---|---|---|
| 2 | **A final read of `/privacy`** — anything to change before it takes effect? | It takes effect when accounts open | Draft banner stays |
| 3 | **Colour theme:** keep the dark crimson "Rx" look, or explore a lighter/warmer palette? | The user said the theme can change (ADR-015) | Today's palette stays |
| 4 | **Resend:** whose account, and is `haci <noreply@hacininkokteylleri.tech>` fine as the sender? | E-mail sign-in, password resets | Google sign-in only |
| 5 | **Hacı's first admin sign-in** — when (his phone, a network that does not block the domain)? | His 2FA factor is not enrolled yet | He cannot use the panel |

---

## 📍 Current State

- **Production:** `hacininkokteylleri.tech` (apex), `www` → apex, `admin.hacininkokteylleri.tech`;
  `hacininkokteylleri.vercel.app` → 308 to the domain. `main` deploys on push.
- **Accounts (M3):** Google app **in production** (Google Cloud `haci-511515`, branding: home
  page, `/privacy`, authorized domains, no logo). Supabase: Google provider on, TOTP on,
  sign-ups **should be off** (Step 0). Pages: `/login`, `/auth/callback`, `/welcome`, `/account`
  (profile, **avatar** — new this session, sign out, delete), `/u/{username}` (shows the avatar),
  `/privacy` (draft, no contact address). All tested end to end on `localhost:3000` on 2026-10-13
  with the user's `wowcubey@gmail.com` Google account; the test account was deleted (all rows
  and the avatar object gone).
- **Avatars:** `src/app/(site)/account/AvatarField.tsx` (centre square → 256 px WebP →
  `{user_id}/{base36}.webp` → `setAvatar` → old object deleted), `src/components/Avatar.tsx`
  (picture or initial), `avatarUrl()` / `AVATARS_BUCKET` in `src/lib/supabase/config.ts`.
- **Supabase** (ref `qwvnhdghwycqlvsnlvlt`): 6 migrations, none added this session. Advisors as
  before (only leaked-password protection — Pro plan).
- **Admins:** owner "Efe" (`n.efeyigit@outlook.com`, 2FA), editor "Hacı"
  (`furkancam99@hotmail.com`, no sign-in yet, no 2FA yet). The two e-mail users in `auth.users`
  are these admins (no profiles).
- **Members:** none (the test member was deleted).
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

**This session's lessons**
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
| Admins, 2FA, canonical domain, WHOIS, reviews/logs, mobile stack | See ADR-007, 011, 010, plan.md M2, ADR-012, ADR-013 |

---

## 🧭 Look-ahead

- **M3** finish and open → **M4** reviews and favourites → **M5** drink log → **M6** community
  recipes and feeds → **M7** showcase → **M8** Expo apps (the cherry icon is ready:
  `public/brand/haci-app-icon-1024.png`, `haci-play-store-512.png`; the adaptive-icon foreground
  needs the mark scaled into the 66% safe zone).
- Icebox highlights: localization (English first), colour theme review, a `haci` domain.
