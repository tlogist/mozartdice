"use client";

import { useAppStore } from "@/lib/state/useAppStore";
import type { LoopResult } from "@/lib/domain/types";

interface FeedbackOverlayProps {
  lastLoopResult: LoopResult | null;
}

export default function FeedbackOverlay({ lastLoopResult }: FeedbackOverlayProps) {
  const { practiceMode, consecutiveGoodLoops, autoSpeedUp, tempo } = useAppStore();

  if (practiceMode === "free" || !lastLoopResult) return null;

  const { accuracyPercent, perfectCount, earlyCount, lateCount, wrongCount, missedCount } = lastLoopResult;

  const barColor =
    accuracyPercent >= 90 ? "bg-emerald-500"
    : accuracyPercent >= 70 ? "bg-amber-500"
    : "bg-red-500";

  return (
    <div className="flex w-full max-w-md flex-col gap-1 rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-2">
      {/* Accuracy bar */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-neutral-400">Accuracy</span>
        <div className="flex-1 rounded-full bg-neutral-800 h-3">
          <div
            className={`h-3 rounded-full ${barColor} transition-all duration-300`}
            style={{ width: `${accuracyPercent}%` }}
          />
        </div>
        <span className="text-xs font-bold text-neutral-200">{accuracyPercent}%</span>
      </div>

      {/* Detail counts */}
      <div className="flex gap-3 text-[10px]">
        <span className="text-emerald-400">{perfectCount} perfect</span>
        <span className="text-orange-400">{earlyCount} early</span>
        <span className="text-amber-400">{lateCount} late</span>
        <span className="text-red-400">{wrongCount} wrong</span>
        <span className="text-neutral-500">{missedCount} missed</span>
      </div>

      {/* Auto speed-up progress */}
      {autoSpeedUp && (
        <div className="flex items-center gap-2 text-[10px] text-neutral-400">
          <span>Speed-up: {consecutiveGoodLoops}/3 good loops</span>
          <span>@ {tempo} BPM</span>
        </div>
      )}
    </div>
  );
}
