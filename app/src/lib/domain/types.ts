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
}

/** A generated exercise consisting of measures and their expected notes */
export interface Exercise {
  measures: Measure[];
  expectedNotes: ExpectedNote[];
}
