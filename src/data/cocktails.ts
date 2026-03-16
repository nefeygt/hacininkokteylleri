export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
  iconType: "shot" | "dash" | "drop" | "slice" | "spoon" | "topup";
  tooltip?: string;
}

export interface Cocktail {
  id: string;
  name: string;
  subtitle: string;
  baseAlcohol: string;
  flavor: string;
  tags: string[];
  color: string;
  ingredients: Ingredient[];
  instructions: string[];
  garnish: string;
  glass: string;
  vegan: boolean;
  note?: string;
}

export const tooltips: Record<string, string> = {
  "Simple Syrup":
    "1 ölçek şeker ve 1 ölçek suyun kaynatılmasıyla elde edilen baz şurup.",
  "Şeker Şurubu":
    "1 ölçek şeker ve 1 ölçek suyun kaynatılmasıyla elde edilen baz şurup.",
  Aquafaba:
    "Vegan dostu! Kokteyle köpük katmak için yumurta akı yerine kullanılan nohut suyu.",
  "Top up": "Bardağın geri kalanını bu içecekle tamamla.",
};

const cocktails: Cocktail[] = [
  {
    id: "moscow-mule",
    name: "Moscow Mule",
    subtitle: "Sovyet rüzgârı bir bakır kupada",
    baseAlcohol: "Vodka",
    flavor: "Ekşi",
    tags: ["Vodka", "Zencefil", "Lime", "Klasik"],
    color: "#c87533",
    ingredients: [
      { name: "Vodka", amount: 6, unit: "cl", iconType: "shot" },
      { name: "Zencefil Birası", amount: 12, unit: "cl", iconType: "topup" },
      { name: "Lime Suyu", amount: 2, unit: "cl", iconType: "shot" },
      { name: "Şeker Şurubu", amount: 1, unit: "cl", iconType: "spoon" },
    ],
    instructions: [
      "Bakır kupaya buz ekle.",
      "Vodkayı ve lime suyunu ekle.",
      "Şeker Şurubu ile tatlandır.",
      "Zencefil birası ile Top up yap.",
      "Yavaşça karıştır, lime dilimi ile süsle.",
    ],
    garnish: "Lime dilimi & taze nane",
    glass: "Bakır Kupa (Moscow Mule Mug)",
    vegan: true,
    note: "Yoldaşın favorisi. Bakır kupa ile servis edilmeli — devrimler soğuk içilir.",
  },
  {
    id: "vegan-whiskey-sour",
    name: "Vegan Whiskey Sour",
    subtitle: "Aquafaba ile klasiğe vegan dokunuş",
    baseAlcohol: "Viski",
    flavor: "Ekşi",
    tags: ["Viski", "Limon", "Aquafaba", "Vegan", "Klasik"],
    color: "#d4a745",
    ingredients: [
      { name: "Bourbon Viski", amount: 6, unit: "cl", iconType: "shot" },
      { name: "Limon Suyu", amount: 3, unit: "cl", iconType: "shot" },
      { name: "Şeker Şurubu", amount: 2, unit: "cl", iconType: "spoon" },
      { name: "Aquafaba", amount: 3, unit: "cl", iconType: "dash" },
    ],
    instructions: [
      "Tüm malzemeleri shaker'a ekle.",
      "Önce buzsuz çalkala (dry shake) — Aquafaba köpürsün.",
      "Buz ekle, tekrar sert çalkala.",
      "İnce süzgeçle bardağa süz.",
      "Üzerine birkaç damla Angostura bitter ile süsle.",
    ],
    garnish: "Angostura bitter damlaları, portakal kabuğu",
    glass: "Rocks / Old Fashioned",
    vegan: true,
    note: "Yumurta akı yerine Aquafaba — hayvan sömürüsüz, aynı ipeksi köpük.",
  },
  {
    id: "negroni",
    name: "Negroni",
    subtitle: "Acı, güçlü ve ödünsüz",
    baseAlcohol: "Cin",
    flavor: "Acı",
    tags: ["Cin", "Campari", "Vermut", "Klasik", "Acı"],
    color: "#9b2335",
    ingredients: [
      { name: "London Dry Gin", amount: 3, unit: "cl", iconType: "shot" },
      { name: "Campari", amount: 3, unit: "cl", iconType: "shot" },
      { name: "Tatlı Vermut", amount: 3, unit: "cl", iconType: "shot" },
    ],
    instructions: [
      "Karıştırma bardağına buz ekle.",
      "Gin, Campari ve vermutü ekle.",
      "30 saniye karıştır.",
      "Büyük buz küpü olan rocks bardağına süz.",
      "Portakal kabuğu ile süsle.",
    ],
    garnish: "Portakal kabuğu",
    glass: "Rocks / Old Fashioned",
    vegan: true,
    note: "Eşit oranlar, sıfır uzlaşma. Acısıyla yüzleşmekten korkma.",
  },
  {
    id: "dark-stormy",
    name: "Dark 'n' Stormy",
    subtitle: "Fırtına öncesi karanlık",
    baseAlcohol: "Rom",
    flavor: "Baharatlı",
    tags: ["Rom", "Zencefil", "Lime", "Tropikal"],
    color: "#3d1c02",
    ingredients: [
      { name: "Dark Rum", amount: 6, unit: "cl", iconType: "shot" },
      { name: "Zencefil Birası", amount: 10, unit: "cl", iconType: "topup" },
      { name: "Lime Suyu", amount: 1.5, unit: "cl", iconType: "shot" },
    ],
    instructions: [
      "Highball bardağına buz doldur.",
      "Zencefil birasını ekle.",
      "Dark rum'ı yavaşça üstten dök — katman oluşsun.",
      "Lime suyu ile bitir.",
    ],
    garnish: "Lime dilimi",
    glass: "Highball",
    vegan: true,
  },
];

export default cocktails;
