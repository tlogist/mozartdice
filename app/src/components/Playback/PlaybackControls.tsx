"use client";

import { useEffect, useRef, useCallback } from "react";
import { useAppStore } from "@/lib/state/useAppStore";
import { getMeasureData } from "@/lib/mozart/measureData";

interface PlaybackControlsProps {
  onActiveNotes: (notes: Set<number>) => void;
  onExpectedNotes: (notes: number[]) => void;
  onFingeringMap: (map: Map<number, number>) => void;
  onLeftHandMidis: (midis: Set<number>) => void;
}

export default function PlaybackControls({
  onActiveNotes,
  onExpectedNotes,
  onFingeringMap,
  onLeftHandMidis,
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

  // Build fingering map from measure data (both hands)
  const buildFingeringMap = useCallback(
    (md: NonNullable<typeof measureData>): Map<number, number> => {
      const map = new Map<number, number>();
      md.rightHand.forEach((note, i) => {
        if (md.fingeringRight[i] !== undefined) {
          map.set(note.midi, md.fingeringRight[i]);
        }
      });
      md.leftHand.forEach((note, i) => {
        if (md.fingeringLeft[i] !== undefined) {
          map.set(note.midi, md.fingeringLeft[i]);
        }
      });
      return map;
    },
    []
  );

  // When a bar is selected, show expected notes + fingering even without playback
  useEffect(() => {
    if (measureData) {
      const allNotes = [...measureData.rightHand, ...measureData.leftHand];
      onExpectedNotes(allNotes.map((n) => n.midi));
      onFingeringMap(buildFingeringMap(measureData));
      onLeftHandMidis(new Set(measureData.leftHand.map((n) => n.midi)));
    } else {
      onExpectedNotes([]);
      onFingeringMap(new Map());
      onLeftHandMidis(new Set());
    }
  }, [measureData, onExpectedNotes, onFingeringMap, onLeftHandMidis, buildFingeringMap]);

  const stopPlayback = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    onActiveNotes(new Set());
  }, [onActiveNotes]);

  useEffect(() => {
    if (!isPlaying || !measureData) {
      stopPlayback();
      return;
    }

    const allNotes = [...measureData.rightHand, ...measureData.leftHand];

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
