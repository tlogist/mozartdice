"use client";

import { useEffect, useRef, useCallback } from "react";
import { useAppStore } from "@/lib/state/useAppStore";
import { getMeasureData } from "@/lib/mozart/measureData";

interface PlaybackControlsProps {
  onActiveNotes: (notes: Set<number>) => void;
  onExpectedNotes: (notes: number[]) => void;
}

export default function PlaybackControls({
  onActiveNotes,
  onExpectedNotes,
}: PlaybackControlsProps) {
  const { selectedBar, measureIds, isPlaying, tempo, togglePlayback } =
    useAppStore();
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  const measureId = selectedBar !== null ? measureIds[selectedBar] : null;
  const measureData = measureId !== null ? getMeasureData(measureId) : null;

  // Scale factor: 60 BPM = 1x, higher BPM = faster
  const tempoScale = 60 / tempo;

  // Total measure duration: 3 beats in 3/4 time
  const measureDurationMs = 3 * 1000 * tempoScale;

  const stopPlayback = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    onActiveNotes(new Set());
    onExpectedNotes([]);
  }, [onActiveNotes, onExpectedNotes]);

  useEffect(() => {
    if (!isPlaying || !measureData) {
      stopPlayback();
      return;
    }

    const allNotes = [...measureData.rightHand, ...measureData.leftHand];
    // Show all expected notes
    onExpectedNotes(allNotes.map((n) => n.midi));

    startTimeRef.current = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTimeRef.current;
      // Loop: wrap elapsed time within measure duration
      const position = elapsed % measureDurationMs;

      const active = new Set<number>();
      for (const note of allNotes) {
        const scaledStart = note.startMs * tempoScale;
        const scaledEnd = note.endMs * tempoScale;
        if (position >= scaledStart && position <= scaledEnd) {
          active.add(note.midi);
        }
      }
      onActiveNotes(active);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [
    isPlaying,
    measureData,
    tempoScale,
    measureDurationMs,
    onActiveNotes,
    onExpectedNotes,
    stopPlayback,
  ]);

  // Stop playback when bar changes
  useEffect(() => {
    if (isPlaying) {
      startTimeRef.current = performance.now();
    }
  }, [selectedBar, isPlaying]);

  const canPlay = selectedBar !== null && measureData !== null;

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
      {selectedBar !== null && !measureData && (
        <span className="text-xs text-neutral-500">
          No playback data for measure {measureIds[selectedBar]}
        </span>
      )}
    </div>
  );
}
