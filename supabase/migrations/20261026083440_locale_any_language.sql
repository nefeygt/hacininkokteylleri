-- More languages will follow English (the user, 2026-10-26: Spanish, German, Russian, Chinese…), so a
-- locale is any language tag the site knows (src/lib/i18n/locales.ts), not a fixed pair.
alter table public.account_settings drop constraint account_settings_locale_check;
alter table public.account_settings
  add constraint account_settings_locale_check check (locale ~ '^[a-z]{2}(-[A-Za-z]{2,4})?$');
