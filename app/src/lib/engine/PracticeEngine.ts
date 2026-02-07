import type { ExpectedNote, NoteEvaluation, LoopResult, HandMode, TimingJudgment } from "@/lib/domain/types";

export class PracticeEngine {
  /**
   * Check if a MIDI note belongs to the hand being practiced.
   * rightHandMidis contains all MIDI values that are right-hand notes for the current measure(s).
   */
  static isRelevantHand(midi: number, handMode: HandMode, rightHandMidis: Set<number>): boolean {
    if (handMode === "both") return true;
    const isRight = rightHandMidis.has(midi);
    return handMode === "right" ? isRight : !isRight;
  }

  /**
   * Evaluate a single played note against the expected notes.
   * positionMs is the current playback position in the loop.
   * tempoScale = 60 / tempo (how much to scale note times).
   */
  static evaluateNote(
    midi: number,
    positionMs: number,
    expectedNotes: ExpectedNote[],
    tempoScale: number,
    handMode: HandMode,
    rightHandMidis: Set<number>,
  ): NoteEvaluation {
    // Find expected notes with matching MIDI pitch
    const candidates = expectedNotes.filter(
      (n) => n.midi === midi && PracticeEngine.isRelevantHand(midi, handMode, rightHandMidis),
    );

    if (candidates.length === 0) {
      return { midi, matchedExpected: null, timing: "wrong", offsetMs: 0 };
    }

    // Find the closest expected note by scaled startMs
    let bestCandidate = candidates[0];
    let bestOffset = Math.abs(positionMs - candidates[0].startMs * tempoScale);

    for (let i = 1; i < candidates.length; i++) {
      const offset = Math.abs(positionMs - candidates[i].startMs * tempoScale);
      if (offset < bestOffset) {
        bestOffset = offset;
        bestCandidate = candidates[i];
      }
    }

    const offset = positionMs - bestCandidate.startMs * tempoScale;
    let timing: TimingJudgment;

    if (Math.abs(offset) <= 150) {
      timing = "perfect";
    } else if (Math.abs(offset) <= 350) {
      timing = offset < 0 ? "early" : "late";
    } else {
      timing = "wrong";
    }

    return { midi, matchedExpected: bestCandidate, timing, offsetMs: offset };
  }

  /**
   * Compute aggregate results for a loop pass.
   */
  static computeLoopResult(evaluations: NoteEvaluation[], totalExpectedCount: number): LoopResult {
    let perfectCount = 0;
    let earlyCount = 0;
    let lateCount = 0;
    let wrongCount = 0;

    for (const ev of evaluations) {
      switch (ev.timing) {
        case "perfect": perfectCount++; break;
        case "early": earlyCount++; break;
        case "late": lateCount++; break;
        case "wrong": wrongCount++; break;
      }
    }

    const correctNotes = perfectCount + earlyCount + lateCount;
    const missedCount = Math.max(0, totalExpectedCount - correctNotes);
    const accuracyPercent = totalExpectedCount > 0
      ? Math.round((correctNotes / totalExpectedCount) * 100)
      : 0;

    return {
      totalExpected: totalExpectedCount,
      correctNotes,
      perfectCount,
      earlyCount,
      lateCount,
      wrongCount,
      missedCount,
      accuracyPercent,
    };
  }
}
