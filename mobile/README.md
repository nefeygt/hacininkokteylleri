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

Native modules that are not in Expo Go (Google and Apple sign-in, later in M8) need a
development build through EAS: `npx eas-cli@latest build --profile development`.

## Layout

```
src/app/            screens (Expo Router): (tabs)/index (archive), feed, account; cocktail/[slug]
src/components/     the site's components rebuilt for React Native
src/lib/            supabase client, theme, content fetchers, the archive context
assets/images/      icons, rendered from public/brand by scripts/export-brand.mjs (repo root)
.env                public settings only (ADR-008)
```

`@shared/*` resolves to the site's `src/lib/*` (Metro watches that folder): the generated
database types and the browser-safe modules (`archive-filter`, `recipe`, `drink-log`,
`showcase`, `community`, `slug`, `brand`). Keep those free of Next.js imports.
