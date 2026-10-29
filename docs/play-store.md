# Google Play — store listing and forms

Drafts for M8 step 7 (ADR-024), written 2026-10-29 from `/privacy` (version `2026-10-28`) and the app as it is after the
parity pass. **Approved by the user on 2026-10-29** (§1–3 and §5–7 as written; §4 still to make). **Nothing is submitted
yet.** The user does anything that needs their password or a payment.

## 1. App details

| Field | Value |
|---|---|
| App name | `haci` |
| Package | `tech.hacininkokteylleri.haci` |
| Default language | Turkish (tr-TR); English (en-US) as a translation |
| App or game | App |
| Free or paid | Free |
| Category | Food & Drink |
| Tags (pick up to 5 in the console) | Recipes, Cocktails, Drinks, Social |
| Contact e-mail | `contact@hacininkokteylleri.tech` |
| Website | `https://hacininkokteylleri.tech` |
| Privacy policy URL | `https://hacininkokteylleri.tech/privacy` |
| Account deletion URL | `https://hacininkokteylleri.tech/privacy#delete-account` |

## 2. Store listing — Turkish (the default)

**App name** (30 characters at most): `haci — kokteyl tarifleri`

**Short description** (80 at most):

> Hacı'nın kokteyl arşivi, içki günlüğün ve kokteyl seven bir topluluk.

**Full description** (4,000 at most):

```
haci, Hacı'nın kendi elinden çıkan kokteyl tariflerini ve onları yapan, yazan, puanlayan bir topluluğu bir araya getirir.

TARİFLER
• Hacı'nın arşivi: her tarifin malzemeleri, ölçüleri, bardağı ve hazırlanışı
• Baz içkiye ve tada göre filtrele, ara, sırala; her gün yeni bir "Günün kokteyli"
• "Kaç kişilik?" ile ölçüleri 1–8 kadeh için ayarla, cl ile oz arasında geç
• "Elimde ne var?": evdeki malzemeleri seç, hemen yapabileceklerini ve tek malzemesi eksik olanları gör

İÇKİ GÜNLÜĞÜ
• İçtiğin kokteyli tarihi, puanı ve notuyla kaydet; tarifi yaptığın hâliyle sakla
• Kayıtların varsayılan olarak yalnızca sana görünür; istersen herkese aç

TOPLULUK
• Kendi tariflerini fotoğrafıyla yaz ve yayınla
• Tariflere puan ver, değerlendirme yaz, favorilerine ekle
• Üyeleri takip et; akışta onların kayıtlarını ve popüler tarifleri gör
• Vitrin: tarifinle başvur, beğendiklerine oy ver
• Biri seni takip ettiğinde, kaydına yorum yazdığında ya da tarifini değerlendirdiğinde bildirim al

SENİN UYGULAMAN
• Altı görünüm, koyu ve açık
• Türkçe ve İngilizce
• Reklam yok; verilerin satılmaz

haci yalnızca 18 yaşından büyükler içindir. Alkolü sorumlulukla tüket.
```

## 3. Store listing — English (translation, follows `docs/glossary.md`)

**App name:** `haci — cocktail recipes`

**Short description:**

> Hacı's cocktail archive, your drink log and a community of cocktail lovers.

**Full description:**

```
haci brings together Hacı's own cocktail recipes and a community that makes, writes and rates them.

RECIPES
• Hacı's archive: every recipe's ingredients, amounts, glass and preparation
• Filter by base spirit and flavor, search, sort; a new "Cocktail of the day" every day
• "How many glasses?" scales the amounts from 1 to 8; switch between cl and oz
• "What do I have?": pick what's in your kitchen and see what you can make now and what is one ingredient away

DRINK LOG
• Log the cocktail you had with its date, rating and notes; keep the recipe as you made it
• Your entries are visible only to you by default; make them public if you like

COMMUNITY
• Write and publish your own recipes with a photo
• Rate recipes, write reviews, add favorites
• Follow members; see their entries and popular recipes in the feed
• Showcase: apply with your recipe, vote for the ones you like
• Get notified when someone follows you, comments on your entry or reviews your recipe

YOUR APP
• Six themes, dark and light
• Turkish and English
• No ads; your data is never sold

haci is for people over 18 only. Please drink responsibly.
```

## 4. Graphics (to make)

| Asset | Spec | Source |
|---|---|---|
| App icon | 512 × 512 PNG, 32-bit | `scripts/export-brand.mjs` (add a 512 px output) |
| Feature graphic | 1024 × 500 PNG/JPEG, required | new — the wordmark on the Rx background |
| Phone screenshots | 2–8, 9:16 or 16:9, 320–3840 px per side | the phone (`adb exec-out screencap -p`) in Rx: archive, recipe with servings, "Elimde ne var?", log form with the glass picker, feed, profile; a set per language |

