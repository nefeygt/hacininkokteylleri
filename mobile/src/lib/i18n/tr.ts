// The app's own Turkish words: what the site's dictionary (src/lib/i18n/dictionaries) does not have (ADR-033).
// Turkish is the source; en.ts has exactly this shape, so a missing key fails typecheck. Placeholders are {name};
// fill them with `format` from @shared/i18n/format. Use the site's key whenever the Turkish text is the same.

export const tr = {
  nativeAuth: {
    googleNoToken: "Google bir kimlik vermedi. Tekrar dene.",
    noPlayServices: "Bu cihazda Google Play hizmetleri yok.",
    googleUnavailable: "Google ile giriş bu sürümde çalışmıyor.",
    appleNoToken: "Apple bir kimlik vermedi. Tekrar dene.",
    appleFailed: "Apple ile giriş tamamlanamadı. Tekrar dene.",
  },
  recipes: {
    ingredientMissing: "Katalogdaki bir malzeme bulunamadı. Tarifi kapatıp yeniden aç.",
    photoTooBig: "Fotoğraf çok büyük. Başka bir fotoğraf dene.",
  },
  tabs: {
    account: "Hesap",
    logEntry: "Günlük kaydı",
  },
  account: {
    lastStep: "Son bir adım",
    lastStepBody: "Kullanıcı adını seç ve 18 yaşından büyük olduğunu onayla.",
    completeProfile: "Profilini tamamla",
  },
  feed: {
    recipesLoadFailed: "Tarifler yüklenemedi. Tekrar dene",
    completeProfileFirst: "Takip ettiğin kişilerin günlükleri için önce profilini tamamla.",
    signInToSee: "Takip ettiğin kişilerin içki günlüklerini burada görmek için giriş yap.",
  },
  archive: {
    loadFailed: "Kokteyller yüklenemedi.",
    searchPlaceholder: "Kokteyl, malzeme ara",
  },
  load: {
    log: "Kayıt yüklenemedi. Tekrar dene",
    logs: "Kayıtlar yüklenemedi. Tekrar dene",
    recipe: "Tarif yüklenemedi. Tekrar dene",
    recipes: "Tarifler yüklenemedi. Tekrar dene",
    profile: "Profil yüklenemedi. Tekrar dene",
    reviews: "Değerlendirmeler yüklenemedi. Tekrar dene",
    comments: "Yorumlar yüklenemedi. Tekrar dene",
  },
  notFound: {
    log: "Bu kayıt bulunamadı.",
    logPublic: "Bu kayıt bulunamadı ya da artık herkese açık değil.",
    recipe: "Bu tarif bulunamadı.",
    profile: "Bu profil bulunamadı.",
  },
  gate: {
    logsSignIn: "İçki günlüğü için giriş yap.",
    logsFinish: "İçki günlüğü için önce profilini tamamla.",
    recipesSignIn: "Tarif yazmak için giriş yap.",
    recipesFinish: "Tarif yazmak için önce profilini tamamla.",
  },
  myRecipes: {
    newSubtitle: "Kendi tarifini yaz. Yayınladığında profilinde ve akışta görünür.",
    editLabel: "{name} tarifini düzenle",
  },
  recipe: {
    savedToFavorites: "Favorilerine eklendi.",
  },
};

export type AppDictionary = Strings<typeof tr>;

type Strings<T> = { [K in keyof T]: T[K] extends string ? string : Strings<T[K]> };
