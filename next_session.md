# Next Session — Handoff Note

> This file is the starting point for the next session (a new chat, another Claude
> account, another computer, or a different agent). **Copy the prompt below and paste
> it — you shouldn't need to explain anything else.**

**Prepared by session:** 2026-10-15 (M9 backup + cl ↔ oz) · **Handing off:** M8 steps 1–6 are done; **the store release
is paused (ADR-024)**. **M9 (web improvements):** done and deployed this session (ADR-027): the weekly content backup
(GitHub Action) and the cl ↔ oz switch; last session's features passed the live check and Google's Rich Results Test.
**Then the themes (ADR-028):** "Rx" (readable: a sans for text, mono only for labels) is the main look, with five more
themes in a "Görünüm" picker. **A later session (2026-10-15) removed the Letterboxd icon from the navbar and built "Elimde ne var?" (ADR-029): an
ingredient catalogue in the database and the page `/what-can-i-make`.**
**Next: ask the user what M9 still needs**; before the store, one app ↔ site parity pass.
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

## 🎯 This Session's Task — M9, the colour theme and a more readable font

1. **Check the backup** (ADR-027; a manual run on 2026-10-15 passed with "Nothing changed"; on Thursday 2026-10-15 no scheduled run had happened yet — the first is **Monday 2026-10-19**): the Action "Back up content" ran on Monday 03:00 UTC, or start it by hand
   (`gh workflow run backup-content.yml`, then `gh run list --workflow backup-content.yml`). Nothing changed → no commit;
   a change → a commit by `github-actions[bot]` and **no new Vercel deployment** for it
   (`gh api repos/nefeygt/hacininkokteylleri/commits/<sha>/status`: Vercel should report the build skipped/ignored).
   If Vercel built it anyway, check `ignoreCommand` in `vercel.json` and the project's "Ignored Build Step" setting.
