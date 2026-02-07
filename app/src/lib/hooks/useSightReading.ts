"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useAppStore } from "@/lib/state/useAppStore";
import type { LoopResult } from "@/lib/domain/types";

export function useSightReading() {
  const {
    sightReadingSession,
    tempo,
    startSightReading,
    restartSightReading,
    advanceSightReading,
    finishSightReading,
    clearSightReading,
  } = useAppStore();

  const [countdown, setCountdown] = useState<number | null>(null);
  const tempoScale = 60 / tempo;

  const isActive = sightReadingSession !== null && !sightReadingSession.isComplete;

  const shouldCountdown = useMemo(() => {
    if (!sightReadingSession) return false;
    return !sightReadingSession.isComplete
      && sightReadingSession.currentBarIndex === 0
      && sightReadingSession.barResults.length === 0;
  }, [sightReadingSession]);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    if (shouldCountdown) {
      timers.push(setTimeout(() => setCountdown(3), 0));
      timers.push(setTimeout(() => setCountdown(2), 1000));
      timers.push(setTimeout(() => setCountdown(1), 2000));
      timers.push(setTimeout(() => setCountdown(null), 3000));
    } else {
      timers.push(setTimeout(() => setCountdown(null), 0));
    }

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [
    shouldCountdown,
    sightReadingSession?.currentBarIndex,
    sightReadingSession?.barResults.length,
    sightReadingSession?.isComplete,
  ]);

  const onBarComplete = useCallback((barResult: LoopResult) => {
    const state = useAppStore.getState();
    const session = state.sightReadingSession;
    if (!session || session.isComplete) return;

    const sortedSelection = [...state.selectedBars].sort((a, b) => a - b);
    const isDefaultAutoFlow =
      sortedSelection.length === 1 && sortedSelection[0] === session.currentBarIndex;

    if (isDefaultAutoFlow) {
      const isLast = session.currentBarIndex >= session.measureIds.length - 1;
      advanceSightReading(barResult);
      if (isLast) {
        finishSightReading();
      }
      return;
    }

    if (sortedSelection.length > 0) {
      const current = state.selectedBar ?? sortedSelection[0];
      const currentIdx = sortedSelection.indexOf(current);
      const nextIdx = currentIdx >= 0 ? (currentIdx + 1) % sortedSelection.length : 0;
      const nextBar = sortedSelection[nextIdx];

      useAppStore.setState((s) => {
        if (!s.sightReadingSession || s.sightReadingSession.isComplete) return {};
        const barResults = [...s.sightReadingSession.barResults, barResult];
        const totalScore = Math.round(
          barResults.reduce((sum, r) => sum + r.accuracyPercent, 0) / barResults.length,
        );
        return {
          sightReadingSession: {
            ...s.sightReadingSession,
            currentBarIndex: nextBar,
            barResults,
            totalScore,
          },
          selectedBar: nextBar,
        };
      });
    }
  }, [advanceSightReading, finishSightReading]);

  return {
    sightReadingSession,
    countdown,
    tempoScale,
    isActive,
    startSightReading,
    restartSightReading,
    clearSightReading,
    onBarComplete,
  };
}
