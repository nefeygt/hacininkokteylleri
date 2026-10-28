# Next Session — Handoff Note

> This file is the starting point for the next session (a new chat, another Claude
> account, another computer, or a different agent). **Copy the prompt below and paste
> it — you shouldn't need to explain anything else.**

**Prepared by session:** 2026-10-28 (parity pass steps 2–3, [sonnet]) · Themes and languages are in the app (ADR-033);
**next is step 4 [sonnet] (recipe screens)**, then 5 and 6 — the same model. The store upload still waits for the Apple account or the user's two other Play apps (ADR-024).
`main` is pushed and deployed.

**Model split (the user, 2026-10-26):** the parity pass runs over several chats. Each step below is tagged
**[opus]** or **[sonnet]**; a session works through consecutive steps of its own tag and stops before a step with the
other tag (see "Model handoff"). **Steps 1–3 are done; the next session is [sonnet]** (steps 4–6).
---

## 📋 Prompt to Copy

```
Hi. We're working on haci (formerly Hacı'nın Kokteylleri) — a Next.js + Supabase cocktail
site (hacininkokteylleri.tech) with an admin panel, growing into a community and mobile apps.

BEFORE YOU START, read these in order:
1. plan.md         — the single source of truth (status board, product, architecture, milestones)
2. next_session.md — this file (what to do, open questions, things that bite)
3. adr.md          — decisions already made and why (don't relitigate them, apply them)
4. docs/glossary.md — the TR → EN terms and style rules; every English word follows it (a new term goes there first)

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
- MODEL HANDOFF: steps in "This Session's Task" are tagged [opus] or [sonnet]. Do the
  consecutive steps that match the model you run on, starting from the first open one.
  Before a step with the other tag: stop, do the end-of-session routine below, then tell
  me in Turkish: "Sıradaki adım [opus|sonnet] — yeni bir sohbette o modelle devam et."
  Also stop and hand off the same way if the context is getting full.

AT THE END OF THE SESSION (before context fills, even if work is unfinished):
- Update plan.md: status board, milestone checkboxes, session log
- Rewrite next_session.md: new state, new task, new open questions
- Add an ADR to adr.md if you made a decision that outlives the session
- Commit and push (main deploys to production — build first)
```

---

## 🎯 This Session's Task — the mobile parity pass (M8, toward production)

The user (2026-10-26): "close M9, move to the mobile parity pass and get production-ready." The app (`mobile/`, Expo SDK
57) did everything the site did on 2026-10-15; since then the site gained everything in **"Web changes since
2026-10-15"** below. Port it, then make the app release-ready.

**The user's answers (2026-10-28, step 1, ADR-033):** the app gets **English**, **all six themes** and **push
notifications** in this pass. So the order is foundations first — themes, then languages — and every feature screen
after them is written themed and bilingual once, not twice.

**Every step's check:** `npm run typecheck` in `mobile/`; the site's `npm run build` when a shared `src/lib` module
changes; the bundles build (`npx expo export ...`, plan.md §5.4); and the changed screens seen in Expo web at phone width
(`npx expo start --web --port 8081`, the built-in browser — read the DOM, screenshots lag) in **Rx and Reçete Kâğıdı**
(one dark, one light) and, from step 3 on, **in Turkish and English**. "Typecheck passed" alone is not done. Commit after
each step; tick the step here; mark the items of "Web changes since 2026-10-15" as you finish them.

1. ✅ **[opus] State check, audit and plan** (2026-10-28). State: `main` clean, 1 docs commit ahead of `origin`; 32
   migrations, the latest `20261026100157_translations_en_names_glossary_dedupe`; 5 Expo patch releases waiting (update in
   step 10). Audit: of the web list only the filter chips (ADR-026) are in the app; everything else is missing (marked in
   the list). The plan below.