2. **A live look at the themes** on the domain (the user's phone): open "Görünüm" (palette icon, top right), try each
   theme on a recipe, the archive, `/feed`, `/account` and `/login`. Pages not checked yet in the light themes: the
   account forms, logs, members' recipes, the feed's showcase, `/privacy`, `/u/{username}` — look for text that vanishes
   (a fixed colour instead of a token) and fix it with tokens (ADR-028).
3. **"Elimde ne var?" (ADR-029)** is deployed and passed its live check on 2026-10-15 (panel signed in, the page on
   the domain). Nothing left there; the user may want to look at it on the phone.
4. **Ask the user what M9 still needs** before the parity pass (Icebox candidates: localization, rating breakdown,
   members' recipes in "Elimde ne var?"). Don't start one without their pick.

**While doing web work:**
- Add every user-visible web change to **"Web changes since 2026-10-15 (for the parity pass)"** below — it is the
  app's checklist before release.
- A change in a shared module in `src/lib` (the app imports it through `@shared/*`) must keep the app compiling:
  run `npm run typecheck` in `mobile/` too (PowerShell `Set-Location …\mobile`).

### Web changes since 2026-10-15 (for the parity pass)

- **House recipe pages `/cocktails/{slug}`** (ADR-025). The app already has a recipe screen (`cocktail/[slug]`); for
  parity: a "share" link should use the site's URL, and links the app opens to house recipes should point here,
  not to `/cocktails?cocktail=`. The magnifier/quick card is a web-only pattern.
- **Filter chips from the data** (ADR-026) — **already in the app**: `(tabs)/index.tsx` uses `baseChoices` /
  `flavorChoices`, and the shared `filterCocktails` matches flavour notes. Typecheck passed; not yet seen in Expo web.
- **"Kaç kişilik?"** (1–8 glasses) on the recipe: port to the app's recipe screens with `SERVINGS_MAX` and
  `scaleAmount` from `@shared/recipe`.
- **"Paylaş"** on recipes: React Native's `Share.share({ message, url })` with the site's URL
  (`/cocktails/{slug}` or `/recipes/{slug}`).
- **"Benzer kokteyller"** under house recipes: `similarCocktails(target, archive, 4)` from `@shared/archive-filter`.
- The wordmark and the recipe JSON-LD are web-only (the app has its own header; no SEO).
- **The Letterboxd icon is gone from the navbar** (the user, 2026-10-15). The app never had it — nothing to port.
- **"Elimde ne var?"** (ADR-029): a screen (or a section on the archive tab) with chips from `ingredients`
  (`groupByCategory`) and `matchCocktails` from `@shared/ingredients`; the app's cocktail query must select
  `cocktail_ingredients.ingredient_id` and map it to `ingredientId`. Keep the choice in AsyncStorage.
- **Themes and readable type** (ADR-028): the app's `mobile/src/lib/theme.ts` copies Rx's new colours (brighter
  crimson glow `#d0453a`, greys `#b4b1ae` / `#7d7a78`); reading text in IBM Plex Sans, mono only for labels
  (`@expo-google-fonts/ibm-plex-sans`); a theme choice from `@shared/themes` (`THEMES`) on the account screen, kept in
  storage — or decide with the user that the app stays Rx only.
- **"cl | oz"** on recipes (ADR-027): a toggle beside "Kaç kişilik?" with `convertAmount`, `formatOunces`,
  `isConvertibleUnit` from `@shared/recipe`; remember the choice (AsyncStorage or the app's existing storage).

---

## 📦 Parked — M8 step 7: the store release, Android first (resume per ADR-024)

**Resume when:** the Apple Developer account is open, or the user's two other Play apps are ready to share a closed
test — the user decides. **First:** the parity pass — port every item of the list above to `mobile/`, update packages,
a new development build and a phone pass. Then:

### State check (when resuming)

`git status` — clean, `main` in step with `origin/main`. **Tools:** the Supabase MCP (`list_migrations` on
`qwvnhdghwycqlvsnlvlt` → 14, the latest `20261015194832_ingredient_catalogue_drafts`) and a browser: **Claude in Chrome was
disconnected most of 2026-10-15; the user reconnected it at the end** — try `tabs_context_mcp`; if it still fails, use the built-in browser
(`mcp__Claude_Browser__*`; it reaches `localhost:8081`; read the DOM, screenshots lag). Store consoles (Play Console,
expo.dev) need the user's signed-in Chrome — ask them to reconnect Claude in Chrome for those. The built-in browser holds the
**owner admin's login** (`n.efeyigit@outlook.com`) **without a profile** (it opens onboarding); ask before making a temporary
member, delete it afterwards. SQL: profiles `ahmet_kafa` (the user) and **`mustafa_hayat` — the user's friend, never touch
their rows**. Every community table was empty at the end of 2026-10-15. **Port 8081:** `Get-NetTCPConnection -LocalPort 8081`
→ stop an old Expo server by PID, then `npx expo start --web --port 8081`.

### Store steps (plan.md §6), what can start without Apple

1. **The user's go and a phone pass first:** the app has every feature now; the user should run the development build (or a
   preview APK) on their phone through the new screens (members' recipes, the feed, the showcase) before anything reaches a
   store. Their feedback may come first.
2. **Packages:** `npx expo install --check` (5 patch releases waited for a new build) → `npm run typecheck`,
   `npx expo-doctor`.
3. **A production Android build** (`eas build -p android --profile production`, an AAB; the Android keystore is on EAS).
   Check `app.json` (version, `versionCode`, permissions — photos only) before it.
4. **Play Console** (the user's "KZN" account; the user does anything that needs their password or a payment): create the app
   `haci`, the Turkish store listing (draft the texts — **the user approves**), screenshots from Expo web at phone width or the
   phone, content rating (alcohol → the questionnaire's answers; 18+), the Data safety form (drafted from `/privacy`: e-mail,
   name/username, photos, user content; Supabase, Vercel, Google, Resend), the privacy policy URL `/privacy`, account deletion
   URL (in-app deletion exists; Play also wants a web route — `/account` works for signed-in members; check the requirement).
   Then the closed test track — the user sources the 12 testers.
5. **Play's app-signing SHA-1** → a further Android OAuth client in Google Cloud `haci-511515` and its client ID in Supabase's
   Google provider, otherwise Google sign-in fails in Play-installed builds.

### Also open (not blocking)

- **Sign in with Apple:** waits for the Apple Developer account (the user enrols from an iPhone). Then:
  Supabase → Auth → Apple provider with the bundle ID as client ID; an iOS build; `/privacy` names
  Apple (draft the text, **the user approves**); check whether iOS Google sign-in needs "Skip nonce
  checks" in Supabase (the free google-signin module cannot pass a nonce).
- **Google Play closed test:** the account was created after 2023-11-13, so 12 testers for 14 days
  before production. **The user's plan:** buy a tester service (Fiverr, cheaper for several apps at
  once). Alternatives offered: haci's own audience through a Google Group (real feedback — Play's
  production-access form asks how testers engaged), free tester-exchange communities, or an
  organization account (needs a D-U-N-S number; skips the rule). Start it once a preview build is
  worth testing; the app needs Play's app-signing SHA-1 in a further Android OAuth client then.
- 5 Expo packages have newer patch releases (`npx expo install --check`); update together with the
  next development build, not alone.
- Auth e-mails land in Outlook's spam (plan.md §8).
- Hacı's own first admin sign-in (question 5).
- Not yet seen in the app: a showcase entry card with a real recipe photo (everything else of steps 5–6 was checked with
  a seeded second member on 2026-10-15).
- Icebox (plan.md §9): follower lists, notifications, comment editing, tuning "popular", a showcase
  archive of past winners.

---

## 🙋 Questions for the User

| # | Question | Why it matters | Until it is answered |
|---|---|---|---|
| 5 | **Hacı's first admin sign-in** — when (his phone, a network that does not block the domain)? | His 2FA factor is not enrolled yet | He cannot use the panel |
| 6 | **The first real showcase period** — when, a week or a month? | Nothing promotes it until a period exists (the feed hides the section) | No period; the feature is invisible |
| 11 | **Who enrols the Apple Developer account, and when?** The user expects it to be in **another person's name** | That person is the App Store publisher (seller name) and must give EAS access (their Apple ID with 2FA, or an App Store Connect API key); Sign in with Apple and every iOS build wait for it | Android only |

---

## 📍 Current State

- **The app's showcase (M8 step 6, 2026-10-15):** `mobile/src/lib/showcase.ts` (`fetchMyApplication`, `fetchMyVotes`,
  `applyToShowcase`, `withdrawShowcaseEntry`, `setShowcaseVote`; revalidates `/feed` and `/` like the site's actions),
  `content.ts` (`fetchShowcase`, `fetchShowcaseWinner` — filtered to approved, visible entries of published recipes, since
  the applicant's own session reads more), `components/Showcase.tsx` above "Bu ay popüler" on the Akış tab (now a
  `KeyboardScrollView`). Shares `src/lib/showcase.ts` (period state and formatting, `PITCH_MAX_LENGTH`, `STATUS_LABELS`).
- **The app's community (M8 step 5, 2026-10-15):** `mobile/src/lib/recipes.ts` (`fetchMyRecipes`, `fetchMyRecipe`,
  `saveRecipe`, `deleteRecipe`, `pickRecipePhoto`, `discardRecipePhoto`, `NEW_RECIPE`, `leaveRecipeForm`), `social.ts`
  (`isFollowing`, `setFollow`, `fetchPublicLog`, `countComments`, `fetchFollowingLogs`, `fetchComments`, `addComment`,
  `deleteComment`), `content.ts` (`fetchRecipe`, `fetchNewRecipes`, `fetchPopularRecipes` — filtered to published and
  visible, since an author's session reads drafts and hidden rows). Components `RecipeForm`, `RecipeActions`
  (`FavoriteButton`, `LogButton`, shared by both recipe screens), `OptionSheet` (units, icons), `FollowButton`,
  `LogComments`; `MemberGate` takes `feature`. Screens `recipes/[slug]`, `my-recipes/index|new|[id]`, `log/[id]`, the Akış
  tab. `logs/new?cocktail=` accepts members' recipes. `leaveAfterSignIn` switches to the feed tab instead of pushing it.
  Nothing in the app opens the website any more except e-mail links and `/privacy`.
- **Half stars, units, locked steps (2026-10-15, ADR-023):** `reviews.rating` and `drink_logs.rating` are
  `numeric(2,1)` 0.5–5 in half steps (PostgREST sends them as numbers). Helpers in `src/lib/community.ts`:
  `isValidRating`, `RATING_ERROR`, `formatRating`, `ratingStars`; `UNITS` / `unitChoices()` in `src/lib/drink-log.ts`.
  `Stars` (site and app) draw and pick halves; the app's input is 32 px and one adjustable control. Log forms
  (site `LogForm`, app `LogForm`) use the unit list and lock the steps; the app's `DateField` has a month calendar.
  The panel's moderation shows ratings with `ratingStars()`. `leave()` in `drink-logs.ts` goes back, or to the list.
- **The app's drink log (M8 step 4, 2026-10-15):** `mobile/src/lib/drink-logs.ts` (`fetchMyLogs`, `fetchMyLog`,
  `fetchPublicLogs` — filtered to public + visible, since the owner's session reads private logs too —
  `saveDrinkLog`, `deleteDrinkLog`, `recipeOf`, `shiftDate`; revalidates `/u/{username}` and `/logs/{id}` like the
  site); components `LogForm` (date stepper, no native picker), `DrinkLogEntry` (own/public, "Bildir", comments
  open on the site), `MemberGate` (sign-in prompt → `askToSignIn(from)`); screens `logs/index`, `logs/new`
  (`?cocktail=`; picker without it), `logs/[id]`; "Günlüğe ekle" on the recipe; "Günlüğüm →" on the account;
  the logs-default switch reloads the session. Checked signed in on 2026-10-15.
- **After sign-in and the keyboard (2026-10-15, ADR-022):** `mobile/src/lib/after-sign-in.ts` (`askToSignIn`,
  `leaveAfterSignIn`, `takePendingFavorite`, `forgetSignInRequest`) — used by the heart (`favorites.tsx`,
  `toggle(id, from)`), the review prompt, the Hesap tab (signed out → member) and `welcome.tsx`;
  `FavoritesProvider.savedOnSignIn` drives the recipe's "Favorilerine eklendi." notice.
  `components/KeyboardScrollView.tsx` on the recipe, Hesap and onboarding screens. The archive's search
  hint is "Kokteyl, malzeme ara".
- **The app's community (M8 step 3, 2026-10-15):** `mobile/src/lib/community.ts` (`fetchReviews`, `saveReview`,
  `deleteReview`, `setFavorite`, `reportContent`, each revalidating the site), `favorites.tsx`
  (`FavoritesProvider` / `useFavorites()`), components `Stars`, `ReportButton` (hidden for signed-out visitors
  and owners), `CocktailReviews`; the recipe screen's heart, the archive's "Favorilerim", the screen
  `u/[username]`. Members' recipes on a profile still open on the site (step 5).
