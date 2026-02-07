import { create } from "zustand";
import type { DiceRoll, PracticeMode, HandMode, Recording, SightReadingSession, LoopResult } from "@/lib/domain/types";
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
  selectedBars: number[];
  teachingSound: boolean;
  autoSpeedUp: boolean;
  consecutiveGoodLoops: number;
  targetTempo: number;
  sightReadMode: boolean;
  isRecording: boolean;
  currentRecording: Recording | null;
  sightReadingSession: SightReadingSession | null;

  // Existing actions
  rollAllDice: () => void;
  selectBar: (bar: number | null) => void;
  setActiveBar: (bar: number) => void;
  setTempo: (bpm: number) => void;
  togglePlayback: () => void;

  // Practice actions
  setPracticeMode: (mode: PracticeMode) => void;
  setHandMode: (mode: HandMode) => void;
  toggleBarSelection: (bar: number) => void;
  selectBarRange: (bar: number) => void;
  toggleSightReadMode: () => void;
  toggleTeachingSound: () => void;
  toggleAutoSpeedUp: () => void;
  setTargetTempo: (bpm: number) => void;
  incrementGoodLoops: () => void;
  resetGoodLoops: () => void;
  startRecording: () => void;
  stopRecording: (recording: Recording) => void;
  clearRecording: () => void;
  startSightReading: () => void;
  restartSightReading: () => void;
  advanceSightReading: (barResult: LoopResult) => void;
  finishSightReading: () => void;
  clearSightReading: () => void;
  rollWithFixedMeasure: (measureId: number) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentRolls: [],
  measureIds: [],
  selectedBar: null,
  tempo: 60,
  isPlaying: false,

  practiceMode: "free",
  handMode: "both",
  selectedBars: [],
  sightReadMode: false,
  teachingSound: true,
  autoSpeedUp: false,
  consecutiveGoodLoops: 0,
  targetTempo: 80,
  isRecording: false,
  currentRecording: null,
  sightReadingSession: null,

  rollAllDice: () => {
    const { rolls, measureIds } = generateMinuet();
    set({
      currentRolls: rolls,
      measureIds,
      selectedBar: null,
      isPlaying: false,
      selectedBars: [],
      sightReadMode: false,
      sightReadingSession: null,
      practiceMode: "free",
    });
  },

  selectBar: (bar) => set({ selectedBar: bar, selectedBars: bar !== null ? [bar] : [] }),

  setActiveBar: (bar) => set({ selectedBar: bar }),

  setTempo: (bpm) => set({ tempo: bpm }),

  togglePlayback: () => set((state) => ({ isPlaying: !state.isPlaying })),

  setPracticeMode: (mode) => set({ practiceMode: mode }),

  setHandMode: (mode) => set({ handMode: mode }),

  toggleBarSelection: (bar) =>
    set((s) => {
      const idx = s.selectedBars.indexOf(bar);
      const next = idx >= 0
        ? s.selectedBars.filter((b) => b !== bar)
        : [...s.selectedBars, bar].sort((a, b) => a - b);
      return { selectedBar: bar, selectedBars: next };
    }),

  selectBarRange: (bar) =>
    set((s) => {
      if (s.selectedBar === null) return { selectedBar: bar, selectedBars: [bar] };
      const start = Math.min(s.selectedBar, bar);
      const end = Math.max(s.selectedBar, bar);
      const range: number[] = [];
      for (let i = start; i <= end; i++) range.push(i);
      return { selectedBar: bar, selectedBars: range };
    }),

  toggleSightReadMode: () => {
    if (get().sightReadMode) {
      get().clearSightReading();
    } else {
      get().startSightReading();
    }
  },

  toggleTeachingSound: () => set((s) => ({ teachingSound: !s.teachingSound })),

  toggleAutoSpeedUp: () => set((s) => ({ autoSpeedUp: !s.autoSpeedUp, consecutiveGoodLoops: 0 })),

  setTargetTempo: (bpm) => set({ targetTempo: bpm }),

  incrementGoodLoops: () => set((s) => ({ consecutiveGoodLoops: s.consecutiveGoodLoops + 1 })),

  resetGoodLoops: () => set({ consecutiveGoodLoops: 0 }),

  startRecording: () => set({ isRecording: true, currentRecording: null }),

  stopRecording: (recording) => set({ isRecording: false, currentRecording: recording }),

  clearRecording: () => set({ currentRecording: null }),

  startSightReading: () => {
    const { rolls, measureIds } = generateMinuet();
    set({
      currentRolls: rolls,
      measureIds,
      sightReadingSession: {
        measureIds,
        currentBarIndex: 0,
        barResults: [],
        isComplete: false,
        totalScore: 0,
      },
      practiceMode: "sightReading",
      sightReadMode: true,
      isPlaying: true,
      selectedBar: 0,
      selectedBars: [0],
      isRecording: false,
      currentRecording: null,
    });
  },

  restartSightReading: () =>
    set((s) => {
      const sessionMeasureIds = s.sightReadingSession?.measureIds ?? s.measureIds;
      if (sessionMeasureIds.length === 0) return {};
      return {
        sightReadingSession: {
          measureIds: sessionMeasureIds,
          currentBarIndex: 0,
          barResults: [],
          isComplete: false,
          totalScore: 0,
        },
        measureIds: sessionMeasureIds,
        sightReadMode: true,
        practiceMode: "sightReading",
        isPlaying: true,
        selectedBar: 0,
        selectedBars: [0],
        isRecording: false,
        currentRecording: null,
      };
    }),

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
        selectedBar: nextIndex < s.sightReadingSession.measureIds.length ? nextIndex : s.selectedBar,
        selectedBars: nextIndex < s.sightReadingSession.measureIds.length ? [nextIndex] : s.selectedBars,
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
        practiceMode: "sightReading",
      };
    }),

  clearSightReading: () =>
    set({
      sightReadingSession: null,
      sightReadMode: false,
      practiceMode: "free",
      isPlaying: false,
      selectedBars: [],
      selectedBar: null,
    }),

  rollWithFixedMeasure: (measureId) => {
    const { rolls, measureIds } = generateMinuet();
    measureIds[0] = measureId;
    set({
      currentRolls: rolls,
      measureIds,
      selectedBar: 0,
      selectedBars: [0],
      isPlaying: false,
      sightReadMode: false,
      sightReadingSession: null,
      practiceMode: "free",
    });
  },
}));
