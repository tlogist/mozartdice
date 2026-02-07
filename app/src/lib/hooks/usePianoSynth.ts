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
  const loadFailedRef = useRef(false);
  const pendingAutoNotesRef = useRef<Map<number, number>>(new Map());
  const pendingManualNotesRef = useRef<Map<number, number>>(new Map());

  const ensureContext = useCallback((): AudioContext => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
    }
    if (ctxRef.current.state === "suspended") {
      void ctxRef.current.resume().catch(() => {
        // Some environments require explicit user interaction to resume audio.
      });
    }
    return ctxRef.current;
  }, []);

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

  const flushPendingManualNotes = useCallback(() => {
    if (!sampledRef.current?.isLoaded) return;
    pendingManualNotesRef.current.forEach((velocity, note) => {
      synthRef.current?.noteOff(note);
      sampledRef.current?.noteOn(note, velocity);
    });
    pendingManualNotesRef.current.clear();
  }, []);

  const startLoading = useCallback((ctx: AudioContext): Promise<void> => {
    if (sampledRef.current?.isLoaded) {
      return Promise.resolve();
    }
    if (loadingRef.current && loadPromiseRef.current) {
      return loadPromiseRef.current;
    }

    loadingRef.current = true;
    loadFailedRef.current = false;
    if (!sampledRef.current) {
      sampledRef.current = new SampledPiano();
    }
    loadPromiseRef.current = sampledRef.current
      .load(ctx)
      .then(() => {
        flushPendingManualNotes();
        flushPendingAutoNotes();
      })
      .catch((err) => {
        loadFailedRef.current = true;
        throw err;
      })
      .finally(() => {
        loadingRef.current = false;
      });
    return loadPromiseRef.current;
  }, [flushPendingAutoNotes, flushPendingManualNotes]);

  const noteOn = useCallback((note: number, velocity: number) => {
    const ctx = ensureContext();
    void startLoading(ctx);
    if (sampledRef.current?.isLoaded) {
      // Kill any leftover oscillator voice from before samples loaded
      synthRef.current?.noteOff(note);
      sampledRef.current.noteOn(note, velocity);
    } else if (loadFailedRef.current) {
      // Fallback only if sample loading actually failed.
      getSynth().noteOn(note, velocity);
    } else {
      // Keep first interaction timbre consistent: wait for sampled piano.
      pendingManualNotesRef.current.set(note, velocity);
    }
  }, [ensureContext, startLoading]);

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
  }, [ensureContext, startLoading]);

  const noteOff = useCallback((note: number) => {
    pendingAutoNotesRef.current.delete(note);
    pendingManualNotesRef.current.delete(note);
    // Release on both synths to prevent stuck notes during sample loading transition
    synthRef.current?.noteOff(note);
    sampledRef.current?.noteOff(note);
  }, []);

  // Start loading samples immediately on mount, then warm up again on first user interaction.
  useEffect(() => {
    const pendingAutoNotes = pendingAutoNotesRef.current;
    const pendingManualNotes = pendingManualNotesRef.current;
    const preloadCtx = ensureContext();
    void startLoading(preloadCtx);

    const warmup = () => {
      const ctx = ensureContext();
      void startLoading(ctx);
    };
    document.addEventListener("pointerdown", warmup, { once: true });
    document.addEventListener("keydown", warmup, { once: true });
    return () => {
      document.removeEventListener("pointerdown", warmup);
      document.removeEventListener("keydown", warmup);
      synthRef.current?.dispose();
      synthRef.current = null;
      sampledRef.current?.dispose();
      sampledRef.current = null;
      pendingAutoNotes.clear();
      pendingManualNotes.clear();
      loadPromiseRef.current = null;
      loadFailedRef.current = false;
      ctxRef.current?.close();
      ctxRef.current = null;
    };
  }, [ensureContext, startLoading]);

  return { noteOn, noteOnAuto, noteOff };
}
