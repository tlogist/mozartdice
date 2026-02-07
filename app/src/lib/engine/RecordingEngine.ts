import type { PlayedNote } from "@/lib/domain/types";

export class RecordingEngine {
  private baselineMs = 0;
  private notes: PlayedNote[] = [];
  private activeNotes = new Map<number, number>(); // midi → index in notes[]

  start(): void {
    this.baselineMs = performance.now();
    this.notes = [];
    this.activeNotes.clear();
  }

  noteOn(midi: number, velocity: number): number {
    if (this.baselineMs === 0) {
      // Defensive: if recording start lifecycle is missed, initialize baseline on first note.
      this.start();
    }
    const timestampMs = performance.now() - this.baselineMs;
    const note: PlayedNote = { midi, velocity, timestampMs, releaseMs: null };
    const idx = this.notes.length;
    this.notes.push(note);
    this.activeNotes.set(midi, idx);
    return timestampMs;
  }

  noteOff(midi: number): void {
    const idx = this.activeNotes.get(midi);
    if (idx !== undefined) {
      this.notes[idx].releaseMs = performance.now() - this.baselineMs;
      this.activeNotes.delete(midi);
    }
  }

  getNotes(): PlayedNote[] {
    return [...this.notes];
  }

  reset(): void {
    this.notes = [];
    this.activeNotes.clear();
    this.baselineMs = 0;
  }
}
