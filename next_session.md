# Next Session — Handoff Note

> This file is the starting point for the next session (a new chat, another Claude
> account, another computer, or a different agent). **Copy the prompt below and paste
> it — you shouldn't need to explain anything else.**

**Prepared by session:** 2026-10-13 (evening) · **Handing off:** M1 is checked end to end with
the owner's account and two-factor authentication; Hacı's first sign-in is left. M2 (domain)
is live. **Next: the community data-model ADR, then M3 — accounts.**

---

## 📋 Prompt to Copy

```
Hi. We're working on Hacı'nın Kokteylleri — a Next.js + Supabase cocktail site
(hacininkokteylleri.tech) with an admin panel, growing into a community and a mobile app.

BEFORE YOU START, read these in order:
1. plan.md         — the single source of truth (status board, product, architecture, milestones)
2. next_session.md — this file (what to do, open questions, things that bite)
3. adr.md          — decisions already made and why (don't relitigate them, apply them)

Then do the work described under "This Session's Task".

WORKING RULES:
- Write EVERYTHING in the repository in English — docs, code, comments, commit messages,
  SQL. Everything visitors and admins read (UI strings, recipes) is Turkish. I may chat
  with you in Turkish; that never changes the language of what you produce. See ADR-002.
- Don't reopen decisions that are already closed. If one needs to change, ask me first.
- Don't add features outside the active milestone. Ideas go to plan.md §9 "Icebox".
- The database is the gatekeeper: every table has RLS, every permission is a policy, and
  there is no secret key in the app (ADR-007). Admin powers need a 2FA session (ADR-011).
- Schema changes: apply with the Supabase MCP, mirror the SQL as
  supabase/migrations/{version}_{name}.sql, regenerate database.types.ts, run the advisors
  (ADR-009).
- Verify your own work before claiming it is done: `npm run build` must pass, and UI
  changes are checked in a real browser (Claude in Chrome — my Chrome, signed in to
  Vercel, Supabase and Namify). plan.md §5.4 has the commands.
- Use your own judgement on small calls; only use AskUserQuestion for things that
  genuinely change direction.

AT THE END OF THE SESSION (before context fills, even if work is unfinished):
- Update plan.md: status board, milestone checkboxes, session log
- Rewrite next_session.md: new state, new task, new open questions
- Add an ADR to adr.md if you made a decision that outlives the session
- Commit and push (main deploys to production — build first)
```

---

## 🎯 This Session's Task — close M1, then design the community (ADR before code)

### Step 1 — Hacı's account (needs the user and Hacı)

Hacı's login is `mustafafurkancam@hacininkokteylleri.com`, but **`hacininkokteylleri.com` is not
registered** (NXDOMAIN, 2026-10-13): no mail can reach him, and whoever registers that domain
could one day receive his password-reset mails. Ask the user for Hacı's real address, then
change it (the dashboard's user page, or SQL on `auth.users.email` **and**
`auth.identities.identity_data->>'email'` for his `email` identity — check both afterwards).
Then Hacı signs in on `admin.hacininkokteylleri.tech` (from a network that does not block it —
see "Things That Will Bite You") and enrols his own authenticator app. Check
`select status from auth.mfa_factors` shows a `verified` factor for him.

### Step 2 — Google Search Console (small)

Add `hacininkokteylleri.tech` as a Domain property; put the TXT record it gives at Namify
(DNS → DNS Records → Add new record, type TXT, host empty). Ask the user first — it is their
Google account.

### Step 3 — the community data-model ADR (the main work)

