# Translation glossary — Turkish → English (ADR-032)

Every English string — interface, recipes, e-mails, metadata — follows this file. **A new term goes here first, then
into the text.** Spanish, German… will get a column each. Started 2026-10-26 from the dictionaries, the shared
`src/lib` helpers and the 37 house recipes in the database.

## Style rules

- **Brand:** always lowercase `haci` (`src/lib/brand.ts`, ADR-015). Never "Haci", never "HACI" in prose. (Uppercase
  labels are CSS only.) The person behind the recipes stays **Hacı** (name, with the dotless ı) — "Hacı's recipes".
- **Tone:** the same as the Turkish — warm, short, a bartender talking to a friend; second person ("you"), not
  "the user". Recipe steps are **imperative** and terse ("Muddle the cucumber."), like the Turkish ("Salatalığı ez.").
  No exclamation marks unless the Turkish has one.
- **Capitalisation:** sentence case for headings, buttons and labels ("Go to cocktails", not "Go To Cocktails"). Proper
  names and drink names keep their capitals (Negroni, Blue Curaçao). Chip labels such as flavours are capitalised as in
  the data ("Sweet-Sour").
- **Spelling:** American English (flavor, color, liqueur — "flavor" is also the database column). Numbers: 1,5 → 1.5;
  dates and numbers go through `INTL_LOCALES[locale]`, never hand-formatted.
- **Turkish cocktail names are translated** into a meaningful English name, not word for word (the user,
  2026-10-26); names already in English stay. See "Cocktail names" below.
- **Members' recipes and comments are never translated** — they stay in the language they were written in.
- **Placeholders** `{name}` are kept exactly; word order around them may change.
- **Counts:** a string with `{n}` that needs a singular is written "one|other" (`"{n} vote|{n} votes"`); `format()` picks
  by `n` (`plural()` in `src/lib/i18n/format.ts`). Turkish strings have no "|".
- **Form errors** address the reader ("Pick a rating…"), never blame ("Invalid input").
- **Don't translate:** URLs, slugs, `cl`/`ml`/`oz`, product names (Aperol, Baileys, Jägermeister, Malibu, Prosecco,
  Sprite, Campari), `Top up` (see below), the theme name "Rx".

## Units

| TR | EN | Notes |
|---|---|---|
| cl | cl | house unit; the "cl \| oz" toggle converts at **1 oz = 3 cl** (ADR-027) |
| ml | ml | |
| oz | oz | |
| adet | piece / pieces | "3 adet" → "3 pieces"; singular for 1 |
| yaprak | leaf / leaves | mint, basil, sorrel ("kuzu kulağı") |
| demet | bunch | |
| dilim | slice / slices | |
| dash | dash / dashes | already English in the data |
| kaşık | spoon | |
| bar kaşığı | barspoon | |
| çay kaşığı | teaspoon | |
| tatlı kaşığı | dessertspoon | |
| yemek kaşığı | tablespoon | |
| damla | drop / drops | |

Unit values are a **controlled list stored in its Turkish form** ("adet", "yaprak", …; `UNITS` in `drink-log.ts`).
Every page shows them through `unitLabel()` and the dictionary's `units` section ("adet" → "piece|pieces", singular
for an amount of 1). A unit the list does not know (a member typed it) shows as written. `cl`/`ml`/`oz` never change.

## Ingredient icons (recipe form)

| TR label | EN label |
|---|---|
| Shot / ölçü | Shot / measure |
| Şurup / kaşık | Syrup / spoon |
| Az (dash) | A little (dash) |
| Damla / adet | Drop / piece |
| Dilim / yaprak | Slice / leaf |
| Tamamla (top up) | Top up |

## Glasses

| TR | EN | Notes |
|---|---|---|
| Highball | Highball | |
| Collins | Collins | |
| Rocks | Rocks | also "old fashioned glass", "tumbler" |
| Coupe | Coupe | |
| Martini | Martini | |
| Margarita | Margarita | |
| Şarap Kadehi | Wine glass | |
| Flüt | Flute | |
| Hurricane | Hurricane | |
| Shot | Shot glass | |
| Kupa | Mug | |
| Bakır Kupa | Copper mug | |
| Karaf | Carafe | "Karaf / Pitcher" → "Carafe / Pitcher" |
| Toddy / Kupa | Toddy / Mug | |
| Margarita / Kadeh | Margarita glass | |

