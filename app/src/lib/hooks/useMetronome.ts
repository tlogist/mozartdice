"use client";

import { useCallback, useEffect, useRef } from "react";
import { useAppStore } from "@/lib/state/useAppStore";

// This app's generated material is Mozart's minuet (triple meter).
const BEATS_PER_MEASURE = 3;

export function useMetronome() {
  const tempo = useAppStore((s) => s.tempo);
  const isPlaying = useAppStore((s) => s.isPlaying);
  const metronomeEnabled = useAppStore((s) => s.metronomeEnabled);
  const metronomeSubdivision = useAppStore((s) => s.metronomeSubdivision);
  const metronomeVolume = useAppStore((s) => s.metronomeVolume);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const tickInMeasureRef = useRef(0);

  const ensureContext = useCallback((): AudioContext => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
    }
    if (ctxRef.current.state === "suspended") {
      void ctxRef.current.resume().catch(() => {
        // User interaction may be required in some environments.
      });
    }
    return ctxRef.current;
  }, []);

  const click = useCallback((tickInMeasure: number, subdivision: number, volume: number) => {
    const ctx = ensureContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "square";
    // Beat 1 is accented, regular beats are medium, subdivisions are light.
    const isDownBeat = tickInMeasure === 0;
    const isBeatBoundary = tickInMeasure % subdivision === 0;
    osc.frequency.value = isDownBeat ? 1400 : isBeatBoundary ? 1050 : 800;
    const rawGain = isDownBeat ? 0.26 : isBeatBoundary ? 0.18 : 0.12;
    const peakGain = rawGain * volume;

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(peakGain, now + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);

    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.06);
  }, [ensureContext]);

  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (!metronomeEnabled || !isPlaying) return;

    const ticksPerMeasure = BEATS_PER_MEASURE * metronomeSubdivision;
    tickInMeasureRef.current = 0;
    click(tickInMeasureRef.current, metronomeSubdivision, metronomeVolume);
    const intervalMs = Math.max(30, Math.round(60000 / (tempo * metronomeSubdivision)));
    timerRef.current = setInterval(() => {
      tickInMeasureRef.current = (tickInMeasureRef.current + 1) % ticksPerMeasure;
      click(tickInMeasureRef.current, metronomeSubdivision, metronomeVolume);
    }, intervalMs);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [click, isPlaying, metronomeEnabled, metronomeSubdivision, metronomeVolume, tempo]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      void ctxRef.current?.close();
      ctxRef.current = null;
    };
  }, []);
}
