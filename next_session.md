# Next Session — Handoff Note

> This file is the starting point for the next session (a new chat, another Claude
> account, another computer, or a different agent). **Copy the prompt below and paste
> it — you shouldn't need to explain anything else.**

**Prepared by session:** 2026-10-13 · **Handing off:** M1 (admin panel — built, waiting on
the admin accounts for its end-to-end check) and M2 (domain — apex live, `www`/`admin`
certificates pending).

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
  there is no secret key in the app (ADR-007).
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

## 🎯 This Session's Task — finish M1 and M2, then start M3's design

### Step 1 — admin accounts (needs the user)

Check `select id, email from auth.users` and `select * from public.admins`. If the accounts
are missing, ask the user to create them: Supabase → Authentication → Users → **Add user →
Create new user**, with **Auto Confirm User** ticked — one for the user, one for Hacı. You
never type a password. Then add them (owner = the user, editor = Hacı):

```sql
insert into public.admins (user_id, role, display_name)
select id, 'owner', 'Efe' from auth.users where email = '<owner email>';
insert into public.admins (user_id, role, display_name)
select id, 'editor', 'Hacı' from auth.users where email = '<hacı email>';
```

### Step 2 — the panel end to end

The user signs in on `https://admin.hacininkokteylleri.tech` (or `http://admin.localhost:3000`
with `npm run dev`) in their Chrome; then drive it through Claude in Chrome:
create a **test** cocktail with a photo → it appears on `/kokteyller` at once → edit it →
unpublish (it disappears) → delete it (its photo disappears from the bucket — check with
SQL on `storage.objects`). Check the glossary editor the same way. Fix what breaks.

### Step 3 — the domain

Vercel → project → Settings → Domains: all of apex, `www`, `admin` must say **Valid
Configuration**, and `https://` must work on each (`curl -I`). On 2026-10-13 the apex was
valid and the other two were still waiting on Vercel's own DNS check. Then, with the user's
OK: Supabase → Authentication → URL Configuration (Site URL `https://hacininkokteylleri.tech`;
redirect URLs `https://admin.hacininkokteylleri.tech/**`, `http://admin.localhost:3000/**`),
turn **off** "Allow new users to sign up" until M3, and add the domain to Google Search
Console.

### Step 4 — if there is time: M3's ADR

Write the community data model ADR (plan.md §5.2 has the sketch) and agree it with the user
before building. Do not build M3 without it.

---

## 🙋 Questions for the User

| # | Question | Why it matters | Until it is answered |
|---|---|---|---|
| 1 | **The two admin accounts' e-mails and display names** | M1 cannot be checked end to end without them | Panel is live but nobody can sign in |
| 2 | **When does the mobile app start, and in what?** Recommendation: **Expo** (React Native + TypeScript + supabase-js), after M3 so it ships with accounts | Shapes the repo (monorepo or a second repo) and M8's place in the order | M3 → M7 on the web first |
| 3 | **Comments and ratings: one review (stars + optional text) per user per cocktail, Letterboxd-style, or separate free comments plus a rating?** | Decides the M4 tables | Recommendation: one review per user per cocktail |
| 4 | **Showcase votes: one vote per user per period, or one per entry?** And who approves applications — any admin? | Decides M7's tables and rules | Ask at M7 |

---

## 📍 Current State

- **Supabase** project `hacininkokteylleri-eu` (ref `qwvnhdghwycqlvsnlvlt`, Frankfurt). Old
  Seoul project `kdicsywipwkauonkxcdc` is **paused**; the user said it can be deleted — only the
  user can, in the dashboard (Settings → General → Delete project).
- **Schema** (4 migrations in `supabase/migrations/`): `cocktails`, `cocktail_ingredients`,
  `glossary_terms`, `admins`; `private.is_admin()`; `public.save_cocktail()`; bucket
  `cocktail-images`. Security advisor: empty.
- **Content:** 37 cocktails, 153 ingredients, 4 glossary terms; 37 WebP photos (Gemini sparkle
  removed). `src/data/cocktails.ts` and `public/images/cocktails/` are deleted (git history up to
  `bb06ba0`).
- **Site:** `/kokteyller` is static, revalidated hourly and on every admin write.
- **Admin panel:** built, type-checked, builds; sign-in page verified on `admin.localhost:3000`.
  Not yet used with a real account.
- **Domain:** bought 2026-10-13 at get.tech/Namify. DNS: `A @ 216.198.79.1`, `CNAME www` and
  `CNAME admin` → `1327916967901761.vercel-dns-017.com`. Vercel: apex valid; `www` (308 → apex)
  and `admin` waiting on verification at hand-off.

