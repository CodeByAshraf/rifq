import { IconBook } from "@/components/art/Icons";
import { MEANINGS_SOURCE, TAFSIR_SOURCE, useTafsir } from "@/lib/tafsir";

/** Simplified meaning of a verse + meanings of difficult words, from verified sources. */
export function VerseMeaning({ surah, ayah }: { surah: number; ayah: number }) {
  const { tafsir, error } = useTafsir(surah);
  if (error) return <p className="text-sm font-bold text-coral-500">تعذّر تحميل المعنى. تحقّق من الاتصال.</p>;
  if (!tafsir) return <div className="h-16 animate-pulse rounded-2xl bg-cream-100" />;
  const words = tafsir.w[ayah - 1] ?? [];
  const text = tafsir.m[ayah - 1];
  return (
    <div className="space-y-3 text-right">
      {words.length > 0 && (
        <div>
          <div className="mb-2 text-xs font-bold text-lilac-600">كلمات جديدة</div>
          <div className="flex flex-wrap gap-2">
            {words.map(([w, m], i) => (
              <span key={i} className="rounded-2xl bg-lilac-100 px-3 py-1.5 text-sm leading-relaxed">
                <b className="font-display text-lilac-600">{w}</b>
                <span className="text-ink-700">: {m}</span>
              </span>
            ))}
          </div>
        </div>
      )}
      {text && (
        <div className="rounded-2xl bg-teal-50 p-4">
          <div className="mb-1 flex items-center gap-1.5 text-xs font-bold text-teal-700">
            <IconBook size={14} /> معنى الآية ببساطة
          </div>
          <p className="leading-loose text-ink-900">{text}</p>
        </div>
      )}
      <p className="text-[11px] text-ink-500">
        المصادر: {TAFSIR_SOURCE}، و{MEANINGS_SOURCE}.
      </p>
    </div>
  );
}
