/**
 * The phone's own voice (text-to-speech), in Arabic, for story narration only — never Quran.
 * - Android: the app plugin RifqVoice (mobile/android/.../RifqVoicePlugin.java), which prefers
 *   Google's speech engine and the best installed Arabic voice.
 * - iOS / browser: the Web Speech API (speechSynthesis), with an Arabic system voice.
 */
import { Capacitor, registerPlugin } from "@capacitor/core";

export interface VoiceStatus {
  /** The speech engine works. */
  engineReady: boolean;
  /** Android: Google's speech engine is installed. */
  google: boolean;
  /** An Arabic voice is ready to speak. */
  arabic: boolean;
}

interface RifqVoice {
  status(): Promise<VoiceStatus>;
  refresh(): Promise<VoiceStatus>;
  speak(o: { text: string; rate?: number; pitch?: number }): Promise<void>;
  stop(): Promise<void>;
  installVoice(): Promise<void>;
  settings(): Promise<void>;
}

const android = Capacitor.getPlatform() === "android";
const Native = registerPlugin<RifqVoice>("RifqVoice");

const synth = () => (typeof window !== "undefined" && "speechSynthesis" in window ? window.speechSynthesis : null);

/** Web voices load asynchronously; wait a moment for the list. */
async function webArabicVoice(): Promise<SpeechSynthesisVoice | null> {
  const s = synth();
  if (!s) return null;
  let list = s.getVoices();
  if (!list.length)
    list = await new Promise((r) => {
      const done = () => r(s.getVoices());
      s.addEventListener("voiceschanged", done, { once: true });
      setTimeout(done, 1500);
    });
  return list.find((v) => v.lang.toLowerCase().startsWith("ar")) ?? null;
}

export async function voiceStatus(fresh = false): Promise<VoiceStatus> {
  if (android) return fresh ? Native.refresh() : Native.status();
  const v = await webArabicVoice();
  return { engineReady: Boolean(synth()), google: false, arabic: Boolean(v) };
}

export async function speak(text: string, rate = 0.85, pitch = 1.05): Promise<void> {
  if (android) return Native.speak({ text, rate, pitch });
  const s = synth();
  const v = await webArabicVoice();
  if (!s || !v) throw new Error("no-arabic");
  s.cancel();
  return new Promise((resolve, reject) => {
    const u = new SpeechSynthesisUtterance(text);
    u.voice = v;
    u.lang = v.lang;
    u.rate = rate;
    u.pitch = pitch;
    u.onend = () => resolve();
    u.onerror = (e) => (e.error === "interrupted" || e.error === "canceled" ? resolve() : reject(new Error(e.error)));
    s.speak(u);
  });
}

export const stopVoice = () => (android ? Native.stop().catch(() => {}) : Promise.resolve(synth()?.cancel()));

/** Android: download the Arabic voice (or install Google's engine). */
export const installVoice = () => (android ? Native.installVoice().catch(() => {}) : Promise.resolve());
/** Android: the system text-to-speech settings. */
export const voiceSettings = () => (android ? Native.settings().catch(() => {}) : Promise.resolve());
export const isAndroid = android;