- **E-mail links (2026-10-15, ADR-021):** `/auth/callback` verifies `token_hash` + `type` (`verifyOtp`) besides
  Google's `code`; `NewPasswordForm` asks for the TOTP code on 2FA accounts; `authErrorMessage()` only says
  "8 characters" for real length errors.
- **The app's accounts (M8 step 2, 2026-10-15):** `mobile/src/lib/session.tsx` (`SessionProvider`,
  `useSession()`: loading / signed-out / onboarding / ok with profile and settings), `native-auth.ts`
  (Google through `@react-native-google-signin/google-signin`, loaded with `require` so Expo Go does
  not crash; Apple through `expo-apple-authentication`), `revalidate.ts` (`revalidateSite(paths)` →
  the site's `POST /api/revalidate`), screens `(tabs)/account.tsx` and `welcome.tsx`, components
  `SignIn`, `AccountView`, `Form`, `Avatar`. Shared with the site: `src/lib/profile.ts`
  (`checkProfile`, `profileError`, `suggestUsername`) and `authErrorMessage()` in `account-config.ts`.
  `mobile/.env` holds the Google web and iOS client IDs; `app.json` the google-signin plugin with the
  iOS URL scheme, `expo-apple-authentication`, `expo-image-picker` (photos only). `eas.json`: profiles
  development / preview / production. EAS project `@nefeygt/haci`, Android keystore on EAS (SHA-1
  `01:AE:1B:63:CB:81:EC:A3:20:9F:32:C3:BC:21:5D:2B:43:58:58:A7`).
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
- **Supabase** (ref `qwvnhdghwycqlvsnlvlt`): 14 migrations, the latest `20261015194832_ingredient_catalogue_drafts`.
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

**Browser**
- Claude in Chrome's window had **no haci session** on 2026-10-15 even though the user saw themselves signed in
  elsewhere; the user signed in to the panel (2FA) in the agent's tab when asked. Ask them to do that for panel checks;
  never type a password or code yourself. Its screenshots still time out — use DOM checks.

**Supabase**
- A new house ingredient must exist in `ingredients` first; `save_cocktail` refuses an unlinked line on a house
  recipe (ADR-029). The panel's "Malzemeler" page adds items.
- A build can fail on a transient Supabase 500 ("Could not load cocktails: Internal server error" in
  `generateStaticParams`) — check `get_project` is healthy and run the build again before digging.
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

**This session's lessons (M9 themes)**
- **Tailwind 4 tokens can be themed at runtime:** `@theme` (not `@theme inline`) emits `--color-*`/`--font-*` on
  `:root` and utilities read them, so `:root[data-theme="…"]` overrides work, `/opacity` modifiers included.
- next/font variables must not share names with Tailwind's `--font-*` tokens: they are `--ff-*` and the tokens point at
  them. `preload: false` keeps unused themes' fonts off the first load.
- The navbar at 375 px has no room left: any new item needs something else to shrink (`scrollWidth` check per theme).
- Built-in browser screenshots after a `data-theme` change can show a mix of the old and new frame — read
  `getComputedStyle` before believing a wrong colour.

**Lessons (M9 backup + cl ↔ oz)**
- **Claude in Chrome's screenshots timed out again** (even without a resize) — `javascript_tool`/`get_page_text` worked.
  For visuals use the built-in browser (`preset: "mobile"`); its screenshots can lag a frame — confirm in the DOM.
- In `javascript_tool`, two `.click()`s in a row on a React counter apply once (the handler reads stale state) — wait
  between clicks.
- Google's Rich Results Test takes ~1 minute; `get_page_text` reads its verdict ("1 geçerli öğe algılandı").
- `scripts/backup-content.mjs` runs locally too (`node scripts/backup-content.mjs`); a diff in `backup/` afterwards means
  the panel changed content since the last run.

**Lessons (M9 quick wins)**
- **`mobile/node_modules` can be missing** (a fresh checkout or OneDrive): `npm run typecheck` then fails with
  "File 'expo/tsconfig.base' not found" and dozens of unrelated errors. Run `npm ci` in `mobile/` first.
- **A flex child image shrinks to 0 px** — the navbar's wordmark vanished on phones until the link got `shrink-0`.
  Check `getBoundingClientRect().width` and `document.documentElement.scrollWidth` at 375 px, not just a screenshot.
- **Claude in Chrome's screenshots timed out after `resize_window`** for the rest of the session (the DOM tools still
  worked). The built-in browser's `resize_window` preset `mobile` is the reliable way to see phone width.
