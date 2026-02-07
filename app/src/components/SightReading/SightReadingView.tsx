"use client";

import { useMemo } from "react";
import type { SightReadingSession, LoopResult } from "@/lib/domain/types";
import type { FeedbackColor } from "@/components/Keyboard/PianoKey";
import StaffNotation from "@/components/StaffNotation/StaffNotation";
import { getMeasureData } from "@/lib/mozart/measureData";

interface SightReadingViewProps {
  session: SightReadingSession;
  countdown: number | null;
  playbackPositionMs: number | null;
  tempoScale: number;
  feedbackMap?: Map<number, FeedbackColor>;
  pressedNotes?: Set<number>;
  onRetry: () => void;
  onNewPiece: () => void;
  onClose: () => void;
}

function BarChart({ results }: { results: LoopResult[] }) {
  if (results.length === 0) return null;
  const barWidth = 20;
  const gap = 4;
  const height = 60;
  const svgWidth = results.length * (barWidth + gap);

  return (
    <svg width={svgWidth} height={height + 16} className="mt-2">
      {results.map((r, i) => {
        const x = i * (barWidth + gap);
        const barH = (r.accuracyPercent / 100) * height;
        const fill = r.accuracyPercent >= 80 ? "#10b981" : r.accuracyPercent >= 50 ? "#f59e0b" : "#ef4444";
        return (
          <g key={i}>
            <rect x={x} y={height - barH} width={barWidth} height={barH} fill={fill} rx={2} />
            <text x={x + barWidth / 2} y={height + 12} textAnchor="middle" className="fill-neutral-500 text-[9px]">
              {i + 1}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function SightReadingView({
  session,
  countdown,
  playbackPositionMs,
  tempoScale,
  feedbackMap,
  pressedNotes,
  onRetry,
  onNewPiece,
  onClose,
}: SightReadingViewProps) {
  const currentMeasureData = useMemo(() => {
    if (session.isComplete) return null;
    const mid = session.measureIds[session.currentBarIndex];
    return mid !== undefined ? getMeasureData(mid) : null;
  }, [session.isComplete, session.measureIds, session.currentBarIndex]);
  if (session.isComplete) {
    return (
      <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-lg border border-neutral-700 bg-neutral-900 p-6">
        <h2 className="text-lg font-bold text-neutral-200">Sight-Reading Complete</h2>
        <div className="text-4xl font-black text-amber-400">{session.totalScore}%</div>
        <BarChart results={session.barResults} />
        <div className="flex gap-3">
          <button
            onClick={onRetry}
            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-bold text-white hover:bg-amber-500"
          >
            Retry
          </button>
          <button
            onClick={onNewPiece}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-bold text-white hover:bg-green-500"
          >
            New Piece
          </button>
          <button
            onClick={onClose}
            className="rounded-lg bg-neutral-700 px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-600"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-center gap-2">
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-neutral-400">
          Bar {session.currentBarIndex + 1} of 16
        </span>
        {countdown !== null && (
          <span className="text-3xl font-black text-amber-400 animate-pulse">{countdown}</span>
        )}
      </div>
      {/* Staff notation for current bar */}
      <div className="w-full max-w-lg">
        {currentMeasureData && (
          <StaffNotation
            rightHand={currentMeasureData.rightHand}
            leftHand={currentMeasureData.leftHand}
            fingeringRight={currentMeasureData.fingeringRight}
            fingeringLeft={currentMeasureData.fingeringLeft}
            playbackPositionMs={playbackPositionMs}
            tempoScale={tempoScale}
            feedbackMap={feedbackMap}
            pressedNotes={pressedNotes}
          />
        )}
      </div>
      {/* Progress dots */}
      <div className="flex gap-1">
        {session.measureIds.map((_, i) => (
          <div
            key={i}
            className={`h-2 w-2 rounded-full ${
              i < session.currentBarIndex
                ? session.barResults[i]?.accuracyPercent >= 80
                  ? "bg-emerald-500"
                  : "bg-red-500"
                : i === session.currentBarIndex
                  ? "bg-amber-400"
                  : "bg-neutral-700"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
