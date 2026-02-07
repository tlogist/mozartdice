"use client";

import { useRef, useCallback, useState } from "react";
import { useAppStore } from "@/lib/state/useAppStore";
import { PracticeEngine } from "@/lib/engine/PracticeEngine";
import { RecordingEngine } from "@/lib/engine/RecordingEngine";
import { getMeasureData } from "@/lib/mozart/measureData";
import type { NoteEvaluation, LoopResult, ExpectedNote } from "@/lib/domain/types";
import type { FeedbackColor } from "@/components/Keyboard/PianoKey";

interface UsePracticeSessionReturn {
  feedbackMap: Map<number, FeedbackColor>;
  lastLoopResult: LoopResult | null;
  onPracticeNoteOn: (note: number, velocity: number) => void;
  onPracticeNoteOff: (note: number) => void;
  onPlaybackTick: (positionMs: number) => void;
  onLoopComplete: () => void;
}

function timingToFeedback(timing: NoteEvaluation["timing"]): FeedbackColor {
  switch (timing) {
    case "perfect": return "correct";
    case "early": return "early";
    case "late": return "late";
    case "wrong": return "wrong";
  }
}

export function usePracticeSession(
  noteOn: (note: number, velocity: number) => void,
  noteOff: (note: number) => void,
  onStatsRecord?: (measureId: number, accuracy: number, tempo: number) => void,
): UsePracticeSessionReturn {
  const [feedbackMap, setFeedbackMap] = useState<Map<number, FeedbackColor>>(new Map());
  const [lastLoopResult, setLastLoopResult] = useState<LoopResult | null>(null);

  const positionRef = useRef(0);
  const evaluationsRef = useRef<NoteEvaluation[]>([]);
  const recorderRef = useRef(new RecordingEngine());
  const feedbackTimersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const store = useAppStore;

  const getExpectedNotes = useCallback((): { notes: ExpectedNote[]; rhMidis: Set<number>; totalCount: number } => {
    const { selectedBars, measureIds, handMode } = store.getState();
    const rhMidis = new Set<number>();
    let allNotes: ExpectedNote[] = [];

    if (selectedBars.length > 1) {
      const sorted = [...selectedBars].sort((a, b) => a - b);
      for (let idx = 0; idx < sorted.length; idx++) {
        const mid = measureIds[sorted[idx]];
        const md = mid !== undefined ? getMeasureData(mid) : null;
        if (!md) continue;
        const offset = idx * 3000;
        for (const n of md.rightHand) {
          allNotes.push({ midi: n.midi, startMs: n.startMs + offset, endMs: n.endMs + offset });
          rhMidis.add(n.midi);
        }
        for (const n of md.leftHand) {
          allNotes.push({ midi: n.midi, startMs: n.startMs + offset, endMs: n.endMs + offset });
        }
      }
    } else if (selectedBars.length === 1) {
      const mid = measureIds[selectedBars[0]];
      const md = mid !== undefined ? getMeasureData(mid) : null;
      if (md) {
        allNotes = [...md.rightHand, ...md.leftHand];
        md.rightHand.forEach((n) => rhMidis.add(n.midi));
      }
    }

    // Filter by hand mode
    const filtered = handMode === "both" ? allNotes
      : handMode === "right" ? allNotes.filter((n) => rhMidis.has(n.midi))
      : allNotes.filter((n) => !rhMidis.has(n.midi));

    return { notes: allNotes, rhMidis, totalCount: filtered.length };
  }, [store]);

  const onPlaybackTick = useCallback((positionMs: number) => {
    positionRef.current = positionMs;
  }, []);

  const onPracticeNoteOn = useCallback((note: number, velocity: number) => {
    // Always play sound
    noteOn(note, velocity);

    const { practiceMode, isRecording, handMode } = store.getState();
    if (practiceMode === "free" && !isRecording) return;

    const tempoScale = 60 / store.getState().tempo;
    const { notes, rhMidis } = getExpectedNotes();

    // Record if recording
    if (isRecording) {
      recorderRef.current.noteOn(note, velocity);
    }

    // Evaluate
    const ev = PracticeEngine.evaluateNote(note, positionRef.current, notes, tempoScale, handMode, rhMidis);
    evaluationsRef.current.push(ev);

    // Visual feedback
    const fb = timingToFeedback(ev.timing);
    setFeedbackMap((prev) => {
      const next = new Map(prev);
      next.set(note, fb);
      return next;
    });

    // Clear feedback after 500ms
    const existingTimer = feedbackTimersRef.current.get(note);
    if (existingTimer) clearTimeout(existingTimer);
    feedbackTimersRef.current.set(note, setTimeout(() => {
      setFeedbackMap((prev) => {
        const next = new Map(prev);
        next.delete(note);
        return next;
      });
      feedbackTimersRef.current.delete(note);
    }, 500));
  }, [noteOn, store, getExpectedNotes]);

  const onPracticeNoteOff = useCallback((note: number) => {
    noteOff(note);
    const { isRecording } = store.getState();
    if (isRecording) {
      recorderRef.current.noteOff(note);
    }
  }, [noteOff, store]);

  const onLoopComplete = useCallback(() => {
    const {
      practiceMode, autoSpeedUp, tempo, targetTempo,
      isRecording, selectedBar, measureIds, selectedBars,
      incrementGoodLoops, resetGoodLoops, consecutiveGoodLoops,
      setTempo, stopRecording,
    } = store.getState();

    if (practiceMode === "free" && !isRecording) {
      evaluationsRef.current = [];
      return;
    }

    const { totalCount } = getExpectedNotes();
    const result = PracticeEngine.computeLoopResult(evaluationsRef.current, totalCount);
    setLastLoopResult(result);
    evaluationsRef.current = [];

    // Record stats
    const mid = selectedBars.length > 0 ? measureIds[selectedBars[0]] : (selectedBar !== null ? measureIds[selectedBar] : null);
    if (mid !== undefined && mid !== null) {
      onStatsRecord?.(mid, result.accuracyPercent, tempo);
    }

    // Handle recording
    if (isRecording && mid !== undefined && mid !== null) {
      stopRecording({
        measureId: mid,
        tempo,
        playedNotes: recorderRef.current.getNotes(),
        loopResult: result,
        recordedAt: Date.now(),
      });
      recorderRef.current.reset();
    }

    // Auto speed-up logic
    if (autoSpeedUp && practiceMode === "scaffolded") {
      if (result.accuracyPercent >= 80) {
        const newCount = consecutiveGoodLoops + 1;
        incrementGoodLoops();
        if (newCount >= 3) {
          const newTempo = Math.min(tempo + 5, targetTempo);
          setTempo(newTempo);
          resetGoodLoops();
        }
      } else {
        resetGoodLoops();
      }
    }
  }, [store, getExpectedNotes, onStatsRecord]);

  return {
    feedbackMap,
    lastLoopResult,
    onPracticeNoteOn,
    onPracticeNoteOff,
    onPlaybackTick,
    onLoopComplete,
  };
}