- **PowerShell 5.1's `Set-Content -Encoding utf8` writes a BOM** — remove it (`sed -i '1s/^\xEF\xBB\xBF//'`) or edit
  with the Edit tool / Python instead.
- `next start` in a background task "fails" with exit code 255 when stopped by PID — expected.
- Don't click "Paylaş" in automation on desktop Chrome: Windows has `navigator.share`, which opens a native dialog.

**Lessons (M8 step 6)**
- **A showcase test needs no panel:** insert a period in SQL, apply in the app, approve with
  `update showcase_entries set status='approved'` (postgres passes the admin policy), move `starts_at`/`ends_at` to see the
  winner (past) or the upcoming state (future). A recipe's `image_path` only has to be non-null for the rule.
- **A second member in SQL** (`auth.users` with an `@example.invalid` e-mail, then `account_settings`, `profiles`, and its
  rows) covers "someone else's" content; deleting the `auth.users` row cascades everything. Claude in Chrome (signed out of
  the app) gives the visitor's view, the built-in browser the member's.
- On the log screen the report form's "Gönder" comes before the comment box's — pick the first, not the last.
- **A temporary member on the built-in browser's admin login can be made in SQL** (`account_settings` then `profiles` for the
  admin's `auth.users` id) — the app picks it up on reload; delete both rows afterwards (the login stays).
