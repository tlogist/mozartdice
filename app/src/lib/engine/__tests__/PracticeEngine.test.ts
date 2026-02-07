import { describe, expect, it } from "vitest";
import { PracticeEngine } from "@/lib/engine/PracticeEngine";
import type { ExpectedNote } from "@/lib/domain/types";

describe("PracticeEngine", () => {
  it("does not overcount repeated hits on one expected note", () => {
    const expected: ExpectedNote[] = [
      { midi: 60, startMs: 100, endMs: 250, hand: "right", expectedId: "n1" },
    ];

    const first = PracticeEngine.evaluateNote(60, 100, expected, 1, "both", new Set([60]));
    const second = PracticeEngine.evaluateNote(60, 120, expected, 1, "both", new Set([60]));
    const result = PracticeEngine.computeLoopResult([first, second], 1);

    expect(result.correctNotes).toBe(1);
    expect(result.wrongCount).toBe(1);
    expect(result.accuracyPercent).toBe(100);
  });

  it("uses hand metadata for filtering when pitches overlap", () => {
    const expected: ExpectedNote[] = [
      { midi: 60, startMs: 100, endMs: 200, hand: "right", expectedId: "r1" },
      { midi: 60, startMs: 600, endMs: 700, hand: "left", expectedId: "l1" },
    ];

    const wrongTimeLeft = PracticeEngine.evaluateNote(60, 100, expected, 1, "left", new Set([60]));
    const correctLeft = PracticeEngine.evaluateNote(60, 600, expected, 1, "left", new Set([60]));

    expect(wrongTimeLeft.timing).toBe("wrong");
    expect(correctLeft.timing).toBe("perfect");
    expect(correctLeft.matchedExpectedId).toBe("l1");
  });

  it("computes missed notes from unmatched expected notes", () => {
    const expected: ExpectedNote[] = [
      { midi: 60, startMs: 0, endMs: 100, hand: "right", expectedId: "a" },
      { midi: 62, startMs: 200, endMs: 300, hand: "right", expectedId: "b" },
    ];

    const onlyFirst = PracticeEngine.evaluateNote(60, 0, expected, 1, "both", new Set([60, 62]));
    const result = PracticeEngine.computeLoopResult([onlyFirst], 2);

    expect(result.correctNotes).toBe(1);
    expect(result.missedCount).toBe(1);
    expect(result.accuracyPercent).toBe(50);
  });
});
