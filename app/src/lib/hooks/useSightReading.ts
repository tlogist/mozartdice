"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import { useAppStore } from "@/lib/state/useAppStore";
import { PracticeEngine } from "@/lib/engine/PracticeEngine";
import { getMeasureData } from "@/lib/mozart/measureData";
import type { NoteEvaluation, ExpectedNote } from "@/lib/domain/types";

export function useSightReading() {
  const {
    sightReadingSession, tempo,
    startSightReading, advanceSightReading, finishSightReading, clearSightReading,
  } = useAppStore();

  const [countdown, setCountdown] = useState<number | null>(null);
  const evaluationsRef = useRef<NoteEvaluation[]>([]);
  const positionRef = useRef(0);
  const tempoScale = 60 / tempo;

  const isActive = sightReadingSession !== null && !sightReadingSession.isComplete;

  // Countdown timer on start
  useEffect(() => {
    if (!isActive || sightReadingSession!.currentBarIndex !== 0 || sightReadingSession!.barResults.length > 0) {
      setCountdown(null);
      return;
    }
    setCountdown(3);
    const t1 = setTimeout(() => setCountdown(2), 1000);
    const t2 = setTimeout(() => setCountdown(1), 2000);
    const t3 = setTimeout(() => setCountdown(null), 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [isActive, sightReadingSession]);

  const onSightReadingTick = useCallback((positionMs: number) => {
    positionRef.current = positionMs;
  }, []);

  const evaluateNote = useCallback((midi: number) => {
    if (!sightReadingSession || sightReadingSession.isComplete) return;
    const barIdx = sightReadingSession.currentBarIndex;
    const mid = sightReadingSession.measureIds[barIdx];
    const md = mid !== undefined ? getMeasureData(mid) : null;
    if (!md) return;

    const allNotes: ExpectedNote[] = [...md.rightHand, ...md.leftHand];
    const rhMidis = new Set(md.rightHand.map((n) => n.midi));
    const ev = PracticeEngine.evaluateNote(midi, positionRef.current, allNotes, tempoScale, "both", rhMidis);
    evaluationsRef.current.push(ev);
  }, [sightReadingSession, tempoScale]);

  const completeBar = useCallback(() => {
    if (!sightReadingSession || sightReadingSession.isComplete) return;
    const barIdx = sightReadingSession.currentBarIndex;
    const mid = sightReadingSession.measureIds[barIdx];
    const md = mid !== undefined ? getMeasureData(mid) : null;
    const totalExpected = md ? md.rightHand.length + md.leftHand.length : 0;

    const result = PracticeEngine.computeLoopResult(evaluationsRef.current, totalExpected);
    evaluationsRef.current = [];

    if (barIdx >= 15) {
      advanceSightReading(result);
      finishSightReading();
    } else {
      advanceSightReading(result);
    }
  }, [sightReadingSession, advanceSightReading, finishSightReading]);

  return {
    sightReadingSession,
    countdown,
    isActive,
    startSightReading,
    clearSightReading,
    onSightReadingTick,
    evaluateNote,
    completeBar,
  };
}