- The Bash tool's `cd mobile && npx expo export` once ran in the repo root ("platforms array: [web]") — run app commands with
  PowerShell `Set-Location …\mobile`.

**Lessons (M8 step 5)**
- **`ImageManipulator` on the web needs both sides in `resize()`** — `{ width, height: null }` works natively but gives
  "source height is zero" in the browser. Pass the computed height.
- **Expo web's image picker opens its file input with `dispatchEvent(new MouseEvent("click"))`**, not `.click()`: to feed it
  a file in the browser, patch `EventTarget.prototype.dispatchEvent` for file inputs (set `input.files` from a
  `DataTransfer`, then dispatch `change`). A canvas-made PNG blob works as the photo.
- **Screens under the top of the stack stay in the DOM** — `querySelector('[aria-label="Yorum"]')` found the recipe screen's
  review field under the log screen. Pick the last match, or match on a placeholder.

**Lessons (M8 step 4 feedback)**
- **The built-in browser works for Expo web** (`localhost:8081`) when Claude in Chrome is down; the user signs
  in there themselves. Its screenshots often show the previous frame — confirm state in the DOM first. A
  coordinate click needs a screenshot taken first in that turn.
- **React Native web keeps a closed `Modal`'s nodes in the DOM** — "is the sheet gone?" must be checked visually.
- **Changing a column's type** needs the views and the `before update of <col>` triggers that use it dropped and
  recreated (`half_star_ratings` does it); column grants survive.