Combined values ("Martini / Coupe") keep the slash and the order. `glassKind` matches the field's text for drawing the
glass. English aliases (champagne, copper, carafe) are already in `GLASSES`, so English glass names draw the right icon.

## Base spirits and categories

| TR | EN |
|---|---|
| Votka | Vodka |
| Cin | Gin |
| Rom | Rum |
| Viski | Whiskey |
| Tekila | Tequila |
| Likör | Liqueur |
| Aperitif | Aperitif |
| Sert içkiler | Spirits |
| Likörler ve köpüklü | Liqueurs and sparkling |
| Meyve suları | Juices |
| Şuruplar ve tatlandırıcılar | Syrups and sweeteners |
| Gazlılar, kahve, çay, süt | Sodas, coffee, tea, milk |
| Taze malzemeler | Fresh ingredients |
| Diğer | Other |

"Viski" → **whiskey** (the generic spelling the site uses; "whisky" only inside a product name).

## Flavors (chips and collection pages)

The data writes compound flavors with a hyphen ("Tatlı-Ekşi"); each side is a note. Keep the hyphen and the order,
and translate each note — the filter splits on "-".

| TR | EN |
|---|---|
| Ekşi | Sour |
| Tatlı | Sweet |
| Acı | Bitter |
| Meyveli | Fruity |
| Ferah | Refreshing |
| Baharatlı | Spiced |
| Kahve | Coffee |
| Bitkisel | Herbal |
| Çiçeksi | Floral |
| Tropikal | Tropical |
| Kompleks | Complex |

Compounds: Acı-Tatlı → Bittersweet · Tatlı-Ekşi → Sweet-Sour · Ekşi-Tatlı → Sour-Sweet · Ekşi-Ferah → Sour-Refreshing ·
Ekşi-Baharatlı → Sour-Spiced · Çiçeksi-Ekşi → Floral-Sour · Tatlı-Meyveli → Sweet-Fruity.
"Acı" alone is **Bitter** (taste); in "acı portakal" it is "bitter orange".

## Preparation verbs (recipe steps)

| TR | EN | Notes |
|---|---|---|
| çalkala | shake | shaker + ice |
| karıştır | stir | mixing glass or in the glass |
| ez / ez (muddle) | muddle | keep the "(muddle)" gloss out in English |
| süz / çift süzgeçle süz | strain / double-strain | |
| tamamla / Top up yap | top up / top with | "Top up with tonic." |
| ekle | add | |
| doldur | fill | "fill the glass with ice" |
| soğut | chill | "chilled glass" = soğutulmuş bardak |
| yak / alevlendir | flame / light | flamed orange peel |
| tütsüle | smoke | smoked sage leaf |
| çırp | whisk / shake hard | foam with aquafaba: "dry shake" |
| sertçe çalkala | shake hard | |
| iyice ez | muddle well | |
| buzla / buzlu bardağa | over ice / into an iced glass | |
| kırık buz | crushed ice | |
| buz | ice | |
| bardak | glass | |
| kadeh | glass (stemmed) | coupe, martini, wine |
| shaker | shaker | stays |

## Garnish ("süsleme")

| TR | EN |
|---|---|
| Süsleme | Garnish |
| Yok | None |
| dilim | slice / wheel (lime tekerleği → lime wheel) |
| kabuk | peel (limon kabuğu → lemon peel) |
| dal | sprig (nane dalı → mint sprig) |
| yaprak | leaf |
| şerit / rulo | ribbon / roll (salatalık şeridi → cucumber ribbon) |
| çekirdek | bean (kahve çekirdeği → coffee bean) |
| nar tanesi | pomegranate seed |
| kuru | dried |
| taze | fresh |
| alevlendirilmiş | flamed |
| tütsülenmiş | smoked |

## Catalogue ingredients (52)

