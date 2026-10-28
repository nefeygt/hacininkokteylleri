import type { Locale } from "@/lib/i18n/locales";

// The privacy notice's text per language (ADR-032). It lives here, not in the dictionaries, because the dictionaries
// ship whole to the browser and this text is only needed on /privacy. The Turkish text governs; every other language
// is a translation the user approved, and changes together with it (bump PRIVACY_NOTICE_VERSION).
// "{brand}", "{site}", "{controller}" and "{contact}" are filled by the page; "{contact}" becomes a mailto link.

export type PrivacyNotice = {
  metaTitle: string;
  metaDescription: string;
  version: string;
  title: string;
  /** Only in translations: which text governs, with "{turkish}" as the link to the Turkish page. */
  governs: string | null;
  governsLink: string;
  draft: string;
  controllerTitle: string;
  controller: string;
  dataTitle: string;
  data: string[];
  purposesTitle: string;
  purposes: string[];
  noAds: string;
  processorsTitle: string;
  processorsIntro: string;
  processors: string[];
  transfers: string;
  retentionTitle: string;
  retention: string;
  rightsTitle: string;
  rightsIntro: string;
  rights: string[];
  rightsOutro: string;
};

export const PRIVACY_NOTICE: Record<Locale, PrivacyNotice> = {
  tr: {
    metaTitle: "Aydınlatma Metni",
    metaDescription: "Kişisel verilerin nasıl işlendiğine dair KVKK aydınlatma metni.",
    version: "Rx · Sürüm {version}",
    title: "Kişisel Verilerin İşlenmesine İlişkin Aydınlatma Metni",
    governs: null,
    governsLink: "",
    draft: "Taslak: üyelik açıldığında yürürlüğe girer.",
    controllerTitle: "1. Veri sorumlusu",
    controller:
      "{brand} ({site}) bir kokteyl tarifleri platformudur. 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamındaki veri sorumlusu: {controller}. Bize {contact} adresinden ulaşabilirsin.",
    dataTitle: "2. Hangi verileri işliyoruz?",
    data: [
      "Hesap bilgileri: e-posta adresin; e-posta ile üye olursan şifren (düz metin olarak değil, geri çevrilemez bir özet olarak saklanır); Google ile girersen Google hesabındaki adın ve hesap kimliğin.",
      'Profil: kullanıcı adın, görünen adın, "hakkında" yazın ve yüklersen profil fotoğrafın.',
      "Onaylar: 18 yaşından büyük olduğunu onayladığın zaman ve gördüğün aydınlatma metninin sürümü. Doğum tarihini sormayız.",
      "Sitede paylaştıkların: yorumların, puanların, favorilerin ve ileride eklenecek özelliklerde yazdıkların.",
      "İçki günlüğün: kaydettiğin kokteyller, tarihleri, yaptığın hâliyle tarifleri, o akşamki puanın ve notların. Kayıtların varsayılan olarak yalnızca sana görünür; herkese açık yaptıkların profilinde ve seni takip edenlerin akışında görünür, diğer üyeler bunlara yorum yazabilir.",
      "Tariflerin: yazdığın kokteyl tarifleri ve yüklersen fotoğrafları. Yayındakiler profilinde ve akışta herkese görünür; taslaklarını yalnızca sen görürsün.",
      "Takip ve yorumlar: kimi takip ettiğin ve seni kimlerin takip ettiği (profilinde takipçi ve takip sayıların görünür) ile herkese açık günlük kayıtlarına yazdığın yorumlar.",
      "Vitrin: başvurduğun tarif ve tanıtım yazın; bir yönetici onaylarsa akışta herkese görünür, kazanırsa ana sayfada da. Verdiğin oyları yalnızca sen görürsün; herkes yalnızca toplam oy sayısını görür.",
      "Telefon bildirimleri: uygulamada telefon bildirimlerini açarsan, bildirimleri cihazına gönderebilmek için cihazının bildirim anahtarı (push token) ve türü (iOS ya da Android). Çıkış yaptığında ya da hesabını sildiğinde silinir; ayardan kapattığında artık bildirim gönderilmez.",
      "Teknik kayıtlar: oturumunu açık tutan çerezler; sunucu kayıtlarında IP adresin ve tarayıcı bilgin.",
    ],
    purposesTitle: "3. Neden işliyoruz ve hukuki sebebi ne?",
    purposes: [
      "Hesabını açmak, yönetmek ve paylaştıklarını sitede göstermek için: sözleşmenin kurulması ve ifası (KVKK m. 5/2-c).",
      "Siteyi güvende tutmak, kötüye kullanımı ve spam'i önlemek için: meşru menfaat (KVKK m. 5/2-f).",
      "Yasal yükümlülüklerimizi yerine getirmek için: hukuki yükümlülük (KVKK m. 5/2-ç).",
    ],
    noAds: "Reklam göstermiyoruz, verilerini satmıyoruz, analiz ya da takip çerezi kullanmıyoruz.",
    processorsTitle: "4. Kimlere aktarılıyor?",
    processorsIntro: "Site, verileri bizim adımıza işleyen şu hizmet sağlayıcılarla çalışır:",
    processors: [
      "Supabase: veritabanı, kimlik doğrulama ve dosya depolama; sunucular Frankfurt, Almanya.",
      "Vercel: sitenin barındırılması ve çerezsiz, anonim ziyaret istatistikleri (hangi sayfanın kaç kez açıldığı); ABD merkezli.",
      "Google: yalnızca Google ile giriş yapmayı seçersen, kimliğini doğrulamak için.",
      "Resend: üye olursan doğrulama ve şifre sıfırlama e-postalarını, ayrıca kapatmadığın sürece okunmamış bildirimlerinin özetini göndermek için; sunucular İrlanda.",
      "Expo (650 Industries): uygulamada telefon bildirimlerini açarsan, bildirimlerini cihazına iletmek için; bildirimler Google (Firebase Cloud Messaging) ve Apple (Apple Push Notification service) üzerinden ulaşır; ABD merkezli.",
      "ImprovMX: {contact} adresine yazdığın e-postaları bize iletmek için; ABD merkezli.",
    ],
    transfers:
      "Bu sağlayıcıların sunucuları yurt dışında olduğundan verilerin yurt dışına aktarılır; aktarım KVKK'nın 9. maddesine uygun olarak yapılır. Profilin ve herkese açık paylaştıkların sitede herkes tarafından görülebilir.",
    retentionTitle: "5. Ne kadar saklıyoruz?",
    retention:
      'Hesabın açık kaldığı sürece. Hesabını "Hesabım" sayfasından sildiğinde hesabın, profilin ve yazdıkların hemen ve kalıcı olarak silinir. Sunucu kayıtları hizmet sağlayıcıların belirlediği kısa süreler boyunca tutulur.',
    rightsTitle: "6. Hakların",
    rightsIntro: "KVKK'nın 11. maddesi uyarınca şunları isteyebilirsin:",
    rights: [
      "kişisel verilerinin işlenip işlenmediğini ve işleniyorsa bilgisini öğrenmek,",
      "işlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenmek,",
      "aktarıldığı üçüncü kişileri bilmek,",
      "eksik ya da yanlış işlenmişse düzeltilmesini, KVKK m. 7 şartlarıyla silinmesini istemek ve bunların aktarılan kişilere bildirilmesini istemek,",
      "otomatik sistemlerle analiz sonucu aleyhine bir sonuca itiraz etmek,",
      "kanuna aykırı işleme nedeniyle zarara uğrarsan zararın giderilmesini talep etmek.",
    ],
    rightsOutro:
      'Profilini istediğin zaman "Hesabım" sayfasından düzeltebilir ya da hesabını silebilirsin. Diğer talepler için {contact} adresine yaz; en geç 30 gün içinde yanıtlarız.',
  },
  en: {
    metaTitle: "Privacy notice",
    metaDescription: "The KVKK privacy notice: how your personal data is processed.",
    version: "Rx · Version {version}",
    title: "Privacy notice on the processing of personal data",
    governs:
      "This English version is provided for convenience. If it differs from the {turkish}, the Turkish text governs.",
    governsLink: "Turkish text",
    draft: "Draft: takes effect when sign-ups open.",
    controllerTitle: "1. Data controller",
    controller:
      "{brand} ({site}) is a cocktail recipe platform. The data controller under Turkey's Personal Data Protection Law No. 6698 (KVKK) is {controller}. You can reach us at {contact}.",
    dataTitle: "2. What data do we process?",
    data: [
      "Account details: your e-mail address; if you sign up with e-mail, your password (stored not as plain text but as an irreversible hash); if you sign in with Google, the name and account ID of your Google account.",
      'Profile: your username, display name, "about" text and, if you upload one, your profile photo.',
      "Confirmations: when you confirmed that you are over 18, and the version of the privacy notice you saw. We don't ask for your date of birth.",
      "What you share on the site: your reviews, ratings, favorites and what you write in features added later.",
      "Your drink log: the cocktails you log, their dates, the recipes as you made them, that evening's rating and your notes. Your entries are visible only to you by default. The ones you make public appear on your profile and in the feed of people who follow you, and other members can comment on them.",
      "Your recipes: the cocktail recipes you write and, if you upload them, their photos. Published ones are visible to everyone on your profile and in the feed; only you see your drafts.",
      "Follows and comments: who you follow and who follows you (your follower and following counts show on your profile), and the comments you write on public log entries.",
      "Showcase: the recipe you apply with and your pitch. If an admin approves it, everyone can see it in the feed, and if it wins, on the home page too. Only you see the votes you give; everyone else sees only the total number of votes.",
      "Phone notifications: if you turn on phone notifications in the app, your device's notification key (push token) and type (iOS or Android), so notifications can be sent to it. It is deleted when you sign out or delete your account; when you turn the setting off, no more notifications are sent.",
      "Technical records: cookies that keep you signed in; your IP address and browser details in server logs.",
    ],
    purposesTitle: "3. Why do we process it, and on what legal basis?",
    purposes: [
      "To open and manage your account and show what you share on the site: establishing and performing a contract (KVKK art. 5(2)(c)).",
      "To keep the site safe and prevent abuse and spam: legitimate interest (KVKK art. 5(2)(f)).",
      "To meet our legal obligations: legal obligation (KVKK art. 5(2)(ç)).",
    ],
    noAds: "We don't show ads, we don't sell your data, and we don't use analytics or tracking cookies.",
    processorsTitle: "4. Who is it shared with?",
    processorsIntro: "The site works with these service providers, which process data on our behalf:",
    processors: [
      "Supabase: database, authentication and file storage; servers in Frankfurt, Germany.",
      "Vercel: hosting the site, and cookieless, anonymous visit statistics (how many times each page was opened); based in the USA.",
      "Google: only if you choose to sign in with Google, to verify your identity.",
      "Resend: if you become a member, to send verification and password-reset e-mails and, unless you turn it off, a digest of your unread notifications; servers in Ireland.",
      "Expo (650 Industries): if you turn on phone notifications in the app, to deliver your notifications to your device; they reach it through Google (Firebase Cloud Messaging) and Apple (Apple Push Notification service); based in the US.",
      "ImprovMX: to forward the e-mails you send to {contact} to us; based in the USA.",
    ],
    transfers:
      "Because these providers' servers are abroad, your data is transferred outside Turkey. The transfer is made in line with Article 9 of the KVKK. Anyone on the site can see your profile and what you share publicly.",
    retentionTitle: "5. How long do we keep it?",
    retention:
      'As long as your account stays open. When you delete your account on the "Account" page, your account, profile and what you wrote are deleted immediately and permanently. Server logs are kept for the short periods the service providers set.',
    rightsTitle: "6. Your rights",
    rightsIntro: "Under Article 11 of the KVKK, you can ask:",
    rights: [
      "to learn whether your personal data is processed and, if it is, to get information about it,",
      "to learn the purpose of the processing and whether the data is used for that purpose,",
      "to know the third parties it is transferred to,",
      "to have it corrected if it is incomplete or wrong, to have it deleted under the conditions of KVKK art. 7, and to have these steps reported to the parties it was transferred to,",
      "to object to an outcome against you that comes from analysis by automated systems alone,",
      "to claim compensation if you suffer damage because of unlawful processing.",
    ],
    rightsOutro:
      'You can correct your profile or delete your account on the "Account" page at any time. For other requests, write to {contact}. We reply within 30 days at the latest.',
  },
};