2. ✅ **[sonnet] Themes: the runtime and the six palettes** (ADR-028, ADR-033) — done 2026-10-28: `lib/theme.ts` (`PALETTES`, `FONT_SETS`),
   `lib/theme-context.tsx` (`ThemeProvider`, `useTheme`, `useStyles`), all 39 style files converted, `ThemePicker` on the Hesap tab
   (also signed out). **In components the theme is `const theme = useTheme()`; `t` is reserved for the dictionary (step 3)** —
   inside `makeStyles = (t: Theme) => …` `t` is the theme. Checked in Expo web (signed out: archive, recipe, feed, account;
   contrast audit clean in Rx and Reçete Kâğıdı); the signed-in screens (forms, sheets, calendar, stars) are converted the same
   way but **not yet seen** — look at them in step 9 with a temporary member. Original brief:
   - `mobile/src/lib/theme.ts`: keep `space`, `readable`, `alpha`. Replace the single `colors` with
     `PALETTES: Record<ThemeId, Palette>` — the 14 tokens of each theme copied **from `src/app/globals.css`** (Rx's new
     crimson glow `#d0453a`, greys `#b4b1ae` / `#7d7a78`; night-bar = night-serif; paper = paper-rx; `veganBg` is the CSS
     `--color-vegan-bg` hex) — and `FONT_SETS: Record<ThemeId, { display; displayBold; sans; sansBold; mono; monoItalic }>`
     per globals.css lines 28–110: rx and paper-rx Plex Sans / Plex Sans / JetBrains Mono; night-bar Bricolage Grotesque /
     Source Sans 3 / JetBrains Mono; negroni Bricolage / Atkinson Hyperlegible / IBM Plex Mono; paper and night-serif
     Instrument Serif / Atkinson / IBM Plex Mono (Instrument Serif has one weight: its `displayBold` is the regular face).
     `export type Theme = { id: ThemeId; light: boolean; colors: Palette; fonts: FontSet }`.
   - New `mobile/src/lib/theme-context.tsx`: `ThemeProvider` (reads `THEME_STORAGE_KEY` from `@shared/themes` in
     AsyncStorage, `isThemeId`, default `DEFAULT_THEME`; holds the splash until read), `useTheme()` → `Theme & { setTheme }`,
     and `useStyles(make: (t: Theme) => Styles)` = `useMemo(() => StyleSheet.create(make(t)), [t])`.
   - Fonts: `npx expo install @expo-google-fonts/ibm-plex-sans @expo-google-fonts/ibm-plex-mono
     @expo-google-fonts/bricolage-grotesque @expo-google-fonts/source-sans-3 @expo-google-fonts/atkinson-hyperlegible
     @expo-google-fonts/instrument-serif`; load 400 + 700 of the sans/display faces and 400 + 400 italic of the monos in
     `_layout.tsx`; remove `@expo-google-fonts/inter` once nothing uses it.
   - **Convert all 39 files with a module-level `StyleSheet.create`** (`grep -rln "StyleSheet.create" mobile/src`) to
     `const makeStyles = (t: Theme) => StyleSheet.create({...})` + `const styles = useStyles(makeStyles)` inside the
     component; inline `colors.x` → `t.colors.x` from `useTheme()`. Hard-coded rgba colours (`"rgba(20, 83, 45, 0.3)"` in
     `cocktail/[slug].tsx` and others: `grep -rn "rgba(" mobile/src`) → `alpha(t.colors.…)` or `t.colors.veganBg`.
   - `_layout.tsx` / `(tabs)/_layout.tsx`: the navigation theme from `DarkTheme` or `DefaultTheme` by `t.light`;
     `StatusBar style={t.light ? "dark" : "light"}`; `expo-system-ui` `setBackgroundColorAsync(t.colors.bgPrimary)` on change;
     `app.json` `userInterfaceStyle` stays as is (the app picks its own theme, not the phone's).
   - `Type.tsx`: `Heading` → `fonts.displayBold`, `Body` → `fonts.sans` (Plex Sans in Rx: the readable type),
     `Mono`/`Label` → `fonts.mono`. Then go through `Mono` uses: reading text (subtitles, instructions, notes, comments,
     bios, review text) becomes `Body`; amounts, labels, dates, counters stay `Mono` (ADR-028: "mono only for labels").
   - The picker: a "Görünüm" section on the account screen (`AccountView`, also shown to signed-out visitors on the Hesap
     tab) — the six `THEMES` as rows with their two `swatch` colours, name and hint, the current one marked. Words from
     `THEMES` for now (step 3 moves them to `t.themes[id]`).
   - Check: every screen in Rx and Reçete Kâğıdı (light!) — no unreadable text, no leftover dark-only colour; the photo
     placeholders, the tab bar, the headers, `OptionSheet`, `DateField`'s calendar, `Stars`. Rx must look as before except
     the brighter crimson, the greys and the reading font.

3. ✅ **[sonnet] Languages: the runtime, the words and the content** (ADR-032, ADR-033) — done 2026-10-28. `lib/i18n.tsx`
   (`useLocale()` → `{ locale, t, a, setLocale }`; `words()` for plain modules), `lib/i18n/{tr,en}.ts` (app-only words), a codemod-like
   runner converted every string, `src/lib/translations.ts` is shared, `fetchArchive(locale)` loads translated recipes and glossary,
   `LanguagePicker` next to `ThemePicker` (also signed out). Checked in Expo web: Turkish and English at 375 and 320 px, no Turkish
   left in English except "Türkçe" and members' content. **Not yet seen:** signed-in screens in English (forms, comments,
   showcase apply, account) — step 9. Known small leftovers: `a.tabs.logEntry` is a misnamed key (it is the log screen's title);
   `MemberGate`'s `feature` is now `"logs" | "recipes"`; the e-mail links the app asks for carry the language
   (`/en/account`, `/en/reset-password`) — worth a real e-mail test. Original brief:
   - `npx expo install expo-localization`. New `mobile/src/lib/i18n.tsx`: `LocaleProvider` — the language from AsyncStorage
     key `haci.locale`, else the phone's (`getLocales()[0].languageCode === "tr"` → `tr`, anything else → `en`), only
     `PUBLISHED_LOCALES`; `useLocale()` → `{ locale, t, a, setLocale }` where `t = getDictionary(locale)` (from
     `@shared/i18n/dictionaries`, already Next-free) and `a` is the app's own dictionary. `setLocale` also writes
     `account_settings.locale` when signed in (the column and its grant exist; e-mails follow it), like the site's switcher.
   - App-only words: `mobile/src/lib/i18n/tr.ts` (the source, `export const tr = {...}`, `export type AppDictionary = typeof
     tr`) and `en.ts` (`export const en: AppDictionary`) — a missing key fails typecheck. **Use the site's dictionary key
     whenever the Turkish text is the same** (nav, recipe, reviews, logs, account, auth, validation, themes,
     notifications…); only app-only strings go to `a`. English follows `docs/glossary.md` (a new term goes there first).
   - **Convert every Turkish string** (~300 in 41 files: `grep -rlP "[ğüşıöçĞÜŞİÖÇ]" mobile/src`), including the
     `Stack.Screen` titles in `_layout.tsx`, the tab titles, `Alert` texts and placeholders. Shared helpers take the
     words: `authErrorMessage(msg, t.auth)`, `formatLogDate(d, locale)`, `formatAverage(x, locale)`, `formatRating`,
     `formatAmount(i, locale, t)`, `unitLabel(u, n, t)`, `profileError`, `cleanRecipe(..., t.validation)`; counts through
     `format()` ("one|other" — no literal "|" in a template with `{n}`).
   - **`Label`'s `upperTr` must follow the language:** the Turkish rule turns English "drink" into "DRİNK". Use
     `toLocaleUpperCase(INTL_LOCALES[locale])` with the Turkish i→İ fix only for `tr`.
   - Content: `mobile/src/lib/content.ts` / `archive.tsx` load house recipes in the language — extract the site's
     `translateCocktails` merge (`src/lib/content.ts:176`) into a pure, shared `applyCocktailTranslation(cocktail, row)`
     in a new `src/lib/translations.ts` (no Next imports; the site's `content.ts` uses it too → site `npm run build`), and
     a shared `COCKTAIL_TRANSLATION_COLUMNS`. The app reads `cocktail_translations` (and `glossary_term_translations`
     for `GlossaryText`) with the publishable key when `locale !== "tr"`; `ArchiveProvider` reloads on a language change.
     Members' recipes stay as written. A new log of a house recipe starts from the shown language (as on the site).
   - Links to the site carry the language: `localePath(locale, "/privacy")` in `welcome.tsx` and anywhere `SITE_URL`
     is joined (`grep -rn SITE_URL mobile/src`).
   - The picker: a "Dil / Language" row on the account screen next to "Görünüm" (`LOCALE_NAMES`). Theme names and hints
     now come from `t.themes[id]`.
   - Check: every screen in English — no Turkish left except members' content and stored log snapshots; dates and
     ratings in English format; labels uppercased correctly ("İ" in Turkish, "I" in English); 320 px-wide text that
     grew in English still fits (buttons, tab labels, chips).

4. ✅ **[sonnet] Recipe screens** — done 2026-10-28: servings 1–8 and the cl/oz toggle (key `haci.volume-unit`, now `VOLUME_UNIT_KEY`
   in `@shared/recipe`), `ShareButton` (house `/cocktails/{slug}`, members' `/recipes/{slug}`, in the language), "similar" under house
   recipes, `RatingBreakdown` (shared `RATING_COLUMNS`/`toRating` moved to `src/lib/community.ts`). Seen in Expo web: servings,
   oz remembered after reload, similar, share pill. **Not seen:** the breakdown bars (no reviews exist) — check with a
   temporary member in step 9. No `/cocktails?cocktail=` links remain in the app. Original brief:
   - "Kaç kişilik?" stepper 1–`SERVINGS_MAX` (`@shared/recipe`), amounts through `scaleAmount`; the "cl | oz" toggle
     beside it (`isConvertibleUnit`, `convertAmount`, `formatOunces`), the choice in AsyncStorage under the site's key
     (`VOLUME_UNIT_KEY`, `src/components/RecipeDetails.tsx:185` — move it to `@shared/recipe` if it is not exported).
     Words from the site's dictionary (the web `RecipeDetails` shows which keys).
   - "Paylaş": `Share.share({ message: name + url, url })` with `SITE_URL + localePath(locale, "/cocktails/{slug}")`
     (house) or `"/recipes/{slug}"` (members').
   - "Benzer kokteyller" under house recipes: `similarCocktails(cocktail, archive.cocktails, 4)` from
     `@shared/archive-filter`, as `CocktailCard`s linking to `cocktail/[slug]`.
   - Rating breakdown: `withRatings` selects `half_star_counts` too (use the site's `RATING_COLUMNS` / `toRating` —
     share them if they are in the server module), `Rating` gets `halfStars?: number[]`; ten bars from
     `ratingBreakdown()` (`@shared/community`) in `CocktailReviews`, like the web `RatingBreakdown.tsx`.
   - Links the app builds to house recipes open `cocktail/[slug]`, never `/cocktails?cocktail=`
     (`grep -rn "cocktail=" mobile/src`).
   - Check: servings 1 and 8, oz on and remembered after a reload, the share sheet text (web: `navigator.share` may be
     missing — no crash), similar cocktails present and tappable, a cocktail with and without reviews.

5. **[sonnet] Archive tab and feed** (`(tabs)/index.tsx`, `(tabs)/feed.tsx`).
   - Sort: three choices (`ArchiveSort`, `sortCocktails`; labels from the dictionary, not `SORT_LABELS`' Turkish) applied
     after `filterCocktails`.
   - "Günün kokteyli" at the top of the archive: `cocktailOfTheDay(cocktails, todayInTurkey())` from
     `@shared/collections` — a large card; and the house picks the site's home shows (check `src/app/[lang]/(site)/page.tsx`
     for what it lists) — only if they fit without crowding; otherwise note it here.
   - "Elimde ne var?": a new screen `mobile/src/app/what-can-i-make.tsx` opened from a button on the archive tab.
     Catalogue from `ingredients` (+ `ingredient_translations` in English, as the site's `getIngredientCatalogue`),
     chips grouped by `groupByCategory`; results from `matchCocktails` (`@shared/ingredients`) over house recipes **and
     published members' recipes**, showing "can make" and "missing one" like the web `WhatCanIMake.tsx`. The archive
     query selects `cocktail_ingredients.ingredient_id` → `ingredientId`. Picks in AsyncStorage under the site's
     `PANTRY_KEY`. Register the screen title in `_layout.tsx`.
   - Collection chips: skip (optional; note it in the Icebox if not done).
   - Check: each sort, the cocktail of the day matches the site's for today, picking 3 ingredients gives the same result
     as the site.

6. **[sonnet] Forms** (`LogForm.tsx`, `RecipeForm.tsx`).
   - Glass picker: new `mobile/src/components/GlassIcon.tsx` — the 13 paths of `src/components/GlassIcon.tsx` in
     `react-native-svg` (already installed), stroke `t.colors.textSecondary`, selected `crimsonGlow` — and
     `GlassPicker.tsx` (a horizontal row/grid of the 13 `GLASSES` from `@shared/glasses` with names from the dictionary;
     `glassKind()` reads a stored free-text value). Used in the log form and the recipe form instead of the free text.
   - The catalogue select per ingredient line in `RecipeForm`: an `OptionSheet` of the catalogue (`groupByCategory`),
     "Katalogda yok" as the empty choice, the hint and the "{n}/{total} malzeme katalogda" counter (`isFullyLinked`),
     words from the site's dictionary (the web recipe form shows which). `ingredientId` already survives an edit.
   - Check: create and edit a log and a member's recipe with a glass and linked lines (temporary `@example.test` member,
     deleted afterwards); the recipe then appears in "Elimde ne var?".

7. **[opus] Community** — notifications, follower lists, comment editing (ADR-030).
   - Notifications screen `mobile/src/app/notifications.tsx`: `NOTIFICATION_COLUMNS`, `NOTIFICATIONS_SHOWN`,
     `describeNotification(row, t)`; map its `href` (`/u/x`, `/logs/id`, `/account`, recipe paths) to app routes;
     mark read on opening (the site's `NotificationsSeen` shows the update); a badge with the unread count on the Hesap tab
     (`tabBarBadge`), refreshed on focus.
   - Follower lists: the profile's counts open two lists (the site's `FollowList.tsx` and its query).
   - Comment editing in `LogComments`: "Düzenle", save → `edited_at`, "düzenlendi" — the RLS policy
     `log_comments_one_update_policy` decides what may change.
   - The app writes straight to the database: check every write against its policy; test signed in with a temporary
     `@example.test` member (delete it afterwards).

8. **[opus] Push notifications** (ADR-033).
   - **The user first:** a Firebase project with Android FCM (google-services.json in `mobile/`, the FCM V1 service-account
     key uploaded to EAS credentials) — the user does the console steps in their Chrome; iOS waits for the Apple account.
   - `npx expo install expo-notifications`; `app.json` plugin; ask permission only after sign-in and on a clear action (not
     on launch); `getExpoPushTokenAsync({ projectId })` → upsert.
   - Schema (ADR-009, migration + types + advisors): `push_tokens (token text primary key, user_id uuid not null references
     auth.users on delete cascade, platform text check in ('ios','android'), created_at, last_seen_at)` with RLS — members
     select/insert/update/delete only their own rows; `account_settings.push_notifications boolean not null default true`
     (+ grant update) and a switch on the account screen next to the e-mail switch.
   - Sender: an Edge Function `send-push-notifications` called by an `after insert` trigger on `notifications` through
     `pg_net` (as the e-mail schedule calls its function) — it reads the row and the member's tokens with the service
     role inside the function (never in the app, ADR-007), builds the text with `describeNotification` in the member's
     `account_settings.locale`, posts to `https://exp.host/--/api/v2/push/send`, and deletes tokens Expo reports as
     `DeviceNotRegistered`. Decide whether a pushed notification skips the e-mail digest (record it in ADR-033).
   - Tapping a push opens the same route as the notifications screen.
   - The privacy notice gets a line about push tokens (both languages; **the user approves the text**; bump
     `PRIVACY_NOTICE_VERSION` only if the policy says so).
   - Check: a development build on the user's phone receives a push from a follow by the temporary member.

9. **[sonnet] Sweep** — run the whole app once in each of the 6 themes × 2 languages at 320 and 390 px; fix what is off;
   empty the "Web changes" list (every item done or "web-only").

10. **[opus] Release readiness:** `npx expo install --check` (the 5 patch releases), `npx expo-doctor`, `app.json`
    version/`versionCode`/permissions (photos, notifications), a new development build (`eas build`), the user's phone
    pass, then the store steps under the parked section.

**While porting:** keep `@shared/*` modules free of Next imports; mark each item of the list below done (or "web-only")
as you go, so the list ends empty.

**Waiting for the user (do not block on them):** notifications signed in; Search Console sitemap (now with `/en` alternates);
the first run/schedule of `cleanup-photos.yml`; **`RESEND_API_KEY`** in Supabase secrets (the `/privacy` digest line is live since 2026-10-26); Rx crimson labels for AA. **Videos: dropped** (the user).

**Things that bite (translation step 3):**
- The navbar has no room at 320 px: the language switcher shows only its icon below 360 px and the gaps shrink there.
  A new navbar item needs the same check (`scrollWidth` in a 320 px iframe).
- `format()` treats a "|" in a template with `{n}` as "one|other" — don't put a literal "|" in such a string.
- Auth e-mail links (Supabase templates) carry no `next`, so a reset from an English page lands on the Turkish reset page.

**Things that bite (translation step 2):**
- **No git identity on the DESKTOP-ELV0EC4 machine:** `git -c user.name=nefeygt -c user.email=n.efeyigit@outlook.com
  commit …`. **Its network blocks the domain:** use check-host.net (plan.md §5.4) and `gh`.
- `[lang]/layout.tsx` must not set `dynamicParams = false` (children inherit it; profiles 404'd).
- After moving app files, `rm -rf .next` before `tsc` (stale validator types).
- Imports of actions are `@/app/[lang]/(site)/...` now.
- A `loading.tsx` in `(site)` makes missing pages answer 200 — don't add one.
- The auto-mode classifier refuses calling the photo-cleanup function (bulk delete): leave its runs to the user.
- Fake data for testing: `auth.users` with `@example.test` e-mails + profiles; delete with
  `delete from auth.users where email like '...@example.test'` (cascades). Never touch `ahmet_kafa`/`mustafa_hayat`.

**While doing web work:** add user-visible changes to the list below (the app's checklist); a change in a shared
`src/lib` module must keep `mobile/` compiling (`npx tsc --noEmit` there).

### Web changes since 2026-10-15 (for the parity pass)

**Audit 2026-10-28 (step 1):** only the filter chips are in the app (typecheck only — see them in Expo web in step 2).
Every other item below is **missing** and planned in the step named in brackets; web-only items are marked so.

- ✅ [step 4, done] **House recipe pages `/cocktails/{slug}`** (ADR-025). The app already has a recipe screen (`cocktail/[slug]`); for
  parity: a "share" link should use the site's URL, and links the app opens to house recipes should point here,
  not to `/cocktails?cocktail=`. The magnifier/quick card is a web-only pattern.
- **Filter chips from the data** (ADR-026) — **already in the app**: `(tabs)/index.tsx` uses `baseChoices` /
  `flavorChoices`, and the shared `filterCocktails` matches flavour notes. Typecheck passed; not yet seen in Expo web.
- ✅ [step 4, done] **"Kaç kişilik?"** (1–8 glasses) on the recipe: port to the app's recipe screens with `SERVINGS_MAX` and
  `scaleAmount` from `@shared/recipe`.
- ✅ [step 4, done] **"Paylaş"** on recipes: React Native's `Share.share({ message, url })` with the site's URL
  (`/cocktails/{slug}` or `/recipes/{slug}`).
- ✅ [step 4, done] **"Benzer kokteyller"** under house recipes: `similarCocktails(target, archive, 4)` from `@shared/archive-filter`.
- The wordmark and the recipe JSON-LD are web-only (the app has its own header; no SEO).
- **The Letterboxd icon is gone from the navbar** (the user, 2026-10-15). The app never had it — nothing to port.
- [step 5] **"Elimde ne var?"** (ADR-029): a screen (or a section on the archive tab) with chips from `ingredients`
  (`groupByCategory`) and `matchCocktails` from `@shared/ingredients`; the app's cocktail query must select
  `cocktail_ingredients.ingredient_id` and map it to `ingredientId`. Keep the choice in AsyncStorage.
- ✅ [step 2, done] **Themes and readable type** (ADR-028): the app's `mobile/src/lib/theme.ts` copies Rx's new colours (brighter
  crimson glow `#d0453a`, greys `#b4b1ae` / `#7d7a78`); reading text in IBM Plex Sans, mono only for labels
  (`@expo-google-fonts/ibm-plex-sans`); a theme choice from `@shared/themes` (`THEMES`) on the account screen, kept in
  storage — or decide with the user that the app stays Rx only.
- [step 6] **Members' recipes in "Elimde ne var?"** (ADR-029 amendment): the app's recipe form needs the catalogue select per
  line ("Katalogda yok", the hint and the counter, `isFullyLinked` from `@shared/ingredients`); catalogue from
  `ingredients` (`groupByCategory`). It already keeps `ingredientId` through an edit and revalidates `/what-can-i-make`.
- ✅ [step 3, done] **Languages** (ADR-032, English live 2026-10-26): the app is Turkish only; for parity it could read
  `@shared/i18n` dictionaries and `cocktail_translations` — decide with the user in the parity pass.
- **Share cards and 404/error screens** (M9 A, 2026-10-26): web-only (the app has no link previews); the app's own
  error states are already its own.
- [step 7] **Notifications** (ADR-030): a screen with `NOTIFICATION_COLUMNS` and `describeNotification` from
  `@shared/notifications` (links map to the app's screens), a badge on the account tab with the unread count, mark
  read on opening. Push notifications are a separate decision.
- [step 5, optional] **Collections and the glossary** (M9 C): web-only SEO pages; the app could later show the collection chips
  (`collections` from `@shared/collections`) on its archive tab — optional.
- [step 5] **Sort and "Günün kokteyli"** (M9 D): the app's archive tab gets the three sort choices (`sortCocktails`,
  `SORT_LABELS` from `@shared/archive-filter`); its home/feed could show `cocktailOfTheDay` and the house picks.
- ✅ [step 4 done; follower lists step 7] **Rating breakdown** (M9): the app's recipe screen reads `half_star_counts` with the rating and draws the ten bars
  (`ratingBreakdown` from `@shared/community`). **Follower lists**: profile counts open two lists in the app.
- [step 7] **Comment editing** (M9): the app's log comments get "Düzenle" and "düzenlendi" (`edited_at`).
- [step 6] **Glass picker** (M9): the app's log and recipe forms pick the glass by drawing (`GLASSES`, `glassKind` from
  `@shared/glasses`; the 13 paths of `GlassIcon.tsx` move to react-native-svg).
- ✅ [step 4, done] **"cl | oz"** on recipes (ADR-027): a toggle beside "Kaç kişilik?" with `convertAmount`, `formatOunces`,
  `isConvertibleUnit` from `@shared/recipe`; remember the choice (AsyncStorage or the app's existing storage).

---

## 📦 After the parity pass — M8 step 7: the store release, Android first (ADR-024)

**The upload waits** until the Apple Developer account is open, or the user's two other Play apps are ready to share a
closed test — the user decides. **The parity pass (this session's task) comes first**; everything below that needs no
store account (packages, a production build, listing drafts) can follow it. Then:

### State check (when resuming)

`git status` — clean, `main` in step with `origin/main`. **Tools:** the Supabase MCP (`list_migrations` on
`qwvnhdghwycqlvsnlvlt` → 32, the latest `20261026100157_translations_en_names_glossary_dedupe`) and a browser: **Claude in Chrome was
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

None open. Step 8 needs the user's Firebase/FCM console steps; the privacy line for push needs their approval.

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
- **Supabase** (ref `qwvnhdghwycqlvsnlvlt`): 15 migrations, the latest `20261015203143_recipe_ingredient_links`.
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

**Lessons (translation step 2)**
- **The Bash tool eats backslashes and trips on apostrophes in heredocs** (Turkish text, regexes with `\s` or `\.`): write
  scripts and files with the Write tool, then run them. A Python file named `types.py` in the scratch folder shadows the
  standard library (`import json` ran it and edited `database.types.ts` twice); never name scratch files after stdlib modules.
- The dictionaries grow by a JSON of `{section: {tr: {...}, en: {...}}}` appended to both files by a script (read the two
  files, refuse a key mismatch, insert before the final `};`). A parity script — same keys, same `{placeholders}`, no Turkish
  letters in `en` — caught nothing at the end, but is worth rewriting for every new batch.
- **Auto-mode classifier:** it refused a temporary `PUBLISHED_LOCALES = ["tr", "en"]` + dev server ("production deploy").
  Publishing English is the user's decision; test the two-language output as part of the planned publish.
- A child `generateStaticParams` receives the parent's params as a plain object (`{ params: { lang } }`), not a Promise.
- `AccountCard` stays a server component (it exports class-name constants other files import): its translated eyebrow is the
  client component `AccountEyebrow`.
- Server actions never see route params: use `actionDictionary()` (it reads the referer; Turkish when the header is missing).
- Git prints a CRLF warning for every file on `add`/`diff`; send stderr to `/dev/null` to keep the output readable.

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
| English in the app? | **Yes, in this pass** (the user, 2026-10-28; ADR-033) |
| Themes in the app? | **All six**, picker on the account screen (the user, 2026-10-28; ADR-033) |
| Push notifications? | **Yes**, besides the in-app list and the e-mail digest (the user, 2026-10-28; ADR-033) |
| More languages after English? | **Not now** — Turkish and English are enough; Icebox (the user, 2026-10-26) |
| Close M9? | **Yes** — next is the mobile parity pass and production readiness (the user, 2026-10-26) |
| English privacy notice? | **Approved as drafted, with the digest line** in both languages (the user, 2026-10-26; version `2026-10-26.2`) |
| Translate cocktail names? | **Yes — meaningful, not literal** (the user, 2026-10-26); 10 Turkish names translated |
| `yeni-yil` draft? | **Either way** — its English is ready; Hacı may tidy it (the user, 2026-10-26) |
| "Simple Syrup" vs "Şeker Şurubu"? | **Keep "Şeker Şurubu"**; "Simple Syrup" deleted (the user, 2026-10-26) |
| Test the panel's translation editors? | **Not needed** — only Hacı and the user use the panel (the user, 2026-10-26) |
| Hacı's first admin sign-in? | **When we are ready to launch** (the user, 2026-10-26) — his 2FA is enrolled then |
| The first real showcase period? | **Opens at the public launch**, so people start using it (the user, 2026-10-26) |
| Who enrols the Apple Developer account? | **Şükrü Balta** — not opened yet (2026-10-26); he is the App Store publisher and gives EAS access |
| The two other Play apps (shared closed test)? | **One is nearly ready; no rush** (the user, 2026-10-26) |
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

- **M8 parity pass** (now), then step 7 (plan.md §6): production builds, Turkish listings, 18+ rating, privacy forms,
  Play's closed test, App Store review — the upload waits for ADR-024's condition.
- Before a public launch (outside code): `RESEND_API_KEY` in Supabase secrets, Hacı's first admin sign-in with 2FA,
  the first showcase period, DMARC beyond `p=none`, auth e-mails out of Outlook's spam.
- Icebox highlights: more languages, a `haci` domain, videos.