Before any M3 code, write **ADR-014: the community data model** and agree it with the user.
It must cover, with tables, keys and RLS for each:
- `profiles` (one per auth user; username rules; what is public)
- house vs. community recipes (plan.md §5.2 sketches `cocktails.author_id`, null = Hacı's)
- `reviews` — **one per person per cocktail** (ADR-012): rating 1–5, optional text, public
- `drink_logs` — **unlimited per person per cocktail** (ADR-012): date, note, the recipe as made
  (jsonb snapshot), visibility; decide whether a log carries its own rating
- `favorites`; showcase periods, entries and votes (question 3 below)
- moderation: hide/report, who may do it (admins at aal2), what a hidden row looks like
- how ordinary users' policies coexist with the admin policies without overlapping permissive
  policies (the performance advisor flags overlaps)

Then M3 itself: public sign-in (question 2), `profiles`, an 18+ confirmation, a privacy notice
(KVKK), account deletion. Public sign-up is **off** in Supabase Auth today — turn it on only
when M3 ships.

---

## 🙋 Questions for the User

| # | Question | Why it matters | Until it is answered |
|---|---|---|---|
| 1 | **Hacı's real e-mail address** | His login address's domain does not exist | Hacı can still sign in with his password + 2FA; resets impossible |
| 2 | **Sign-in methods for the public (M3):** Google only, or Google + e-mail/password? Recommendation: **both**, Google first. E-mail needs a sender on the domain (e.g. Resend: free tier, DNS records at Namify) | Shapes M3's work and the accounts the user must open | M3 waits |
| 3 | **Showcase votes:** one vote per user per period, or one per entry? Who approves applications — any admin, or only the owner? | M7's tables and rules | Ask while writing the ADR |
| 4 | **What is public on a profile?** Username, display name, avatar, bio, logs, favourites? | Privacy, KVKK | Ask while writing the ADR |

---

## 📍 Current State

- **Production:** `hacininkokteylleri.tech` (apex), `www` → apex, `admin.hacininkokteylleri.tech`;
  `main` deploys on push. Build passes; `/kokteyller` is static, revalidated hourly and on every
  admin write.
- **Supabase** `hacininkokteylleri-eu` (ref `qwvnhdghwycqlvsnlvlt`, Frankfurt). 5 migrations in
  `supabase/migrations/`. Security advisor: only "leaked password protection" (Pro plan only —
  expected). Performance advisor: clean. The paused Seoul project (`kdicsywipwkauonkxcdc`) is the
  user's to delete in the dashboard.
- **Auth:** sign-ups **off**; Site URL `https://hacininkokteylleri.tech`; redirect URLs for the
  apex, the admin host and both localhost hosts; TOTP enabled.
- **Admins:** owner "Efe" (`n.efeyigit@outlook.com`, 2FA enrolled), editor "Hacı" (not signed in
  yet, no 2FA yet, e-mail to replace).
- **Content:** 37 cocktails, 153 ingredients, 4 glossary terms, 37 photos — unchanged by the
  end-to-end check (its test cocktail, photo and glossary term were deleted).
- **WHOIS:** the registry publishes no registrant data. Nothing to buy or change.

---

## ⚠️ Things That Will Bite You

**Next.js 16 and the two hosts**
- Middleware is **`src/proxy.ts`** exporting `proxy()`. `revalidateTag(tag)` needs a second
  argument (`'max'`); `revalidatePath` is unchanged.
- The panel's pages live under `src/app/admin` but are **only** reachable through an `admin.*`
  host; `localhost:3000/admin` is a 404 on purpose. Locally use **`http://admin.localhost:3000`**.
- Links inside the panel are written **without** `/admin` (`/kokteyller/yeni`) — the proxy adds it.
- **Never call `redirect()` inside a server action.** Next renders the target internally, past the
  proxy, so on the admin host it rendered the public home page. Return `{ ok }` and navigate in the
  browser (ADR-007). `redirect()` while rendering a page is fine.
- A public page that touches cookies stops being static. Public pages use `createPublicClient()` only.
- `<body suppressHydrationWarning>` is there because browser extensions (Claude in Chrome among
  them) add `style="isolation:isolate"` before React loads.

**Supabase**
- **New tables are fully granted to `anon` by default** here. Every new table: `revoke all … from
  anon, authenticated`, grant only what is needed, enable RLS, write policies.
- Write policies call `(select private.is_admin())`, which needs an `aal2` session (ADR-011). When
  testing policies in SQL, set the claim: `set_config('request.jwt.claims', '{"sub":"…","role":"authenticated","aal":"aal2"}', true)`.
- The MCP's `execute_sql` returns only the last statement's rows; inside one statement a
  data-modifying CTE's writes are invisible to sibling subqueries; string literals in a `union`
  need an explicit enum cast (`'owner'::public.admin_role`).
- `apply_migration` assigns the version; read it with `list_migrations` before naming the mirror file.
- Free plan: pauses after 7 idle days (the keep-alive cron prevents it), **no backups**, no
  leaked-password check, no SMS 2FA.
- The built-in mailer sends only to the org's members, a few per hour — no public e-mail sign-up
  until a custom SMTP sender exists.
- An admin who loses their phone: delete their factor (Authentication → Users → the user → MFA, or
  `delete from auth.mfa_factors where user_id = …`); they enrol again at the next sign-in.

**Auto mode and permissions**
- A temporary policy letting `anon` write was **refused by the auto-mode safety check** as weakening
  security. Bulk uploads go through the dashboard: Claude in Chrome → Storage → bucket →
  `file_upload` on the page's hidden `<input type=file multiple>` (≤ 10 MB per call).
- Never type passwords or create accounts; the user does. The user's TOTP codes come from their phone.

**Browsers and consoles**
- Use **Claude in Chrome**. The built-in browser pane is not signed in to anything.
- **Keystrokes go only to the front tab.** With two tabs open, typing into the background one does
  nothing; close the other tab first.
- Typing right after a navigation can be lost if the page has not hydrated yet — click the field,
  check, then type.
- The Supabase dashboard tab sometimes stops answering screenshots; reload it.
- Vercel's "Add Domain" dialog: the redirect-target combobox needs **Enter**; a click outside closes
  the dialog without saving.
- Namify's "Add a new record": **Host name empty = apex**; check the record type before Save (it
  flipped to AAAA once).
