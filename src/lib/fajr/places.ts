/**
 * Cities for the Fajr alarm, with the calculation method each country's religious authority
 * uses. Coordinates are city centres (2 decimals ≈ 1 km, under a minute of difference).
 * The user can always switch method or add a minute offset to match their local mosque.
 */
import { CalculationMethod, CalculationParameters } from "adhan";

export type MethodId =
  | "Egyptian"
  | "UmmAlQura"
  | "MuslimWorldLeague"
  | "Dubai"
  | "Kuwait"
  | "Qatar"
  | "Karachi"
  | "Turkey"
  | "NorthAmerica"
  | "MoonsightingCommittee"
  | "Singapore"
  | "Morocco";

export const METHODS: { id: MethodId; name: string }[] = [
  { id: "Egyptian", name: "الهيئة المصرية العامة للمساحة" },
  { id: "UmmAlQura", name: "تقويم أم القرى (السعودية)" },
  { id: "MuslimWorldLeague", name: "رابطة العالم الإسلامي" },
  { id: "Dubai", name: "دائرة الشؤون الإسلامية بدبي" },
  { id: "Kuwait", name: "الكويت" },
  { id: "Qatar", name: "قطر" },
  { id: "Morocco", name: "وزارة الأوقاف المغربية" },
  { id: "Karachi", name: "جامعة العلوم الإسلامية بكراتشي" },
  { id: "Turkey", name: "رئاسة الشؤون الدينية التركية" },
  { id: "Singapore", name: "ماليزيا وإندونيسيا وسنغافورة" },
  { id: "NorthAmerica", name: "الجمعية الإسلامية لأمريكا الشمالية" },
  { id: "MoonsightingCommittee", name: "لجنة رؤية الهلال (بريطانيا)" },
];

export function methodParams(id: MethodId): CalculationParameters {
  if (id === "Morocco") {
    // Morocco's Ministry of Habous: Fajr 19°, Isha 17°.
    const p = CalculationMethod.Other();
    p.fajrAngle = 19;
    p.ishaAngle = 17;
    return p;
  }
  return CalculationMethod[id]();
}

export interface City {
  id: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
  method: MethodId;
}

const c = (id: string, name: string, country: string, lat: number, lng: number, method: MethodId): City => ({ id, name, country, lat, lng, method });

