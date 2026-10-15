# haci — the mobile app

The Expo app (iOS and Android) for haci, built in milestone M8 (ADR-013, ADR-020). It talks to
the same Supabase project as the website; the database's policies are the rules.

The project's docs live at the repository root: `plan.md` (status and milestones), `adr.md`
(decisions), `next_session.md` (the current task). Read them first.

## Run

```bash
cd mobile
npm install
npx expo start          # scan the QR code with Expo Go (SDK 57) on a phone on the same network
npx expo start --web    # a quick look in a browser at http://localhost:8081
npm run typecheck
npx expo-doctor
```

Native modules that are not in Expo Go (Google and Apple sign-in) need a development build
through EAS on the `@nefeygt/haci` project (`eas.json`): `npx eas-cli@latest build --profile
development --platform android`, install the APK on the phone, then `npx expo start` and open the
project from the development build instead of Expo Go. In Expo Go and on the web the Google button
is hidden; e-mail sign-in works everywhere.

## Layout

```
src/app/            screens (Expo Router): (tabs)/index (archive), feed, account; cocktail/[slug]; welcome (onboarding)
src/components/     the site's components rebuilt for React Native
src/lib/            supabase client, theme, content fetchers, the archive context, the session
                    (session.tsx), native Google/Apple sign-in (native-auth.ts), revalidateSite()
assets/images/      icons, rendered from public/brand by scripts/export-brand.mjs (repo root)
.env                public settings only (ADR-008)
```

`@shared/*` resolves to the site's `src/lib/*` (Metro watches that folder): the generated
database types and the browser-safe modules (`archive-filter`, `recipe`, `drink-log`,
`showcase`, `community`, `slug`, `brand`, `profile`, `account-config`).

After every write the app calls `revalidateSite(paths)` (`src/lib/revalidate.ts`) so the site's
static pages show it: `POST /api/revalidate` with the member's token (ADR-020). Keep those free of Next.js imports.