- **The network the user's computer was on blocks the new domain** (a Fortinet FortiGate: DNS answers
  `208.91.112.55`, HTTPS shows a Fortinet certificate and a 403; WebFetch fails the same way because
  it runs locally). Check DNS with `https://dns.google/resolve?name=…&type=A` and HTTP with
  check-host.net (plan.md §5.4).

**Windows**
- A background `npm run dev` / `next start` leaves its `node` child running after the task is stopped.
  Free the port by PID: `Get-NetTCPConnection -LocalPort 3000 -State Listen` → check the command line
  is ours → `Stop-Process`.
- Git has no identity configured on this machine; commit with
  `git -c user.name=nefeygt -c user.email=n.efeyigit@outlook.com commit …` (the identity of every
  earlier commit).

**Photos**
- Never overwrite an object in the bucket: new name, update the row, delete the old object (ADR-006).
- The sparkle remover assumes the Gemini sparkle's position; untick it for real photos.

---

## ✅ Closed Questions (don't ask again)

| Question | Answer |
|---|---|
| Where is the backend? | **Supabase, Frankfurt** (ADR-003) |
| Can the Seoul project be deleted? | **Yes** — the user deletes it in the dashboard |
| Where do recipes live, and where is the panel? | **The database; `admin.hacininkokteylleri.tech`** (ADR-004, ADR-007) |
| Who are the admins? | **Owner "Efe" (the user) and editor "Hacı"**; both create, edit and delete cocktails |
| 2FA for the panel? | **Yes, TOTP, enforced by the database** (ADR-011) — the user asked 2026-10-13 |
| Remove the Gemini watermark from photos? | **Yes** — done for the 37 and on by default for uploads (ADR-006) |
| Canonical domain? | **`hacininkokteylleri.tech`** (no www) (ADR-010) |
| Buy WHOIS privacy, or change the contact details? | **Neither** — the public record already shows no personal data (checked 2026-10-13) |
| Reviews and logs? | **One review per person per cocktail; unlimited logs with their own notes** (ADR-012) |
| Mobile app stack and timing? | **Expo, after M3** (ADR-013) |
| Does the home page stay Hacı's? | **Yes** — community recipes live on profiles and feeds; the home page changes only through the showcase |

---

## 🧭 Look-ahead

- **M3 — Accounts** (after ADR-014): public sign-in, profiles, 18+ gate, privacy notice.
- **M4** reviews and favourites · **M5** drink log · **M6** community recipes and feeds ·
  **M7** showcase · **M8** Expo app.
