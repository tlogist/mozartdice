"use client";

import { useEffect, useMemo, useRef, useCallback } from "react";
import { useAppStore } from "@/lib/state/useAppStore";
import { getMeasureData } from "@/lib/mozart/measureData";
import { buildLoopData } from "@/lib/mozart/loopData";

interface PlaybackControlsProps {
  onActiveNotes: (notes: Set<number>) => void;
  onExpectedNotes: (notes: number[]) => void;
  onFingeringMap: (map: Map<number, number>) => void;
  onLeftHandMidis: (midis: Set<number>) => void;
  onPlaybackPosition?: (positionMs: number) => void;
  onPlaybackLoopPosition?: (positionMs: number) => void;
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
  onPlaybackLoopPosition,
  onLoopBoundary,
  onAutoNoteOn,
  onAutoNoteOff,
}: PlaybackControlsProps) {
  const { measureIds, isPlaying, tempo, togglePlayback, selectedBars, selectedBar, handMode } =
    useAppStore();
  // Read handMode/teachingSound from store inside tick to avoid restarting playback on changes
  const storeRef = useRef(useAppStore);
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const loopCountRef = useRef<number>(0);
  const prevAutoActiveRef = useRef<Set<number>>(new Set());
  const activeBarIdxRef = useRef<number>(-1);

  // Scale factor: 60 BPM = 1x, higher BPM = faster
  const tempoScale = 60 / tempo;

  const loopData = useMemo(() => buildLoopData(measureIds, selectedBars), [measureIds, selectedBars]);

  // When selection changes, show expected notes + fingering for the first active bar
  useEffect(() => {
    if (loopData && loopData.bars.length > 0) {
      const bar = loopData.bars[0];
      const midis = handMode === "right"
        ? bar.rightHandMidis
        : handMode === "left"
          ? bar.leftHandMidis
          : [...bar.rightHandMidis, ...bar.leftHandMidis];
      onExpectedNotes(midis);
      onFingeringMap(bar.fingeringMap);
      onLeftHandMidis(bar.leftHandMidiSet);
    } else {
      onExpectedNotes([]);
      onFingeringMap(new Map());
      onLeftHandMidis(new Set());
    }
  }, [loopData, handMode, onExpectedNotes, onFingeringMap, onLeftHandMidis]);

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

    if (!loopData) {
      stopPlayback();
      return;
    }

    startTimeRef.current = performance.now();
    loopCountRef.current = 0;
    activeBarIdxRef.current = -1;

    const scaledLoopDurationMs = loopData.totalDurationMs * tempoScale;
    if (scaledLoopDurationMs <= 0) {
      stopPlayback();
      return;
    }

    const tick = (now: number) => {
      const elapsed = now - startTimeRef.current;
      const positionScaled = elapsed % scaledLoopDurationMs;
      const positionBase = positionScaled / tempoScale;

      // Detect loop boundary
      const currentLoop = Math.floor(elapsed / scaledLoopDurationMs);
      if (currentLoop > loopCountRef.current) {
        loopCountRef.current = currentLoop;
        onLoopBoundary?.(currentLoop);
      }

      // Read handMode + teachingSound from store (avoids effect restart)
      const { handMode: hm, teachingSound } = storeRef.current.getState();

      // Find active bar from cumulative per-bar durations.
      let barInLoop = loopData.bars.length - 1;
      for (let i = 0; i < loopData.bars.length; i++) {
        const bar = loopData.bars[i];
        if (positionBase < bar.startOffsetMs + bar.durationMs) {
          barInLoop = i;
          break;
        }
      }
      const activeBar = loopData.bars[barInLoop];
      const barPositionScaled = (positionBase - activeBar.startOffsetMs) * tempoScale;
      onPlaybackLoopPosition?.(positionScaled);
      onPlaybackPosition?.(barPositionScaled);

      // Rotate active bar highlight, sheet music, and teaching keyboard through selected bars
      if (barInLoop !== activeBarIdxRef.current) {
        activeBarIdxRef.current = barInLoop;
        useAppStore.getState().setActiveBar(loopData.sortedBars[barInLoop]);

        const midis = hm === "right"
          ? activeBar.rightHandMidis
          : hm === "left"
            ? activeBar.leftHandMidis
            : [...activeBar.rightHandMidis, ...activeBar.leftHandMidis];
        onExpectedNotes(midis);
        onFingeringMap(activeBar.fingeringMap);
        onLeftHandMidis(activeBar.leftHandMidiSet);
      }

      // Teaching keyboard shows the selected hand
      const displayNotes = hm === "both"
        ? loopData.allNotes
        : hm === "right"
          ? loopData.rightHandNotes
          : loopData.leftHandNotes;

      // Auto-play the selected hand (so user hears what they're learning)
      const autoPlayNotes = !teachingSound ? []
        : hm === "both"
          ? loopData.allNotes
          : hm === "right"
            ? loopData.rightHandNotes
            : loopData.leftHandNotes;

      // Active teaching display notes
      const active = new Set<number>();
      for (const note of displayNotes) {
        const scaledStart = note.startMs * tempoScale;
        const scaledEnd = note.endMs * tempoScale;
        if (positionScaled >= scaledStart && positionScaled <= scaledEnd) {
          active.add(note.midi);
        }
      }
      onActiveNotes(active);

      // Auto-play sound
      const autoActive = new Set<number>();
      for (const note of autoPlayNotes) {
        const scaledStart = note.startMs * tempoScale;
        const scaledEnd = note.endMs * tempoScale;
        if (positionScaled >= scaledStart && positionScaled <= scaledEnd) {
          autoActive.add(note.midi);
        }
      }

      // Trigger noteOn/Off for auto-play
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
      // Release any auto-play notes on cleanup
      prevAutoActiveRef.current.forEach((midi) => onAutoNoteOff?.(midi));
      prevAutoActiveRef.current.clear();
    };
  }, [
    isPlaying,
    loopData,
    tempoScale,
    onActiveNotes,
    onExpectedNotes,
    onFingeringMap,
    onLeftHandMidis,
    onPlaybackPosition,
    onPlaybackLoopPosition,
    onLoopBoundary,
    onAutoNoteOn,
    onAutoNoteOff,
    stopPlayback,
  ]);

  // Reset position when selection or playback state changes
  useEffect(() => {
    if (isPlaying) {
      startTimeRef.current = performance.now();
      loopCountRef.current = 0;
      activeBarIdxRef.current = -1;
    }
  }, [selectedBars, isPlaying]);

  const canPlay = selectedBars.length > 0 && selectedBars.some((i) => {
    const mid = measureIds[i];
    return mid !== undefined && getMeasureData(mid) !== null;
  });

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
      {selectedBar !== null && selectedBars.length <= 1 && !loopData && (
        <span className="text-xs text-neutral-500">
          No playback data for measure {measureIds[selectedBar]}
        </span>
      )}
    </div>
  );
}
