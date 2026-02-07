"use client";

import { useEffect, useRef, useCallback } from "react";
import { useAppStore } from "@/lib/state/useAppStore";
import { getMeasureData } from "@/lib/mozart/measureData";
import type { ExpectedNote } from "@/lib/domain/types";

interface PlaybackControlsProps {
  onActiveNotes: (notes: Set<number>) => void;
  onExpectedNotes: (notes: number[]) => void;
  onFingeringMap: (map: Map<number, number>) => void;
  onLeftHandMidis: (midis: Set<number>) => void;
  onPlaybackPosition?: (positionMs: number) => void;
  onLoopBoundary?: (loopCount: number) => void;
  onAutoNoteOn?: (midi: number) => void;
  onAutoNoteOff?: (midi: number) => void;
}

export default function PlaybackControls({
  onActiveNotes,
  onExpectedNotes,
  onFingeringMap,
  onLeftHandMidis,
  onPlaybackPosition,
  onLoopBoundary,
  onAutoNoteOn,
  onAutoNoteOff,
}: PlaybackControlsProps) {
  const { selectedBar, measureIds, isPlaying, tempo, togglePlayback, loopRange, handMode } =
    useAppStore();
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const loopCountRef = useRef<number>(0);
  const prevAutoActiveRef = useRef<Set<number>>(new Set());

  const measureId = selectedBar !== null ? measureIds[selectedBar] : null;
  const measureData = measureId !== null ? getMeasureData(measureId) : null;

  // Scale factor: 60 BPM = 1x, higher BPM = faster
  const tempoScale = 60 / tempo;

  // Total measure duration: 3 beats in 3/4 time
  const singleMeasureDurationMs = 3 * 1000 * tempoScale;

  // Build multi-bar data when loopRange is set
  const getLoopData = useCallback(() => {
    if (loopRange) {
      const allNotes: ExpectedNote[] = [];
      const rhNotes: ExpectedNote[] = [];
      const lhNotes: ExpectedNote[] = [];
      const fMap = new Map<number, number>();
      const lhMidis = new Set<number>();
      const barCount = loopRange.endBar - loopRange.startBar + 1;

      for (let i = 0; i < barCount; i++) {
        const barIdx = loopRange.startBar + i;
        const mid = measureIds[barIdx];
        const md = mid !== undefined ? getMeasureData(mid) : null;
        if (!md) continue;
        const offset = i * 3000; // 3000ms per bar at base tempo

        for (const note of md.rightHand) {
          const shifted = { midi: note.midi, startMs: note.startMs + offset, endMs: note.endMs + offset };
          allNotes.push(shifted);
          rhNotes.push(shifted);
        }
        for (const note of md.leftHand) {
          const shifted = { midi: note.midi, startMs: note.startMs + offset, endMs: note.endMs + offset };
          allNotes.push(shifted);
          lhNotes.push(shifted);
          lhMidis.add(note.midi);
        }

        // Fingering
        md.rightHand.forEach((note, j) => {
          if (md.fingeringRight[j] !== undefined) fMap.set(note.midi, md.fingeringRight[j]);
        });
        md.leftHand.forEach((note, j) => {
          if (md.fingeringLeft[j] !== undefined) fMap.set(note.midi, md.fingeringLeft[j]);
        });
      }

      const totalDuration = barCount * singleMeasureDurationMs;
      return { allNotes, rhNotes, lhNotes, fMap, lhMidis, totalDuration, barCount };
    }

    if (!measureData) return null;

    const allNotes = [...measureData.rightHand, ...measureData.leftHand];
    const fMap = new Map<number, number>();
    const lhMidis = new Set<number>();

    measureData.rightHand.forEach((note, i) => {
      if (measureData.fingeringRight[i] !== undefined) fMap.set(note.midi, measureData.fingeringRight[i]);
    });
    measureData.leftHand.forEach((note, i) => {
      if (measureData.fingeringLeft[i] !== undefined) fMap.set(note.midi, measureData.fingeringLeft[i]);
      lhMidis.add(note.midi);
    });

    return {
      allNotes,
      rhNotes: measureData.rightHand,
      lhNotes: measureData.leftHand,
      fMap,
      lhMidis,
      totalDuration: singleMeasureDurationMs,
      barCount: 1,
    };
  }, [loopRange, measureData, measureIds, singleMeasureDurationMs]);

  // When selection changes, show expected notes + fingering even without playback
  useEffect(() => {
    const data = getLoopData();
    if (data) {
      // Filter expected notes by hand mode
      let displayNotes: ExpectedNote[];
      if (handMode === "right") {
        displayNotes = data.rhNotes;
      } else if (handMode === "left") {
        displayNotes = data.lhNotes;
      } else {
        displayNotes = data.allNotes;
      }
      onExpectedNotes(displayNotes.map((n) => n.midi));
      onFingeringMap(data.fMap);
      onLeftHandMidis(data.lhMidis);
    } else {
      onExpectedNotes([]);
      onFingeringMap(new Map());
      onLeftHandMidis(new Set());
    }
  }, [getLoopData, handMode, onExpectedNotes, onFingeringMap, onLeftHandMidis]);

  const stopPlayback = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    onActiveNotes(new Set());
    // Release any auto-play notes
    prevAutoActiveRef.current.forEach((midi) => onAutoNoteOff?.(midi));
    prevAutoActiveRef.current.clear();
  }, [onActiveNotes, onAutoNoteOff]);

  useEffect(() => {
    if (!isPlaying) {
      stopPlayback();
      return;
    }

    const data = getLoopData();
    if (!data) {
      stopPlayback();
      return;
    }

    startTimeRef.current = performance.now();
    loopCountRef.current = 0;

    const tick = (now: number) => {
      const elapsed = now - startTimeRef.current;
      const position = elapsed % data.totalDuration;

      // Detect loop boundary
      const currentLoop = Math.floor(elapsed / data.totalDuration);
      if (currentLoop > loopCountRef.current) {
        loopCountRef.current = currentLoop;
        onLoopBoundary?.(currentLoop);
      }

      onPlaybackPosition?.(position);

      // Determine which notes to display vs auto-play based on hand mode
      const practiceNotes = handMode === "both" ? data.allNotes
        : handMode === "right" ? data.rhNotes : data.lhNotes;
      const autoPlayNotes = handMode === "both" ? []
        : handMode === "right" ? data.lhNotes : data.rhNotes;

      // Active teaching display notes (practice hand)
      const active = new Set<number>();
      for (const note of practiceNotes) {
        const scaledStart = note.startMs * tempoScale;
        const scaledEnd = note.endMs * tempoScale;
        if (position >= scaledStart && position <= scaledEnd) {
          active.add(note.midi);
        }
      }
      onActiveNotes(active);

      // Auto-play the other hand
      const autoActive = new Set<number>();
      for (const note of autoPlayNotes) {
        const scaledStart = note.startMs * tempoScale;
        const scaledEnd = note.endMs * tempoScale;
        if (position >= scaledStart && position <= scaledEnd) {
          autoActive.add(note.midi);
        }
      }

      // Trigger noteOn/Off for auto-play hand
      const prev = prevAutoActiveRef.current;
      for (const midi of autoActive) {
        if (!prev.has(midi)) onAutoNoteOn?.(midi);
      }
      for (const midi of prev) {
        if (!autoActive.has(midi)) onAutoNoteOff?.(midi);
      }
      prevAutoActiveRef.current = autoActive;

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [
    isPlaying,
    getLoopData,
    tempoScale,
    handMode,
    onActiveNotes,
    onPlaybackPosition,
    onLoopBoundary,
    onAutoNoteOn,
    onAutoNoteOff,
    stopPlayback,
  ]);

  // Reset position when bar changes during playback
  useEffect(() => {
    if (isPlaying) {
      startTimeRef.current = performance.now();
      loopCountRef.current = 0;
    }
  }, [selectedBar, loopRange, isPlaying]);

  const canPlay = (selectedBar !== null && measureData !== null) || loopRange !== null;

  return (
    <div className="flex items-center gap-3">
      {isPlaying ? (
        <button
          onClick={togglePlayback}
          className="rounded-lg bg-red-600 px-5 py-2 font-bold text-white transition-colors hover:bg-red-500"
        >
          Stop
        </button>
      ) : (
        <button
          onClick={togglePlayback}
          disabled={!canPlay}
          className="rounded-lg bg-green-600 px-5 py-2 font-bold text-white transition-colors hover:bg-green-500 disabled:opacity-30"
        >
          Play
        </button>
      )}
      {selectedBar !== null && !measureData && !loopRange && (
        <span className="text-xs text-neutral-500">
          No playback data for measure {measureIds[selectedBar]}
        </span>
      )}
    </div>
  );
}
