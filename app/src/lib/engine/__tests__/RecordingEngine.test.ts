import { describe, expect, it } from "vitest";
import { RecordingEngine } from "@/lib/engine/RecordingEngine";

describe("RecordingEngine", () => {
  it("auto-starts baseline on first note if start() was not called", () => {
    const engine = new RecordingEngine();

    engine.noteOn(60, 100);
    const notes = engine.getNotes();

    expect(notes).toHaveLength(1);
    expect(notes[0].timestampMs).toBeGreaterThanOrEqual(0);
    expect(notes[0].timestampMs).toBeLessThan(50);
  });

  it("captures release times after noteOff", async () => {
    const engine = new RecordingEngine();
    engine.start();
    engine.noteOn(64, 90);

    await new Promise((resolve) => setTimeout(resolve, 5));
    engine.noteOff(64);

    const notes = engine.getNotes();
    expect(notes[0].releaseMs).not.toBeNull();
    expect(notes[0].releaseMs!).toBeGreaterThanOrEqual(notes[0].timestampMs);
  });
});
