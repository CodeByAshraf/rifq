/**
 * Plays a story's narration: AI-voice clips for the retelling, human recitation for verses.
 * Files are streamed when played (the app stays small); nothing is uploaded or tracked.
 * Narration files are published as assets of the GitHub release "story-audio"
 * (.github/workflows/story-audio.yml).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { audioUrl, RECITERS } from "@/lib/quran";
import type { Clip } from "@/lib/story-clips";

const STORY_AUDIO_BASE = "https://github.com/CodeByAshraf/rifq/releases/download/story-audio/";

const urlOf = (c: Clip) => (c.kind === "voice" ? STORY_AUDIO_BASE + c.file : audioUrl(c.surah, c.ayah, RECITERS[1]));

export type NarratorState = "idle" | "loading" | "playing" | "paused" | "error";

/**
 * A queue player. `onClip` reports each clip as it starts (to turn pages), `onEnd` when the
 * queue is done. One <audio> element, released on unmount.
 */
export function useNarrator(opts: { onClip?: (c: Clip, i: number) => void; onEnd?: () => void } = {}) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const queue = useRef<Clip[]>([]);
  const index = useRef(0);
  const cb = useRef(opts);
  cb.current = opts;
  const [state, setState] = useState<NarratorState>("idle");
  const [clip, setClip] = useState<Clip | null>(null);

  const playAt = useCallback((i: number) => {
    const a = audio.current;
    const c = queue.current[i];
    if (!a) return;
    if (!c) {
      setState("idle");
      setClip(null);
      cb.current.onEnd?.();
      return;
    }
    index.current = i;
    setClip(c);
    setState("loading");
    cb.current.onClip?.(c, i);
    a.src = urlOf(c);
    a.play().catch((e: unknown) => {
      if ((e as { name?: string })?.name !== "AbortError") setState("error");
    });
  }, []);

  useEffect(() => {
    const a = new Audio();
    a.preload = "auto";
    audio.current = a;
    const ended = () => playAt(index.current + 1);
    const playing = () => setState("playing");
    const failed = () => setState("error");
    a.addEventListener("ended", ended);
    a.addEventListener("playing", playing);
    a.addEventListener("error", failed);
    return () => {
      a.pause();
      a.removeAttribute("src");
      a.removeEventListener("ended", ended);
      a.removeEventListener("playing", playing);
      a.removeEventListener("error", failed);
      audio.current = null;
    };
  }, [playAt]);

  const start = useCallback(
    (clips: Clip[]) => {
      queue.current = clips;
      playAt(0);
    },
    [playAt],
  );
  const pause = useCallback(() => {
    audio.current?.pause();
    setState((s) => (s === "playing" || s === "loading" ? "paused" : s));
  }, []);
  const resume = useCallback(() => {
    if (!queue.current.length) return;
    audio.current
      ?.play()
      .then(() => setState("playing"))
      .catch(() => setState("error"));
  }, []);
  const stop = useCallback(() => {
    audio.current?.pause();
    queue.current = [];
    setState("idle");
    setClip(null);
  }, []);
  /** Gently lowers the volume, then stops (sleep timer). */
  const fadeOut = useCallback(
    (ms = 8000) => {
      const a = audio.current;
      if (!a) return stop();
      const from = a.volume;
      const t0 = Date.now();
      const step = () => {
        const k = Math.min(1, (Date.now() - t0) / ms);
        a.volume = from * (1 - k);
        if (k < 1) setTimeout(step, 200);
        else {
          stop();
          a.volume = from;
        }
      };
      step();
    },
    [stop],
  );

  return { start, pause, resume, stop, fadeOut, state, clip };
}
