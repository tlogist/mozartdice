/**
 * MIDI-to-staff-position mapping for SVG notation rendering.
 *
 * Position 0 = middle C (MIDI 60). Each integer = one diatonic step.
 * Positive = up, negative = down.
 *
 *   Position 10 = F5 (treble top line)
 *   Position  2 = E4 (treble bottom line)
 *   Position  0 = C4 (middle C, 1 ledger line)
 *   Position -2 = A3 (bass top line)
 *   Position -10 = G2 (bass bottom line)
 */

// Chromatic pitch class → [diatonic offset from C, accidental]
// Using flats for Eb, Ab, Bb and sharps for C#, F# (matching Mozart's key signatures)
const PITCH_TABLE: [number, string][] = [
  [0, ""],   // 0  C
  [0, "#"],  // 1  C#
  [1, ""],   // 2  D
  [2, "b"],  // 3  Eb
  [2, ""],   // 4  E
  [3, ""],   // 5  F
  [3, "#"],  // 6  F#
  [4, ""],   // 7  G
  [5, "b"],  // 8  Ab
  [5, ""],   // 9  A
  [6, "b"],  // 10 Bb
  [6, ""],   // 11 B
];

const NOTE_NAMES = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];

export interface StaffNote {
  position: number;   // diatonic steps from middle C (0)
  accidental: "" | "#" | "b";
  noteName: string;   // e.g. "C#4"
  midi: number;
}

export function midiToStaff(midi: number): StaffNote {
  const octave = Math.floor(midi / 12) - 1;
  const pitchClass = midi % 12;
  const [diatonicOffset, accidental] = PITCH_TABLE[pitchClass];
  const position = (octave - 4) * 7 + diatonicOffset;
  const noteName = NOTE_NAMES[pitchClass] + octave;

  return { position, accidental: accidental as "" | "#" | "b", noteName, midi };
}

/**
 * Returns staff positions that need ledger lines for a given note position.
 * Treble staff lines: positions 2,4,6,8,10
 * Bass staff lines: positions -2,-4,-6,-8,-10
 * Middle C (position 0) needs a ledger line in either clef.
 */
export function getLedgerLines(position: number, clef: "treble" | "bass"): number[] {
  const lines: number[] = [];

  if (clef === "treble") {
    // Below treble staff: position < 2
    // Ledger lines at even positions: 0, -2 (only 0 typically needed for treble)
    if (position <= 0) {
      for (let p = 0; p >= position; p -= 2) {
        lines.push(p);
      }
    }
    // Above treble staff: position > 10
    if (position >= 12) {
      for (let p = 12; p <= position; p += 2) {
        lines.push(p);
      }
    }
  } else {
    // Above bass staff: position > -2
    // Ledger lines at even positions: 0, 2 (only 0 typically needed for bass)
    if (position >= 0) {
      for (let p = 0; p <= position; p += 2) {
        lines.push(p);
      }
    }
    // Below bass staff: position < -10
    if (position <= -12) {
      for (let p = -12; p >= position; p -= 2) {
        lines.push(p);
      }
    }
  }

  return lines;
}

export type Duration = "eighth" | "quarter" | "half" | "whole";

/**
 * Classify note duration from timing in milliseconds (at base tempo, i.e. 60 BPM).
 */
export function classifyDuration(startMs: number, endMs: number): Duration {
  const durationMs = endMs - startMs;
  if (durationMs <= 600) return "eighth";
  if (durationMs <= 1200) return "quarter";
  if (durationMs <= 2200) return "half";
  return "whole";
}
