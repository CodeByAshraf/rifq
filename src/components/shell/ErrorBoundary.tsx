import { Component, type ReactNode } from "react";

/**
 * Catches a crash in one screen so the whole app does not go blank. Shows a calm message
 * with a way home. Keyed by route in main.tsx, so moving to another screen resets it.
 * Nothing is sent anywhere (no crash reporting in a kids app).
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    if (process.env.NODE_ENV !== "production") console.error("[screen]", error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div dir="rtl" className="grid min-h-[70vh] place-items-center p-6 text-center">
        <div className="max-w-sm rounded-3xl bg-white p-7 shadow-lift">
          <h1 className="font-display text-2xl font-extrabold text-ink-700">حدث خطأ غير متوقّع</h1>
          <p className="mt-2 text-ink-500">تقدّمك محفوظ. ارجع إلى الصفحة الرئيسية وحاول مرة أخرى.</p>
          <a href="#/" className="mt-5 inline-block rounded-2xl bg-teal-600 px-6 py-3 font-bold text-white">
            الصفحة الرئيسية
          </a>
        </div>
      </div>
    );
  }
}