export const CITIES: City[] = [
  // Egypt
  c("cairo", "القاهرة", "مصر", 30.04, 31.24, "Egyptian"),
  c("giza", "الجيزة", "مصر", 30.01, 31.21, "Egyptian"),
  c("alexandria", "الإسكندرية", "مصر", 31.2, 29.92, "Egyptian"),
  c("portsaid", "بورسعيد", "مصر", 31.27, 32.3, "Egyptian"),
  c("suez", "السويس", "مصر", 29.97, 32.55, "Egyptian"),
  c("ismailia", "الإسماعيلية", "مصر", 30.6, 32.27, "Egyptian"),
  c("damietta", "دمياط", "مصر", 31.42, 31.81, "Egyptian"),
  c("mansoura", "المنصورة", "مصر", 31.04, 31.38, "Egyptian"),
  c("tanta", "طنطا", "مصر", 30.79, 31.0, "Egyptian"),
  c("zagazig", "الزقازيق", "مصر", 30.59, 31.5, "Egyptian"),
  c("benha", "بنها", "مصر", 30.47, 31.18, "Egyptian"),
  c("shebin", "شبين الكوم", "مصر", 30.55, 31.01, "Egyptian"),
  c("kafrelsheikh", "كفر الشيخ", "مصر", 31.11, 30.94, "Egyptian"),
  c("damanhour", "دمنهور", "مصر", 31.03, 30.47, "Egyptian"),
  c("fayoum", "الفيوم", "مصر", 29.31, 30.84, "Egyptian"),
  c("benisuef", "بني سويف", "مصر", 29.07, 31.1, "Egyptian"),
  c("minya", "المنيا", "مصر", 28.11, 30.74, "Egyptian"),
  c("assiut", "أسيوط", "مصر", 27.18, 31.18, "Egyptian"),
  c("sohag", "سوهاج", "مصر", 26.56, 31.69, "Egyptian"),
  c("qena", "قنا", "مصر", 26.16, 32.72, "Egyptian"),
  c("luxor", "الأقصر", "مصر", 25.69, 32.64, "Egyptian"),
  c("aswan", "أسوان", "مصر", 24.09, 32.9, "Egyptian"),
  c("hurghada", "الغردقة", "مصر", 27.26, 33.81, "Egyptian"),
  c("sharm", "شرم الشيخ", "مصر", 27.92, 34.33, "Egyptian"),
  c("arish", "العريش", "مصر", 31.13, 33.8, "Egyptian"),
  c("matrouh", "مرسى مطروح", "مصر", 31.35, 27.24, "Egyptian"),
  c("kharga", "الخارجة", "مصر", 25.44, 30.55, "Egyptian"),
  // Saudi Arabia
  c("makkah", "مكة المكرمة", "السعودية", 21.42, 39.83, "UmmAlQura"),
  c("madinah", "المدينة المنورة", "السعودية", 24.47, 39.61, "UmmAlQura"),
  c("riyadh", "الرياض", "السعودية", 24.71, 46.68, "UmmAlQura"),
  c("jeddah", "جدة", "السعودية", 21.54, 39.17, "UmmAlQura"),
  c("dammam", "الدمام", "السعودية", 26.43, 50.1, "UmmAlQura"),
  c("taif", "الطائف", "السعودية", 21.27, 40.42, "UmmAlQura"),
  c("abha", "أبها", "السعودية", 18.22, 42.51, "UmmAlQura"),
  c("tabuk", "تبوك", "السعودية", 28.38, 36.57, "UmmAlQura"),
  // Gulf
  c("dubai", "دبي", "الإمارات", 25.2, 55.27, "Dubai"),
  c("abudhabi", "أبوظبي", "الإمارات", 24.45, 54.38, "Dubai"),
  c("sharjah", "الشارقة", "الإمارات", 25.35, 55.42, "Dubai"),
  c("kuwait", "الكويت", "الكويت", 29.38, 47.99, "Kuwait"),
  c("doha", "الدوحة", "قطر", 25.29, 51.53, "Qatar"),
  c("manama", "المنامة", "البحرين", 26.23, 50.59, "UmmAlQura"),
  c("muscat", "مسقط", "عُمان", 23.59, 58.41, "MuslimWorldLeague"),
  // Levant, Iraq, Yemen
  c("amman", "عمّان", "الأردن", 31.95, 35.93, "MuslimWorldLeague"),
  c("quds", "القدس", "فلسطين", 31.78, 35.23, "MuslimWorldLeague"),
  c("gaza", "غزة", "فلسطين", 31.5, 34.47, "MuslimWorldLeague"),
  c("beirut", "بيروت", "لبنان", 33.89, 35.5, "MuslimWorldLeague"),
  c("damascus", "دمشق", "سوريا", 33.51, 36.29, "MuslimWorldLeague"),
  c("baghdad", "بغداد", "العراق", 33.31, 44.36, "MuslimWorldLeague"),
  c("sanaa", "صنعاء", "اليمن", 15.37, 44.19, "UmmAlQura"),
  // Africa
  c("khartoum", "الخرطوم", "السودان", 15.5, 32.56, "Egyptian"),
  c("tripoli", "طرابلس", "ليبيا", 32.89, 13.19, "Egyptian"),
  c("tunis", "تونس", "تونس", 36.81, 10.18, "MuslimWorldLeague"),
  c("algiers", "الجزائر", "الجزائر", 36.75, 3.06, "MuslimWorldLeague"),
  c("casablanca", "الدار البيضاء", "المغرب", 33.57, -7.59, "Morocco"),
  c("rabat", "الرباط", "المغرب", 34.02, -6.84, "Morocco"),
  c("nouakchott", "نواكشوط", "موريتانيا", 18.08, -15.98, "MuslimWorldLeague"),
  c("mogadishu", "مقديشو", "الصومال", 2.05, 45.32, "MuslimWorldLeague"),
  // Elsewhere
  c("istanbul", "إسطنبول", "تركيا", 41.01, 28.98, "Turkey"),
  c("karachi", "كراتشي", "باكستان", 24.86, 67.01, "Karachi"),
  c("kualalumpur", "كوالالمبور", "ماليزيا", 3.14, 101.69, "Singapore"),
  c("jakarta", "جاكرتا", "إندونيسيا", -6.21, 106.85, "Singapore"),
  c("london", "لندن", "بريطانيا", 51.51, -0.13, "MoonsightingCommittee"),
  c("paris", "باريس", "فرنسا", 48.86, 2.35, "MuslimWorldLeague"),
  c("berlin", "برلين", "ألمانيا", 52.52, 13.4, "MuslimWorldLeague"),
  c("newyork", "نيويورك", "الولايات المتحدة", 40.71, -74.01, "NorthAmerica"),
  c("toronto", "تورونتو", "كندا", 43.65, -79.38, "NorthAmerica"),
];

export const cityById = (id: string) => CITIES.find((x) => x.id === id);
