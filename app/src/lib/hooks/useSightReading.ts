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
    const session = useAppStore.getState().sightReadingSession;
    if (!session || session.isComplete) return;

    const isLast = session.currentBarIndex >= session.measureIds.length - 1;
    advanceSightReading(barResult);
    if (isLast) {
      finishSightReading();
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
