"use client";

import { useEffect, useRef, useCallback } from "react";
import { PianoSynth } from "@/lib/audio/PianoSynth";
import { SampledPiano } from "@/lib/audio/SampledPiano";

export function usePianoSynth() {
  const synthRef = useRef<PianoSynth | null>(null);
  const sampledRef = useRef<SampledPiano | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const loadingRef = useRef(false);

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

  const startLoading = (ctx: AudioContext) => {
    if (loadingRef.current) return;
    if (sampledRef.current?.isLoaded) return;
    loadingRef.current = true;
    if (!sampledRef.current) {
      sampledRef.current = new SampledPiano();
    }
    sampledRef.current.load(ctx).then(() => {
      loadingRef.current = false;
    });
  };

  const noteOn = useCallback((note: number, velocity: number) => {
    const ctx = ensureContext();
    startLoading(ctx);
    if (sampledRef.current?.isLoaded) {
      sampledRef.current.noteOn(note, velocity);
    } else {
      getSynth().noteOn(note, velocity);
    }
  }, []);

  const noteOff = useCallback((note: number) => {
    if (sampledRef.current?.isLoaded) {
      sampledRef.current.noteOff(note);
    } else {
      getSynth().noteOff(note);
    }
  }, []);

  useEffect(() => {
    return () => {
      synthRef.current?.dispose();
      synthRef.current = null;
      sampledRef.current?.dispose();
      sampledRef.current = null;
      ctxRef.current?.close();
      ctxRef.current = null;
    };
  }, []);

  return { noteOn, noteOff };
}
