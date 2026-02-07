"use client";

import { useAppStore } from "@/lib/state/useAppStore";

export default function LoopControls() {
  const { loopRange, setLoopRange, autoSpeedUp, consecutiveGoodLoops, tempo, targetTempo } = useAppStore();

  if (!loopRange) return null;

  return (
    <div className="flex items-center gap-3 rounded border border-blue-800 bg-blue-950/50 px-3 py-1.5">
      <span className="text-xs font-medium text-blue-300">
        Looping: Bar {loopRange.startBar + 1}–{loopRange.endBar + 1}
      </span>

      {autoSpeedUp && (
        <>
          <span className="text-neutral-600">|</span>
          <span className="text-[10px] text-blue-400">
            {tempo} → {targetTempo} BPM ({consecutiveGoodLoops}/3)
          </span>
        </>
      )}

      <button
        onClick={() => setLoopRange(null)}
        className="rounded px-2 py-0.5 text-[10px] text-neutral-400 hover:text-neutral-200 bg-neutral-800"
      >
        Clear
      </button>
    </div>
  );
}