- **A screen opened by URL has nothing to go back to** — `router.back()` silently does nothing; use
  `router.canGoBack()` with a fallback (`leave()`).
- The owner admin `n.efeyigit@outlook.com` had become a member (`sudiii`) by signing in to the app; that profile
  was deleted on 2026-10-15 (the admin login stays). Signing in to the app with it again starts onboarding.

**Lessons (M8 step 4)**
- **Claude in Chrome can be disconnected for a whole session** — `tabs_context_mcp` says so; the user reconnects
  it from Chrome's Claude side panel. Leave the browser check open rather than claim it.
- **A stale Expo server on 8081** makes `npx expo start` ask for another port and quit in non-interactive mode,
  and the typed routes (`.expo/types/router.d.ts`) are not regenerated → `tsc` rejects new routes like `"/logs"`.
  Stop the old one by PID and start again; the types appear within seconds.
- Run the site's `npm run build` with an absolute path (PowerShell `Set-Location`): parallel Bash calls with
  `cd` raced and one ran in `mobile/` ("Missing script: build").

**Lessons (M8 phone pass)**
- **Drive the phone over adb:** `adb exec-out screencap -p > file.png` and Read it; `adb exec-out uiautomator dump
  /dev/tty` gives bounds (`content-desc` = `accessibilityLabel`) for `adb shell input tap x y`; deep links
  `adb shell am start -a android.intent.action.VIEW -d "haci://cocktail/<slug>" tech.hacininkokteylleri.haci`.
  JS logs: `adb logcat -s ReactNativeJS:*`. `adb reverse` is lost on reconnect — set it again.
- **`router.navigate("/account")` from a stack screen pushes a second `(tabs)` navigator** in Expo Router 57
  (back from the recipe went to Hesap; two Hesap tabs both reacted to a sign-in). Dismiss to the root first
  (`router.dismissAll()`), as `askToSignIn` does.
- **Edge to edge Android does not resize for the keyboard** — `KeyboardAvoidingView` with no behaviour does
  nothing; use `KeyboardScrollView`. Effects of a provider run after its children's: the Hesap tab reacts to
  a sign-in before `FavoritesProvider` does.
- **The supabase auth logs show each sign-in** (`/token`, `grant_type=id_token`) — useful to tell whether the
  user actually signed in again.

**This session's lessons (M8 step 3)**
- **E-mail links must carry `token_hash` (ADR-021).** `{{ .ConfirmationURL }}` finishes with the requesting
  client's flow: the app's implicit flow puts tokens in a `#hash` the server never sees, and the site's PKCE
  verifier lives in one browser. The templates in the dashboard now match `supabase/templates/`.
- **The owner admin is also the user's e-mail sign-in.** 2FA accounts need `aal2` for `updateUser({ password })`
  (`insufficient_aal`); the reset form now asks for the code. Error messages must come from the real error —
  the old form said "8 characters" for everything.
