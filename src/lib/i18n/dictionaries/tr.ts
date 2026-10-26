// Turkish: the source dictionary (ADR-032). Every other language has exactly this shape (the Dictionary type),
// so a missing key fails the build. Placeholders are {name}; fill them with `format` from ../format.

export const tr = {
  meta: {
    siteDescription: "Sinematik bir kokteyl arşivi: her biri özenle formüle edilmiş kokteyl reçeteleri.",
  },
  nav: {
    home: "Ana Sayfa",
    homeLabel: "{brand} — Ana Sayfa",
    cocktails: "Kokteyller",
    feed: "Akış",
    account: "Hesabım",
    login: "Giriş",
    notifications: "Bildirimler",
    notificationsNew: "Bildirimler, {n} yeni",
    accountNew: "Hesabım, {n} yeni bildirim",
    language: "Dil",
  },
  themes: {
    title: "Görünüm",
    rx: {
      name: "Rx",
      hint: "Varsayılan: koyu, kızıl",
    },
    "night-bar": {
      name: "Gece Barı",
      hint: "Sıcak koyu, kiraz kırmızısı",
    },
    negroni: {
      name: "Negroni",
      hint: "Koyu, acı portakal",
    },
    "night-serif": {
      name: "Gece Serifi",
      hint: "Gece Barı, kâğıdın yazılarıyla",
    },
    paper: {
      name: "Reçete Kâğıdı",
      hint: "Açık, eczane kâğıdı",
    },
    "paper-rx": {
      name: "Kâğıt Rx",
      hint: "Reçete Kâğıdı, Rx'in yazılarıyla",
    },
  },
  status: {
    toCocktails: "Kokteyllere git",
    home: "Ana sayfa",
    notFoundTitle: "Bu reçete bulunamadı",
    notFoundBody: "Aradığın sayfa hiç olmamış, kaldırılmış ya da adresi değişmiş olabilir.",
    errorTitle: "Bir şeyler ters gitti",
    errorBody: "Sayfa yüklenirken bir sorun çıktı. Biraz sonra tekrar dene.",
    retry: "Tekrar dene",
    notFoundMeta: "Bulunamadı",
  },
};
