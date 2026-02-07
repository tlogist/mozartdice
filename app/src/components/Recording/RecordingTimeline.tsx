"use client";

import { useCallback, useRef } from "react";
import { useAppStore } from "@/lib/state/useAppStore";
import { getMeasureData } from "@/lib/mozart/measureData";
import type { ExpectedNote, PlayedNote } from "@/lib/domain/types";

interface RecordingTimelineProps {
  onReplayNoteOn: (midi: number, velocity: number) => void;
  onReplayNoteOff: (midi: number) => void;
}

export default function RecordingTimeline({ onReplayNoteOn, onReplayNoteOff }: RecordingTimelineProps) {
  const { currentRecording, clearRecording } = useAppStore();
  const replayTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const stopReplay = useCallback(() => {
    replayTimersRef.current.forEach(clearTimeout);
    replayTimersRef.current = [];
  }, []);

  const replay = useCallback(() => {
    if (!currentRecording) return;
    stopReplay();

    for (const note of currentRecording.playedNotes) {
      replayTimersRef.current.push(
        setTimeout(() => onReplayNoteOn(note.midi, note.velocity), note.timestampMs),
      );
      if (note.releaseMs !== null) {
        replayTimersRef.current.push(
          setTimeout(() => onReplayNoteOff(note.midi), note.releaseMs),
        );
      }
    }
  }, [currentRecording, onReplayNoteOn, onReplayNoteOff, stopReplay]);

  if (!currentRecording) return null;

  const md = getMeasureData(currentRecording.measureId);
  const refNotes: ExpectedNote[] = md ? [...md.rightHand, ...md.leftHand] : [];
  const rhMidis = new Set(md?.rightHand.map((n) => n.midi) ?? []);

  // Calculate total duration for positioning
  const tempoScale = 60 / currentRecording.tempo;
  const totalDuration = 3 * 1000 * tempoScale;
  const playedDuration = currentRecording.playedNotes.length > 0
    ? Math.max(...currentRecording.playedNotes.map((n) => n.releaseMs ?? n.timestampMs))
    : totalDuration;
  const maxDuration = Math.max(totalDuration, playedDuration);

  const pct = (ms: number) => `${(ms / maxDuration) * 100}%`;
  const widthPct = (start: number, end: number) => `${((end - start) / maxDuration) * 100}%`;

  const NoteBar = ({ start, end, color }: { start: number; end: number; color: string }) => (
    <div
      className={`absolute h-3 rounded-sm ${color}`}
      style={{ left: pct(start), width: widthPct(start, end) }}
    />
  );

  const { accuracyPercent } = currentRecording.loopResult;

  return (
    <div className="flex w-full max-w-md flex-col gap-2 rounded-lg border border-neutral-700 bg-neutral-900 p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-neutral-300">Recording — {accuracyPercent}% accuracy</span>
        <div className="flex gap-2">
          <button
            onClick={replay}
            className="rounded bg-green-700 px-2 py-0.5 text-[10px] text-white hover:bg-green-600"
          >
            Replay
          </button>
          <button
            onClick={() => { stopReplay(); clearRecording(); }}
            className="rounded bg-neutral-800 px-2 py-0.5 text-[10px] text-neutral-400 hover:text-neutral-200"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Reference row */}
      <div>
        <span className="text-[10px] text-neutral-500">Reference</span>
        <div className="relative h-4 rounded bg-neutral-800">
          {refNotes.map((n, i) => (
            <NoteBar
              key={`ref-${i}`}
              start={n.startMs * tempoScale}
              end={n.endMs * tempoScale}
              color={rhMidis.has(n.midi) ? "bg-blue-500/70" : "bg-red-500/70"}
            />
          ))}
        </div>
      </div>

      {/* Your playing row */}
      <div>
        <span className="text-[10px] text-neutral-500">Your Playing</span>
        <div className="relative h-4 rounded bg-neutral-800">
          {currentRecording.playedNotes.map((n: PlayedNote, i: number) => (
            <NoteBar
              key={`play-${i}`}
              start={n.timestampMs}
              end={n.releaseMs ?? n.timestampMs + 100}
              color="bg-emerald-500/70"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
