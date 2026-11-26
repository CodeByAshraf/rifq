/**
 * Plays a story's narration.
 * - The retelling: a recorded voice file if one was published (release "story-audio"), otherwise
 *   the phone's own text-to-speech voice (free, offline; src/lib/voice.ts). Recorded files win automatically as
 *   soon as they exist.
 * - Quran verses: always human recitation from EveryAyah. Never text-to-speech.
 * Nothing is uploaded or tracked.
 */
import { useEffect, useRef, useState } from "react";
import { speak as speakText, stopVoice } from "@/lib/voice";
import { audioUrl, RECITERS } from "@/lib/quran";
import type { Clip } from "@/lib/story-clips";

const STORY_AUDIO_BASE = "https://github.com/CodeByAshraf/rifq/releases/download/story-audio/";

/** Once a recorded file is missing, use the phone voice for the rest of the session (no waiting on 404s). */
let recordedMissing = false;

export type NarratorState = "idle" | "loading" | "playing" | "paused" | "error";

/**
 * A queue player. `onClip` reports each clip as it starts (to turn pages), `onEnd` when the
 * queue is done. One <audio> element, released on unmount.
 */
export function useNarrator(opts: { onClip?: (c: Clip, i: number) => void; onEnd?: () => void } = {}) {
  const cb = useRef(opts);
  cb.current = opts;
  const [state, setState] = useState<NarratorState>("idle");
  const [clip, setClip] = useState<Clip | null>(null);

  // One controller for the life of the component (no stale closures between callbacks).
  const ctl = useRef<ReturnType<typeof makeController> | null>(null);
  if (!ctl.current) ctl.current = makeController();

  function makeController() {
    const audio = typeof Audio !== "undefined" ? new Audio() : null;
    if (audio) audio.preload = "auto";
    let queue: Clip[] = [];
    let index = 0;
    let run = 0; // bumps on start/stop/pause: late callbacks of an old run are ignored
    let viaVoice = false; // the current clip is being read by the phone voice

    const playAt = (i: number) => {
      const c = queue[i];
      if (!audio) return;
      if (!c) {
        setState("idle");
        setClip(null);
        cb.current.onEnd?.();
        return;
      }
      index = i;
      setClip(c);
      cb.current.onClip?.(c, i);
      if (c.kind === "voice" && recordedMissing) return speak(i);
      viaVoice = false;
      setState("loading");
      audio.src = c.kind === "voice" ? STORY_AUDIO_BASE + c.file : audioUrl(c.surah, c.ayah, RECITERS[1]);
      audio.play().catch((e: unknown) => {
        if ((e as { name?: string })?.name !== "AbortError") failed();
      });
    };

    /** Reads a voice clip with the phone's voice, then moves on. */
    const speak = (i: number) => {
      const c = queue[i];
      if (c?.kind !== "voice") return;
      const mine = ++run;
      viaVoice = true;
      setState("playing");
      speakText(c.text)
        .then(() => {
          if (run === mine) playAt(i + 1);
        })
        .catch(() => {
          if (run === mine) setState("error");
        });
    };

    /** A file failed: voice clips fall back to the phone voice; a verse that cannot load is an error. */
    const failed = () => {
      if (queue[index]?.kind === "voice") {
        recordedMissing = true;
        speak(index);
      } else setState("error");
    };

    audio?.addEventListener("ended", () => playAt(index + 1));
    audio?.addEventListener("playing", () => setState("playing"));
    audio?.addEventListener("error", () => {
      if (audio.getAttribute("src")) failed();
    });

    const halt = () => {
      run++;
      audio?.pause();
      if (viaVoice) void stopVoice();
    };

    return {
      start(clips: Clip[]) {
        halt();
        queue = clips;
        playAt(0);
      },
      pause() {
        halt();
        setState((s) => (s === "playing" || s === "loading" ? "paused" : s));
      },
      resume() {
        if (!queue.length) return;
        // The phone voice cannot resume mid-sentence: the current page is read again.
        if (viaVoice) return playAt(index);
        audio
          ?.play()
          .then(() => setState("playing"))
          .catch(() => setState("error"));
      },
      stop() {
        halt();
        queue = [];
        setState("idle");
        setClip(null);
      },
      /** Gently lowers the volume, then stops (sleep timer). */
      fadeOut(ms = 8000) {
        if (!audio || viaVoice) return this.stop();
        const from = audio.volume;
        const t0 = Date.now();
        const step = () => {
          const k = Math.min(1, (Date.now() - t0) / ms);
          audio.volume = from * (1 - k);
          if (k < 1) setTimeout(step, 200);
          else {
            this.stop();
            audio.volume = from;
          }
        };
        step();
      },
      dispose() {
        halt();
        audio?.removeAttribute("src");
        void stopVoice();
      },
    };
  }

  useEffect(() => () => ctl.current?.dispose(), []);

  const c = ctl.current;
  return {
    start: (clips: Clip[]) => c.start(clips),
    pause: () => c.pause(),
    resume: () => c.resume(),
    stop: () => c.stop(),
    fadeOut: (ms?: number) => c.fadeOut(ms),
    state,
    clip,
  };
}
