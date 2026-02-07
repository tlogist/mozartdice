import { describe, expect, it } from "vitest";
import { buildLoopData } from "@/lib/mozart/loopData";

describe("buildLoopData", () => {
  it("uses real measure duration when notes exceed 3000ms", () => {
    const loop = buildLoopData([5], [0]);
    expect(loop).not.toBeNull();
    expect(loop!.totalDurationMs).toBeGreaterThanOrEqual(8800);
  });

  it("uses cumulative bar offsets instead of fixed 3000ms", () => {
    const loop = buildLoopData([5, 1], [0, 1]);
    expect(loop).not.toBeNull();

    const firstBarDuration = loop!.bars[0].durationMs;
    const secondBarStart = loop!.bars[1].startOffsetMs;

    expect(secondBarStart).toBe(firstBarDuration);
    expect(secondBarStart).toBeGreaterThan(3000);
  });

  it("assigns expectedId and hand metadata for every sequenced note", () => {
    const loop = buildLoopData([1], [0]);
    expect(loop).not.toBeNull();

    for (const note of loop!.allNotes) {
      expect(note.expectedId).toBeTruthy();
      expect(note.hand === "right" || note.hand === "left").toBe(true);
    }
  });
});
