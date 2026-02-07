import type { ExpectedNote } from "@/lib/domain/types";
import { getMeasureData, type MeasureData } from "@/lib/mozart/measureData";

export type SequencedExpectedNote = ExpectedNote & {
  hand: "right" | "left";
  expectedId: string;
};

export interface LoopBarData {
  barIndex: number;
  measureId: number;
  startOffsetMs: number;
  durationMs: number;
  rightHandNotes: SequencedExpectedNote[];
  leftHandNotes: SequencedExpectedNote[];
  allNotes: SequencedExpectedNote[];
  rightHandMidis: number[];
  leftHandMidis: number[];
  fingeringMap: Map<number, number>;
  leftHandMidiSet: Set<number>;
}

export interface LoopData {
  bars: LoopBarData[];
  sortedBars: number[];
  allNotes: SequencedExpectedNote[];
  rightHandNotes: SequencedExpectedNote[];
  leftHandNotes: SequencedExpectedNote[];
  totalDurationMs: number;
  leftHandMidis: Set<number>;
  allRightHandMidis: Set<number>;
}

const MIN_MEASURE_MS = 3000;

export function getMeasureDurationMsFromNotes(notes: ExpectedNote[]): number {
  if (notes.length === 0) return MIN_MEASURE_MS;
  const maxEndMs = notes.reduce((max, note) => Math.max(max, note.endMs), 0);
  return Math.max(MIN_MEASURE_MS, maxEndMs);
}

function getMeasureDurationMs(measureData: MeasureData | null): number {
  if (!measureData) return MIN_MEASURE_MS;
  return getMeasureDurationMsFromNotes([...measureData.rightHand, ...measureData.leftHand]);
}

export function buildLoopData(measureIds: number[], selectedBars: number[]): LoopData | null {
  const sortedBars = [...selectedBars].sort((a, b) => a - b);
  if (sortedBars.length === 0) return null;

  const bars: LoopBarData[] = [];
  const allNotes: SequencedExpectedNote[] = [];
  const rightHandNotes: SequencedExpectedNote[] = [];
  const leftHandNotes: SequencedExpectedNote[] = [];
  const leftHandMidis = new Set<number>();
  const allRightHandMidis = new Set<number>();

  let runningOffsetMs = 0;

  for (let i = 0; i < sortedBars.length; i++) {
    const barIndex = sortedBars[i];
    const measureId = measureIds[barIndex];
    const measureData = measureId !== undefined ? getMeasureData(measureId) : null;
    const durationMs = getMeasureDurationMs(measureData);

    if (!measureData || measureId === undefined) {
      bars.push({
        barIndex,
        measureId: measureId ?? -1,
        startOffsetMs: runningOffsetMs,
        durationMs,
        rightHandNotes: [],
        leftHandNotes: [],
        allNotes: [],
        rightHandMidis: [],
        leftHandMidis: [],
        fingeringMap: new Map(),
        leftHandMidiSet: new Set(),
      });
      runningOffsetMs += durationMs;
      continue;
    }

    const fingeringMap = new Map<number, number>();
    const leftHandMidiSet = new Set<number>();
    const rightHandMidis: number[] = [];
    const leftHandMidiArr: number[] = [];

    const barRight: SequencedExpectedNote[] = measureData.rightHand.map((note, idx) => {
      const sequenced: SequencedExpectedNote = {
        midi: note.midi,
        startMs: note.startMs + runningOffsetMs,
        endMs: note.endMs + runningOffsetMs,
        hand: "right",
        expectedId: `bar:${barIndex}:R:${idx}`,
      };
      rightHandMidis.push(note.midi);
      allRightHandMidis.add(note.midi);
      if (measureData.fingeringRight[idx] !== undefined) {
        fingeringMap.set(note.midi, measureData.fingeringRight[idx]);
      }
      return sequenced;
    });

    const barLeft: SequencedExpectedNote[] = measureData.leftHand.map((note, idx) => {
      const sequenced: SequencedExpectedNote = {
        midi: note.midi,
        startMs: note.startMs + runningOffsetMs,
        endMs: note.endMs + runningOffsetMs,
        hand: "left",
        expectedId: `bar:${barIndex}:L:${idx}`,
      };
      leftHandMidiSet.add(note.midi);
      leftHandMidis.add(note.midi);
      leftHandMidiArr.push(note.midi);
      if (measureData.fingeringLeft[idx] !== undefined) {
        fingeringMap.set(note.midi, measureData.fingeringLeft[idx]);
      }
      return sequenced;
    });

    const barAll = [...barRight, ...barLeft];

    bars.push({
      barIndex,
      measureId,
      startOffsetMs: runningOffsetMs,
      durationMs,
      rightHandNotes: barRight,
      leftHandNotes: barLeft,
      allNotes: barAll,
      rightHandMidis,
      leftHandMidis: leftHandMidiArr,
      fingeringMap,
      leftHandMidiSet,
    });

    allNotes.push(...barAll);
    rightHandNotes.push(...barRight);
    leftHandNotes.push(...barLeft);

    runningOffsetMs += durationMs;
  }

  if (allNotes.length === 0) return null;

  return {
    bars,
    sortedBars,
    allNotes,
    rightHandNotes,
    leftHandNotes,
    totalDurationMs: runningOffsetMs,
    leftHandMidis,
    allRightHandMidis,
  };
}
