import { useState } from "react";
import { IconShield } from "@/components/art/Icons";
import { AppShell } from "@/components/shell/AppShell";
import { Link } from "@/components/shell/Link";
import { Button, Card } from "@/components/ui";
import { parseNumber } from "@/lib/fajr/challenges";
import { gateQuestion, unlock } from "@/lib/parental-gate";

/** Asks an adult-only question before showing a parents' screen. */
export function ParentalGate({ onPass }: { onPass: () => void }) {
  const [q, setQ] = useState(() => gateQuestion());
  const [value, setValue] = useState("");
  const [wrong, setWrong] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parseNumber(value) === q.answer) {
      unlock();
      onPass();
      return;
    }
    setWrong(true);
    setValue("");
    setQ(gateQuestion()); // a new question each time: no trying every number
  };

  return (
    <AppShell>
      <Card className="mx-auto mt-6 max-w-md p-7 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-teal-100 text-teal-700">
          <IconShield size={34} />
        </div>
        <h1 className="mt-4 font-display text-3xl font-extrabold">ركن الوالدين</h1>
        <p className="mt-2 text-ink-500">هذا الجزء لبابا وماما. للدخول اكتب ناتج:</p>
        <form onSubmit={submit} className="mt-5">
          <div className="font-display text-3xl font-extrabold text-teal-700">{q.text} = ؟</div>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            inputMode="numeric"
            autoComplete="off"
            maxLength={3}
            aria-label="الناتج"
            className="mt-4 h-14 w-full rounded-2xl bg-cream-100 text-center font-display text-2xl outline-none focus:ring-2 focus:ring-teal-300"
            dir="ltr"
          />
          {wrong && <p className="mt-2 text-sm font-bold text-coral-500">إجابة غير صحيحة، جرّب السؤال الجديد.</p>}
          <Button type="submit" size="lg" className="mt-4 w-full">
            دخول
          </Button>
        </form>
        <Link href="/kids" className="mt-4 inline-block font-bold text-teal-700">
          الرجوع إلى عالمي
        </Link>
      </Card>
    </AppShell>
  );
}
