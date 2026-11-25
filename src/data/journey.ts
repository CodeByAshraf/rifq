/** Journey map stations. Each station is tied to one surah; names are world-building labels. */
export interface Station {
  surah: number;
  place: string;
  scene: "gate" | "garden" | "fountain" | "palm" | "tower" | "house" | "lantern" | "pond";
}

export const STATIONS: Station[] = [
  { surah: 1, place: "بوابة النور", scene: "gate" },
  { surah: 114, place: "حديقة الأمان", scene: "garden" },
  { surah: 113, place: "تلّة الفجر", scene: "lantern" },
  { surah: 112, place: "واحة التوحيد", scene: "palm" },
  { surah: 111, place: "جسر العِبرة", scene: "pond" },
  { surah: 110, place: "ساحة البشرى", scene: "fountain" },
  { surah: 109, place: "منارة الثبات", scene: "tower" },
  { surah: 108, place: "نهر الخير", scene: "pond" },
  { surah: 107, place: "بيت العطاء", scene: "house" },
  { surah: 106, place: "سوق القافلة", scene: "house" },
  { surah: 105, place: "وادي الحكايات", scene: "palm" },
  { surah: 104, place: "بستان الكلمة الطيبة", scene: "garden" },
  { surah: 103, place: "ساعة الوقت", scene: "tower" },
  { surah: 102, place: "شاطئ القناعة", scene: "pond" },
  { surah: 101, place: "قمّة اليقين", scene: "lantern" },
  { surah: 100, place: "مضمار الفرسان", scene: "palm" },
  { surah: 99, place: "سهل الأعمال", scene: "garden" },
  { surah: 98, place: "مكتبة البيّنة", scene: "house" },
  { surah: 97, place: "سماء ليلة القدر", scene: "lantern" },
  { surah: 96, place: "جبل اقرأ", scene: "tower" },
  { surah: 95, place: "بستان التين والزيتون", scene: "garden" },
  { surah: 94, place: "واحة اليُسر", scene: "fountain" },
  { surah: 93, place: "شروق الضحى", scene: "lantern" },
  { surah: 92, place: "درب العطاء", scene: "palm" },
  { surah: 91, place: "مرصد الشمس", scene: "tower" },
  { surah: 90, place: "مدينة البلد", scene: "house" },
  { surah: 89, place: "ضفاف الفجر", scene: "pond" },
  { surah: 88, place: "نبع الغاشية", scene: "fountain" },
  { surah: 87, place: "روضة الأعلى", scene: "garden" },
  { surah: 86, place: "نجمة الطارق", scene: "lantern" },
  { surah: 85, place: "قلعة البروج", scene: "tower" },
  { surah: 84, place: "أفق الانشقاق", scene: "pond" },
  { surah: 83, place: "ميزان العدل", scene: "house" },
  { surah: 82, place: "مرفأ النجوم", scene: "pond" },
  { surah: 81, place: "قبّة التكوير", scene: "house" },
  { surah: 80, place: "حديقة عبس", scene: "garden" },
  { surah: 79, place: "وادي طُوى", scene: "palm" },
  { surah: 78, place: "قمّة النبأ العظيم", scene: "gate" },
];
