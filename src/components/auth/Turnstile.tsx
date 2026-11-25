import { useEffect, useRef } from "react";

/**
 * Cloudflare Turnstile CAPTCHA (privacy-friendly, free). Rendered only when
 * RIFQ_TURNSTILE_SITE_KEY is set. The token is passed to Supabase Auth, which
 * verifies it server-side with the secret configured in the Supabase dashboard.
 */
type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  remove: (id: string) => void;
};

const SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
let loading: Promise<void> | null = null;

function load(): Promise<void> {
  if ((window as unknown as { turnstile?: TurnstileApi }).turnstile) return Promise.resolve();
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = SRC;
      s.async = true;
      s.defer = true;
      s.onload = () => resolve();
      s.onerror = () => {
        loading = null;
        reject(new Error("turnstile"));
      };
      document.head.appendChild(s);
    });
  }
  return loading;
}

export function Turnstile({ siteKey, onToken }: { siteKey: string; onToken: (t: string | null) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let id: string | null = null;
    let dead = false;
    load()
      .then(() => {
        const api = (window as unknown as { turnstile?: TurnstileApi }).turnstile;
        if (dead || !api || !ref.current) return;
        id = api.render(ref.current, {
          sitekey: siteKey,
          language: "ar",
          callback: (t: string) => onToken(t),
          "expired-callback": () => onToken(null),
          "error-callback": () => onToken(null),
        });
      })
      .catch(() => onToken(null));
    return () => {
      dead = true;
      const api = (window as unknown as { turnstile?: TurnstileApi }).turnstile;
      if (id && api) api.remove(id);
    };
  }, [siteKey, onToken]);
  return <div ref={ref} className="flex min-h-[65px] justify-center" />;
}
