import { describe, it, expect } from "vitest";
import { midiToStaff, getLedgerLines, classifyDuration } from "../midiToStaff";

describe("midiToStaff", () => {
  it("maps middle C (MIDI 60) to position 0", () => {
    const result = midiToStaff(60);
    expect(result.position).toBe(0);
    expect(result.accidental).toBe("");
    expect(result.noteName).toBe("C4");
  });

  it("maps E4 (MIDI 64) to position 2 — treble bottom line", () => {
    const result = midiToStaff(64);
    expect(result.position).toBe(2);
    expect(result.accidental).toBe("");
    expect(result.noteName).toBe("E4");
  });

  it("maps F5 (MIDI 77) to position 10 — treble top line", () => {
    const result = midiToStaff(77);
    expect(result.position).toBe(10);
    expect(result.accidental).toBe("");
    expect(result.noteName).toBe("F5");
  });

  it("maps G2 (MIDI 43) to position -10 — bass bottom line", () => {
    const result = midiToStaff(43);
    expect(result.position).toBe(-10);
    expect(result.accidental).toBe("");
    expect(result.noteName).toBe("G2");
  });

  it("maps A3 (MIDI 57) to position -2 — bass top line", () => {
    const result = midiToStaff(57);
    expect(result.position).toBe(-2);
    expect(result.accidental).toBe("");
    expect(result.noteName).toBe("A3");
  });

  it("maps C#4 (MIDI 61) with sharp accidental", () => {
    const result = midiToStaff(61);
    expect(result.position).toBe(0);
    expect(result.accidental).toBe("#");
    expect(result.noteName).toBe("C#4");
  });

  it("maps Bb3 (MIDI 58) with flat accidental", () => {
    const result = midiToStaff(58);
    expect(result.position).toBe(-1);
    expect(result.accidental).toBe("b");
    expect(result.noteName).toBe("Bb3");
  });

  it("maps F#4 (MIDI 66) with sharp accidental", () => {
    const result = midiToStaff(66);
    expect(result.position).toBe(3);
    expect(result.accidental).toBe("#");
    expect(result.noteName).toBe("F#4");
  });

  it("maps Eb4 (MIDI 63) with flat accidental", () => {
    const result = midiToStaff(63);
    expect(result.position).toBe(2);
    expect(result.accidental).toBe("b");
    expect(result.noteName).toBe("Eb4");
  });

  it("maps high C6 (MIDI 84) to position 14", () => {
    const result = midiToStaff(84);
    expect(result.position).toBe(14);
    expect(result.accidental).toBe("");
  });

  it("maps low C2 (MIDI 36) to position -14", () => {
    const result = midiToStaff(36);
    expect(result.position).toBe(-14);
    expect(result.accidental).toBe("");
  });

  it("preserves midi value in result", () => {
    expect(midiToStaff(72).midi).toBe(72);
    expect(midiToStaff(48).midi).toBe(48);
  });
});

describe("getLedgerLines", () => {
  it("returns ledger line at 0 for middle C in treble clef", () => {
    expect(getLedgerLines(0, "treble")).toEqual([0]);
  });

  it("returns ledger line at 0 for middle C in bass clef", () => {
    expect(getLedgerLines(0, "bass")).toEqual([0]);
  });

  it("returns no ledger lines for notes on the treble staff", () => {
    // E4 (position 2) is treble bottom line — no ledger lines
    expect(getLedgerLines(2, "treble")).toEqual([]);
    // F5 (position 10) is treble top line — no ledger lines
    expect(getLedgerLines(10, "treble")).toEqual([]);
    // D4 (position 1) is a space — no ledger lines
    expect(getLedgerLines(1, "treble")).toEqual([]);
  });

  it("returns no ledger lines for notes on the bass staff", () => {
    // A3 (position -2) is bass top line — no ledger lines
    expect(getLedgerLines(-2, "bass")).toEqual([]);
    // G2 (position -10) is bass bottom line — no ledger lines
    expect(getLedgerLines(-10, "bass")).toEqual([]);
  });

  it("returns multiple ledger lines for very high notes in treble", () => {
    // C6 (position 14) needs ledger lines at 12 and 14
    expect(getLedgerLines(14, "treble")).toEqual([12, 14]);
  });

  it("returns multiple ledger lines for very low notes in bass", () => {
    // C2 (position -14) needs ledger lines at -12 and -14
    expect(getLedgerLines(-14, "bass")).toEqual([-12, -14]);
  });

  it("returns ledger lines below treble for B3 (position -1)", () => {
    // B3 (position -1) sits just below the 0 ledger line
    expect(getLedgerLines(-1, "treble")).toEqual([0]);
  });
});

describe("classifyDuration", () => {
  it("classifies short notes as eighth", () => {
    expect(classifyDuration(0, 500)).toBe("eighth");
    expect(classifyDuration(0, 600)).toBe("eighth");
  });

  it("classifies medium notes as quarter", () => {
    expect(classifyDuration(0, 900)).toBe("quarter");
    expect(classifyDuration(0, 1200)).toBe("quarter");
  });

  it("classifies longer notes as half", () => {
    expect(classifyDuration(0, 1500)).toBe("half");
    expect(classifyDuration(0, 2200)).toBe("half");
  });

  it("classifies very long notes as whole", () => {
    expect(classifyDuration(0, 2500)).toBe("whole");
    expect(classifyDuration(0, 3000)).toBe("whole");
  });
});