Spirits: Cin Gin · Rom Rum · Tekila Tequila · Viski Whiskey · Votka Vodka.
Liqueurs and sparkling: Aperol, Baileys, Jägermeister, Malibu, Prosecco (unchanged) · Blue Curaçao · Kahve Likörü
Coffee liqueur · Portakal Likörü Orange liqueur · Şeftali Likörü Peach liqueur.
Juices: Ananas Suyu Pineapple juice · Cranberry Suyu Cranberry juice · Elma Suyu Apple juice · Greyfurt Suyu Grapefruit
juice · Nar Suyu Pomegranate juice · Portakal Suyu Orange juice.
Syrups and sweeteners: Bal Honey · Blue Curaçao Şurubu Blue curaçao syrup · Çilek Püresi Strawberry purée · Çilek Şurubu
Strawberry syrup · Esmer Şeker Brown sugar · Frambuaz Şurubu Raspberry syrup · Grenadine · Şeker Şurubu Simple syrup ·
Sweet & Sour **Sweet & sour mix** (the catalogue and the recipe lines).
Mixers: Çay Tea · Hibiskus Çayı Hibiscus tea · Kahve Coffee · Kola Cola · Krema Cream · Soda Soda water · Sprite ·
Süt Milk · Tonik Tonic water · Zencefilli Gazoz Ginger soda.
Fresh: Adaçayı Sage · Böğürtlen Blackberry · Çilek Strawberry · Elma Apple · Fesleğen Basil · Kuzu Kulağı **Sorrel**
(garden sorrel, *Rumex acetosa*) · Lime · Limon Lemon · Nane Mint · Salatalık Cucumber · Yumurta Egg.
Other: Aquafaba (unchanged) · Su Water.
Also used in the archive filter: Zencefil Ginger · Campari (unchanged).

## Glossary terms (the tooltips)

| Term TR | Term EN | Definition EN |
|---|---|---|
| Aquafaba | Aquafaba | Vegan-friendly! Chickpea water used instead of egg white to give a cocktail foam. |
| Şeker Şurubu | Simple syrup | The base syrup made by boiling 1 part sugar with 1 part water. |
| Top up | Top up | Fill the rest of the glass with this drink. |

## Cocktail names (2026-10-26)

| TR | EN | Why |
|---|---|---|
| Kuzu Kulağı Devrimi | Sorrel Revolution | |
| Kuzu Kulağı Sour | Sorrel Sour | |
| Ferah Manifesto | Fresh Manifesto | |
| Sovyet Elması | Soviet Apple | |
| Mavi İşçi | Blue Collar | the subtitle is about blue-collar workers |
| Cin Çileği | Gin Berry | "cin" is gin (and a djinn); keeps the short rhyme |
| Klasik Viski Sour | Classic Whiskey Sour | |
| Tekila Sunrise | Tequila Sunrise | the classic's name |
| Fesleğen Frozen | Frozen Basil | |
| yeni yıl (draft) | New Year | |

A new house recipe with a Turkish name gets a row here and an English name in the panel.

## Interface phrases (already translated in `en.ts`, and the ones to come)

