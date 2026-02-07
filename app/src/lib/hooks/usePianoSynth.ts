"use client";

import { useEffect, useRef, useCallback } from "react";
import { PianoSynth } from "@/lib/audio/PianoSynth";
import { SampledPiano } from "@/lib/audio/SampledPiano";

export function usePianoSynth() {
  const synthRef = useRef<PianoSynth | null>(null);
  const sampledRef = useRef<SampledPiano | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const loadingRef = useRef(false);
  const loadPromiseRef = useRef<Promise<void> | null>(null);
  const pendingAutoNotesRef = useRef<Map<number, number>>(new Map());

  const ensureContext = (): AudioContext => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
    }
    if (ctxRef.current.state === "suspended") {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  };

  const getSynth = (): PianoSynth => {
    if (!synthRef.current) {
      synthRef.current = new PianoSynth();
    }
    return synthRef.current;
  };

  const flushPendingAutoNotes = useCallback(() => {
    if (!sampledRef.current?.isLoaded) return;
    pendingAutoNotesRef.current.forEach((velocity, note) => {
      // Ensure no oscillator voice is left over before handing note to sampler.
      synthRef.current?.noteOff(note);
      sampledRef.current?.noteOn(note, velocity);
    });
    pendingAutoNotesRef.current.clear();
  }, []);

  const startLoading = useCallback((ctx: AudioContext): Promise<void> => {
    if (sampledRef.current?.isLoaded) {
      return Promise.resolve();
    }
    if (loadingRef.current && loadPromiseRef.current) {
      return loadPromiseRef.current;
    }

    loadingRef.current = true;
    if (!sampledRef.current) {
      sampledRef.current = new SampledPiano();
    }
    loadPromiseRef.current = sampledRef.current
      .load(ctx)
      .then(() => {
        flushPendingAutoNotes();
      })
      .finally(() => {
        loadingRef.current = false;
      });
    return loadPromiseRef.current;
  }, [flushPendingAutoNotes]);

  const noteOn = useCallback((note: number, velocity: number) => {
    const ctx = ensureContext();
    void startLoading(ctx);
    if (sampledRef.current?.isLoaded) {
      // Kill any leftover oscillator voice from before samples loaded
      synthRef.current?.noteOff(note);
      sampledRef.current.noteOn(note, velocity);
    } else {
      getSynth().noteOn(note, velocity);
    }
  }, [startLoading]);

  const noteOnAuto = useCallback((note: number, velocity: number) => {
    const ctx = ensureContext();
    if (sampledRef.current?.isLoaded) {
      synthRef.current?.noteOff(note);
      sampledRef.current.noteOn(note, velocity);
      return;
    }

    // For auto-play, avoid timbre switching by waiting for sampled piano.
    pendingAutoNotesRef.current.set(note, velocity);
    void startLoading(ctx);
  }, [startLoading]);

  const noteOff = useCallback((note: number) => {
    pendingAutoNotesRef.current.delete(note);
    // Release on both synths to prevent stuck notes during sample loading transition
    synthRef.current?.noteOff(note);
    sampledRef.current?.noteOff(note);
  }, []);

  // Start loading samples on first user interaction (click/keypress)
  // so they're ready before the first noteOn
  useEffect(() => {
    const pendingAutoNotes = pendingAutoNotesRef.current;
    const warmup = () => {
      const ctx = ensureContext();
      void startLoading(ctx);
      document.removeEventListener("click", warmup);
      document.removeEventListener("keydown", warmup);
    };
    document.addEventListener("click", warmup, { once: false });
    document.addEventListener("keydown", warmup, { once: false });
    return () => {
      document.removeEventListener("click", warmup);
      document.removeEventListener("keydown", warmup);
      synthRef.current?.dispose();
      synthRef.current = null;
      sampledRef.current?.dispose();
      sampledRef.current = null;
      pendingAutoNotes.clear();
      loadPromiseRef.current = null;
      ctxRef.current?.close();
      ctxRef.current = null;
    };
  }, [startLoading]);

  return { noteOn, noteOnAuto, noteOff };
}
