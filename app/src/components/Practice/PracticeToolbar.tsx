"use client";

import { useAppStore } from "@/lib/state/useAppStore";
import type { PracticeMode, HandMode } from "@/lib/domain/types";

interface PracticeToolbarProps {
  onStartSightReading: () => void;
  onOpenStats: () => void;
}

export default function PracticeToolbar({ onStartSightReading, onOpenStats }: PracticeToolbarProps) {
  const {
    practiceMode, setPracticeMode,
    handMode, setHandMode,
    autoSpeedUp, toggleAutoSpeedUp,
    targetTempo, setTargetTempo,
    isRecording, startRecording,
    measureIds,
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
    <div className="flex flex-wrap items-center justify-center gap-3 rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-2">
      {/* Mode toggle */}
      <div className="flex items-center gap-1">
        {modes.map((m) => (
          <button
            key={m.value}
            onClick={() => setPracticeMode(m.value)}
            className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
              practiceMode === m.value
                ? "bg-amber-500 text-black"
                : "bg-neutral-800 text-neutral-400 hover:text-neutral-200"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <span className="text-neutral-600">|</span>

      {/* Hand selector */}
      <div className="flex items-center gap-1">
        {hands.map((h) => (
          <button
            key={h.value}
            onClick={() => setHandMode(h.value)}
            className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
              handMode === h.value
                ? "bg-blue-500 text-white"
                : "bg-neutral-800 text-neutral-400 hover:text-neutral-200"
            }`}
          >
            {h.label}
          </button>
        ))}
      </div>

      <span className="text-neutral-600">|</span>

      {/* Auto speed-up */}
      <button
        onClick={toggleAutoSpeedUp}
        className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
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

      <span className="text-neutral-600">|</span>

      {/* Record */}
      <button
        onClick={startRecording}
        disabled={isRecording}
        className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
          isRecording
            ? "bg-red-600 text-white animate-pulse"
            : "bg-neutral-800 text-neutral-400 hover:text-neutral-200"
        }`}
      >
        {isRecording ? "Recording..." : "Record"}
      </button>

      <span className="text-neutral-600">|</span>

      {/* Sight-reading */}
      <button
        onClick={onStartSightReading}
        disabled={measureIds.length === 0}
        className="rounded bg-neutral-800 px-2 py-1 text-xs font-medium text-neutral-400 transition-colors hover:text-neutral-200 disabled:opacity-30"
      >
        Sight-Read
      </button>

      {/* Stats */}
      <button
        onClick={onOpenStats}
        className="rounded bg-neutral-800 px-2 py-1 text-xs font-medium text-neutral-400 transition-colors hover:text-neutral-200"
      >
        Stats
      </button>
    </div>
  );
}
