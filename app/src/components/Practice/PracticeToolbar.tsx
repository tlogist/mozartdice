"use client";

import { useAppStore } from "@/lib/state/useAppStore";
import type { PracticeMode, HandMode } from "@/lib/domain/types";

interface PracticeToolbarProps {
  onOpenStats: () => void;
}

export default function PracticeToolbar({ onOpenStats }: PracticeToolbarProps) {
  const {
    practiceMode, setPracticeMode,
    handMode, setHandMode,
    teachingSound, toggleTeachingSound,
    sightReadMode, toggleSightReadMode,
    autoSpeedUp, toggleAutoSpeedUp,
    targetTempo, setTargetTempo,
    isRecording, startRecording,
  } = useAppStore();

  const modes: { value: PracticeMode; label: string }[] = [
    { value: "free", label: "Free" },
    { value: "scaffolded", label: "Scaffolded" },
  ];

  const hands: { value: HandMode; label: string }[] = [
    { value: "both", label: "Both" },
    { value: "right", label: "RH" },
    { value: "left", label: "LH" },
  ];

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-3 text-xs">
      {/* Mode toggle */}
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Mode</span>
        <div className="flex gap-1">
          {modes.map((m) => (
            <button
              key={m.value}
              onClick={() => setPracticeMode(m.value)}
              className={`rounded px-2 py-1 font-medium transition-colors ${
                practiceMode === m.value
                  ? "bg-amber-500 text-black"
                  : "bg-neutral-800 text-neutral-400 hover:text-neutral-200"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Hand selector */}
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Hand</span>
        <div className="flex gap-1">
          {hands.map((h) => (
            <button
              key={h.value}
              onClick={() => setHandMode(h.value)}
              className={`rounded px-2 py-1 font-medium transition-colors ${
                handMode === h.value
                  ? "bg-blue-500 text-white"
                  : "bg-neutral-800 text-neutral-400 hover:text-neutral-200"
              }`}
            >
              {h.label}
            </button>
          ))}
        </div>
      </div>

      {/* Teaching sound */}
      <button
        onClick={toggleTeachingSound}
        className={`rounded px-2 py-1 font-medium transition-colors ${
          teachingSound
            ? "bg-purple-600 text-white"
            : "bg-neutral-800 text-neutral-400 hover:text-neutral-200"
        }`}
      >
        Sound {teachingSound ? "ON" : "OFF"}
      </button>

      {/* Auto speed-up */}
      <div className="flex flex-col gap-1">
        <button
          onClick={toggleAutoSpeedUp}
          className={`rounded px-2 py-1 font-medium transition-colors ${
            autoSpeedUp
              ? "bg-green-600 text-white"
              : "bg-neutral-800 text-neutral-400 hover:text-neutral-200"
          }`}
        >
          Speed-up {autoSpeedUp ? "ON" : "OFF"}
        </button>
        {autoSpeedUp && (
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-neutral-500">Target:</span>
            <input
              type="number"
              min={40}
              max={200}
              value={targetTempo}
              onChange={(e) => setTargetTempo(Number(e.target.value))}
              className="w-14 rounded bg-neutral-800 px-1 py-0.5 text-xs text-neutral-300"
            />
          </div>
        )}
      </div>

      {/* Record */}
      <button
        onClick={startRecording}
        disabled={isRecording}
        className={`rounded px-2 py-1 font-medium transition-colors ${
          isRecording
            ? "bg-red-600 text-white animate-pulse"
            : "bg-neutral-800 text-neutral-400 hover:text-neutral-200"
        }`}
      >
        {isRecording ? "Rec..." : "Record"}
      </button>

      {/* Sight-read mode (hides teaching keyboard) */}
      <button
        onClick={toggleSightReadMode}
        className={`rounded px-2 py-1 font-medium transition-colors ${
          sightReadMode
            ? "bg-cyan-600 text-white"
            : "bg-neutral-800 text-neutral-400 hover:text-neutral-200"
        }`}
      >
        Sight-Read {sightReadMode ? "ON" : "OFF"}
      </button>

      {/* Stats */}
      <button
        onClick={onOpenStats}
        className="rounded bg-neutral-800 px-2 py-1 font-medium text-neutral-400 transition-colors hover:text-neutral-200"
      >
        Stats
      </button>
    </div>
  );
}
