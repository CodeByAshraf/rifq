/**
 * How the name of Allah is spelled for the voice. Engines differ: some read «اللَّه» with a short
 * vowel; an explicit long alif or the dagger alif fixes it on others. The parent picks the one
 * that sounds right on their phone (saved on the device). Display text never changes.
 */
export const ALLAH_FORMS = [
  { id: "shadda", label: "١", spell: (h: string) => `لَّ${h}` },
  { id: "alif", label: "٢", spell: (h: string) => `لَّا${h}` },
  { id: "dagger", label: "٣", spell: (h: string) => `لَّٰ${h}` },
] as const;
export type AllahForm = (typeof ALLAH_FORMS)[number]["id"];
const FORM_KEY = "rifq.voice.allah";
export function allahForm(): AllahForm {
  try {
    const v = localStorage.getItem(FORM_KEY);
    if (ALLAH_FORMS.some((f) => f.id === v)) return v as AllahForm;
  } catch {
    /* storage unavailable */
  }
  return "alif";
}
export function setAllahForm(f: AllahForm) {
  try {
    localStorage.setItem(FORM_KEY, f);
  } catch {
    /* storage unavailable */
  }
}
/** Respells every «اللَّه» (with any prefix and case ending) in the chosen form. */
export function spellAllah(text: string, form: AllahForm = allahForm()): string {
  const f = ALLAH_FORMS.find((x) => x.id === form)!;
  // Two lams (the first may carry a kasra: «لِلَّهِ»), then a shadda and a vowel in either order, then ه (so «كُلَّهُ» is never touched).
  return text.replace(/(ل\u0650?)ل[\u064E\u064F\u0650]?\u0651[\u064E\u064F\u0650]?(ه)/g, (_m, l: string, h: string) => `${l}${f.spell(h)}`);
}
/** A short sentence to compare the forms. */
export const ALLAH_SAMPLE = "بِسْمِ اللَّهِ. قَالَ اللَّهُ تَعَالَى. الْحَمْدُ لِلَّهِ.";
