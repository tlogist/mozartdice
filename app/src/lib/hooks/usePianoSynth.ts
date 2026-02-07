"use client";

import { useEffect, useRef, useCallback } from "react";
import { PianoSynth } from "@/lib/audio/PianoSynth";

export function usePianoSynth() {
  const synthRef = useRef<PianoSynth | null>(null);

  const getSynth = (): PianoSynth => {
    if (!synthRef.current) {
      synthRef.current = new PianoSynth();
    }
    return synthRef.current;
  };

  const noteOn = useCallback((note: number, velocity: number) => {
    getSynth().noteOn(note, velocity);
  }, []);

  const noteOff = useCallback((note: number) => {
    getSynth().noteOff(note);
  }, []);

  useEffect(() => {
    return () => {
      synthRef.current?.dispose();
      synthRef.current = null;
    };
  }, []);

  return { noteOn, noteOff };
}
