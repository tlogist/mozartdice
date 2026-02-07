/** A musical pattern for one hand within a measure */
export interface Pattern {
  notes: number[];
  fingering: number[];
  shapeId: string;
}

/** A single measure that can be looked up from the dice tables */
export interface Measure {
  id: string;
  type: "mozart" | "agitato";
  rightHandPattern: Pattern;
  leftHandPattern: Pattern;
  harmonicFunction: string;
  difficulty: number;
}

/** Result of rolling two six-sided dice */
export interface DiceRoll {
  die1: number;
  die2: number;
  sum: number;
}

/** A note expected to be played at a specific time */
export interface ExpectedNote {
  midi: number;
  startMs: number;
  endMs: number;
  hand?: "right" | "left";
  expectedId?: string;
}

/** A generated exercise consisting of measures and their expected notes */
export interface Exercise {
  measures: Measure[];
  expectedNotes: ExpectedNote[];
}

// --- Practice & Teaching Types ---

export type TimingJudgment = "perfect" | "early" | "late" | "wrong";
export type HandMode = "both" | "right" | "left";
export type PracticeMode = "free" | "scaffolded" | "sightReading";

export interface PlayedNote {
  midi: number;
  velocity: number;
  timestampMs: number;
  releaseMs: number | null;
}

export interface NoteEvaluation {
  midi: number;
  matchedExpected: ExpectedNote | null;
  matchedExpectedId: string | null;
  timing: TimingJudgment;
  offsetMs: number;
}

export interface LoopResult {
  totalExpected: number;
  correctNotes: number;
  perfectCount: number;
  earlyCount: number;
  lateCount: number;
  wrongCount: number;
  missedCount: number;
  accuracyPercent: number;
}

export interface BarRange {
  startBar: number;
  endBar: number;
}

export interface Recording {
  measureId: number;
  tempo: number;
  playedNotes: PlayedNote[];
  loopResult: LoopResult;
  recordedAt: number;
}

export interface MeasureStats {
  measureId: number;
  attempts: number;
  bestAccuracy: number;
  lastAccuracy: number;
  highestTempo: number;
  lastPracticedAt: number;
  accuracyHistory: number[];
}

export interface SightReadingSession {
  measureIds: number[];
  currentBarIndex: number;
  barResults: LoopResult[];
  isComplete: boolean;
  totalScore: number;
}
