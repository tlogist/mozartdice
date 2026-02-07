import { create } from "zustand";
import type { DiceRoll } from "@/lib/domain/types";
import { generateMinuet } from "@/lib/mozart/generateMinuet";

interface AppState {
  currentRolls: DiceRoll[];
  measureIds: number[];
  selectedBar: number | null;
  tempo: number;
  isPlaying: boolean;

  rollAllDice: () => void;
  selectBar: (bar: number | null) => void;
  setTempo: (bpm: number) => void;
  togglePlayback: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentRolls: [],
  measureIds: [],
  selectedBar: null,
  tempo: 60,
  isPlaying: false,

  rollAllDice: () => {
    const { rolls, measureIds } = generateMinuet();
    set({ currentRolls: rolls, measureIds, selectedBar: null, isPlaying: false });
  },

  selectBar: (bar) => set({ selectedBar: bar }),

  setTempo: (bpm) => set({ tempo: bpm }),

  togglePlayback: () => set((state) => ({ isPlaying: !state.isPlaying })),
}));