- **Supabase's template editor is Monaco:** in a background tab, `monaco.editor.getEditors()` →
  `executeEdits` on the model `file:///code-id`, then click "Save changes" via the DOM ("Successfully updated
  email template"). `history.pushState` does not switch templates — navigate for each one.
- **Expo web deep links before the archive loads:** the recipe screen showed "Bu kokteyl bulunamadı" while the
  archive was still loading — it now shows a spinner until the archive is there.
- **Vercel's deploy state without the dashboard:** `gh api repos/nefeygt/hacininkokteylleri/commits/<sha>/status`
  (`Vercel=success`). The domain is blocked on the office network (curl gets nothing; Chrome shows an error page).

**This session's lessons (M8 step 2)**
- **Supabase answers "sent" for a sign-up with an address that already has an account, and sends
  nothing** (so nobody can probe addresses). The user hit this with `n.efeyigit@outlook.com` (the
  admin). The texts now say so.
- **Chrome autofills the user's saved e-mail and password into the app's sign-in form** on
  `localhost:8081`. Never submit it; signed-in tests need the user to sign in themselves.
- **The google-signin config plugin throws without `iosUrlScheme`** — it is the iOS client ID reversed
  (`com.googleusercontent.apps.…`), already in `app.json`.
- **Google Cloud pages:** the "Free Trial" banner appears a few seconds after load and shifts everything
  down ~40 px; a click aimed at a field hit a help link once. Screenshot right before each click, or go
  straight to `…/auth/clients/create?project=haci-511515&authuser=1`. Client IDs: read them from
  `document.body.innerText` (the screenshot truncates them).
- **expo.dev truncates fingerprints** (`01:AE...58:A7`) and the full value is not in the DOM. Wrap
  `navigator.clipboard.writeText` in `javascript_tool`, then click the copy button.
- `eas build --non-interactive` creates the Android keystore by itself; `eas init --non-interactive
  --force` creates and links the project.
- **Typed routes** (`router.push("/welcome")`) fail `tsc` until `.expo/types/router.d.ts` is regenerated:
  start `npx expo start` once.
- `StyleSheet.absoluteFillObject` is gone in React Native 0.86 — use `StyleSheet.absoluteFill`.
- In a Python script, `"\n"` inside a triple-quoted string becomes a real line break in the TypeScript
  it writes — use the Edit tool for string literals with escapes.
- **The site's pages are not CORS-enabled** — fetch them with curl; only `/api/revalidate` answers
  other origins (bearer tokens, never cookies).
- A background `next start` / `expo start` keeps its node process after `TaskStop`: free ports 3000 and
  8081 by PID (`Get-NetTCPConnection` → `Stop-Process`).

**Lessons from M8 step 1**
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
| Colour theme and font? | **"Rx, readable" is the main look; the other directions and combinations are selectable themes** (ADR-028, 2026-10-15) |
| Backup and oz? | **GitHub Action with the public key, house content + photos; 1 oz = 3 cl** (ADR-027, 2026-10-15) |
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
| Developer accounts? | **Expo: the user's existing account** (username next session). **Google Play: personal, exists.** **Apple: personal**, opened later from an iPhone through the Apple Developer app (~650 TL/yr) — Android goes first (2026-10-14) |
| Expo username? | **`nefeygt`** — EAS project `@nefeygt/haci` (2026-10-15) |
| When was the Play account created? | **After 2023-11-13** → a closed test (12 testers, 14 days) before production; **the user sources the testers** (paid tester services; alternatives offered, their call) (2026-10-15) |
| Play Console developer name? | **"KZN"** — haci is published from the user's personal Play account (2026-10-15) |
| Mobile app: where, scope, platforms, sign-in? | **`mobile/` in this repo; full parity with the site before the first store release; iOS + Android from day one on the user's accounts; native Google + e-mail (+ Sign in with Apple on iOS)** (ADR-020, 2026-10-14) |
| Admins, 2FA, canonical domain, WHOIS, reviews/logs, mobile stack | See ADR-007, 011, 010, plan.md M2, ADR-012, ADR-013 |

---

## 🧭 Look-ahead

- **M8** step 7 (plan.md §6): store release (EAS production builds, Turkish listings, 18+ rating,
  privacy forms, Play's closed test, App Store review).
- Icebox highlights: localization (English first), a `haci` domain.
- M9 after the theme: the user decides what else the site needs before the parity pass and the store.