| TR | EN |
|---|---|
| Kokteyller | Cocktails |
| Akış | Feed |
| Hesabım | Account |
| Giriş | Sign in |
| Çıkış yap | Sign out |
| Bildirimler | Notifications |
| Telefon bildirimleri | Phone notifications *(push; "push token" in the privacy notice is "notification key (push token)")* |
| Kaç kişilik? | How many glasses? |
| Benzer kokteyller | Similar cocktails |
| Günün kokteyli | Cocktail of the day |
| Elimde ne var? | What do I have? *(the page and its link; the small eyebrow above it reads "What can I make?")* |
| Paylaş | Share |
| Favorilerim | My favorites |
| Günlüğe ekle / Günlüğüm | Add to log / My log |
| Değerlendirme / Yorum | Review / Comment |
| Takip et / Takipten çık | Follow / Unfollow |
| Bildir | Report |
| Gizle / gizlendi | Hide / hidden |
| düzenlendi | edited |
| Vitrin | Showcase |
| Başvur / Oyla | Apply / Vote |
| İnceleniyor / Onaylandı / Reddedildi | Under review / Approved / Declined |
| Tümü | All |
| Önerilen / Puana göre / A–Z | Recommended / By rating / A–Z |
| Tekrar dene | Try again |
| Bulunamadı | Not found |
| Bu reçete bulunamadı | This prescription was not found |
| Reçete | Prescription *(the site's pharmacy-label motif; "recipe" for ordinary use)* |
| Tarif | Recipe |
| Malzemeler | Ingredients |
| Hazırlanışı | Preparation |
| Süsleme | Garnish |
| Bardak | Glass |
| Not | Note |
| Gizlilik | Privacy |
| Hesabı sil | Delete account |
| Katalogda yok | Not in the catalogue |
| Giriş yaptıktan sonra | After you sign in |

Themes: Rx · Gece Barı **Night Bar** · Negroni · Gece Serifi **Night Serif** · Reçete Kâğıdı **Prescription Paper** ·
Kâğıt Rx **Paper Rx**.

## Decisions taken while translating (2026-10-26)

- **Cocktail names:** first kept as written, then translated at the user's request (2026-10-26, table above).
- **Ingredient lines are translated by position** (`ingredient_names`), not through the catalogue, because a recipe's
  line can differ from the catalogue name ("Beyaz Rom" is "White rum" while the catalogue item is "Rum").
- **Kuzu kulağı = sorrel** (garden sorrel). **Viski = whiskey.** **Şampanya (Prosecco) = Sparkling wine (Prosecco)**
  (Prosecco is not champagne). **Kahlua = Kahlúa.** **Çay = tea; hibiscus = petal** for the garnish.
- **"Simple syrup" (English) is one glossary entry** — the Turkish glossary's two rows ("Şeker Şurubu", "Simple Syrup")
  both translate to it, and the page lists it once.
- **Members' recipes and comments are not translated**; on an English page their Turkish terms keep their tooltips
  (`getGlossary(lang, true)`).
- **Page titles:** "Elimde ne var?" is "What do I have?" everywhere (page title, link, form text).

## Final check (2026-10-26, Opus session)

All 38 recipe rows, 52 catalogue rows, 4 glossary rows and `en.ts` were read against this file. Fixed: B-52's garnish
("Flame (optional: light it)", migration `translations_en_review`), English counts in the singular ("1 vote", not
"1 votes"), the hero tagline in sentence case. Confirmed as written: "mint and sugar" in the Mojito follows the Turkish
step; "fine strainer" where the Turkish says "ince süzgeç" and "double-strain" only for "çift süzgeç".

## Inconsistencies found (2026-10-26) — resolve in the final check

1. **"Simple Syrup" and "Şeker Şurubu"** — resolved 2026-10-26: the user kept "Şeker Şurubu"; "Simple Syrup" was
   deleted (no recipe used it).
2. **"Reçete" vs "Tarif"** — the Turkish UI uses both (the prescription motif vs plain recipe). English uses
   "prescription" only for the motif ("This prescription was not found") and "recipe" elsewhere.
3. **Theme hint "Default: dark, crimson"** — the Turkish hint says "kızıl"; "crimson" is right for Rx, but `Gece Barı`
   uses "kiraz kırmızısı" → "cherry red". Don't use "red" for both.
4. **Flavors are free text** in the data (compound flavors with "-"): a new Turkish flavor needs an English row here
   *and* a translation, or the English chip shows the Turkish word.
5. **"Viski"** appears as "Viski" (base) and in product names — whiskey vs whisky spelling decided above.
6. **"Cin"** is "Gin" in English but the Turkish search aliases (`cin` ↔ `gin`, `votka` ↔ `vodka`, `rom` ↔ `rum`)
   live in `archive-filter.ts`; the English chips use the English data so the aliases need to work both ways.
7. **A garnish field holding a whole sentence** ("Bardağın kenarına bir dal taze biberiye ekleyin…") — translate as a
   sentence, in the imperative.
8. **Units are written in the data** ("adet", "yaprak", "demet", "kaşık"): the English page translates the label by
   `unitLabel()` (written), the stored value stays.
9. **Rx's hint** — "Default: dark, crimson" — and Gece Barı's "cherry red" are kept apart on purpose (see 3).
10. **Draft recipe `yeni-yil`** (house, unpublished): lowercase name, no subtitle, no tags, a garnish that is a whole
    sentence; its English is written but the Turkish original should be tidied by Hacı before it is published.