---

## ⚠️ Things That Will Bite You

**Next.js 16**
- Middleware is **`src/proxy.ts`** exporting `proxy()`; the old `middleware.ts` name is gone.
- `revalidateTag(tag)` needs a second argument (`'max'`); `revalidatePath` is unchanged.
- The admin panel's pages live under `src/app/admin` but are **only** reachable through an
  `admin.*` host. `localhost:3000/admin` is a 404 on purpose. Use `admin.localhost:3000`
  (Chrome resolves it; `allowedDevOrigins` in `next.config.mjs` lets dev assets load).
- Links inside the panel are written **without** `/admin` (`/kokteyller/yeni`) — the proxy adds it.
- A public page that touches cookies stops being static. Public pages use
  `createPublicClient()` only.

**Supabase**
- **New tables are fully granted to `anon` by default** in this project. Every new table:
  `revoke all … from anon, authenticated`, grant only what is needed, enable RLS, write policies.
- Write policies call `(select private.is_admin())` — the `select` wrapper is for performance.
- One permissive policy per role and action; overlapping ones trip the performance advisor.
- The MCP's `apply_migration` assigns the version; read it with `list_migrations` before naming
  the mirrored file.
- The free plan: pauses after 7 idle days (the keep-alive cron prevents it), **no backups**.
- The built-in mailer sends only to the org's members, a few per hour — no public sign-up until
  custom SMTP exists (M3).
- The dashboard's "Total users (estimated)" is a statistic, not a count; ask SQL.

**Auto mode and permissions**
- Creating a temporary policy that lets `anon` write was **refused by the auto-mode safety check**
  as weakening security. Bulk uploads go through the dashboard instead: Claude in Chrome →
  Storage → bucket → `file_upload` on the page's hidden `<input type=file multiple>` (≤ 10 MB per call).
- Never type passwords or create accounts — the user does that.

**Browsers and consoles**
- Use **Claude in Chrome**. The built-in browser pane is not signed in to anything.
- Vercel's "Add Domain" dialog: the redirect-target combobox needs **Enter** to commit the choice,
  or "Add Domain" does nothing. A click outside the dialog closes it without saving.
- Namify's "Add a new record": leave **Host name empty for the apex**. The record-type dropdown can
  flip (it went to AAAA once) — check the type before Save.
- Local DNS on this machine cached the registrar's parking IP (`208.91.112.55`) for a while; check
  propagation with `https://dns.google/resolve?name=…&type=A` instead.

**Photos**
- Never overwrite an object in the bucket: new name, update the row, delete the old object (ADR-006).
- The Gemini sparkle remover assumes the sparkle's position (112 px in from both edges at 2816 px
  width, scaled). A non-Gemini photo uploaded with the box ticked gets a faint patch in that corner —
  untick it for real photos.

**Windows**
- Git Bash rewrites `/paths` in arguments; PowerShell is the primary shell. `npm` prints
  "allow-scripts" warnings for `sharp` — harmless.

---

## ✅ Closed Questions (don't ask again)

| Question | Answer |
|---|---|
| Where is the backend? | **Supabase, Frankfurt** — recreated from Seoul on the user's choice, 2026-10-13 (ADR-003) |
| Can the Seoul project be deleted? | **Yes** (the user, 2026-10-13) — the user deletes it in the dashboard |
| Where do recipes live? | **In the database**, edited in the admin panel (ADR-004) |
| Where is the admin panel? | **`admin.hacininkokteylleri.tech`**, same app (ADR-007) |
| Who are the admins? | **The user (owner, "genel admin") and Hacı (editor)**; both can create, edit and delete cocktails |
| Remove the Gemini watermark from photos? | **Yes** — done for the 37, and on by default for new uploads (ADR-006) |
| Canonical domain? | **`hacininkokteylleri.tech`** (no www) (ADR-010) |
| Does the mobile app get its content from the panel? | **Yes** — same backend, same panel |
| Does the home page stay Hacı's when user recipes arrive? | **Yes** — community recipes live on profiles and feeds; the home page changes only through the showcase |

---

## 🧭 Look-ahead

- **M3 — Accounts** (ADR first): public sign-in (Google + email with custom SMTP), profiles,
  18+ gate, privacy notice.
- **M4** ratings/comments/favourites · **M5** drink log with recipe-as-made snapshots ·
  **M6** community recipes and feeds · **M7** showcase applications and voting · **M8** mobile app.
