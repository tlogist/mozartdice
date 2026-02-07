import { create } from "zustand";
import type { DiceRoll, PracticeMode, HandMode, BarRange, Recording, SightReadingSession, LoopResult } from "@/lib/domain/types";
import { generateMinuet } from "@/lib/mozart/generateMinuet";

interface AppState {
  // Existing
  currentRolls: DiceRoll[];
  measureIds: number[];
  selectedBar: number | null;
  tempo: number;
  isPlaying: boolean;

  // Practice
  practiceMode: PracticeMode;
  handMode: HandMode;
  loopRange: BarRange | null;
  autoSpeedUp: boolean;
  consecutiveGoodLoops: number;
  targetTempo: number;
  isRecording: boolean;
  currentRecording: Recording | null;
  sightReadingSession: SightReadingSession | null;

  // Existing actions
  rollAllDice: () => void;
  selectBar: (bar: number | null) => void;
  setTempo: (bpm: number) => void;
  togglePlayback: () => void;

  // Practice actions
  setPracticeMode: (mode: PracticeMode) => void;
  setHandMode: (mode: HandMode) => void;
  setLoopRange: (range: BarRange | null) => void;
  toggleAutoSpeedUp: () => void;
  setTargetTempo: (bpm: number) => void;
  incrementGoodLoops: () => void;
  resetGoodLoops: () => void;
  startRecording: () => void;
  stopRecording: (recording: Recording) => void;
  clearRecording: () => void;
  startSightReading: () => void;
  advanceSightReading: (barResult: LoopResult) => void;
  finishSightReading: () => void;
  clearSightReading: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentRolls: [],
  measureIds: [],
  selectedBar: null,
  tempo: 60,
  isPlaying: false,

  practiceMode: "free",
  handMode: "both",
  loopRange: null,
  autoSpeedUp: false,
  consecutiveGoodLoops: 0,
  targetTempo: 80,
  isRecording: false,
  currentRecording: null,
  sightReadingSession: null,

  rollAllDice: () => {
    const { rolls, measureIds } = generateMinuet();
    set({ currentRolls: rolls, measureIds, selectedBar: null, isPlaying: false, loopRange: null });
  },

  selectBar: (bar) => set({ selectedBar: bar }),

  setTempo: (bpm) => set({ tempo: bpm }),

  togglePlayback: () => set((state) => ({ isPlaying: !state.isPlaying })),

  setPracticeMode: (mode) => set({ practiceMode: mode }),

  setHandMode: (mode) => set({ handMode: mode }),

  setLoopRange: (range) => set({ loopRange: range }),

  toggleAutoSpeedUp: () => set((s) => ({ autoSpeedUp: !s.autoSpeedUp, consecutiveGoodLoops: 0 })),

  setTargetTempo: (bpm) => set({ targetTempo: bpm }),

  incrementGoodLoops: () => set((s) => ({ consecutiveGoodLoops: s.consecutiveGoodLoops + 1 })),

  resetGoodLoops: () => set({ consecutiveGoodLoops: 0 }),

  startRecording: () => set({ isRecording: true, currentRecording: null }),

  stopRecording: (recording) => set({ isRecording: false, currentRecording: recording }),

  clearRecording: () => set({ currentRecording: null }),

  startSightReading: () => {
    const { measureIds } = generateMinuet();
    set({
      sightReadingSession: {
        measureIds,
        currentBarIndex: 0,
        barResults: [],
        isComplete: false,
        totalScore: 0,
      },
      practiceMode: "sightReading",
      isPlaying: true,
      selectedBar: 0,
    });
  },

  advanceSightReading: (barResult) =>
    set((s) => {
      if (!s.sightReadingSession) return {};
      const newResults = [...s.sightReadingSession.barResults, barResult];
      const nextIndex = s.sightReadingSession.currentBarIndex + 1;
      return {
        sightReadingSession: {
          ...s.sightReadingSession,
          barResults: newResults,
          currentBarIndex: nextIndex,
        },
        selectedBar: nextIndex < 16 ? nextIndex : s.selectedBar,
      };
    }),

  finishSightReading: () =>
    set((s) => {
      if (!s.sightReadingSession) return {};
      const totalScore = s.sightReadingSession.barResults.length > 0
        ? Math.round(
            s.sightReadingSession.barResults.reduce((sum, r) => sum + r.accuracyPercent, 0) /
              s.sightReadingSession.barResults.length,
          )
        : 0;
      return {
        sightReadingSession: { ...s.sightReadingSession, isComplete: true, totalScore },
        isPlaying: false,
        practiceMode: "free",
      };
    }),

  clearSightReading: () => set({ sightReadingSession: null, practiceMode: "free" }),
}));
