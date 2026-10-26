import type { Metadata } from "next";
import { ACCOUNTS_OPEN, PRIVACY_NOTICE_VERSION } from "@/lib/account-config";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Aydınlatma Metni",
  description: "Kişisel verilerin nasıl işlendiğine dair KVKK aydınlatma metni.",
};

// The KVKK privacy notice (aydınlatma metni). It shows a draft banner until
// accounts open; when the text changes, bump PRIVACY_NOTICE_VERSION in
// src/lib/account-config.ts. CONTACT forwards to the owner through ImprovMX.
const CONTROLLER = "Nazım Efe Yiğit";
const CONTACT = "contact@hacininkokteylleri.tech";

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl px-6 py-16 leading-relaxed text-text-secondary">
      <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.25em] text-crimson-glow">
        Rx · Sürüm {PRIVACY_NOTICE_VERSION}
      </div>
      <h1 className="mb-8 text-3xl font-bold text-text-primary">Kişisel Verilerin İşlenmesine İlişkin Aydınlatma Metni</h1>

      {!ACCOUNTS_OPEN && (
        <p className="mb-8 rounded border border-border bg-bg-card p-3 text-xs text-text-muted">
          Taslak: üyelik açıldığında yürürlüğe girer.
        </p>
      )}

      <Section title="1. Veri sorumlusu">
        <p>
          {BRAND} ({"hacininkokteylleri.tech"}) bir kokteyl tarifleri platformudur. 6698 sayılı Kişisel Verilerin
          Korunması Kanunu (KVKK) kapsamındaki veri sorumlusu: {CONTROLLER}.
          Bize <Mail /> adresinden ulaşabilirsin.
        </p>
      </Section>

      <Section title="2. Hangi verileri işliyoruz?">
        <ul className="list-disc space-y-1 pl-5">
          <li>Hesap bilgileri: e-posta adresin; e-posta ile üye olursan şifren (düz metin olarak değil, geri çevrilemez bir özet olarak saklanır); Google ile girersen Google hesabındaki adın ve hesap kimliğin.</li>
          <li>Profil: kullanıcı adın, görünen adın, &quot;hakkında&quot; yazın ve yüklersen profil fotoğrafın.</li>
          <li>Onaylar: 18 yaşından büyük olduğunu onayladığın zaman ve gördüğün aydınlatma metninin sürümü. Doğum tarihini sormayız.</li>
          <li>Sitede paylaştıkların: yorumların, puanların, favorilerin ve ileride eklenecek özelliklerde yazdıkların.</li>
          <li>İçki günlüğün: kaydettiğin kokteyller, tarihleri, yaptığın hâliyle tarifleri, o akşamki puanın ve notların. Kayıtların varsayılan olarak yalnızca sana görünür; herkese açık yaptıkların profilinde ve seni takip edenlerin akışında görünür, diğer üyeler bunlara yorum yazabilir.</li>
          <li>Tariflerin: yazdığın kokteyl tarifleri ve yüklersen fotoğrafları. Yayındakiler profilinde ve akışta herkese görünür; taslaklarını yalnızca sen görürsün.</li>
          <li>Takip ve yorumlar: kimi takip ettiğin ve seni kimlerin takip ettiği (profilinde takipçi ve takip sayıların görünür) ile herkese açık günlük kayıtlarına yazdığın yorumlar.</li>
          <li>Vitrin: başvurduğun tarif ve tanıtım yazın; bir yönetici onaylarsa akışta herkese görünür, kazanırsa ana sayfada da. Verdiğin oyları yalnızca sen görürsün; herkes yalnızca toplam oy sayısını görür.</li>
          <li>Teknik kayıtlar: oturumunu açık tutan çerezler; sunucu kayıtlarında IP adresin ve tarayıcı bilgin.</li>
        </ul>
      </Section>

      <Section title="3. Neden işliyoruz ve hukuki sebebi ne?">
        <ul className="list-disc space-y-1 pl-5">
          <li>Hesabını açmak, yönetmek ve paylaştıklarını sitede göstermek için: sözleşmenin kurulması ve ifası (KVKK m. 5/2-c).</li>
          <li>Siteyi güvende tutmak, kötüye kullanımı ve spam&apos;i önlemek için: meşru menfaat (KVKK m. 5/2-f).</li>
          <li>Yasal yükümlülüklerimizi yerine getirmek için: hukuki yükümlülük (KVKK m. 5/2-ç).</li>
        </ul>
        <p className="mt-3">Reklam göstermiyoruz, verilerini satmıyoruz, analiz ya da takip çerezi kullanmıyoruz.</p>
      </Section>

      <Section title="4. Kimlere aktarılıyor?">
        <p>Site, verileri bizim adımıza işleyen şu hizmet sağlayıcılarla çalışır:</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Supabase: veritabanı, kimlik doğrulama ve dosya depolama; sunucular Frankfurt, Almanya.</li>
          <li>Vercel: sitenin barındırılması ve çerezsiz, anonim ziyaret istatistikleri (hangi sayfanın kaç kez açıldığı); ABD merkezli.</li>
          <li>Google: yalnızca Google ile giriş yapmayı seçersen, kimliğini doğrulamak için.</li>
          <li>Resend: e-posta ile üye olursan doğrulama ve şifre sıfırlama e-postalarını göndermek için; sunucular İrlanda.</li>
          <li>ImprovMX: {CONTACT} adresine yazdığın e-postaları bize iletmek için; ABD merkezli.</li>
        </ul>
        <p className="mt-3">
          Bu sağlayıcıların sunucuları yurt dışında olduğundan verilerin yurt dışına aktarılır; aktarım KVKK&apos;nın
          9. maddesine uygun olarak yapılır. Profilin ve herkese açık paylaştıkların sitede herkes tarafından görülebilir.
        </p>
      </Section>

      <Section title="5. Ne kadar saklıyoruz?">
        <p>
          Hesabın açık kaldığı sürece. Hesabını &quot;Hesabım&quot; sayfasından sildiğinde hesabın, profilin ve
          yazdıkların hemen ve kalıcı olarak silinir. Sunucu kayıtları hizmet sağlayıcıların belirlediği kısa
          süreler boyunca tutulur.
        </p>
      </Section>

      <Section title="6. Hakların">
        <p>KVKK&apos;nın 11. maddesi uyarınca şunları isteyebilirsin:</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>kişisel verilerinin işlenip işlenmediğini ve işleniyorsa bilgisini öğrenmek,</li>
          <li>işlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenmek,</li>
          <li>aktarıldığı üçüncü kişileri bilmek,</li>
          <li>eksik ya da yanlış işlenmişse düzeltilmesini, KVKK m. 7 şartlarıyla silinmesini istemek ve bunların aktarılan kişilere bildirilmesini istemek,</li>
          <li>otomatik sistemlerle analiz sonucu aleyhine bir sonuca itiraz etmek,</li>
          <li>kanuna aykırı işleme nedeniyle zarara uğrarsan zararın giderilmesini talep etmek.</li>
        </ul>
        <p className="mt-3">
          Profilini istediğin zaman &quot;Hesabım&quot; sayfasından düzeltebilir ya da hesabını silebilirsin.
          Diğer talepler için <Mail /> adresine yaz; en geç 30 gün içinde yanıtlarız.
        </p>
      </Section>
    </article>
  );
}

function Mail() {
  return (
    <a href={`mailto:${CONTACT}`} className="text-text-primary underline underline-offset-2 hover:text-crimson-glow">
      {CONTACT}
    </a>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 font-mono text-sm font-bold uppercase tracking-[0.1em] text-text-primary">{title}</h2>
      {children}
    </section>
  );
}