## 5. Data safety form

Play counts data that leaves the device. Service providers that process data on haci's behalf (Supabase, Vercel,
Resend, Expo, Google sign-in, ImprovMX — `/privacy` §4) are **not "sharing"** in Play's sense, and what members choose
to make public is user-initiated, so **no data is shared**.

- Does the app collect or share any of the required user data types? **Yes**
- Is all user data encrypted in transit? **Yes** (HTTPS to Supabase and the site)
- Do you provide a way for users to request that their data is deleted? **Yes** (in the app: Hesap → delete account;
  on the web: `/privacy#delete-account`)

| Category → type | Collected | Shared | Required or optional | Purposes |
|---|---|---|---|---|
| Personal info → Email address | Yes | No | Required (for an account) | Account management, App functionality |
| Personal info → Name (username, display name; Google account name on Google sign-in) | Yes | No | Required | Account management, App functionality |
| Personal info → User IDs (account ID; Google account ID on Google sign-in) | Yes | No | Required | Account management |
| Photos and videos → Photos (profile photo, recipe photos) | Yes | No | Optional | App functionality |
| App activity → Other user-generated content (reviews, ratings, log entries, recipes, comments, "about" text, showcase pitch) | Yes | No | Optional | App functionality |
| App activity → Other actions (favorites, follows, showcase votes) | Yes | No | Optional | App functionality |
| Device or other IDs (push token) | Yes | No | Optional | App functionality (notifications) |

Not collected: location, financial info, health, messages, contacts, calendar, audio, files, web history, installed
apps, search history, crash logs or diagnostics (no crash reporter in the app). The password is not "collected" by the
app as a data type of its own (it is part of signing in; stored only as a hash by Supabase Auth).

Supabase's server logs hold IP addresses (`/privacy` §2 "Technical records"). Play asks about IP only when it is used to
derive location; haci does not, so it is not declared (the user agreed, 2026-10-29).

## 6. Content rating (IARC questionnaire)

- Category: **"All other app types"** (not a game, not a store).
- Violence, fear, sexuality, crude humour, profanity: **No**.
- Controlled substances — references to alcohol: **Yes** (the app is about cocktails). Depicts or encourages use: the
  recipes show how to make drinks — answer **Yes** to references/depiction, **No** to tobacco and drugs.
- Gambling or simulated gambling: **No**.
- Users can interact or exchange content: **Yes** (comments, reviews, public log entries, recipes; moderated with
  reports and hiding by admins).
- Shares the user's location with others: **No**.
- Digital purchases: **No**.
- Expected: a mature rating (alcohol). The rating is whatever IARC returns; nothing to choose.

## 7. Other declarations

- **Target audience:** 18 and over only (the app asks every new member to confirm they are over 18). Not designed for
  children; no Families programme.
- **Ads:** the app contains no ads.
- **App access:** some features need an account. Play's reviewers get a test account — **the user creates it** by signing
  up on the site or in the app (e-mail + password, a normal member, no admin rights, onboarding finished so a profile
  exists) and pastes the credentials into the console. The agent does not create accounts or set passwords; the
  credentials are never stored in this repository.
- **Account deletion (web link):** `https://hacininkokteylleri.tech/privacy#delete-account` — section 7 of the privacy
  notice, "haci hesabını silmek" (added 2026-10-29, text approved by the user): the steps in the app and on the site, and
  e-mail to `contact@` for members who can't sign in. No new processing, so `PRIVACY_NOTICE_VERSION` stays `2026-10-28`.
- **News, health, financial features, government, COVID-19:** none.
- **Alcohol policy:** the app does not sell or facilitate the sale of alcohol — recipes only.

## 8. Before the upload

1. The production AAB: build `2df42d3d-bf6b-45a3-9c6b-651bca1a9339` (versionCode 2, 2026-10-29) on EAS — finished, `.aab` ready.
2. The upload itself waits for ADR-024's trigger (the Apple account, or the user's two other Play apps for a shared
   closed test).
3. After the first upload: Play's app-signing SHA-1 → a further Android OAuth client in Google Cloud `haci-511515` and its
   client ID in Supabase's Google provider, or Google sign-in fails in Play-installed builds. **The same SHA-1 also goes on the
   Firebase "Android key"** (Google Cloud `haci-1def7` → Credentials → Android key → Android restrictions → Add, package
   `tech.hacininkokteylleri.haci`), or push notifications fail in Play-installed builds: the key is restricted to the app's
   signing certificates since 2026-10-29.
